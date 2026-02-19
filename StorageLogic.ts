
import { Schedule, WeekConfig } from './types';
import { 
  LOCAL_STORAGE_KEY, BACKUP_HISTORY_KEY, WEEK_CONFIG_KEY, 
  getLocalDateString 
} from './constants';

/**
 * 存储与备份管理模块
 */

// 保存数据到本地并触发备份
export const saveSchedulesWithBackup = (schedules: Schedule[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(schedules));
  
  // 每日自动快照逻辑
  const historyJson = localStorage.getItem(BACKUP_HISTORY_KEY);
  let history = historyJson ? JSON.parse(historyJson) : [];
  const today = getLocalDateString(new Date());
  
  if (schedules.length > 0 && !history.find((b: any) => b.date === today)) {
    const snapshot = { date: today, timestamp: Date.now(), data: schedules };
    const newHistory = [snapshot, ...history].slice(0, 7); // 仅保留最近7天
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(newHistory));
  }
};

// 手动导出数据为 JSON 文件
export const exportData = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data || data === '[]') {
    alert("当前没有可备份的日程数据。");
    return;
  }
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = getLocalDateString(new Date()).replace(/-/g, '');
  const fileName = `schedules_backup_${date}.json`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 从 JSON 文件导入数据
export const importData = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      
      // 基础格式校验
      if (!Array.isArray(parsed)) {
        throw new Error("格式错误：备份文件应包含一个数组。");
      }

      if (confirm("确定要还原备份吗？这将覆盖当前应用中的所有日程数据且无法撤销。")) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        // 刷新页面以应用新数据
        window.location.reload();
      }
    } catch (err: any) {
      alert(`导入失败: ${err.message || '文件格式不正确'}`);
    }
  };
  reader.onerror = () => alert("文件读取出错");
  reader.readAsText(file);
};

// 计算 LocalStorage 占用百分比
export const calculateStorageUsage = () => {
  let total = 0;
  for (let x in localStorage) {
    if (localStorage.hasOwnProperty(x)) {
      total += (localStorage[x].length + x.length) * 2;
    }
  }
  return Math.min(100, (total / (5 * 1024 * 1024)) * 100).toFixed(1);
};

// 清空所有本地数据
export const clearAllData = () => {
  if (confirm("确定要永久删除所有日程和配置吗？此操作不可逆。")) {
    localStorage.clear();
    window.location.reload();
  }
};

// 周数校准：获取当前日期对应的周数
export const getDisplayWeek = (date: string, config: WeekConfig) => {
  const d1 = new Date(config.baseDate);
  const d2 = new Date(date);
  const diff = Math.floor((d2.getTime() - d1.getTime()) / (7 * 24 * 3600 * 1000));
  return config.baseWeek + diff;
};
