
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Calendar, ChevronRight, ChevronLeft, Settings2, BellRing, Sparkles, MessageSquare, Network
} from 'lucide-react';
import { Schedule, TabType, WeekConfig } from './types';
import { 
  HOURS, VIEW_DAYS_COUNT, LOCAL_STORAGE_KEY, WEEK_CONFIG_KEY, getLocalDateString 
} from './constants';
import { getEmptySchedule } from './ExtractLogic';
import { saveSchedulesWithBackup } from './StorageLogic';
import { requestNotificationPermission, checkPendingReminders, triggerFeedback } from './ReminderLogic';
import { 
  SettingsModal, EditScheduleOverlay 
} from './OverlayComponents';
import { ReminderSelector, ContactEditor } from './EditorComponents';
import { calculateWeekTag } from './WeekPatch';
import { LogicGraphPatch } from './LogicGraphPatch';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('widget');
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [weekConfig, setWeekConfig] = useState<WeekConfig>(() => {
    const saved = localStorage.getItem(WEEK_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { baseDate: getLocalDateString(new Date()), baseWeek: 1 };
  });

  const [editingItem, setEditingItem] = useState<Schedule | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [toast, setToast] = useState({ show: false, message: "" });
  const [isWeekConfigOpen, setIsWeekConfigOpen] = useState(false);
  const [showAdvanceUser, setShowAdvanceUser] = useState(false);
  
  const [isLogicHubOpen, setIsLogicHubOpen] = useState(false);
  const [logicHubMode, setLogicHubMode] = useState<'graph' | 'chat'>('graph'); // 設置 Logic Hub 的初始模式
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isEditingFromGraph, setIsEditingFromGraph] = useState(false);

  const triggeredRef = useRef<Set<string>>(new Set());
  const todayStr = useMemo(() => getLocalDateString(new Date()), [viewDate]);

  useEffect(() => { requestNotificationPermission(); }, []);
  useEffect(() => { saveSchedulesWithBackup(schedules); }, [schedules]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem(WEEK_CONFIG_KEY);
      if (saved) setWeekConfig(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkPendingReminders(schedules, triggeredRef.current, (title, body, key) => {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
        showToast(title); triggerFeedback();
        triggeredRef.current.add(key);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [schedules]);

  const showToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 5000);
  };

  const currentDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < VIEW_DAYS_COUNT; i++) {
      const d = new Date(viewDate); d.setDate(d.getDate() + i);
      const dStr = getLocalDateString(d);
      days.push({
        date: dStr,
        dayName: dStr === getLocalDateString(new Date()) ? '今天' : d.toLocaleDateString('zh-CN', { weekday: 'short' }),
        dayNum: d.getDate(), month: d.getMonth() + 1, isToday: dStr === getLocalDateString(new Date()),
        weekTag: calculateWeekTag(dStr, weekConfig)
      });
    }
    return days;
  }, [viewDate, weekConfig]);

  const handleToggleComplete = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  return (
    <div className="h-screen w-screen bg-white antialiased flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {toast.show && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[5000] bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 w-[90%] max-w-sm">
            <BellRing size={16} className="text-indigo-400 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-wider line-clamp-2">{toast.message}</p>
          </div>
        )}

        <div className="bg-white pt-12 px-6 pb-2 border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Calendar size={18} />
              </div>
              <span className="text-xs font-black italic tracking-tighter uppercase">Smart Flow</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewDate(new Date())} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase shadow-sm">Today</button>
              <div className="flex bg-slate-100 p-0.5 rounded-full">
                <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - VIEW_DAYS_COUNT); setViewDate(d); }} className="p-1.5"><ChevronLeft size={14}/></button>
                <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + VIEW_DAYS_COUNT); setViewDate(d); }} className="p-1.5"><ChevronRight size={14}/></button>
              </div>
              <button onClick={() => setIsWeekConfigOpen(true)} className="p-2 bg-slate-900 text-white rounded-full"><Settings2 size={12}/></button>
            </div>
          </div>
          <div className="flex items-end">
            <div className="w-10 text-[10px] font-black text-indigo-600 pb-2">{currentDays?.[0]?.month}月</div>
            {currentDays?.map(day => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <span className={`text-[8px] font-black ${day.isToday ? 'text-indigo-600' : 'text-slate-400'} uppercase`}>{day.dayName}</span>
                <span className={`text-sm font-black ${day.isToday ? 'text-indigo-600' : 'text-slate-800'}`}>{day.dayNum}</span>
                <span className="text-[8px] font-black opacity-60 text-indigo-500">{day.weekTag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'widget' ? (
            <div className="h-full overflow-y-auto scrollbar-hide bg-white pb-32">
              <div className="sticky top-0 z-30 flex bg-white/95 backdrop-blur-md border-b-2 border-indigo-100 shadow-sm">
                <div className="w-10 shrink-0 border-r border-slate-100 flex items-center justify-center bg-slate-50/50">
                   <span className="text-[6px] font-black text-indigo-500 vertical-text uppercase tracking-widest">ALL DAY</span>
                </div>
                <div className="flex-1 flex">
                  {currentDays?.map(day => (
                    <div key={`allday-${day.date}`} className="flex-1 border-r border-slate-50 p-1 min-h-[48px] space-y-1">
                      {schedules?.filter(s => s.date === day.date && s.allDay).map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => { setEditingItem(s); setIsEditingFromGraph(false); }} 
                          className={`w-full rounded-md px-1.5 py-1 text-[7px] font-black text-white truncate shadow-sm cursor-pointer active:scale-95 transition-all ${s.completed ? 'bg-slate-300 line-through' : 'bg-emerald-500'}`}
                        >
                          {s.title}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-h-full">
                <div className="w-10 shrink-0 border-r border-slate-50 bg-slate-50/20">
                  {HOURS.map(h => (
                    <div key={h} className="h-14 border-b border-slate-50 relative">
                      <span className="absolute right-0.5 top-0.5 text-[7px] font-bold text-slate-300">{h}:00</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 flex">
                  {currentDays?.map(day => (
                    <div key={`timeline-${day.date}`} className="flex-1 border-r border-slate-50 relative min-w-[20%]">
                      {schedules?.filter(s => s.date === day.date && !s.allDay).map(s => { 
                        const h = parseInt(s.time?.split(':')[0]); 
                        const m = parseInt(s.time?.split(':')[1]) || 0;
                        const top = ((isNaN(h) ? 0 : Math.max(0, (h - 8) + (m / 60))) * 56); 
                        return (
                          <div 
                            key={s.id} 
                            onClick={() => { setEditingItem(s); setIsEditingFromGraph(false); }} 
                            style={{ top: `${top}px` }} 
                            className={`absolute left-[2px] right-[2px] h-[24px] rounded-lg p-1.5 text-[7px] font-bold text-white truncate z-10 shadow-md cursor-pointer active:scale-95 transition-all border border-white/20 ${s.completed ? 'bg-slate-300 line-through' : 'bg-indigo-600'}`}
                          >
                            <span className="opacity-70 mr-1">{s.time}</span>
                            {s.title}
                          </div>
                        ); 
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full px-6 flex flex-col items-center justify-center bg-white pb-32">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                  <Plus size={48} className="text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900">新增日程</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">手動建立您的待辦事項</p>
                </div>
                <button 
                  onClick={() => { setEditingItem(getEmptySchedule(todayStr)); setIsEditingFromGraph(false); }} 
                  className="w-full max-w-xs py-5 bg-slate-900 text-white rounded-[1.8rem] text-sm font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <Plus size={20}/> 手動新建日程
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 w-full h-20 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center px-6 z-50 shadow-lg pb-[env(safe-area-inset-bottom,8px)]">
          <button onClick={() => setActiveTab('widget')} className={`p-2 transition-all active:scale-90 ${activeTab === 'widget' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
            <Calendar size={28}/>
          </button>
          
          <div className="w-14 h-14" />

          <button onClick={() => setIsActionSheetOpen(!isActionSheetOpen)} className={`p-2 transition-all active:scale-90 ${isLogicHubOpen ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
            <Sparkles size={28}/>
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button 
              onClick={() => { setActiveTab('upload'); setEditingItem(getEmptySchedule(todayStr)); setIsEditingFromGraph(false); }} 
              className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl border-[6px] border-white active:scale-90 transition-all"
            >
              <Plus size={32}/>
            </button>
          </div>
        </div>

        {isActionSheetOpen && (
          <div className="fixed inset-0 z-[6000] flex items-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsActionSheetOpen(false)} />
            <div className="relative w-full bg-white rounded-t-[2.5rem] p-6 pb-12 space-y-3 animate-in slide-in-from-bottom-20 duration-300">
              <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-4" />
              <button 
                onClick={() => { setLogicHubMode('graph'); setIsLogicHubOpen(true); setIsActionSheetOpen(false); }}
                className="w-full flex items-center justify-between p-5 bg-indigo-50 rounded-2xl group active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-xl text-white"><Network size={20}/></div>
                  <div className="text-left">
                    <p className="text-xs font-black text-indigo-900">邏輯圖譜中心</p>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Visual Family Context</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-indigo-300" />
              </button>
              <button 
                onClick={() => { setLogicHubMode('chat'); setIsLogicHubOpen(true); setIsActionSheetOpen(false); }}
                className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl group active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-xl text-white"><MessageSquare size={20}/></div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900">全局 AI 顧問</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Logic Matrix Analysis</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </div>
          </div>
        )}

        {isLogicHubOpen && (
          <LogicGraphPatch 
            allSchedules={schedules} 
            initialViewMode={logicHubMode}
            onClose={() => setIsLogicHubOpen(false)} 
            onEditItem={(s) => { setEditingItem(s); setIsEditingFromGraph(true); setIsLogicHubOpen(false); }}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {isWeekConfigOpen && (
          <SettingsModal 
            onClose={() => {
              setIsWeekConfigOpen(false);
              const saved = localStorage.getItem(WEEK_CONFIG_KEY);
              if (saved) setWeekConfig(JSON.parse(saved));
            }} 
          />
        )}

        {editingItem && (
          <EditScheduleOverlay 
            item={editingItem} 
            setItem={setEditingItem} 
            showAdvanceUser={showAdvanceUser} 
            setShowAdvanceUser={setShowAdvanceUser} 
            schedules={schedules || []}
            onSave={() => { 
              setSchedules(s => s.some(x => x.id === editingItem.id) ? s.map(x => x.id === editingItem.id ? editingItem : x) : [...s, editingItem]); 
              setEditingItem(null); 
              if (isEditingFromGraph) setIsLogicHubOpen(true); // 從圖譜編輯後，返回圖譜
              else setActiveTab('widget'); 
              showToast("保存成功"); 
            }}
            onDelete={() => { 
              setSchedules(s => s.filter(x => x.id !== editingItem.id)); 
              setEditingItem(null); 
              if (isEditingFromGraph) setIsLogicHubOpen(true); // 從圖譜編輯後，返回圖譜
              showToast("已刪除"); 
            }}
            onClose={() => {
              setEditingItem(null);
              if (isEditingFromGraph) setIsLogicHubOpen(true); // 從圖譜編輯後，返回圖譜
            }}
          />
        )}
      </div>
    </div>
  );
};

export default App;
