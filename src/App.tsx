import { useEffect, useMemo, useState } from 'react';
import {
  getCatalogStats,
  getDetailedMuscleById,
  getDetailedMuscles,
  getExerciseHeatmap,
  getSimpleGroupById,
  getSimpleGroups,
  mapSelectionAcrossModes,
  queryMuscle,
} from './core/engine';
import type {
  BodyView,
  DetailMode,
  DetailedMuscleId,
  MuscleQueryFilter,
  SelectionTarget,
  SimpleGroupId,
} from './core/types';
import { HeaderBar } from './components/HeaderBar';
import { BodyMap } from './components/BodyMap';
import { MuscleDetailPanel } from './components/MuscleDetailPanel';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<DetailMode>('simple');
  const [view, setView] = useState<BodyView>('front');
  const [selection, setSelection] = useState<SelectionTarget>({ mode: 'simple', id: 'chest' });
  const [filter, setFilter] = useState<MuscleQueryFilter>({ equipment: 'all', mechanics: 'all' });
  const [heatmapExerciseId, setHeatmapExerciseId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const simpleGroups = useMemo(() => getSimpleGroups(), []);
  const detailedMuscles = useMemo(() => getDetailedMuscles(), []);
  const stats = useMemo(() => getCatalogStats(), []);

  const queryResult = useMemo(() => queryMuscle(selection, filter), [selection, filter]);

  const activeHeatmap = useMemo(
    () => (heatmapExerciseId ? getExerciseHeatmap(heatmapExerciseId) : null),
    [heatmapExerciseId],
  );

  const ensureViewVisible = (views: BodyView[]) => {
    if (views.length > 0 && !views.includes(view)) {
      setView(views[0]);
    }
  };

  const handleModeChange = (nextMode: DetailMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    const mapped = mapSelectionAcrossModes(selection, nextMode, heatmapExerciseId ?? undefined);
    setSelection(mapped);
    if (mapped.mode === 'simple') {
      ensureViewVisible(getSimpleGroupById(mapped.id).views);
    } else {
      ensureViewVisible(getDetailedMuscleById(mapped.id).views);
    }
  };

  const handleSelectSimple = (id: SimpleGroupId) => {
    setMode('simple');
    setSelection({ mode: 'simple', id });
    ensureViewVisible(getSimpleGroupById(id).views);
  };

  const handleSelectDetailed = (id: DetailedMuscleId) => {
    setMode('detailed');
    setSelection({ mode: 'detailed', id });
    ensureViewVisible(getDetailedMuscleById(id).views);
  };

  const handleToggleHeatmap = (exerciseId: string) => {
    if (heatmapExerciseId === exerciseId) {
      setHeatmapExerciseId(null);
      return;
    }
    setHeatmapExerciseId(exerciseId);
    const hm = getExerciseHeatmap(exerciseId);
    const primaryMuscles = hm?.exercise.muscles.filter((m) => m.role === 'primary') ?? [];
    const primaryViews = Array.from(
      new Set(primaryMuscles.flatMap((m) => getDetailedMuscleById(m.muscleId).views)),
    );
    if (primaryViews.length > 0) {
      ensureViewVisible(primaryViews);
    }
  };

  const handleSearchExerciseHeatmap = (exerciseId: string) => {
    const hm = getExerciseHeatmap(exerciseId);
    if (!hm) return;
    setHeatmapExerciseId(exerciseId);
    const firstPrimary = hm.exercise.muscles.find((m) => m.role === 'primary') ?? hm.exercise.muscles[0];
    if (firstPrimary) {
      const m = getDetailedMuscleById(firstPrimary.muscleId);
      ensureViewVisible(m.views);
      if (mode === 'simple') {
        setSelection({ mode: 'simple', id: m.groupId });
      } else {
        setSelection({ mode: 'detailed', id: m.id });
      }
    }
  };

  return (
    <div className="app-shell">
      <HeaderBar
        mode={mode}
        onModeChange={handleModeChange}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        simpleCount={stats.simpleGroupCount}
        detailedCount={stats.detailedMuscleCount}
        onSelectSimpleGroup={(id) => {
          setHeatmapExerciseId(null);
          handleSelectSimple(id);
        }}
        onSelectDetailedMuscle={(id) => {
          setHeatmapExerciseId(null);
          handleSelectDetailed(id);
        }}
        onSelectExerciseHeatmap={handleSearchExerciseHeatmap}
      />

      <main className="workspace-main">
        <BodyMap
          mode={mode}
          view={view}
          onViewChange={setView}
          selection={selection}
          heatmap={activeHeatmap}
          onClearHeatmap={() => setHeatmapExerciseId(null)}
          simpleGroups={simpleGroups}
          detailedMuscles={detailedMuscles}
          onSelectSimple={handleSelectSimple}
          onSelectDetailed={handleSelectDetailed}
        />

        <MuscleDetailPanel
          result={queryResult}
          filter={filter}
          onFilterChange={setFilter}
          activeHeatmapExerciseId={heatmapExerciseId}
          onToggleHeatmap={handleToggleHeatmap}
          onDrillDownMuscle={(muscleId) => {
            setHeatmapExerciseId(null);
            handleSelectDetailed(muscleId);
          }}
          onJumpToSimpleGroup={(groupId) => {
            setHeatmapExerciseId(null);
            handleSelectSimple(groupId);
          }}
        />
      </main>
    </div>
  );
}
