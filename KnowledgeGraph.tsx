
import React, { useMemo } from 'react';
import { Schedule, RelationType } from './types';
import { User, Clock, Link2, ArrowRight } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  data: Schedule;
  type: 'focus' | 'parent' | 'child' | 'parallel';
}

interface Link {
  source: { x: number; y: number };
  target: { x: number; y: number };
  type: RelationType | 'child-link';
}

interface KnowledgeGraphProps {
  target: Schedule;
  allSchedules: Schedule[];
  onFocusNode: (s: Schedule) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ target, allSchedules, onFocusNode }) => {
  const width = 380;
  const height = 450;
  const cx = width / 2;
  const cy = height / 2;

  const { nodes, links } = useMemo(() => {
    const nodesList: Node[] = [];
    const linksList: Link[] = [];

    // 1. Center Node
    const focusNode: Node = { id: target.id, x: cx, y: cy, data: target, type: 'focus' };
    nodesList.push(focusNode);

    // 2. Find Relatives
    const parents = allSchedules.filter(s => target.relations?.some(r => r.id === s.id && r.type === RelationType.PARENT));
    const children = allSchedules.filter(s => s.relations?.some(r => r.id === target.id && r.type === RelationType.PARENT));
    const parallels = allSchedules.filter(s => target.relations?.some(r => r.id === s.id && r.type === RelationType.PARALLEL));

    // Layout Constants
    const hGap = 130;
    const vGap = 90;

    // Position Parents (Left)
    parents.forEach((p, i) => {
      const x = cx - hGap;
      const y = cy + (i - (parents.length - 1) / 2) * vGap;
      const node: Node = { id: p.id, x, y, data: p, type: 'parent' };
      nodesList.push(node);
      linksList.push({ source: { x, y }, target: { x: cx, y: cy }, type: RelationType.PARENT });
    });

    // Position Children (Right)
    children.forEach((c, i) => {
      const x = cx + hGap;
      const y = cy + (i - (children.length - 1) / 2) * vGap;
      const node: Node = { id: c.id, x, y, data: c, type: 'child' };
      nodesList.push(node);
      linksList.push({ source: { x: cx, y: cy }, target: { x, y }, type: 'child-link' as any });
    });

    // Position Parallels (Top/Bottom)
    parallels.forEach((p, i) => {
      const x = cx + (i % 2 === 0 ? -40 : 40);
      const y = cy + (i < 2 ? -120 : 120);
      const node: Node = { id: p.id, x, y, data: p, type: 'parallel' };
      nodesList.push(node);
      linksList.push({ source: { x, y }, target: { x: cx, y: cy }, type: RelationType.PARALLEL });
    });

    return { nodes: nodesList, links: linksList };
  }, [target, allSchedules, cx, cy]);

  return (
    <div className="relative w-full h-[450px] bg-slate-900/50 rounded-[3rem] overflow-hidden border border-white/5 shadow-inner">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
      
      <svg width={width} height={height} className="relative z-10">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
            <stop offset="50%" stopColor="rgba(99, 102, 241, 0.5)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </linearGradient>
        </defs>

        {/* Drawing Connections */}
        {links.map((link, i) => {
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const qx = link.source.x + dx / 2;
          const qy = link.source.y + dy / 2 + (Math.abs(dx) > 10 ? 0 : 20); // Add slight curve to vertical lines
          const path = `M ${link.source.x} ${link.source.y} Q ${qx} ${qy} ${link.target.x} ${link.target.y}`;

          return (
            <g key={`link-${i}`}>
              <path
                d={path}
                fill="none"
                stroke="white"
                strokeOpacity="0.1"
                strokeWidth="1.5"
              />
              <path
                d={path}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2"
                strokeDasharray="10, 20"
                className="animate-[dash_3s_linear_infinite]"
              >
                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
              </path>
            </g>
          );
        })}

        {/* Drawing Nodes */}
        {nodes.map((node) => (
          <foreignObject
            key={node.id}
            x={node.x - 60}
            y={node.y - 35}
            width="120"
            height="70"
            className="overflow-visible"
          >
            <div 
              onClick={() => onFocusNode(node.data)}
              className={`
                w-full h-full rounded-2xl p-2 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-500
                backdrop-blur-md border border-white/10
                ${node.type === 'focus' 
                  ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110' 
                  : 'bg-white/5 hover:bg-white/15 hover:scale-105 active:scale-95'
                }
              `}
            >
              <div className="flex items-center gap-1 mb-1">
                {node.data.owner && (
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-[6px] font-black text-white">{node.data.owner[0]}</span>
                  </div>
                )}
                <span className={`text-[8px] font-black uppercase tracking-tighter ${node.type === 'focus' ? 'text-indigo-200' : 'text-slate-400'}`}>
                   {node.data.date.split('-').slice(1).join('/')}
                </span>
              </div>
              <p className={`text-[9px] font-black leading-tight line-clamp-2 ${node.type === 'focus' ? 'text-white' : 'text-slate-300'}`}>
                {node.data.title}
              </p>
              {node.type !== 'focus' && (
                <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ArrowRight size={6} />
                </div>
              )}
            </div>
          </foreignObject>
        ))}
      </svg>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default KnowledgeGraph;
