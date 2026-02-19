
import React from 'react';

export const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 8:00 to 18:00

export const VIEW_DAYS_COUNT = 4;

export const LOCAL_STORAGE_KEY = 'smart_flow_v14_data';
export const WEEK_CONFIG_KEY = 'smart_flow_v14_week_config';
export const BACKUP_HISTORY_KEY = 'smart_flow_v14_backups'; 
export const API_CONFIG_KEY = 'gemini_settings'; // 修改为 gemini_settings

/**
 * 健壮的本地日期获取函数
 * 解决跨天（尤其是凌晨）时区偏移导致的日期错误
 */
export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
