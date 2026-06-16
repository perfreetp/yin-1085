import { useState } from 'react';
import { JARGON_LIST, type JargonItem } from '@/types';
import { useStore } from '@/store/useStore';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JargonTermProps {
  term: string;
  className?: string;
  showAlwaysExpandable?: boolean;
}

export function JargonTerm({ term, className, showAlwaysExpandable = false }: JargonTermProps) {
  const familyMode = useStore((s) => s.familyMode);
  const [expanded, setExpanded] = useState(false);
  const item = JARGON_LIST.find((j) => j.term === term);

  if (!item) {
    return <span className={className}>{term}</span>;
  }

  const canExpand = familyMode || showAlwaysExpandable;

  if (!canExpand) {
    return <span className={className}>{item.simple}</span>;
  }

  return (
    <span className={cn('inline-flex items-center gap-1 cursor-pointer group', className)}>
      <span>{item.simple}</span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex-shrink-0 w-5 h-5 rounded-full bg-warm-100 text-warm-500 flex items-center justify-center hover:bg-warm-200 transition-colors"
        aria-label={`查看${item.term}的解释`}
      >
        <Info className="w-3 h-3" />
      </button>
      {expanded && (
        <span className="absolute left-0 top-full mt-1 z-50 bg-white rounded-elder shadow-elder-lg p-3 border border-warm-200 text-elder-sm text-warm-700 min-w-[200px]">
          <span className="font-bold text-warm-800 block mb-1">
            原词：{item.term}
          </span>
          {item.detail}
        </span>
      )}
    </span>
  );
}

export function JargonExplainer() {
  const familyMode = useStore((s) => s.familyMode);
  const [open, setOpen] = useState(false);

  if (!familyMode) return null;

  return (
    <div className="relative no-print">
      <button
        onClick={() => setOpen(!open)}
        className="elder-btn-ghost flex items-center gap-2 text-elder-sm"
      >
        <Info className="w-5 h-5" />
        术语解释
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-elder-lg shadow-elder-lg max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-5 border-b border-warm-100 flex items-center justify-between">
              <h3 className="text-elder-lg font-bold text-warm-800">📖 睡眠术语通俗解释</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-warm-500 hover:text-warm-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              {JARGON_LIST.map((item) => (
                <div
                  key={item.term}
                  className="bg-warm-50 rounded-elder p-4 space-y-2"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-elder-base font-bold text-warm-700">
                      {item.term}
                    </span>
                    <span className="text-warm-400 text-elder-sm">→</span>
                    <span className="text-elder-base text-warm-800 font-medium">
                      {item.simple}
                    </span>
                  </div>
                  <p className="text-elder-sm text-warm-600 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function getSimpleTerm(term: string): string {
  const item = JARGON_LIST.find((j) => j.term === term);
  return item ? item.simple : term;
}
