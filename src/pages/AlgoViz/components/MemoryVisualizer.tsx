import React from 'react';
import { Database, Boxes, Hash } from 'lucide-react';
import type { MemoryState } from '../types';
import './memory-visualizer.css';

interface MemoryVisualizerProps {
  memory?: MemoryState;
  className?: string;
}

const formatValue = (v: any): string => {
  if (v == null) return 'null';
  if (typeof v === 'number') return v.toString();
  if (typeof v === 'string') return v.length > 10 ? v.slice(0,10) + '...' : v;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return '[' + v.length + ']';
  return String(v);
};

export const MemoryVisualizer: React.FC<MemoryVisualizerProps> = ({ memory, className = '' }) => {
  if (!memory) {
    return (
      <div className={'memory-visualizer empty ' + className}>
        <Boxes size={32} />
        <p>内存状态将在算法运行时显示</p>
      </div>
    );
  }

  return (
    <div className={'memory-visualizer ' + className}>
      <div className='memory-header'>
        <Boxes size={16} />
        <span>内存状态</span>
      </div>
      {memory.mainArray && (
        <div className='memory-array-section'>
          <div className='array-header'>
            <Database size={14} />
            <span>{memory.mainArray.name}</span>
            <span>{memory.mainArray.data.length} 元素</span>
          </div>
          <div className='memory-array-grid'>
            {memory.mainArray.data.map((v, i) => (
              <div key={i} className='memory-array-cell'>
                <div className='cell-index'>[{i}]</div>
                <div className='cell-value'>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {memory.auxiliaryArrays && memory.auxiliaryArrays.length > 0 && (
        <div className='memory-auxiliary-section'>
          <div className='section-title'>
            <span>辅助数据结构</span>
          </div>
          {memory.auxiliaryArrays.map((arr, idx) => (
            <div key={idx} className='memory-array-section'>
              <div className='array-header'>
                <Database size={14} />
                <span>{arr.name}</span>
                <span>{arr.data.length} 元素</span>
              </div>
              <div className='memory-array-grid'>
                {arr.data.map((v, i) => (
                  <div key={i} className='memory-array-cell'>
                    <div className='cell-index'>[{i}]</div>
                    <div className='cell-value'>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {memory.variables.length > 0 && (
        <div className='memory-variables-section'>
          <div className='section-title'>
            <Hash size={14} />
            <span>变量 ({memory.variables.length})</span>
          </div>
          <div className='variables-grid'>
            {memory.variables.map((v, i) => (
              <div key={i} className={'memory-variable ' + (v.isHighlighted ? 'highlighted' : '')}>
                <div className='variable-name'>{v.name}</div>
                <div className='variable-value'>{formatValue(v.value)}</div>
                <div className='variable-type'>{v.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryVisualizer;
