import { DETAILED_MUSCLES, JOINT_ACTIONS, SIMPLE_MUSCLE_GROUPS, STRETCHES } from './anatomyData';
import { EXERCISES } from './exerciseData';
import type {
  DetailedMuscle,
  DetailedMuscleId,
  DetailMode,
  Exercise,
  ExerciseHeatmap,
  GlobalSearchResult,
  JointActionEntry,
  MuscleQueryFilter,
  MuscleQueryResult,
  MuscleRole,
  RankedExerciseItem,
  SelectionTarget,
  SimpleGroupId,
  SimpleMuscleGroup,
} from './types';

const ROLE_PRIORITY: Record<MuscleRole, number> = { primary: 3, secondary: 2, stabilizer: 1 };

export function getSimpleGroups(): SimpleMuscleGroup[] {
  return [...SIMPLE_MUSCLE_GROUPS];
}

export function getSimpleGroupById(id: SimpleGroupId): SimpleMuscleGroup {
  const group = SIMPLE_MUSCLE_GROUPS.find((entry) => entry.id === id);
  if (!group) throw new RangeError(`Unknown simple muscle group: ${id}`);
  return group;
}

export function getDetailedMuscles(): DetailedMuscle[] {
  return [...DETAILED_MUSCLES];
}

export function getDetailedMuscleById(id: DetailedMuscleId): DetailedMuscle {
  const muscle = DETAILED_MUSCLES.find((entry) => entry.id === id);
  if (!muscle) throw new RangeError(`Unknown detailed muscle: ${id}`);
  return muscle;
}

export function getDetailedMusclesByGroup(groupId: SimpleGroupId): DetailedMuscle[] {
  return getSimpleGroupById(groupId).childMuscles.map(getDetailedMuscleById);
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}

export function getAllJointActions(fitnessCoreOnly = false): JointActionEntry[] {
  return JOINT_ACTIONS.filter((action) => !fitnessCoreOnly || action.fitnessCore);
}

function matchesExerciseFilter(exercise: Exercise, filter: MuscleQueryFilter): boolean {
  const { equipment = 'all', difficulty = 'all', mechanics = 'all' } = filter;
  return (equipment === 'all' || exercise.equipment.includes(equipment))
    && (difficulty === 'all' || exercise.difficulty === difficulty)
    && (mechanics === 'all' || exercise.mechanics === mechanics);
}

function rankExercise(
  exercise: Exercise,
  muscleIds: ReadonlySet<DetailedMuscleId>,
): RankedExerciseItem | undefined {
  const links = exercise.muscles.filter((link) => muscleIds.has(link.muscleId));
  if (links.length === 0) return undefined;

  const strongestRole = links.reduce((highest, link) =>
    ROLE_PRIORITY[link.role] > ROLE_PRIORITY[highest] ? link.role : highest, links[0].role);
  return {
    exercise,
    matchedRole: strongestRole,
    matchedEffectiveness: Math.max(...links.map((link) => link.effectiveness)),
    matchedMuscleIds: links.map((link) => link.muscleId),
  };
}

function compareEffectiveness(a: RankedExerciseItem, b: RankedExerciseItem): number {
  return b.matchedEffectiveness - a.matchedEffectiveness
    || a.exercise.id.localeCompare(b.exercise.id, 'en');
}

