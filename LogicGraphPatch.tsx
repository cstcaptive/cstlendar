import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  X, Search, MessageSquare, BrainCircuit, Network, 
  CheckCircle2, Circle, User, ChevronRight, Send, Loader2, MousePointer2
} from 'lucide-react';
import { Schedule, RelationType } from './types';
import { askAiAboutSchedules } from './services/geminiService';

interface LogicGraphPatchProps {
  allSchedules: Schedule[];
  initialViewMode: 'graph' | 'chat';
  onClose: () => void;
  onEditItem: (s: Schedule) => void;
  onToggleComplete: (id: string) => void;
}

export const LogicGraphPatch: React.FC<LogicGraphPatchProps> = ({ 
  allSchedules, initialViewMode, onClose, onEditItem, onToggleComplete 
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'chat'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusItem, setFocusItem] = useState<Schedule | null>(allSchedules[0] || null);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'u'|'ai', text: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  // SVG 變換狀態
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 1. 計算家族脈絡
  const graphData = useMemo(() => {
    if (!focusItem) return { nodes: [], links: [] };
    const nodesMap = new Map<string, any>();
    const links: any[] = [];
    const visited = new Set<string>();

    const traverse = (id: string, level: number) => {
      if (visited.has(id) || visited.size > 25) return;
      visited.add(id);
      const item = allSchedules.find(s => s.id === id);
      if (!item) return;

      nodesMap.set(id, { ...item, level });

      allSchedules.forEach(s => {
        if (s.relations?.some(r => r.id === id && (r.type === 'parent' || r.type === RelationType.PARENT))) {
          links.push({ sourceId: id, targetId: s.id });
          traverse(s.id, level + 1);
        }
      });
      item.relations?.filter(r => r.type === 'parent' || r.type === RelationType.PARENT).forEach(r => {
        links.push({ sourceId: r.id, targetId: id });
        traverse(r.id, level - 1);
      });
    };

    traverse(focusItem.id, 0);
    const nodes = Array.from(nodesMap.values()).map((node, i) => ({
      ...node,
      x: node.level * 280 + 400,
      y: i * 140 + 100,
      isFocus: node.id === focusItem.id
    }));
    return { nodes, links };
  }, [focusItem, allSchedules]);

  // 2. 統一的交互處理邏輯 (支持鼠標與觸控)
  const handleStart = (clientX: number, clientY: number, target: HTMLElement) => {
    if (target.closest('button, input, .node-card')) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX - transform.x, y: clientY - transform.y };
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    setTransform(prev => ({
      ...prev,
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y
    }));
  }, []);

  const handleEnd = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({ ...prev, scale: Math.max(0.2, Math.min(3, prev.scale * delta)) }));
  };

  const handleAsk = async () => {
    if (!chatQuestion.trim() || isAsking) return;
    const q = chatQuestion;
    setChatQuestion("");
    setChatHistory(p => [...p, { role: 'u', text: q }]);
    setIsAsking(true);
    try {
      const ans = await askAiAboutSchedules(q, focusItem!, allSchedules);
      setChatHistory(p => [...p, { role: 'ai', text: ans }]);
    } catch {
      setChatHistory(p => [...p, { role: 'ai', text: "AI 思考失敗了。" }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col overflow-hidden animate-in fade-in duration-300 font-sans touch-none">
      {/* 頂部控制欄 */}
      <div className="relative z-[10001] p-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-indigo-400" size={24}/>
            <div>
              <h2 className="text-white text-xs font-black uppercase tracking-tighter">Logic Patch 5.0</h2>
              <p className="text-indigo-400/60 text-[7px] font-bold uppercase tracking-widest">Mobile Ready Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('graph')} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'graph' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
                <Network size={14}/><span className="text-[9px] font-black uppercase">圖譜</span>
              </button>
              <button onClick={() => setViewMode('chat')} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${viewMode === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
                <MessageSquare size={14}/><span className="text-[9px] font-black uppercase">AI</span>
              </button>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 text-white rounded-xl"><X size={20}/></button>
          </div>
        </div>

        <div className="relative w-full max-w-xl mx-auto">
          <div className="flex items-center gap-3 bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-indigo-400">
            <Search size={16} className="text-indigo-400" />
            <input 
              className="bg-transparent border-none text-white text-xs font-bold outline-none w-full"
              placeholder="搜尋標題切換脈絡..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl z-[10005] max-h-60 overflow-y-auto backdrop-blur-3xl">
              {allSchedules.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setFocusItem(s); setSearchQuery(""); setTransform({ x: 0, y: 0, scale: 1 }); }}
                  className="w-full px-5 py-4 text-left hover:bg-indigo-600 border-b border-white/5 last:border-none flex justify-between items-center group"
                >
                  <div>
                    <div className="text-[11px] font-black text-white">{s.title}</div>
                    <div className="text-[8px] text-slate-500 group-hover:text-indigo-200 uppercase">{s.date}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-white" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 主畫布區：整合鼠標與觸控事件 */}
      <div 
        className="flex-1 relative bg-slate-950 touch-none" 
        onWheel={handleWheel} 
        onMouseDown={(e) => handleStart(e.clientX, e.clientY, e.target as HTMLElement)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
      >
        {viewMode === 'graph' ? (
          <svg width="100%" height="100%" className="cursor-grab active:cursor-grabbing">
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {graphData.links.map((link, i) => {
                const s = graphData.nodes.find(n => n.id === link.sourceId);
                const t = graphData.nodes.find(n => n.id === link.targetId);
                if (!s || !t) return null;
                return <path key={i} d={`M ${s.x} ${s.y} C ${s.x + 100} ${s.y}, ${t.x - 100} ${t.y}, ${t.x} ${t.y}`} stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1.5" fill="none" />;
              })}
              {graphData.nodes.map(node => (
                <foreignObject key={node.id} x={node.x - 90} y={node.y - 50} width="180" height="100" className="overflow-visible">
                  <div 
                    onClick={(e) => { e.stopPropagation(); node.isFocus ? onEditItem(node) : setFocusItem(node); }}
                    className={`w-full h-full rounded-[1.5rem] p-4 border transition-all cursor-pointer flex flex-col justify-between shadow-xl ${node.isFocus ? 'bg-indigo-600/30 border-indigo-400 scale-110 z-50' : 'bg-slate-900 border-white/10 hover:border-indigo-500'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{node.date}</span>
                      <button onClick={(e) => { e.stopPropagation(); onToggleComplete(node.id); }} className={node.completed ? 'text-emerald-500' : 'text-slate-700'}>
                        {node.completed ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-2 mt-1">{node.title}</p>
                    <div className="flex items-center gap-1.5 opacity-40 text-white mt-1">
                      <User size={10}/><span className="text-[8px] font-bold truncate">{node.owner || "無聯絡人"}</span>
                    </div>
                  </div>
                </foreignObject>
              ))}
            </g>
          </svg>
        ) : (
          <div className="h-full flex flex-col p-6 max-w-2xl mx-auto w-full">
            <div className="flex-1 overflow-y-auto space-y-4 pb-36">
              {chatHistory.map((c, i) => (
                <div key={i} className={`flex ${c.role === 'u' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[1.8rem] text-[11px] font-bold ${c.role === 'u' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                    {c.text}
                  </div>
                </div>
              ))}
              {isAsking && <div className="text-indigo-400 text-[10px] font-black animate-pulse px-4">AI 正在深度掃描脈絡...</div>}
            </div>
            <div className="absolute bottom-10 left-6 right-6 max-w-2xl mx-auto flex gap-3 bg-slate-900/90 p-2.5 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl">
              <input className="flex-1 bg-transparent px-5 text-white text-[11px] font-bold outline-none" placeholder="詢問 AI 顧問..." value={chatQuestion} onChange={e => setChatQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAsk()}/>
              <button onClick={handleAsk} className="p-3.5 bg-indigo-600 text-white rounded-full active:scale-90 transition-all shadow-lg"><Send size={18}/></button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-6 pointer-events-none flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md opacity-40">
        <MousePointer2 size={12} className="text-indigo-400"/>
        <span className="text-[8px] font-black text-white uppercase tracking-tighter">單指拖移 • 滾輪縮放 • 點擊切換</span>
      </div>
    </div>
  );
};

export default LogicGraphPatch;