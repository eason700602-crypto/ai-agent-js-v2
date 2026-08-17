import OpenAI from "openai";
import { getCurrentTime, getWeather } from "./tools/index.js";
import { calculate } from "./tools/calculator.js";

export class ChatManager {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY 未設定，請在 .env 檔或環境變數中設定。");
    }

    this.client = new OpenAI({ apiKey });
    this.conversationHistory = new Map();
    this.roles = {
      calculatorExpert: {
        name: "計算機專家",
        instructions:
          "你是一位專業的數學計算助手。當使用者要求計算數學表達式時，優先使用 calculate 工具。計算完成後，清楚地說出計算過程和結果。在回答時，請說明你使用了 calculate 工具。請用繁體中文回答。",
      },
      nightMarketExpert: {
        name: "台灣夜市小吃達人",
        instructions:
          "你是一位專門介紹台灣夜市美食和推薦攤位的專家。請用繁體中文詳細介紹各種夜市小吃，分享美食故事，推薦最受歡迎的攤位和必吃美食。請用熱情友善的語氣回答。",
      },
      weatherAssistant: {
        name: "天氣助手",
        instructions:
          "你是一位專業的天氣與時間助手。當使用者問現在時間或城市天氣時，優先使用 getCurrentTime 和 getWeather 工具。若同時問時間與天氣，請分別呼叫兩個工具後再整合回答。在回答時，請說明你使用了哪些工具（getCurrentTime 或 getWeather）。請用繁體中文，回答簡短且清楚。",
      },
    };
    this.tools = [
      {
        type: "function",
        function: {
          name: "calculate",
          description: "計算簡單數學運算，例如加減乘除、括號和餘數。",
          parameters: {
            type: "object",
            properties: {
              expression: {
                type: "string",
                description: "要計算的數學表達式，例如 '2 + 3 * 4' 或 '(10 + 5) / 3'",
              },
            },
            required: ["expression"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getCurrentTime",
          description: "取得目前時間，格式為 YYYY-MM-DD HH:mm:ss。",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getWeather",
          description: "取得指定城市的目前天氣資訊，包括溫度、濕度和天氣描述。",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "城市名稱，例如 Taipei、Tokyo、London",
              },
            },
            required: ["city"],
            additionalProperties: false,
          },
        },
      },
    ];
  }

  async chat(userMessage, roleKey) {
    const role = this.roles[roleKey];
    if (!role) {
      throw new Error(`未知的角色: ${roleKey}`);
    }

    const history = this.conversationHistory.get(roleKey) ?? [];
    const userEntry = { role: "user", content: userMessage };
    const baseMessages = [{ role: "system", content: role.instructions }, ...history, userEntry];

    let response = await this.client.chat.completions.create({
      model: "gpt-4-turbo",
      max_tokens: 1024,
      messages: baseMessages,
      tools: this.tools,
      tool_choice: "auto",
    });

    let message = response.choices[0]?.message;
    if (!message) {
      return "";
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      const finalContent = message.content ?? "";
      this.conversationHistory.set(roleKey, [...history, userEntry, { role: "assistant", content: finalContent }]);
      return finalContent;
    }

    // 處理所有 tool calls
    const toolResults = [];
    
    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") {
        continue;
      }

      const toolName = toolCall.function.name;
      let toolResultPayload;

      try {
        const args = JSON.parse(toolCall.function.arguments || "{}");

        if (toolName === "calculate") {
          toolResultPayload = { result: calculate(args) };
        } else if (toolName === "getCurrentTime") {
          toolResultPayload = { result: getCurrentTime() };
        } else if (toolName === "getWeather") {
          toolResultPayload = { result: await getWeather(args) };
        } else {
          throw new Error(`Unknown tool: ${toolName}`);
        }
      } catch (error) {
        toolResultPayload = { error: `工具執行失敗：${error.message}` };
      }

      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResultPayload),
      });
    }

    // 如果沒有成功的 tool 調用，直接返回
    if (toolResults.length === 0) {
      const finalContent = message.content ?? "";
      this.conversationHistory.set(roleKey, [...history, userEntry, { role: "assistant", content: finalContent }]);
      return finalContent;
    }

    const assistantToolCallMessage = {
      role: "assistant",
      content: null,
      tool_calls: message.tool_calls,
    };

    // 收集使用的工具名稱
    const usedTools = message.tool_calls.map(tc => tc.function.name).join("、");

    // 構建包含所有 tool results 的消息，並在系統消息中說明使用了哪些工具
    const messagesForFollowUp = [
      ...baseMessages,
      {
        role: "system",
        content: `你已經使用了以下工具：${usedTools}。請在回答時明確說出你使用了哪個工具及其結果。`,
      },
      assistantToolCallMessage,
      ...toolResults,
    ];

    const followUpResponse = await this.client.chat.completions.create({
      model: "gpt-4-turbo",
      max_tokens: 1024,
      messages: messagesForFollowUp,
      tools: this.tools,
      tool_choice: "auto",
    });

    const finalContent = followUpResponse.choices[0]?.message?.content ?? "";

    // 更新對話歷史，包含所有的 tool results
    this.conversationHistory.set(roleKey, [
      ...history,
      userEntry,
      assistantToolCallMessage,
      ...toolResults,
      { role: "assistant", content: finalContent },
    ]);

    return finalContent;
  }

  getRoles() {
    return this.roles;
  }

  getRoleName(roleKey) {
    return this.roles[roleKey]?.name;
  }
}
