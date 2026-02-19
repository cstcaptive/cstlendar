
import { Schedule, ApiConfig } from "../types";
import { API_CONFIG_KEY } from "../constants";

/**
 * AI 基礎通信模塊
 */

const cleanStr = (val: string) => {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, '');
};

const extractValue = (line: string, defaultValue: string): string => {
  if (!line) return defaultValue;
  const match = line.match(/["'](.*?)["']|=(.*?);|=(.*)$/);
  if (match) {
    const val = (match[1] || match[2] || match[3] || defaultValue);
    return cleanStr(val);
  }
  return cleanStr(defaultValue);
};

const getAiConfig = () => {
  const saved = localStorage.getItem(API_CONFIG_KEY);
  let config = {
    baseUrl: "https://www.chataiapi.com",
    apiVersion: "v1",
    modelName: "gemini-2.5-flash-lite",
    apiKey: "" 
  };

  if (saved) {
    try {
      const parsed: ApiConfig = JSON.parse(saved);
      config.baseUrl = extractValue(parsed.baseUrlLine, config.baseUrl);
      config.apiVersion = extractValue(parsed.apiVersionLine, config.apiVersion);
      config.modelName = extractValue(parsed.modelNameLine, config.modelName);
      config.apiKey = extractValue(parsed.apiKeyLine, config.apiKey);
    } catch (e) { console.error("解析 API 配置失敗", e); }
  }
  return config;
};

export async function callGeminiApi(payload: any) {
  const { baseUrl, apiVersion, modelName, apiKey } = getAiConfig();
  if (!apiKey) {
    alert("提示：請先在設置中配置 API Key");
    throw new Error("Missing API Key");
  }
  const base = baseUrl.replace(/\/+$/, "");
  const url = `${base}/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("API 返回內容為空");
    return text;
  } catch (error: any) {
    console.error("Fetch 異常:", error);
    throw error;
  }
}

export const generateLogicHierarchySummary = async (target: Schedule, allSchedules: Schedule[]): Promise<string> => {
  const parents = allSchedules.filter(s => target.relations?.some(r => r.id === s.id && r.type === 'parent'));
  const children = allSchedules.filter(s => s.relations?.some(r => r.id === target.id && r.type === 'parent'));
  const contextStr = `當前：${target.title}。前置：${parents.map(p => p.title).join(',')}。後續：${children.map(c => c.title).join(',')}。`;
  const prompt = `分析此任務的邏輯鏈條，用簡體中文給出建議。背景：${contextStr}`;
  
  try {
    return await callGeminiApi({ contents: [{ parts: [{ text: prompt }] }] });
  } catch (error) { return "AI 分析暫時不可用。"; }
};

export const askAiAboutSchedules = async (question: string, target: Schedule, allSchedules: Schedule[]): Promise<string> => {
  const context = allSchedules.map(s => `- ${s.date} ${s.title}`).join('\n');
  const prompt = `已知日程：\n${context}\n當前關注：${target.title}\n提問：${question}`;
  
  try {
    return await callGeminiApi({ contents: [{ parts: [{ text: prompt }] }] });
  } catch (error) { return "AI Q&A 出錯。"; }
};
