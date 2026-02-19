
import React, { useState } from 'react';
import { Bell, Info, User, ChevronDown, Link2, Search, Plus, Trash2, Clock, Mail, Phone } from 'lucide-react';
import { Schedule, RelationType, Relation } from './types';

interface ReminderSelectorProps {
  item: Schedule;
  updateReminders: (val: number[]) => void;
}

export const ReminderSelector: React.FC<ReminderSelectorProps> = ({ item, updateReminders }) => {
  const options = [
    { label: '準時', val: 0 }, { label: '5分', val: 5 }, { label: '30分', val: 30 },
    { label: '1小時', val: 60 }, { label: '1天前', val: 1440 }
  ];
  const currentReminders = item?.reminders || [];
  const [showCustom, setShowCustom] = useState(false);
  
  const [cDays, setCDays] = useState("0");
  const [cHours, setCHours] = useState("0");
  const [cMins, setCMins] = useState("0");

  const toggle = (val: number) => {
    currentReminders.includes(val) 
      ? updateReminders(currentReminders.filter(v => v !== val)) 
      : updateReminders([...currentReminders, val]);
  };

  const addCustom = () => {
    const total = (parseInt(cDays) || 0) * 1440 + (parseInt(cHours) || 0) * 60 + (parseInt(cMins) || 0);
    if (total >= 0) {
      toggle(total);
      setShowCustom(false);
    }
  };

  const formatOffset = (minutes: number) => {
    if (minutes === 0) return "準時";
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    const m = minutes % 60;
    let res = "";
    if (d > 0) res += `${d}天`;
    if (h > 0) res += `${h}時`;
    if (m > 0) res += `${m}分`;
    return res + "前";
  };

  return (
    <div className="space-y-3 p-5 bg-indigo-50/40 border border-indigo-100 rounded-[2rem]">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
          <Bell size={12}/> 預警提醒
        </span>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button 
            key={opt.val} 
            onClick={() => toggle(opt.val)} 
            className={`px-3 py-2 rounded-xl text-[9px] font-black border ${currentReminders.includes(opt.val) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}
          >
            {opt.label}
          </button>
        ))}
        {currentReminders.filter(r => !options.find(o => o.val === r)).map(r => (
          <button key={r} onClick={() => toggle(r)} className="px-3 py-2 rounded-xl text-[9px] font-black bg-indigo-600 border border-indigo-100 text-white shadow-md">
            {formatOffset(r)}
          </button>
        ))}
        <button onClick={() => setShowCustom(!showCustom)} className="px-3 py-2 rounded-xl text-[9px] font-black border bg-slate-800 border-slate-800 text-white">
          +自定義
        </button>
      </div>

      {showCustom && (
        <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 animate-in zoom-in-95">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-400 uppercase ml-1">天</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-center text-xs font-black" value={cDays} onChange={e=>setCDays(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-400 uppercase ml-1">時</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-center text-xs font-black" value={cHours} onChange={e=>setCHours(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-400 uppercase ml-1">分</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-center text-xs font-black" value={cMins} onChange={e=>setCMins(e.target.value)} />
            </div>
          </div>
          <button onClick={addCustom} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] shadow-lg">確認添加</button>
        </div>
      )}
    </div>
  );
};

export const RelationSelector: React.FC<{ item: Schedule, allSchedules: Schedule[], updateItem: (val: Partial<Schedule>) => void }> = ({ item, allSchedules, updateItem }) => {
  const [search, setSearch] = useState("");
  const results = allSchedules?.filter(s => s.id !== item?.id && s.title?.toLowerCase().includes(search.toLowerCase())).slice(0, 4);

  const addRelation = (targetId: string, type: RelationType) => {
    const relations = [...(item?.relations || []), { id: targetId, type }];
    updateItem({ relations });
    setSearch("");
  };

  const removeRelation = (targetId: string) => {
    updateItem({ relations: (item?.relations || []).filter(r => r.id !== targetId) });
  };

  return (
    <div className="space-y-3 p-5 bg-slate-50 border border-slate-100 rounded-[2rem]">
      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest px-1"><Link2 size={12}/> 脈絡關聯</div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
        <input className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-[10px] font-bold outline-none" placeholder="搜索建立關聯..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {search && results?.length > 0 && (
        <div className="space-y-1.5 animate-in fade-in">
          {results.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
              <span className="text-[9px] font-bold truncate flex-1">{r.title}</span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => addRelation(r.id, RelationType.PARENT)} className="px-2 py-1 bg-indigo-600 text-white text-[7px] font-black rounded-lg">前置</button>
                <button onClick={() => addRelation(r.id, RelationType.PARALLEL)} className="px-2 py-1 bg-slate-800 text-white text-[7px] font-black rounded-lg">平行</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {item?.relations?.map(rel => {
          const target = allSchedules?.find(s => s.id === rel.id);
          return (
            <div key={rel.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
              <span className={`text-[7px] font-black px-1 py-0.5 rounded ${rel.type === RelationType.PARENT ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'}`}>{rel.type === RelationType.PARENT ? '前置' : '平行'}</span>
              <span className="text-[8px] font-bold max-w-[60px] truncate">{target?.title || '已刪除'}</span>
              <button onClick={() => removeRelation(rel.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={10}/></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ContactEditor: React.FC<{ item: Schedule, updateItem: (val: Partial<Schedule>) => void, showAdvanceUser: boolean, onToggleAdvance: () => void }> = ({ item, updateItem, showAdvanceUser, onToggleAdvance }) => {
  const platforms = ['微信', 'QQ', '飛書', '釘釘'];
  const currentPlatforms = item?.ownerContactType ? item.ownerContactType.split(',').filter(Boolean) : [];
  
  const togglePlatform = (type: string) => {
    let nextPlatforms = currentPlatforms.includes(type) ? currentPlatforms.filter(t => t !== type) : [...currentPlatforms, type];
    updateItem({ ownerContactType: nextPlatforms.join(',') });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><User size={12}/> 聯繫人詳情</span>
        <button onClick={onToggleAdvance} className="flex items-center gap-1 text-[8px] font-black text-indigo-600 px-2 py-1 bg-indigo-50 rounded-full border border-indigo-100 shadow-sm transition-all active:scale-95">
          {showAdvanceUser ? '收起' : '完善細節'}<ChevronDown size={10} className={showAdvanceUser ? 'rotate-180' : ''} />
        </button>
      </div>
      
      <div className="relative">
        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
        <input className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black outline-none focus:border-indigo-300 transition-colors" placeholder="姓名 (如：王經理)" value={item?.owner || ""} onChange={e => updateItem({ owner: e.target.value })} />
      </div>

      {showAdvanceUser && (
        <div className="space-y-4 p-5 bg-slate-50/50 border border-slate-100 rounded-[1.8rem] animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Phone size={8}/> 聯繫電話</label>
               <input 
                 className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-[10px] font-bold outline-none focus:border-indigo-200" 
                 placeholder="Mobile" 
                 value={item?.ownerPhone || ""} 
                 onChange={e => updateItem({ ownerPhone: e.target.value })} 
               />
             </div>
             <div className="space-y-1.5">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Mail size={8}/> 電子郵件</label>
               <input 
                 className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-[10px] font-bold outline-none focus:border-indigo-200" 
                 placeholder="Email" 
                 value={item?.ownerEmail || ""} 
                 onChange={e => updateItem({ ownerEmail: e.target.value })} 
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">聯繫平台</label>
            <div className="grid grid-cols-4 gap-2">
              {platforms.map(t => (
                <button 
                  key={t} 
                  onClick={() => togglePlatform(t)} 
                  className={`py-2 rounded-xl text-[8px] font-black border transition-all ${currentPlatforms.includes(t) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[8px] font-black text-slate-400 uppercase ml-1">備註 / 地址 / 部門</label>
             <input 
               className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-[10px] font-bold outline-none focus:border-indigo-200" 
               placeholder="例如：研發部 301 室" 
               value={item?.ownerDept || ""} 
               onChange={e => updateItem({ ownerDept: e.target.value })} 
             />
          </div>
        </div>
      )}
    </div>
  );
};
