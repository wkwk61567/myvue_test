import { loadDictionary } from "@/i18n/loadDictionary.js"; // CSV 解析檔案

const dictionary = {
  // 讀取 CSV 字典
  fullDictionary: null,
  async init() {
    if (!this.fullDictionary) {
      this.fullDictionary = await loadDictionary();
    }
  },
};

export const API_BASE_URL = "http://" + window.location.hostname;
export const INPUT_COLORS = {
  inputable: "#ffffff", // 可自由輸入
  optional: "#dddddd", // 間接選擇
  fixed: "#aaaaaa", // 不可修改
  unused: "#888888", // 未使用的欄位
}; // 用於欄位的顏色
export const HOVER_COLOR = "#f5f5f5"; // 滑鼠懸停時的背景色
export const SELECTED_COLOR = "#d3d3d3"; // 選取的row的背景色
export const LANGUAGE_OPTIONS = [
  { title: "繁體中文", key: "zh-TW" },
  { title: "English", key: "en" },
  { title: "Tiếng Việt", key: "vi" },
]; // 目前支援三種語言
export default dictionary

// 從 localStorage 讀取語言設定，如果沒有則使用預設語言
export const SELECTED_LANGUAGE = (() => {
  // 從 localStorage 讀取
  const savedLanguage = localStorage.getItem("selectedLanguage");
  // 如果有儲存的語言且在選項中存在，則使用它，否則回傳null
  return savedLanguage &&
    LANGUAGE_OPTIONS.some((opt) => opt.key === savedLanguage)
    ? savedLanguage
    : null;
})();
//export const SELECTED_LANGUAGE = "zh-TW"; // 預設語言 selectedLanguage
