
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Settings2, Trash2, Download, Upload, Clock, User, ChevronDown, Link2, Search, Bell, Trash, Calendar
} from 'lucide-react';
import { Schedule, RelationType, WeekConfig } from './types';
import { calculateStorageUsage, clearAllData, exportData, importData } from './StorageLogic';
import { ReminderSelector, ContactEditor, RelationSelector } from './EditorComponents';
import { WEEK_CONFIG_KEY, getLocalDateString } from './constants';

/**
 * 設置彈窗組件
 */
export const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [weekConfig, setWeekConfig] = useState<WeekConfig>(() => {
    const saved = localStorage.getItem(WEEK_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { baseDate: getLocalDateString(new Date()), baseWeek: 1 };
  });

  const saveWeekConfig = () => {
    localStorage.setItem(WEEK_CONFIG_KEY, JSON.stringify(weekConfig));
    // 手動觸發 storage 事件以通知 App.tsx
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[8000] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-black flex items-center gap-2"><Settings2 size={20}/> 設置</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={16}/></button>
        </div>

        {/* 學期週數設定區塊 */}
        <div className="bg-indigo-50/50 rounded-2xl p-4 mb-5 border border-indigo-100 space-y-3">
          <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
            <Calendar size={12}/> 學期週數設定
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[7px] font-bold text-slate-400 ml-1">錨點日期</label>
              <input 
                type="date" 
                className="w-full bg-white border border-indigo-100 rounded-xl px-2 py-2 text-[10px] font-black outline-none"
                value={weekConfig.baseDate}
                onChange={e => setWeekConfig({...weekConfig, baseDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[7px] font-bold text-slate-400 ml-1">起始週數</label>
              <input 
                type="number" 
                className="w-full bg-white border border-indigo-100 rounded-xl px-2 py-2 text-[10px] font-black outline-none"
                value={weekConfig.baseWeek}
                onChange={e => setWeekConfig({...weekConfig, baseWeek: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          <button 
            onClick={saveWeekConfig}
            className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black shadow-sm active:scale-95 transition-transform"
          >
            保存週數配置
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={exportData} className="py-3 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-xl flex flex-col items-center justify-center gap-1 border border-indigo-100"><Download size={16}/>備份</button>
            <button onClick={() => fileInputRef.current?.click()} className="py-3 bg-slate-50 text-slate-600 text-[9px] font-black rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-100"><Upload size={16}/>還原<input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && importData(e.target.files[0])} className="hidden" accept=".json"/></button>
          </div>
          <button onClick={clearAllData} className="w-full py-3 text-rose-500 text-[8px] font-black border border-rose-100 rounded-xl flex items-center justify-center gap-2"><Trash2 size={12}/>清空數據</button>
        </div>
        <div className="mt-6 text-center text-[7px] font-bold text-slate-400 uppercase tracking-widest">佔用: {calculateStorageUsage()}%</div>
        <button onClick={onClose} className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-lg text-sm">完成</button>
      </div>
    </div>
  );
};

/**
 * 編輯日程彈窗 - 已移除 AI 識別入口
 */
export const EditScheduleOverlay = ({ 
  item, setItem, onSave, onDelete, onClose, 
  showAdvanceUser, setShowAdvanceUser, schedules 
}: any) => (
  <div className="fixed inset-0 bg-slate-900/70 z-[4000] flex items-end backdrop-blur-sm animate-in fade-in">
    <div className="w-full bg-white rounded-t-[2.5rem] p-6 pb-8 space-y-4 max-h-[92vh] overflow-y-auto scrollbar-hide relative shadow-2xl">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">編輯日程詳情</span>
        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={16}/></button>
      </div>
      
      <textarea 
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:border-indigo-600 resize-none" 
        rows={2} value={item?.title || ""} onChange={e => setItem({...item, title: e.target.value})} placeholder="請輸入日程內容..."
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2"><Clock size={14} className="text-indigo-600"/><span className="text-[11px] font-black text-slate-700 uppercase">全天事項</span></div>
          <button onClick={() => setItem({...item, allDay: !item.allDay})} className={`w-10 h-5 rounded-full transition-all relative ${item?.allDay ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${item?.allDay ? 'right-0.5' : 'left-0.5'}`} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 px-1">
            <label className="text-[8px] font-black text-indigo-600 uppercase">日期</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black outline-none" value={item?.date || ""} onChange={e => setItem({...item, date: e.target.value})} />
          </div>
          {!(item?.allDay) && (
            <div className="flex flex-col gap-1.5 px-1 animate-in slide-in-from-top-2">
              <label className="text-[8px] font-black text-indigo-600 uppercase">具體時間</label>
              <input type="time" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black outline-none" value={item?.time || ""} onChange={e => setItem({...item, time: e.target.value})} />
            </div>
          )}
        </div>
      </div>

      <RelationSelector item={item} allSchedules={schedules || []} updateItem={(val: any) => setItem({...item, ...val})} />
      <ReminderSelector item={item} updateReminders={(val: any) => setItem({...item, reminders: val})} />
      <ContactEditor item={item} updateItem={(val: any) => setItem({...item, ...val})} showAdvanceUser={showAdvanceUser} onToggleAdvance={() => setShowAdvanceUser(!showAdvanceUser)} />
      
      <div className="space-y-3 pt-2">
        <button onClick={onSave} className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.8rem] text-sm shadow-xl active:scale-95 transition-transform">保存日程</button>
        <button onClick={onDelete} className="w-full py-2 text-rose-500 text-[9px] font-black uppercase tracking-widest text-center">刪除日程</button>
      </div>
    </div>
  </div>
);
