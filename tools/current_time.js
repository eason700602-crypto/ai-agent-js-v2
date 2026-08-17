import { z } from "zod";

// 定義輸入參數的驗證 schema
export const CurrentTimeInputSchema = z.object({}).strict();

/**
 * 取得目前時間（使用台灣時區 UTC+8）
 * @returns {string} 時間字符串，格式為 YYYY-MM-DD HH:mm:ss
 */
export function getCurrentTime() {
  // 創建 UTC 時間，然後調整為台灣時區 (UTC+8)
  const now = new Date();
  const utcTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const taipeiTime = new Date(utcTime.getTime() + 8 * 60 * 60 * 1000);
  
  const pad = (n) => String(n).padStart(2, '0');
  const year = taipeiTime.getFullYear();
  const month = pad(taipeiTime.getMonth() + 1);
  const date = pad(taipeiTime.getDate());
  const hours = pad(taipeiTime.getHours());
  const minutes = pad(taipeiTime.getMinutes());
  const seconds = pad(taipeiTime.getSeconds());
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

/**
 * 包裝後的 getCurrentTime 函數，用於 tool calling
 * @param {Record<string, never>} params - 空物件
 * @returns {string} 時間字符串
 */
export function getCurrentTimeWrapper(params) {
  // 驗證輸入參數
  CurrentTimeInputSchema.parse(params);
  return getCurrentTime();
}
