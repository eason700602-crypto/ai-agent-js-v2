import { input } from "@inquirer/prompts";
import { OPENAI_API_KEY } from "./config.js";
import { ChatManager } from "./ChatManager.js";

const chatManager = new ChatManager(OPENAI_API_KEY);

console.log("=== Homework 2：Function Calling 計算機 ===\n");
console.log("請輸入數學題目，例如：");
console.log("- 請幫我算 2 + 3 * 4");
console.log("- (10 + 5) / 3 是多少");
console.log("- 7 % 3 等於多少");
console.log("- exit 退出\n");

while (true) {
  const question = (await input({ message: "請輸入題目：" })).trim();

  if (!question) continue;
  if (question.toLowerCase() === "exit") {
    console.log("再會~");
    break;
  }

  try {
    const answer = await chatManager.chat(question, "calculatorExpert");
    console.log(`\nAI 回應：\n${answer}\n`);
  } catch (error) {
    console.error("\n❌ 錯誤：", error.message);
  }
}
