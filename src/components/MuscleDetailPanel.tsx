import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  ExternalLink,
  Flame,
  HeartPulse,
  Info,
  ListChecks,
} from 'lucide-react';
import type {
  DetailedMuscle,
  DetailedMuscleId,
  EquipmentType,
  MuscleQueryFilter,
  MuscleQueryResult,
  MuscleRole,
  RankedExerciseItem,
  SimpleGroupId,
} from '../core/types';
import { getAllJointActions, getDetailedMuscleById, getSimpleGroupById } from '../core/engine';

interface MuscleDetailPanelProps {
  result: MuscleQueryResult;
  filter: MuscleQueryFilter;
  onFilterChange: (next: MuscleQueryFilter) => void;
  activeHeatmapExerciseId: string | null;
  onToggleHeatmap: (exerciseId: string) => void;
  onDrillDownMuscle: (muscleId: DetailedMuscleId) => void;
  onJumpToSimpleGroup: (groupId: SimpleGroupId) => void;
}

type DetailTab = 'exercises' | 'anatomy' | 'stretches';
type RelatedRoleFilter = 'all' | MuscleRole;

const EQUIPMENT_OPTIONS: { value: EquipmentType | 'all'; label: string }[] = [
  { value: 'all', label: '全部器械' },
  { value: 'bodyweight', label: '徒手' },
  { value: 'dumbbell', label: '哑铃' },
  { value: 'barbell', label: '杠铃' },
  { value: 'cable', label: '龙门架/绳索' },
  { value: 'machine', label: '固定器械' },
  { value: 'band_or_kettlebell', label: '弹力带/壶铃' },
];

const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  bodyweight: '徒手',
  dumbbell: '哑铃',
  barbell: '杠铃',
  cable: '绳索',
  machine: '固定器械',
  band_or_kettlebell: '弹力带/壶铃',
};

const DIFFICULTY_LABEL = {
  beginner: '新手友好',
  intermediate: '进阶',
  advanced: '高阶',
} as const;

const ROLE_LABEL: Record<MuscleRole, string> = {
  primary: '主攻',
  secondary: '协同',
  stabilizer: '稳定',
};

