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
 * 中文城市名稱對應到英文的映射
 */
const cityNameMap = {
  台北: "Taipei",
  台中: "Taichung",
  台南: "Tainan",
  高雄: "Kaohsiung",
  新竹: "Hsinchu",
  嘉義: "Chiayi",
  苗栗: "Miaoli",
  彰化: "Changhua",
  南投: "Nantou",
  雲林: "Yunlin",
  屏東: "Pingtung",
  宜蘭: "Yilan",
  花蓮: "Hualien",
  台東: "Taitung",
  澎湖: "Penghu",
  金門: "Kinmen",
  馬祖: "Matsu",
};

/**
 * 將中文城市名稱轉換為英文
 */
function normalizeCityName(city) {
  return cityNameMap[city] || city;
}

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

  // 標準化城市名稱（中文轉英文）
  const normalizedCity = normalizeCityName(city);

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(normalizedCity)}&units=metric&appid=${apiKey}&lang=zh_tw`;
    const response = await fetch(url);

    // 詳細檢查響應狀態
    if (!response.ok) {
      let errorMessage = `無法取得 ${city} 的天氣資料 (HTTP ${response.status})`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage += `: ${errorData.message}`;
        }
      } catch (e) {
        // JSON 解析失敗，使用默認錯誤消息
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // 檢查 API 響應中是否有必要的數據
    if (!data.name || !data.main || !data.weather) {
      throw new Error(`天氣資料不完整: ${JSON.stringify(data)}`);
    }
    
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
  } catch (error) {
    // 如果是網絡錯誤
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`無法連接天氣服務：${error.message}`);
    }
    // 如果是 Zod 驗證錯誤
    if (error.name === "ZodError") {
      throw new Error(`天氣資料驗證失敗：${error.message}`);
    }
    // 其他錯誤直接拋出
    throw error;
  }
}
