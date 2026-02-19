
import { Schedule } from "./types";
import { callGeminiApi } from "./services/geminiService";
import { getLocalDateString } from "./constants";

/**
 * AI 識別與映射補丁 (AiPatch.ts)
 * 核心目標：精準日期偏移、杜絕 09:00、對齊聯繫人數據
 */

export const extractSchedulesWithAiPatch = async (content: string, type: 'text' | 'image' = 'text'): Promise<Partial<Schedule>[]> => {
  const now = new Date();
  const currentTime = now.toLocaleString('zh-CN', { hour12: false });
  // 使用 getLocalDateString 替代 toISOString 以確保時區一致
  const baseDate = getLocalDateString(now);

  const systemPrompt = `你是一個專業的日程與邏輯管理專家。請將輸入內容轉換為嚴格的 JSON。
必須遵守以下協議：

### 第一部分：精準時間基準
1. **基準日期 (BASE_DATE)**: ${baseDate}
2. **當前時間 (CURRENT_TIME)**: ${currentTime}
3. **絕對日期計算**：所有相對詞彙必須轉化為 YYYY-MM-DD。
   - 若用戶說“明天”，結果必須是 ${baseDate} 的後一天。
   - 若用戶說“後天”，結果必須是 ${baseDate} 的後兩天。
   - 禁止返回任何模糊的相對描述。

### 第二部分：提取與淨化協議
1. **title (標題淨化)**: 必須剔除標題中包含的日期、時間、聯繫人姓名及提醒字眼。
   - 示例：“明天下午3點和張三開會” -> 標題為“開會”。
2. **time & allDay (零預設原則)**:
   - 若用戶未提及具體時刻（如“3點”），必須設 "allDay": true 且 time 設為 ""。
   - **嚴禁使用 09:00 或 12:00 作為填充值**，除非用戶明確說了。
3. **contact (聯繫人映射)**:
   - 提取姓名(name)、電話(mobile)、郵件(email)、是否QQ(isQQ)、是否微信(isWeChat)。
4. **reminder**: 默認設為 "10m"。

### 第三部分：輸出格式
返回 JSON：{"schedules": [{"title": "", "date": "YYYY-MM-DD", "time": "HH:mm or empty", "allDay": boolean, "reminder": "10m", "contact": {"name": "", "mobile": "", "email": "", "isQQ": false, "isWeChat": false}}]} `;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      schedules: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            date: { type: "STRING", description: "Must be YYYY-MM-DD. If user says '明天', it must be BASE_DATE + 1 day." },
            time: { type: "STRING" },
            allDay: { type: "BOOLEAN" },
            reminder: { type: "STRING" },
            contact: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                mobile: { type: "STRING" },
                email: { type: "STRING" },
                isQQ: { type: "BOOLEAN" },
                isWeChat: { type: "BOOLEAN" }
              }
            }
          },
          required: ["title", "date", "allDay"]
        }
      }
    },
    required: ["schedules"]
  };

  try {
    const parts: any[] = [{ text: systemPrompt }];
    if (type === 'image') {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: content.split(',')[1] } });
    } else {
      parts.push({ text: `輸入內容：\n${content}` });
    }

    const text = await callGeminiApi({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json", responseSchema }
    });

    const result = JSON.parse(text);
    const raw = result.schedules || [];

    return raw.map((s: any) => {
      const contactTags = [];
      if (s.contact?.isQQ) contactTags.push('QQ');
      if (s.contact?.isWeChat) contactTags.push('微信');

      return {
        title: s.title || "未命名日程",
        date: s.date || baseDate,
        time: s.allDay ? "" : (s.time || ""),
        allDay: s.allDay,
        owner: s.contact?.name || "",
        ownerPhone: s.contact?.mobile || "",
        ownerEmail: s.contact?.email || "",
        ownerContactType: contactTags.join(','),
        reminders: [10] 
      };
    });
  } catch (e) {
    console.error("AiPatch Error:", e);
    throw e;
  }
};
