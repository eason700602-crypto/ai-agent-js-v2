/**
 * 統一導出所有工具函數
 */
export { getCurrentTime, getCurrentTimeWrapper, CurrentTimeInputSchema } from "./current_time.js";
export { getWeather, WeatherInputSchema, WeatherOutputSchema } from "./weather.js";

/**
 * 工具函數映射，用於 tool calling
 */
export const toolFunctions = {
  getCurrentTime: async (params) => {
    const { getCurrentTimeWrapper } = await import("./current_time.js");
    return getCurrentTimeWrapper(params);
  },
  getWeather: async (params) => {
    const { getWeather } = await import("./weather.js");
    return getWeather(params);
  },
};
