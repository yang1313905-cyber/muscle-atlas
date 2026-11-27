import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Layers, Moon, Search, Sparkles, Sun, X } from 'lucide-react';
import type { DetailMode, DetailedMuscleId, GlobalSearchResult, SimpleGroupId } from '../core/types';
import { searchCatalog } from '../core/engine';

interface HeaderBarProps {
  mode: DetailMode;
  onModeChange: (mode: DetailMode) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  simpleCount: number;
  detailedCount: number;
  onSelectSimpleGroup: (id: SimpleGroupId) => void;
  onSelectDetailedMuscle: (id: DetailedMuscleId) => void;
  onSelectExerciseHeatmap: (exerciseId: string) => void;
}

export function HeaderBar({
  mode,
  onModeChange,
  theme,
  onToggleTheme,
  simpleCount,
  detailedCount,
  onSelectSimpleGroup,
  onSelectDetailedMuscle,
  onSelectExerciseHeatmap,
}: HeaderBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results: GlobalSearchResult = query.trim()
    ? searchCatalog(query)
    : { groups: [], muscles: [], exercises: [] };

  const hasResults =
    results.groups.length > 0 || results.muscles.length > 0 || results.exercises.length > 0;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header className="top-header">
      <div className="top-header-inner">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            肌
          </div>
          <div>
            <h1 className="brand-title">肌图志 · Muscle Atlas</h1>
            <span className="brand-sub">解剖级全身肌肉与健身动作速查</span>
          </div>
        </div>

        {/* Dual Granularity Switch */}
        <div className="mode-switch" role="tablist" aria-label="肌肉精细度模式">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'simple'}
            className={`mode-switch-btn ${mode === 'simple' ? 'active' : ''}`}
            onClick={() => onModeChange('simple')}
          >
            <Sparkles size={14} />
            <span>小白精简</span>
            <span className="mode-count-pill">{simpleCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'detailed'}
            className={`mode-switch-btn ${mode === 'detailed' ? 'active' : ''}`}
            onClick={() => onModeChange('detailed')}
          >
            <Layers size={14} />
            <span>专业细分</span>
            <span className="mode-count-pill">{detailedCount}</span>
          </button>
        </div>

        {/* Global Instant Search */}
        <div className="search-wrap" ref={wrapRef}>
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              placeholder="搜肌肉/俗称/动作（如 卧推、水滴肌）"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              aria-label="搜索肌肉或健身动作"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                aria-label="清空搜索"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {open && query.trim().length > 0 && (
            <div className="search-dropdown" role="listbox">
              {!hasResults ? (
                <div className="empty-state" style={{ padding: '16px 10px' }}>
                  未找到与「{query}」匹配的肌肉或动作
                </div>
              ) : (
                <>
                  {results.groups.length > 0 && (
                    <div>
                      <div className="search-section-label">
                        大肌群（精简模式 · {results.groups.length > 5 ? `显示前 5 / 共 ${results.groups.length}` : `${results.groups.length} 项`}）
                      </div>
                      {results.groups.slice(0, 5).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          className="search-item"
                          onClick={() => {
                            onSelectSimpleGroup(g.id);
                            setOpen(false);
                          }}
                        >
                          <div>
                            <div className="search-item-title">{g.nameZh}</div>
                            <div className="search-item-sub">{g.nameEn}</div>
                          </div>
                          <span className="meta-pill">大部位</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.muscles.length > 0 && (
                    <div>
                      <div className="search-section-label">
                        细分肌肉（专业模式 · {results.muscles.length > 6 ? `显示前 6 / 共 ${results.muscles.length}` : `${results.muscles.length} 项`}）
                      </div>
                      {results.muscles.slice(0, 6).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="search-item"
                          onClick={() => {
                            onSelectDetailedMuscle(m.id);
                            setOpen(false);
                          }}
                        >
                          <div>
                            <div className="search-item-title">{m.nameZh}</div>
                            <div className="search-item-sub">
                              {m.aliases.slice(0, 3).join(' · ') || m.nameEn}
                            </div>
                          </div>
                          <span className="meta-pill">细分</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.exercises.length > 0 && (
                    <div>
                      <div className="search-section-label">
                        健身动作（点击反查热力图 · {results.exercises.length > 6 ? `显示前 6 / 共 ${results.exercises.length}` : `${results.exercises.length} 项`}）
                      </div>
                      {results.exercises.slice(0, 6).map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          className="search-item"
                          onClick={() => {
                            onSelectExerciseHeatmap(ex.id);
                            setOpen(false);
                          }}
                        >
                          <div>
                            <div className="search-item-title">{ex.nameZh}</div>
                            <div className="search-item-sub">{ex.whyEffective}</div>
                          </div>
                          <span className="meta-pill">热力图</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="plan-soon-pill" title="已预留数据结构，待接入你的超级套表健身计划">
          <CalendarClock size={14} />
          <span>训练计划 · 待接入套表</span>
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '切换浅色图谱' : '切换深色实验室'}
          aria-label="切换明暗主题"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
