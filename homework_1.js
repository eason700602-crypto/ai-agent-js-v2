import { input, select } from "@inquirer/prompts";
import { OPENAI_API_KEY } from "./config.js";
import { ChatManager } from "./ChatManager.js";

const chatManager = new ChatManager(OPENAI_API_KEY);

try {
  // 在啟動時選擇角色
  const roles = chatManager.getRoles();
  const roleOptions = Object.entries(roles).map(([key, role]) => ({
    name: role.name,
    value: key,
  }));

  const selectedRole = await select({
    message: "請選擇聊天機器人的角色：",
    choices: roleOptions,
  });

  console.log(`\n已選擇角色: ${chatManager.getRoleName(selectedRole)}\n`);

  // 聊天迴圈
  while (true) {
    const userQuestion = (
      await input({ message: "請輸入你的問題：" })
    ).trim();

    if (userQuestion === "") continue;
    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    try {
      const response = await chatManager.chat(userQuestion, selectedRole);
      console.log(`\n${response}\n`);
    } catch (err) {
      console.error("\n❌ 出現錯誤：", err.message);
      console.error("請檢查：");
      console.error("1. OPENAI_API_KEY 是否已正確設定");
      console.error("2. API 金鑰是否有效");
      console.error("3. 網路連接是否正常\n");
    }
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}
