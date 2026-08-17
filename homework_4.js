import { input } from "@inquirer/prompts";
import { OPENAI_API_KEY } from "./config.js";
import { ChatManager } from "./ChatManager.js";

const chatManager = new ChatManager(OPENAI_API_KEY);

console.log("=== Homework 3：天氣與時間工具 ===\n");
console.log("請輸入問題，例如：");
console.log("- 台北現在天氣怎麼樣？");
console.log("- 現在幾點了？");
console.log("- 東京現在的天氣和台北相比如何？");
console.log("- exit 退出\n");

while (true) {
  const question = (await input({ message: "請輸入你的問題：" })).trim();

  if (!question) continue;
  if (question.toLowerCase() === "exit") {
    console.log("再會~");
    break;
  }

  try {
    const answer = await chatManager.chat(question, "nightMarketExpert");
    console.log(`\nAI 回應：\n${answer}\n`);
  } catch (error) {
    console.error("\n❌ 錯誤：", error.message);
  }
}