export function queryMuscle(target: SelectionTarget, filter: MuscleQueryFilter = {}): MuscleQueryResult {
  const group = target.mode === 'simple' ? getSimpleGroupById(target.id) : undefined;
  const includedMuscles = target.mode === 'simple'
    ? getDetailedMusclesByGroup(target.id)
    : [getDetailedMuscleById(target.id)];
  const display = group ?? includedMuscles[0];
  const muscleIds = new Set(includedMuscles.map((muscle) => muscle.id));
  const featuredIds = new Set(group?.featuredExerciseIds);
  const allRelatedExercises: RankedExerciseItem[] = [];

  for (const exercise of EXERCISES) {
    if (!matchesExerciseFilter(exercise, filter)) continue;
    const ranked = rankExercise(exercise, muscleIds);
    if (ranked) allRelatedExercises.push(ranked);
  }

  allRelatedExercises.sort((a, b) =>
    ROLE_PRIORITY[b.matchedRole] - ROLE_PRIORITY[a.matchedRole] || compareEffectiveness(a, b));
  const bestExercises = allRelatedExercises
    .filter((item) => item.matchedRole === 'primary')
    .sort((a, b) =>
      Number(featuredIds.has(b.exercise.id)) - Number(featuredIds.has(a.exercise.id))
      || compareEffectiveness(a, b));

  const jointActionIds = new Set(includedMuscles.flatMap((muscle) => muscle.jointActionIds));
  const jointActions = JOINT_ACTIONS
    .filter((action) => jointActionIds.has(action.id))
    .sort((a, b) => Number(b.fitnessCore) - Number(a.fitnessCore));

  const primaryStretches = [];
  const secondaryStretches = [];
  for (const stretch of STRETCHES) {
    if (stretch.targetMuscles.some((id) => muscleIds.has(id))) {
      primaryStretches.push(stretch);
    } else if (stretch.secondaryMuscles.some((id) => muscleIds.has(id))) {
      secondaryStretches.push(stretch);
    }
  }

  return {
    target,
    titleZh: display.nameZh,
    subtitleEn: display.nameEn,
    summary: group?.beginnerSummary ?? includedMuscles[0].fiberNote,
    proTip: group ? undefined : includedMuscles[0].proTip,
    views: display.views,
    includedMuscles,
    bestExercises,
    allRelatedExercises,
    jointActions,
    stretches: [...primaryStretches, ...secondaryStretches],
  };
}

export function getExerciseHeatmap(exerciseId: string): ExerciseHeatmap | null {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return null;

  const muscleRoles: ExerciseHeatmap['muscleRoles'] = {};
  const groupRoles: ExerciseHeatmap['groupRoles'] = {};
  for (const { muscleId, role } of exercise.muscles) {
    muscleRoles[muscleId] = role;
    const { groupId } = getDetailedMuscleById(muscleId);
    const groupRole = groupRoles[groupId];
    if (!groupRole || ROLE_PRIORITY[role] > ROLE_PRIORITY[groupRole]) {
      groupRoles[groupId] = role;
    }
  }

  return { exercise, muscleRoles, groupRoles };
}

function normalizeSearchText(text: string): string {
  return text.normalize('NFKC').trim().toLowerCase();
}

export function searchCatalog(query: string): GlobalSearchResult {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return { groups: [], muscles: [], exercises: [] };

  const matches = (terms: string[]) =>
    terms.some((term) => normalizeSearchText(term).includes(normalizedQuery));
  const muscles = DETAILED_MUSCLES.filter((muscle) => matches([
    muscle.nameZh, muscle.shortLabelZh, muscle.nameEn, ...muscle.aliases, ...muscle.anatomicalSubparts,
  ]));
  const matchingGroupIds = new Set(muscles.map((muscle) => muscle.groupId));

  return {
    groups: SIMPLE_MUSCLE_GROUPS.filter((group) =>
      matchingGroupIds.has(group.id) || matches([group.nameZh, group.nameEn, group.beginnerSummary])),
    muscles,
    exercises: EXERCISES.filter((exercise) => matches([
      exercise.nameZh, exercise.nameEn, ...exercise.aliases,
    ])),
  };
}

export function mapSelectionAcrossModes(
  current: SelectionTarget,
  nextMode: DetailMode,
  activeExerciseId?: string,
): SelectionTarget {
  if (current.mode === nextMode) return current;
  if (current.mode === 'detailed') {
    return { mode: 'simple', id: getDetailedMuscleById(current.id).groupId };
  }
  const group = getSimpleGroupById(current.id);
  if (activeExerciseId) {
    const exercise = getExerciseById(activeExerciseId);
    if (exercise && exercise.muscles.length > 0) {
      const sortedLinks = [...exercise.muscles].sort(
        (a, b) => ROLE_PRIORITY[b.role] - ROLE_PRIORITY[a.role] || b.effectiveness - a.effectiveness,
      );
      const primaryInCurrentGroup = sortedLinks.find(
        (link) => link.role === 'primary' && group.childMuscles.includes(link.muscleId),
      );
      return { mode: 'detailed', id: (primaryInCurrentGroup ?? sortedLinks[0]).muscleId };
    }
  }
  return { mode: 'detailed', id: group.childMuscles[0] };
}

