import { useMemo, useState } from 'react';
import { Flame, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import {
  ANATOMY_LANDMARKS,
  ANATOMY_REGIONS,
  ANATOMY_VIEWBOX,
  BODY_SILHOUETTE_PATH,
  type AnatomyPathRegion,
} from '../anatomy/svgPaths';
import type {
  BodyView,
  DetailMode,
  DetailedMuscle,
  DetailedMuscleId,
  ExerciseHeatmap,
  MuscleRole,
  SelectionTarget,
  SimpleGroupId,
  SimpleMuscleGroup,
} from '../core/types';
import { QuickPickerDrawer } from './QuickPickerDrawer';

interface BodyMapProps {
  mode: DetailMode;
  view: BodyView;
  onViewChange: (view: BodyView) => void;
  selection: SelectionTarget;
  heatmap: ExerciseHeatmap | null;
  onClearHeatmap: () => void;
  simpleGroups: SimpleMuscleGroup[];
  detailedMuscles: DetailedMuscle[];
  onSelectSimple: (id: SimpleGroupId) => void;
  onSelectDetailed: (id: DetailedMuscleId) => void;
}

const ZOOM_STEPS = [1, 1.35, 1.75] as const;

export function BodyMap({
  mode,
  view,
  onViewChange,
  selection,
  heatmap,
  onClearHeatmap,
  simpleGroups,
  detailedMuscles,
  onSelectSimple,
  onSelectDetailed,
}: BodyMapProps) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const groupMap = useMemo(
    () => new Map(simpleGroups.map((g) => [g.id, g])),
    [simpleGroups],
  );
  const muscleMap = useMemo(
    () => new Map(detailedMuscles.map((m) => [m.id, m])),
    [detailedMuscles],
  );

  const regions = ANATOMY_REGIONS[view];
  const landmarks = ANATOMY_LANDMARKS[view];
  const zoom = ZOOM_STEPS[zoomIdx];

  const getRegionKey = (r: AnatomyPathRegion) =>
    heatmap || mode === 'detailed' ? r.muscleId : r.groupId;

  const getRegionRoleInHeatmap = (r: AnatomyPathRegion): MuscleRole | undefined => {
    if (!heatmap) return undefined;
    // Always color by exact anatomical muscle role in heatmap mode (never smear primary onto uninvolved sibling muscles!)
    return heatmap.muscleRoles[r.muscleId];
  };

  const getRegionLabel = (r: AnatomyPathRegion) => {
    const m = muscleMap.get(r.muscleId);
    const g = groupMap.get(r.groupId);
    if (heatmap) {
      const role = heatmap.muscleRoles[r.muscleId];
      const roleText = role ? roleLabelZh(role) : '未参与';
      return `${m?.nameZh ?? r.muscleId}（${roleText}）`;
    }
    if (mode === 'simple') {
      return g?.nameZh ?? r.groupId;
    }
    return m ? `${m.nameZh}${g ? ` · ${g.nameZh}` : ''}` : r.muscleId;
  };

  const isRegionSelected = (r: AnatomyPathRegion) => {
    if (heatmap) return false;
    return selection.mode === 'simple'
      ? r.groupId === selection.id
      : r.muscleId === selection.id;
  };

  const handleRegionClick = (r: AnatomyPathRegion) => {
    if (heatmap) {
      onClearHeatmap();
    }
    if (mode === 'simple') {
      onSelectSimple(r.groupId);
    } else {
      onSelectDetailed(r.muscleId);
    }
  };

  const hoveredTooltip = useMemo(() => {
    if (!hoveredKey) return null;
    if (heatmap) {
      const m = muscleMap.get(hoveredKey as DetailedMuscleId);
      if (!m) return null;
      const role = heatmap.muscleRoles[m.id];
      return {
        title: m.nameZh,
        sub: role ? roleLabelZh(role) : '未参与该动作',
      };
    }
    if (mode === 'simple') {
      const g = groupMap.get(hoveredKey as SimpleGroupId);
      if (!g) return null;
      return {
        title: g.nameZh,
        sub: `${g.childMuscles.length} 块细分肌群`,
      };
    }
    const m = muscleMap.get(hoveredKey as DetailedMuscleId);
    if (!m) return null;
    return {
      title: m.nameZh,
      sub: groupMap.get(m.groupId)?.nameZh ?? '',
    };
  }, [hoveredKey, mode, groupMap, muscleMap, heatmap]);

  const heatmapBreakdown = useMemo(() => {
    if (!heatmap) return null;
    const primary: string[] = [];
    const secondary: string[] = [];
    const stabilizer: string[] = [];
    for (const link of heatmap.exercise.muscles) {
      const label = muscleMap.get(link.muscleId)?.shortLabelZh ?? link.muscleId;
      if (link.role === 'primary') primary.push(label);
      else if (link.role === 'secondary') secondary.push(label);
      else stabilizer.push(label);
    }
    return { primary, secondary, stabilizer };
  }, [heatmap, muscleMap]);

  const svgWidth = Math.round(290 * zoom);
  const svgHeight = Math.round(580 * zoom);

  return (
    <section className="anatomy-card" aria-label="交互式人体肌肉结构图">
      <div className="stage-toolbar">
        <div className="view-tabs" role="tablist" aria-label="正背面视角切换">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'front'}
            className={`view-tab-btn ${view === 'front' ? 'active' : ''}`}
            onClick={() => onViewChange('front')}
          >
            正面视图
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'back'}
            className={`view-tab-btn ${view === 'back' ? 'active' : ''}`}
            onClick={() => onViewChange('back')}
          >
            背面视图
          </button>
        </div>

        <div className="zoom-group">
          <button
            type="button"
            className="zoom-btn"
            onClick={() => onViewChange(view === 'front' ? 'back' : 'front')}
            title="翻转正背面"
          >
            <RotateCw size={13} />
            <span>翻转</span>
          </button>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
            aria-label="缩小人体图"
            title="缩小"
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            disabled={zoomIdx === ZOOM_STEPS.length - 1}
            aria-label="放大人体图"
            title="放大查看细分肌肉"
          >
            <ZoomIn size={13} />
            <span>{zoom}x</span>
          </button>
        </div>
      </div>

      {heatmap && heatmapBreakdown && (
        <div className="heatmap-banner" role="region" aria-label={`热力图激活详情：${heatmap.exercise.nameZh}`}>
          <div className="heatmap-banner-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Flame size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <span>
                精准热力图：<strong>{heatmap.exercise.nameZh}</strong>（按具体参与肌束着色，可翻转正背面）
              </span>
            </div>
            <button type="button" className="heatmap-exit-btn" onClick={onClearHeatmap}>
              退出热力图
            </button>
          </div>
          <div className="heatmap-breakdown">
            {heatmapBreakdown.primary.length > 0 && (
              <span>
                <strong className="role-text-primary">主攻：</strong>
                {heatmapBreakdown.primary.join('、')}
              </span>
            )}
            {heatmapBreakdown.secondary.length > 0 && (
              <span>
                <strong className="role-text-secondary">协同：</strong>
                {heatmapBreakdown.secondary.join('、')}
              </span>
            )}
            {heatmapBreakdown.stabilizer.length > 0 && (
              <span>
                <strong className="role-text-stabilizer">稳定：</strong>
                {heatmapBreakdown.stabilizer.join('、')}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="svg-viewport">
        <svg
          className="anatomy-svg"
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${ANATOMY_VIEWBOX.width} ${ANATOMY_VIEWBOX.height}`}
          role="group"
          aria-label={`人体${view === 'front' ? '正面' : '背面'}肌肉解剖交互图`}
        >
          {/* Base human athletic silhouette (single seamless closed path) */}
          <g aria-hidden="true">
            <path
              d={BODY_SILHOUETTE_PATH}
              fill="var(--body-silhouette-fill)"
              stroke="var(--body-silhouette-stroke)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>

          {/* Clickable muscle vector paths */}
          <g className={!heatmap && mode === 'simple' ? 'mode-simple-group' : 'mode-detailed-group'}>
            {regions.map((region) => {
              const key = getRegionKey(region);
              const selected = isRegionSelected(region);
              const hovered = hoveredKey === key;
              const heatmapRole = getRegionRoleInHeatmap(region);

              const classes = ['muscle-region'];
              if (heatmap) {
                if (heatmapRole) {
                  classes.push(`role-${heatmapRole}`);
                } else {
                  classes.push('is-dimmed');
                }
              } else if (selected) {
                classes.push('is-selected');
              }
              if (hovered && !selected) {
                classes.push('is-hovered');
              }

              return (
                <path
                  key={region.id}
                  d={region.d}
                  className={classes.join(' ')}
                  role="button"
                  tabIndex={0}
                  aria-label={getRegionLabel(region)}
                  aria-pressed={selected}
                  data-muscle-id={region.muscleId}
                  data-group-id={region.groupId}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey((prev) => (prev === key ? null : prev))}
                  onFocus={() => setHoveredKey(key)}
                  onBlur={() => setHoveredKey((prev) => (prev === key ? null : prev))}
                  onClick={() => handleRegionClick(region)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRegionClick(region);
                    }
                  }}
                />
              );
            })}
          </g>

          {/* Anatomical reference landmarks (non-interactive) */}
          <g
            aria-hidden="true"
            fill="none"
            stroke="var(--body-landmark-stroke)"
            strokeWidth="1.15"
            strokeLinecap="round"
            pointerEvents="none"
          >
            {landmarks.map((d, idx) => (
              <path key={idx} d={d} />
            ))}
          </g>
        </svg>

        {hoveredTooltip && (
          <div className="svg-floating-tooltip" aria-live="polite">
            <span>{hoveredTooltip.title}</span>
            {hoveredTooltip.sub && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                {hoveredTooltip.sub}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="svg-legend">
        <div className="legend-items">
          {heatmap ? (
            <>
              <span>
                <i className="legend-dot" style={{ background: 'var(--accent-primary)' }} />
                主攻肌
              </span>
              <span>
                <i className="legend-dot" style={{ background: 'var(--accent-secondary)' }} />
                协同肌
              </span>
              <span>
                <i className="legend-dot" style={{ background: 'var(--accent-stabilizer)' }} />
                稳定肌
              </span>
            </>
          ) : (
            <>
              <span>
                <i className="legend-dot" style={{ background: 'var(--accent-primary)' }} />
                当前选中
              </span>
              <span>
                <i className="legend-dot" style={{ background: 'var(--muscle-idle-fill)' }} />
                点击任意肌群查看动作
              </span>
            </>
          )}
        </div>
        <span>{mode === 'simple' ? '小白精简模式' : '专业细分模式'}</span>
      </div>

      <QuickPickerDrawer
        mode={mode}
        selection={selection}
        heatmap={heatmap}
        simpleGroups={simpleGroups}
        detailedMuscles={detailedMuscles}
        onSelectSimple={(id) => {
          if (heatmap) onClearHeatmap();
          onSelectSimple(id);
        }}
        onSelectDetailed={(id) => {
          if (heatmap) onClearHeatmap();
          onSelectDetailed(id);
        }}
      />
    </section>
  );
}

function roleLabelZh(role: MuscleRole): string {
  if (role === 'primary') return '主攻肌';
  if (role === 'secondary') return '协同肌';
  return '稳定肌';
}
