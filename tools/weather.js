import { z } from "zod";
import { OPENWEATHER_API_KEY } from "../config.js";

// 定義輸入參數的驗證 schema
export const WeatherInputSchema = z.object({
  city: z.string().min(1, "城市名稱不能為空"),
});

// 定義天氣資訊的輸出 schema
export const WeatherOutputSchema = z.object({
  city: z.string(),
  country: z.string().optional(),
  temperature: z.number(),
  feelsLike: z.number().optional(),
  humidity: z.number().optional(),
  description: z.string(),
  icon: z.string().optional(),
});

/**
 * 取得指定城市的天氣資訊
 * @param {Object} params - 參數物件
 * @param {string} params.city - 城市名稱
 * @returns {Promise<Object>} 天氣資訊物件
 * @throws {Error} 當 API key 未設定或 API 調用失敗時
 */
export async function getWeather({ city }) {
  // 驗證輸入參數
  WeatherInputSchema.parse({ city });

  const apiKey = OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY 未設定，請在 .env 檔或環境變數中設定。");
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}&lang=zh_tw`
  );

  if (!response.ok) {
    throw new Error(`無法取得 ${city} 的天氣資料`);
  }

  const data = await response.json();
  
  const weatherInfo = {
    city: data.name,
    country: data.sys?.country,
    temperature: data.main?.temp,
    feelsLike: data.main?.feels_like,
    humidity: data.main?.humidity,
    description: data.weather?.[0]?.description,
    icon: data.weather?.[0]?.icon,
  };

  // 驗證輸出格式
  return WeatherOutputSchema.parse(weatherInfo);
}
