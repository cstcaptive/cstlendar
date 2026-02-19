
/**
 * 基礎邏輯模塊 (ExtractLogic.ts)
 * 智能提取功能已移除，僅保留基礎工具
 */

/**
 * 生成隨機 ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * 提供手動新建日程的空模板
 */
export const getEmptySchedule = (todayStr: string) => ({
  id: generateId(),
  title: "",
  originalTitle: "",
  date: todayStr,
  time: "",
  allDay: true,
  owner: "",
  completed: false,
  relations: [],
  selectedFragments: [],
  reminders: [10]
});