export function MuscleDetailPanel({
  result,
  filter,
  onFilterChange,
  activeHeatmapExerciseId,
  onToggleHeatmap,
  onDrillDownMuscle,
  onJumpToSimpleGroup,
}: MuscleDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('exercises');
  const [relatedRoleFilter, setRelatedRoleFilter] = useState<RelatedRoleFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [showAllBest, setShowAllBest] = useState(false);

  // Reset per-muscle role filter, expanded cards, and best-list truncation whenever target changes
  useEffect(() => {
    setRelatedRoleFilter('all');
    setExpandedIds({});
    setShowAllBest(false);
  }, [result.target.mode, result.target.id]);

  const toggleExpand = (key: string) => {
    setExpandedIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const includedIdSet = useMemo(
    () => new Set(result.includedMuscles.map((m) => m.id)),
    [result.includedMuscles],
  );

  // Lookup across ALL 75 joint actions so compound exercises never lose non-target joint actions (e.g. elbow extension in bench press)
  const jointActionNameMap = useMemo(
    () => new Map(getAllJointActions(false).map((j) => [j.id, `${j.jointZh}·${j.actionZh}`])),
    [],
  );

  const filteredRelated = useMemo(() => {
    if (relatedRoleFilter === 'all') return result.allRelatedExercises;
    return result.allRelatedExercises.filter((item) => item.matchedRole === relatedRoleFilter);
  }, [result.allRelatedExercises, relatedRoleFilter]);

  const roleCounts = useMemo(() => {
    const counts = { primary: 0, secondary: 0, stabilizer: 0 };
    for (const item of result.allRelatedExercises) {
      counts[item.matchedRole] += 1;
    }
    return counts;
  }, [result.allRelatedExercises]);

  const parentGroup =
    result.target.mode === 'detailed'
      ? getSimpleGroupById(getDetailedMuscleById(result.target.id).groupId)
      : null;

  const currentDetailedMuscle: DetailedMuscle | null =
    result.target.mode === 'detailed' ? result.includedMuscles[0] ?? null : null;

  return (
    <section className="detail-card" aria-label="肌肉详情与推荐动作">
      {/* Hero Summary */}
      <div className="detail-hero">
        <div className="detail-breadcrumb">
          <span className="mode-tag">
            {result.target.mode === 'simple' ? '小白精简视图' : '专业细分视图'}
          </span>
          {parentGroup && (
            <button
              type="button"
              className="submuscle-btn"
              onClick={() => onJumpToSimpleGroup(parentGroup.id)}
            >
              所属大部位：{parentGroup.nameZh} ↗
            </button>
          )}
          <span className="meta-pill">
            最适合动作 {result.bestExercises.length} · 全部涉及 {result.allRelatedExercises.length}
          </span>
        </div>

        <div className="detail-title-row">
          <h2 className="detail-title">{result.titleZh}</h2>
          <span className="detail-subtitle-en">{result.subtitleEn}</span>
        </div>

        <p className="detail-summary">{result.summary}</p>

        {currentDetailedMuscle && currentDetailedMuscle.anatomicalSubparts.length > 0 && (
          <div className="submuscle-strip">
            <span className="submuscle-label">标准解剖包含：</span>
            {currentDetailedMuscle.anatomicalSubparts.map((part) => (
              <span key={part} className="meta-pill">
                {part}
              </span>
            ))}
          </div>
        )}

        {result.target.mode === 'simple' && result.includedMuscles.length > 1 && (
          <div className="submuscle-strip">
            <span className="submuscle-label">切到专业细分查看具体肌束：</span>
            {result.includedMuscles.map((m) => (
              <button
                key={m.id}
                type="button"
                className="submuscle-btn"
                onClick={() => onDrillDownMuscle(m.id)}
              >
                {m.shortLabelZh}
              </button>
            ))}
          </div>
        )}

        {result.proTip && (
          <div className="protip-box">
            <Info size={16} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{result.proTip}</span>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="detail-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'exercises'}
          className={`detail-tab ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          <Dumbbell size={15} />
          <span>锻炼动作</span>
          <span className="tab-badge">{result.allRelatedExercises.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'anatomy'}
          className={`detail-tab ${activeTab === 'anatomy' ? 'active' : ''}`}
          onClick={() => setActiveTab('anatomy')}
        >
          <BookOpen size={15} />
          <span>解剖与关节功能</span>
          <span className="tab-badge">{result.jointActions.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stretches'}
          className={`detail-tab ${activeTab === 'stretches' ? 'active' : ''}`}
          onClick={() => setActiveTab('stretches')}
        >
          <HeartPulse size={15} />
          <span>练后拉伸</span>
          <span className="tab-badge">{result.stretches.length}</span>
        </button>
      </div>

      <div className="detail-body">
        {activeTab === 'exercises' && (
          <>
            {/* Equipment & Mechanics Filter */}
            <div className="filter-row">
              <div className="filter-pills" role="group" aria-label="按器械筛选">
                {EQUIPMENT_OPTIONS.map((opt) => {
                  const active = (filter.equipment ?? 'all') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`filter-pill ${active ? 'active' : ''}`}
                      onClick={() => onFilterChange({ ...filter, equipment: opt.value })}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="filter-pills" role="group" aria-label="动作类型筛选">
                {(['all', 'compound', 'isolation'] as const).map((mech) => {
                  const active = (filter.mechanics ?? 'all') === mech;
                  const label = mech === 'all' ? '复合+孤立' : mech === 'compound' ? '复合动作' : '孤立动作';
                  return (
                    <button
                      key={mech}
                      type="button"
                      className={`filter-pill ${active ? 'active' : ''}`}
                      onClick={() => onFilterChange({ ...filter, mechanics: mech })}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Block 1: Best-Fit Primary Exercises */}
            <div className="section-heading">
              <h3>
                <Award size={17} color="var(--accent-primary)" />
                最适合的锻炼动作（主攻推荐）
              </h3>
              <span>
                {result.bestExercises.length > 8 && !showAllBest
                  ? `显示前 8 / 共 ${result.bestExercises.length} 个主攻动作`
                  : `共 ${result.bestExercises.length} 个主攻动作 · 按效率排序`}
              </span>
            </div>

            {result.bestExercises.length === 0 ? (
              <div className="empty-state" style={{ marginBottom: 22 }}>
                当前筛选条件下暂无主攻动作，试试切换为「全部器械」或「复合+孤立」。
              </div>
            ) : (
              <>
                <div className="exercise-list" style={{ marginBottom: result.bestExercises.length > 8 ? 10 : 24 }}>
                  {(showAllBest ? result.bestExercises : result.bestExercises.slice(0, 8)).map((item) => (
                    <ExerciseCard
                      key={`best_${item.exercise.id}`}
                      item={item}
                      expanded={Boolean(expandedIds[`best_${item.exercise.id}`])}
                      onToggleExpand={() => toggleExpand(`best_${item.exercise.id}`)}
                      isHeatmapActive={activeHeatmapExerciseId === item.exercise.id}
                      onToggleHeatmap={() => onToggleHeatmap(item.exercise.id)}
                      jointActionNameMap={jointActionNameMap}
                      showMatchedSubmuscles={result.target.mode === 'simple'}
                    />
                  ))}
                </div>
                {result.bestExercises.length > 8 && (
                  <div style={{ marginBottom: 24 }}>
                    <button
                      type="button"
                      className="card-action-btn"
                      onClick={() => setShowAllBest((v) => !v)}
                    >
                      {showAllBest ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>
                        {showAllBest
                          ? '收起部分推荐动作'
                          : `展开剩余 ${result.bestExercises.length - 8} 个主攻动作（共 ${result.bestExercises.length} 个）`}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Block 2: All Exercises Involving This Muscle */}
            <div className="section-heading">
              <h3>
                <ListChecks size={17} color="var(--accent-secondary)" />
                会涉及到这块肌肉的所有健身动作
              </h3>
              <span>
                主攻 {roleCounts.primary} · 协同 {roleCounts.secondary} · 稳定 {roleCounts.stabilizer}
              </span>
            </div>

            <div className="filter-pills" style={{ marginBottom: 12 }} role="group" aria-label="按参与角色筛选">
              {(
                [
                  { value: 'all', label: `全部 (${result.allRelatedExercises.length})` },
                  { value: 'primary', label: `主攻 (${roleCounts.primary})` },
                  { value: 'secondary', label: `协同 (${roleCounts.secondary})` },
                  { value: 'stabilizer', label: `稳定 (${roleCounts.stabilizer})` },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`filter-pill ${relatedRoleFilter === opt.value ? 'active' : ''}`}
                  onClick={() => setRelatedRoleFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {filteredRelated.length === 0 ? (
              <div className="empty-state">当前条件下暂无该角色分类的动作。</div>
            ) : (
              <div className="exercise-list" style={{ marginBottom: 0 }}>
                {filteredRelated.map((item) => (
                  <ExerciseCard
                    key={`all_${item.exercise.id}`}
                    item={item}
                    expanded={Boolean(expandedIds[`all_${item.exercise.id}`])}
                    onToggleExpand={() => toggleExpand(`all_${item.exercise.id}`)}
                    isHeatmapActive={activeHeatmapExerciseId === item.exercise.id}
                    onToggleHeatmap={() => onToggleHeatmap(item.exercise.id)}
                    jointActionNameMap={jointActionNameMap}
                    showMatchedSubmuscles={result.target.mode === 'simple'}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'anatomy' && (
          <div>
            <div className="section-heading">
              <h3>
                <Activity size={17} color="var(--accent-primary)" />
                标准解剖关节活动（源自《推拿按摩的解剖学基础》附录校对版）
              </h3>
              <span>共 {result.jointActions.length} 项关联关节活动</span>
            </div>

            {result.jointActions.length === 0 ? (
              <div className="empty-state">暂无记录的关节活动数据。</div>
            ) : (
              result.jointActions.map((ja) => (
                <article key={ja.id} className="joint-card">
                  <div className="joint-card-title">
                    <h4>
                      {ja.jointZh}（{ja.jointAnatomicalZh}）· {ja.actionZh}
                    </h4>
                    {ja.antagonistActionZh && (
                      <span className="meta-pill">拮抗：{ja.antagonistActionZh}</span>
                    )}
                  </div>

                  <div className="joint-muscles-wrap">
                    {ja.sourceMuscles.map((sm, idx) => {
                      const hitsCurrent = (sm.mappedMuscleIds ?? []).some((id) =>
                        includedIdSet.has(id),
                      );
                      return (
                        <span
                          key={`${ja.id}_${sm.nameZh}_${idx}`}
                          className={`joint-muscle-tag ${hitsCurrent ? 'is-current' : ''}`}
                        >
                          {sm.nameZh}
                          {sm.qualifier ? `（${sm.qualifier}）` : ''}
                        </span>
                      );
                    })}
                  </div>

                  {ja.errataNote && <div className="errata-note">注：{ja.errataNote}</div>}
                </article>
              ))
            )}
          </div>
        )}

        {activeTab === 'stretches' && (
          <div>
            <div className="section-heading">
              <h3>
                <HeartPulse size={17} color="var(--accent-emerald)" />
                推荐练后拉伸动作
              </h3>
              <span>已整合《拉伸合集》并补齐下肢/核心缺口</span>
            </div>

            {result.stretches.length === 0 ? (
              <div className="empty-state">该部位暂无对应拉伸动作。</div>
            ) : (
              result.stretches.map((st) => (
                <article key={st.id} className="stretch-card">
                  <div className="exercise-card-top">
                    <h4 className="exercise-name">{st.nameZh}</h4>
                    <span className="meta-pill">
                      {st.source === 'pdf_stretching_collection' ? '原拉伸合集' : 'P1 补全'}
                    </span>
                  </div>

                  <div className="exercise-expanded" style={{ borderTop: 'none', paddingTop: 8, marginTop: 4 }}>
                    <div>
                      <strong>起始姿势：</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{st.setup}</span>
                    </div>
                    <div>
                      <strong>拉伸要点：</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{st.execution}</span>
                    </div>
                    <div>
                      <strong>益处：</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{st.benefit}</span>
                    </div>
                    <div className="pitfall-line">
                      <AlertTriangle
                        size={13}
                        style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }}
                      />
                      警示：{st.caution}
                    </div>
                  </div>

                  <div className="stretch-dosage-grid">
                    <div className="dosage-cell">
                      <strong>初级</strong>
                      <span>{st.dosage.beginner}</span>
                    </div>
                    <div className="dosage-cell">
                      <strong>中级</strong>
                      <span>{st.dosage.intermediate}</span>
                    </div>
                    <div className="dosage-cell">
                      <strong>高级</strong>
                      <span>{st.dosage.advanced}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

interface ExerciseCardProps {
  item: RankedExerciseItem;
  expanded: boolean;
  onToggleExpand: () => void;
  isHeatmapActive: boolean;
  onToggleHeatmap: () => void;
  jointActionNameMap: Map<string, string>;
  showMatchedSubmuscles: boolean;
}

function ExerciseCard({
  item,
  expanded,
  onToggleExpand,
  isHeatmapActive,
  onToggleHeatmap,
  jointActionNameMap,
  showMatchedSubmuscles,
}: ExerciseCardProps) {
  const { exercise, matchedRole, matchedEffectiveness, matchedMuscleIds } = item;

  const jointLabels = exercise.jointActionIds
    .map((id) => jointActionNameMap.get(id))
    .filter((v): v is string => Boolean(v));

  const resistedJointLabels = (exercise.resistedJointActionIds ?? [])
    .map((id) => jointActionNameMap.get(id))
    .filter((v): v is string => Boolean(v));

  const biliUrl = exercise.media?.videoSearchQuery
    ? `https://search.bilibili.com/all?keyword=${encodeURIComponent(exercise.media.videoSearchQuery)}`
    : null;

  return (
    <article className={`exercise-card ${isHeatmapActive ? 'is-heatmap-active' : ''}`}>
      <div className="exercise-card-top">
        <div>
          <h4 className="exercise-name">
            {exercise.nameZh}
            <span className="exercise-en">{exercise.nameEn}</span>
          </h4>
          <div className="badge-row">
            <span className={`role-badge ${matchedRole}`}>{ROLE_LABEL[matchedRole]}</span>
            <span className="meta-pill">
              {exercise.mechanics === 'compound' ? '复合' : '孤立'}
            </span>
            <span className="meta-pill">{DIFFICULTY_LABEL[exercise.difficulty]}</span>
            {exercise.equipment.map((eq) => (
              <span key={eq} className="meta-pill">
                {EQUIPMENT_LABEL[eq]}
              </span>
            ))}
            {showMatchedSubmuscles &&
              matchedMuscleIds.slice(0, 3).map((mid) => (
                <span key={mid} className="meta-pill" style={{ color: 'var(--accent-primary)' }}>
                  {getDetailedMuscleById(mid).shortLabelZh}
                </span>
              ))}
          </div>
        </div>

        <div className="score-bar-wrap" title={`目标肌刺激优先级：${matchedEffectiveness}/100`}>
          <div className="score-bar">
            <div className="score-bar-fill" style={{ width: `${matchedEffectiveness}%` }} />
          </div>
          <span>{matchedEffectiveness}</span>
        </div>
      </div>

      <p className="exercise-why">{exercise.whyEffective}</p>

      <div className="exercise-actions-bar">
        <button
          type="button"
          className={`card-action-btn ${isHeatmapActive ? 'active' : ''}`}
          onClick={onToggleHeatmap}
        >
          <Flame size={13} />
          <span>{isHeatmapActive ? '正在体图高亮' : '体图热力预览'}</span>
        </button>

        <button type="button" className="card-action-btn" onClick={onToggleExpand}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span>{expanded ? '收起要点' : '动作要点与避坑'}</span>
        </button>

        {biliUrl && (
          <a
            href={biliUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action-btn"
          >
            <ExternalLink size={13} />
            <span>B站看教学</span>
          </a>
        )}
      </div>

      {expanded && (
        <div className="exercise-expanded">
          {jointLabels.length > 0 && (
            <div>
              <strong>核心关节活动：</strong>
              <span style={{ color: 'var(--text-secondary)' }}>{jointLabels.join(' / ')}</span>
            </div>
          )}

          {resistedJointLabels.length > 0 && (
            <div>
              <strong>等长稳定（对抗）：</strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {resistedJointLabels.map((lbl) => `抗${lbl}`).join(' / ')}
              </span>
            </div>
          )}

          <div>
            <strong>执行要点：</strong>
            <ul className="cue-list">
              {exercise.cues.map((cue, idx) => (
                <li key={idx}>{cue}</li>
              ))}
            </ul>
          </div>

          <div className="pitfall-line">
            <AlertTriangle
              size={13}
              style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }}
            />
            常见避坑：{exercise.pitfall}
          </div>

          <div>
            <strong>全身参与肌群：</strong>
            <div className="badge-row" style={{ marginTop: 6 }}>
              {exercise.muscles.map((m) => (
                <span key={m.muscleId} className={`role-badge ${m.role}`}>
                  {getDetailedMuscleById(m.muscleId).shortLabelZh} · {ROLE_LABEL[m.role]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
