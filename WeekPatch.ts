
import { WeekConfig } from './types';

/**
 * 獲取給定日期所在週的週一
 */
const getMondayOfDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * 計算學期週數標籤
 * @param targetDateStr 目標日期 (YYYY-MM-DD)
 * @param weekConfig 配置對象 { baseDate: 錨點日期, baseWeek: 錨點週數 }
 */
export const calculateWeekTag = (targetDateStr: string, weekConfig: WeekConfig): string => {
  if (!targetDateStr || !weekConfig || !weekConfig.baseDate) return "";

  try {
    const targetDate = new Date(targetDateStr);
    const anchorDate = new Date(weekConfig.baseDate);

    // 找到錨點日期所在週的週一
    const anchorMonday = getMondayOfDate(anchorDate);
    // 找到目標日期所在週的週一
    const targetMonday = getMondayOfDate(targetDate);

    // 計算相差天數
    const diffTime = targetMonday.getTime() - anchorMonday.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // 每 7 天為一週
    const weekNum = Math.floor(diffDays / 7) + (weekConfig.baseWeek || 1);

    return `W${weekNum}`;
  } catch (e) {
    console.error("Week calculation failed", e);
    return "";
  }
};