export function getCatalogStats(): {
  simpleGroupCount: number;
  detailedMuscleCount: number;
  exerciseCount: number;
  jointActionCount: number;
  stretchCount: number;
} {
  return {
    simpleGroupCount: SIMPLE_MUSCLE_GROUPS.length,
    detailedMuscleCount: DETAILED_MUSCLES.length,
    exerciseCount: EXERCISES.length,
    jointActionCount: JOINT_ACTIONS.length,
    stretchCount: STRETCHES.length,
  };
}

export function validateDataIntegrity(): string[] {
  const errors: string[] = [];
  function uniqueIds(ids: readonly string[], context: string): Set<string> {
    const unique = new Set<string>();
    for (const id of ids) {
      if (!id.trim()) errors.push(`${context}: empty ID`);
      if (unique.has(id)) errors.push(`${context}: duplicate ID "${id}"`);
      unique.add(id);
    }
    return unique;
  }

  const groupIds = uniqueIds(SIMPLE_MUSCLE_GROUPS.map(({ id }) => id), 'Simple groups');
  const muscleIds = uniqueIds(DETAILED_MUSCLES.map(({ id }) => id), 'Detailed muscles');
  const jointIds = uniqueIds(JOINT_ACTIONS.map(({ id }) => id), 'Joint actions');
  uniqueIds(EXERCISES.map(({ id }) => id), 'Exercises');
  uniqueIds(STRETCHES.map(({ id }) => id), 'Stretches');
  const partitionIds = uniqueIds(SIMPLE_MUSCLE_GROUPS.flatMap(({ childMuscles }) => childMuscles), 'Group partition');
  if (groupIds.size !== 14) errors.push(`Expected 14 simple groups, found ${groupIds.size}`);
  if (muscleIds.size !== 37) errors.push(`Expected 37 detailed muscles, found ${muscleIds.size}`);
  if (jointIds.size !== 75) errors.push(`Expected 75 joint actions, found ${jointIds.size}`);
  const jointCount = new Set(JOINT_ACTIONS.map(({ jointZh }) => jointZh)).size;
  if (jointCount !== 16) errors.push(`Expected 16 joint regions, found ${jointCount}`);
  if (EXERCISES.length < 88 || EXERCISES.length > 105) errors.push('Expected 88–105 exercises');
  const originalStretchCount = STRETCHES.filter(({ source }) => source === 'pdf_stretching_collection').length;
  const supplementalStretchCount = STRETCHES.filter(({ source }) => source === 'supplemented_gap').length;
  if (originalStretchCount !== 16) errors.push('Expected 16 original stretches');
  if (supplementalStretchCount < 11) {
    errors.push('Expected at least 11 supplemental stretches');
  }

  const primaryCounts = new Map<DetailedMuscleId, number>();
  for (const exercise of EXERCISES) {
    const resistedIds = exercise.resistedJointActionIds ?? [];
    const combinedJointIds = [...exercise.jointActionIds, ...resistedIds];
    uniqueIds(combinedJointIds, `${exercise.id} joint actions`);
    uniqueIds(exercise.muscles.map(({ muscleId }) => muscleId), `${exercise.id} muscle links`);
    if (combinedJointIds.length === 0) errors.push(`${exercise.id}: no joint actions`);
    for (const jointId of combinedJointIds) {
      if (!jointIds.has(jointId)) errors.push(`${exercise.id}: unknown joint action "${jointId}"`);
    }
    if (!exercise.muscles.some(({ role }) => role === 'primary')) {
      errors.push(`${exercise.id}: no primary muscle`);
    }
    for (const { muscleId, effectiveness, role } of exercise.muscles) {
      if (!muscleIds.has(muscleId)) errors.push(`${exercise.id}: unknown muscle "${muscleId}"`);
      if (!Number.isFinite(effectiveness) || effectiveness < 1 || effectiveness > 100) {
        errors.push(`${exercise.id}: invalid effectiveness for "${muscleId}"`);
      }
      if (role === 'primary') primaryCounts.set(muscleId, (primaryCounts.get(muscleId) ?? 0) + 1);
    }
    if (exercise.mechanics === 'compound') {
      const linkedRoles = new Set(exercise.muscles.map(({ role }) => role));
      if (!linkedRoles.has('secondary') || !linkedRoles.has('stabilizer')) {
        errors.push(`${exercise.id}: compound exercise lacks secondary or stabilizer links`);
      }
    }
    if (exercise.cues.length < 2 || exercise.cues.length > 3
      || exercise.cues.some((cue) => !cue.trim())
      || !exercise.pitfall.trim() || !exercise.whyEffective.trim() || !exercise.media?.videoSearchQuery.trim()) {
      errors.push(`${exercise.id}: incomplete exercise guidance`);
    }
  }

  const stretchedMuscles = new Set<DetailedMuscleId>();
  for (const stretch of STRETCHES) {
    const links = [...stretch.targetMuscles, ...stretch.secondaryMuscles];
    uniqueIds(links, `${stretch.id} stretch targets`);
    if (stretch.targetMuscles.length === 0) errors.push(`${stretch.id}: no primary stretch target`);
    for (const id of links) {
      if (!muscleIds.has(id)) errors.push(`${stretch.id}: unknown stretch target "${id}"`);
      stretchedMuscles.add(id);
    }
  }

  for (const group of SIMPLE_MUSCLE_GROUPS) {
    if (group.childMuscles.length === 0) errors.push(`${group.id}: no child muscles`);
    for (const childId of group.childMuscles) {
      const child = DETAILED_MUSCLES.find(({ id }) => id === childId);
      if (!child) errors.push(`${group.id}: unknown child muscle "${childId}"`);
      else if (child.groupId !== group.id) errors.push(`${group.id}: child "${childId}" belongs to "${child.groupId}"`);
    }
    if (!group.childMuscles.some((id) => stretchedMuscles.has(id))) {
      errors.push(`${group.id}: no matching stretches`);
    }
    const featuredIds = uniqueIds(group.featuredExerciseIds, `${group.id} featured exercises`);
    if (featuredIds.size < 3 || featuredIds.size > 6) errors.push(`${group.id}: expected 3–6 featured exercises`);
    for (const exerciseId of featuredIds) {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) errors.push(`${group.id}: unknown featured exercise "${exerciseId}"`);
      else if (!exercise.muscles.some(({ muscleId, role }) =>
        role === 'primary' && group.childMuscles.includes(muscleId))) {
        errors.push(`${group.id}: featured exercise "${exerciseId}" has no primary match`);
      }
    }
  }

  const mappedActions = new Map<DetailedMuscleId, Set<string>>();
  for (const action of JOINT_ACTIONS) {
    if (action.sourceMuscles.length === 0) errors.push(`${action.id}: no source muscles`);
    for (const source of action.sourceMuscles) {
      uniqueIds(source.mappedMuscleIds ?? [], `${action.id} ${source.nameZh} mappings`);
      for (const id of source.mappedMuscleIds ?? []) {
        if (!muscleIds.has(id)) errors.push(`${action.id}: unknown mapped muscle "${id}"`);
        const mappedIds = mappedActions.get(id) ?? new Set<string>();
        mappedIds.add(action.id);
        mappedActions.set(id, mappedIds);
      }
    }
  }

  for (const muscle of DETAILED_MUSCLES) {
    if (!groupIds.has(muscle.groupId) || !partitionIds.has(muscle.id)) {
      errors.push(`${muscle.id}: no valid parent group partition`);
    }
    if ((primaryCounts.get(muscle.id) ?? 0) < 2) errors.push(`${muscle.id}: fewer than 2 primary exercises`);
    const declared = uniqueIds(muscle.jointActionIds, `${muscle.id} joint actions`);
    if (declared.size === 0) errors.push(`${muscle.id}: no mapped joint actions`);
    const mapped = mappedActions.get(muscle.id) ?? new Set<string>();
    for (const id of declared) {
      if (!jointIds.has(id)) errors.push(`${muscle.id}: unknown joint action "${id}"`);
      else if (!mapped.has(id)) errors.push(`${muscle.id}: joint action "${id}" lacks reverse mapping`);
    }
    for (const id of mapped) {
      if (!declared.has(id)) errors.push(`${muscle.id}: missing joint action "${id}"`);
    }
  }

  const shoulderFlexion = 'shoulder_flexion';
  if (!mappedActions.get('delt_anterior')?.has(shoulderFlexion)
    || mappedActions.get('delt_lateral')?.has(shoulderFlexion)
    || mappedActions.get('delt_posterior')?.has(shoulderFlexion)) {
    errors.push('Shoulder flexion must map to the anterior deltoid only among the deltoid heads');
  }

  return errors;
}
