
import { Schedule } from './types';

/**
 * 提醒與通知邏輯模塊
 */

// 請求瀏覽器通知權限
export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
};

// 震動反饋
export const triggerFeedback = () => {
  if ("vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
};

// 檢查是否有日程到達提醒閾值
export const checkPendingReminders = (
  schedules: Schedule[], 
  triggeredSet: Set<string>,
  onTrigger: (title: string, body: string, key: string) => void
) => {
  const now = Date.now();
  schedules.forEach(s => {
    if (!s.reminders || s.reminders.length === 0 || s.completed) return;
    
    // 計算日程具體時間戳
    const eventTime = new Date(`${s.date}T${s.allDay ? "09:00" : s.time}`).getTime();
    
    s.reminders.forEach(offset => {
      const reminderTime = eventTime - (offset * 60 * 1000);
      const triggerKey = `${s.id}-${offset}`;
      
      // 如果到達時間且未觸發過
      if (now >= reminderTime && !triggeredSet.has(triggerKey)) {
        // 5分鐘以內的視為當前提醒，超過的視為補報
        const isMissed = now - reminderTime > 1000 * 60 * 5; 
        const title = isMissed ? `[補報] ${s.title}` : `日程提醒: ${s.title}`;
        const body = `時間：${s.date} ${s.allDay ? '全天' : s.time}`;
        
        // 觸發震動
        triggerFeedback();
        
        onTrigger(title, body, triggerKey);
      }
    });
  });
};
