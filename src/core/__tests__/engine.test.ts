import { describe, expect, it } from 'vitest';
import { JOINT_ACTIONS, STRETCHES } from '../anatomyData';
import { EXERCISES } from '../exerciseData';
import {
  getAllJointActions,
  getCatalogStats,
  getDetailedMuscleById,
  getDetailedMuscles,
  getDetailedMusclesByGroup,
  getExerciseById,
  getExerciseHeatmap,
  getSimpleGroupById,
  getSimpleGroups,
  mapSelectionAcrossModes,
  queryMuscle,
  searchCatalog,
  validateDataIntegrity,
} from '../engine';
import type { DetailedMuscleId, MuscleRole, SelectionTarget } from '../types';

function jointMuscleIds(id: string): DetailedMuscleId[] {
  const joint = getAllJointActions().find((action) => action.id === id);
  if (!joint) throw new Error(`Missing joint action: ${id}`);
  return joint.sourceMuscles.flatMap((source) => source.mappedMuscleIds ?? []);
}

describe('catalog integrity and coverage', () => {
  it('passes integrity validation and includes all sourced entries', () => {
    expect(validateDataIntegrity()).toEqual([]);
    expect(getCatalogStats()).toEqual({
      simpleGroupCount: 14,
      detailedMuscleCount: 37,
      exerciseCount: EXERCISES.length,
      jointActionCount: 75,
      stretchCount: 29,
    });
    expect(EXERCISES.length).toBeGreaterThanOrEqual(88);
    expect(EXERCISES.length).toBeLessThanOrEqual(105);
    expect(new Set(getAllJointActions().map(({ jointZh }) => jointZh)).size).toBe(16);
    expect(STRETCHES.filter(({ source }) => source === 'pdf_stretching_collection')).toHaveLength(16);
    expect(STRETCHES.filter(({ source }) => source === 'supplemented_gap')).toHaveLength(13);
    expect(STRETCHES.find(({ id }) => id === 'wall_pec_stretch')?.dosage).toEqual({
      beginner: '3 组 × 20 秒',
      intermediate: '5 组 × 30 秒',
      advanced: '6 组 × 40 秒',
    });
  });

  it('makes all 14 macro groups queryable with valid featured exercises and stretches', () => {
    const groups = getSimpleGroups();
    expect(groups).toHaveLength(14);
    const childIds = groups.flatMap(({ childMuscles }) => childMuscles);
    expect(childIds).toHaveLength(37);
    expect(new Set(childIds)).toEqual(new Set(getDetailedMuscles().map(({ id }) => id)));

    for (const group of groups) {
      expect(getSimpleGroupById(group.id)).toBe(group);
      expect(getDetailedMusclesByGroup(group.id).map(({ id }) => id)).toEqual(group.childMuscles);

      const result = queryMuscle({ mode: 'simple', id: group.id });
      expect(result.includedMuscles.map(({ id }) => id)).toEqual(group.childMuscles);
      expect(result.bestExercises.length).toBeGreaterThanOrEqual(group.featuredExerciseIds.length);
      expect(result.jointActions.length).toBeGreaterThan(0);
      expect(result.stretches.length).toBeGreaterThan(0);
      const featuredSlice = result.bestExercises.slice(0, group.featuredExerciseIds.length);
      expect(new Set(featuredSlice.map(({ exercise }) => exercise.id))).toEqual(new Set(group.featuredExerciseIds));
    }
  });

  it('makes all 37 detailed muscles queryable with at least two primary exercises', () => {
    const muscles = getDetailedMuscles();
    expect(muscles).toHaveLength(37);
    for (const muscle of muscles) {
      expect(getDetailedMuscleById(muscle.id)).toBe(muscle);
      const result = queryMuscle({ mode: 'detailed', id: muscle.id });
      expect(result.includedMuscles).toEqual([muscle]);
      expect(result.bestExercises.length, muscle.id).toBeGreaterThanOrEqual(2);
      expect(result.allRelatedExercises.length).toBeGreaterThanOrEqual(result.bestExercises.length);
      expect(result.jointActions.length).toBeGreaterThan(0);
      for (const item of result.bestExercises) {
        expect(item.matchedRole).toBe('primary');
        expect(item.matchedMuscleIds).toEqual([muscle.id]);
      }
    }
  });

  it('reports invalid action references, double links and missing compound roles', () => {
    const exercise = getExerciseById('barbell_bench_press')!;
    const initialActions = exercise.jointActionIds;
    const initialMuscles = exercise.muscles;
    try {
      exercise.jointActionIds = [...initialActions, 'missing_joint'];
      exercise.muscles = [initialMuscles[0], initialMuscles[0]];
      expect(validateDataIntegrity()).toEqual(expect.arrayContaining([
        'barbell_bench_press: unknown joint action "missing_joint"',
        'barbell_bench_press muscle links: duplicate ID "pec_middle"',
        'barbell_bench_press: compound exercise lacks secondary or stabilizer links',
      ]));
    } finally {
      exercise.jointActionIds = initialActions;
      exercise.muscles = initialMuscles;
    }
  });
});

describe('muscle recommendation queries', () => {
  it('ranks detailed results by role and score and breaks score ties by exercise ID', () => {
    const result = queryMuscle({ mode: 'detailed', id: 'pec_middle' });
    const { bestExercises, allRelatedExercises } = result;
    expect(bestExercises[0].exercise.id).toBe('barbell_bench_press');

    const tied = bestExercises.filter(({ matchedEffectiveness }) => matchedEffectiveness === 92);
    expect(tied.map(({ exercise }) => exercise.id)).toEqual(['machine_chest_press', 'push_up']);
    const roles: Record<MuscleRole, number> = { primary: 3, secondary: 2, stabilizer: 1 };
    for (let index = 1; index < allRelatedExercises.length; index += 1) {
      const previous = allRelatedExercises[index - 1];
      const current = allRelatedExercises[index];
      expect(roles[previous.matchedRole]).toBeGreaterThanOrEqual(roles[current.matchedRole]);
      if (previous.matchedRole === current.matchedRole) {
        expect(previous.matchedEffectiveness).toBeGreaterThanOrEqual(current.matchedEffectiveness);
      }
    }
  });

  it('deduplicates a multi-muscle exercise and retains all matched IDs', () => {
    const chest = queryMuscle({ mode: 'simple', id: 'chest' });
    const chestRows = chest.allRelatedExercises.filter(({ exercise }) => exercise.id === 'barbell_bench_press');
    expect(chestRows).toHaveLength(1);
    expect(chestRows[0]).toMatchObject({
      matchedRole: 'primary',
      matchedEffectiveness: 98,
      matchedMuscleIds: ['pec_middle', 'pec_upper', 'pec_lower'],
    });

    const shoulders = queryMuscle({ mode: 'simple', id: 'shoulders' });
    expect(shoulders.allRelatedExercises.find(({ exercise }) => exercise.id === 'barbell_bench_press'))
      .toMatchObject({
        matchedRole: 'secondary',
        matchedEffectiveness: 74,
        matchedMuscleIds: ['delt_anterior', 'rotator_cuff_ext'],
      });
    expect(shoulders.bestExercises.some(({ exercise }) => exercise.id === 'barbell_bench_press')).toBe(false);
  });

  it('chooses group role and effectiveness independently from all matched muscle links', () => {
    const exercise = getExerciseById('incline_dumbbell_press')!;
    const initialMuscles = exercise.muscles;
    try {
      exercise.muscles = initialMuscles.map((link) =>
        link.muscleId === 'pec_lower' ? { ...link, effectiveness: 100 } : link);
      const query = queryMuscle({ mode: 'simple', id: 'chest' });
      const related = query.allRelatedExercises.find((row) => row.exercise.id === exercise.id);
      expect(related).toMatchObject({
        matchedRole: 'primary',
        matchedEffectiveness: 100,
        matchedMuscleIds: ['pec_upper', 'pec_middle', 'pec_lower'],
      });
    } finally {
      exercise.muscles = initialMuscles;
    }
  });

  it('keeps matching featured exercises ahead of higher-scoring unfeatured exercises', () => {
    const { bestExercises, allRelatedExercises } = queryMuscle({ mode: 'simple', id: 'chest' });
    const findPosition = (rows: typeof bestExercises, id: string) =>
      rows.findIndex(({ exercise }) => exercise.id === id);

    expect(findPosition(bestExercises, 'push_up')).toBeLessThan(findPosition(bestExercises, 'incline_barbell_press'));
    expect(findPosition(allRelatedExercises, 'push_up')).toBeGreaterThan(findPosition(allRelatedExercises, 'incline_barbell_press'));
  });

  it('intersects equipment, difficulty and mechanics, including multi-equipment variations', () => {
    const chest: SelectionTarget = { mode: 'simple', id: 'chest' };
    const filtered = queryMuscle(chest, { equipment: 'bodyweight', difficulty: 'beginner', mechanics: 'compound' });
    expect(filtered.bestExercises.map(({ exercise }) => exercise.id)).toEqual(['push_up']);
    for (const { exercise } of filtered.allRelatedExercises) {
      expect(exercise.equipment).toContain('bodyweight');
      expect(exercise.difficulty).toBe('beginner');
      expect(exercise.mechanics).toBe('compound');
    }
    const noMatches = queryMuscle(chest, { equipment: 'bodyweight', difficulty: 'advanced', mechanics: 'isolation' });
    expect(noMatches.bestExercises).toEqual([]);
    expect(noMatches.allRelatedExercises).toEqual([]);
    expect(noMatches.stretches).toEqual(filtered.stretches);
    expect(noMatches.jointActions).toEqual(filtered.jointActions);
    expect(queryMuscle(chest, { equipment: 'all', difficulty: 'all', mechanics: 'all' })).toEqual(queryMuscle(chest));

    const obliques: SelectionTarget = { mode: 'detailed', id: 'obliques' };
    for (const equipment of ['cable', 'band_or_kettlebell'] as const) {
      const { bestExercises } = queryMuscle(obliques, { equipment, difficulty: 'beginner', mechanics: 'compound' });
      expect(bestExercises.map(({ exercise }) => exercise.id)).toContain('pallof_press');
    }
  });

  it('returns unique joint actions with fitness core first and places primary stretches first', () => {
    const macro = queryMuscle({ mode: 'simple', id: 'forearms' });
    const actionIds = macro.jointActions.map(({ id }) => id);
    expect(actionIds).toHaveLength(new Set(actionIds).size);
    expect(actionIds).toContain('wrist_flexion');
    expect(actionIds).toContain('finger_flexion');
    const flags = macro.jointActions.map(({ fitnessCore }) => fitnessCore);
    expect(flags).toEqual([...flags].sort((a, b) => Number(b) - Number(a)));
    expect(getAllJointActions(true)).toEqual(getAllJointActions().filter(({ fitnessCore }) => fitnessCore));

    const calves = queryMuscle({ mode: 'simple', id: 'calves' });
    const stretchIds = calves.stretches.map(({ id }) => id);
    expect(stretchIds).toHaveLength(new Set(stretchIds).size);
    const soleus = queryMuscle({ mode: 'detailed', id: 'soleus' });
    expect(soleus.stretches.map(({ id }) => id)).toEqual([
      'bent_knee_soleus_stretch',
      'step_gastrocnemius_stretch',
      'seated_straight_knee_calf_stretch',
    ]);
  });
});

describe('mode navigation, exercise heatmaps and search', () => {
  it('maps every detailed selection to its parent and every group to its first displayed child', () => {
    for (const muscle of getDetailedMuscles()) {
      const detailed: SelectionTarget = { mode: 'detailed', id: muscle.id };
      expect(mapSelectionAcrossModes(detailed, 'detailed')).toEqual(detailed);
      expect(mapSelectionAcrossModes(detailed, 'simple')).toEqual({ mode: 'simple', id: muscle.groupId });
    }
    for (const group of getSimpleGroups()) {
      const simple: SelectionTarget = { mode: 'simple', id: group.id };
      expect(mapSelectionAcrossModes(simple, 'simple')).toEqual(simple);
      const detailed = mapSelectionAcrossModes(simple, 'detailed');
      expect(detailed).toEqual({ mode: 'detailed', id: group.childMuscles[0] });
      expect(mapSelectionAcrossModes(detailed, 'simple')).toEqual(simple);
    }
  });

  it('maps all muscle roles to a heatmap and aggregates the strongest role per group', () => {
    const heatmap = getExerciseHeatmap('barbell_bench_press');
    expect(heatmap?.exercise).toBe(getExerciseById('barbell_bench_press'));
    expect(heatmap?.muscleRoles).toMatchObject({
      pec_middle: 'primary', delt_anterior: 'secondary', triceps_long: 'secondary', rotator_cuff_ext: 'stabilizer',
    });
    expect(heatmap?.groupRoles).toEqual({
      chest: 'primary', shoulders: 'secondary', triceps: 'secondary', traps: 'stabilizer', forearms: 'stabilizer',
    });
    expect(heatmap?.muscleRoles.delt_lateral).toBeUndefined();
    expect(getExerciseById('unknown')).toBeUndefined();
    expect(getExerciseHeatmap('unknown')).toBeNull();
  });

  it.each([
    ['上胸', 'pec_upper', 'chest'],
    ['水滴肌', 'vastus_medialis', 'quads'],
    ['蝴蝶袖', 'triceps_long', 'triceps'],
    ['公狗腰', 'obliques', 'core'],
    ['人鱼线', 'obliques', 'core'],
    ['马甲线', 'rectus_abdominis', 'core'],
    ['翘臀', 'gluteus_maximus', 'glutes'],
    ['小腿肚', 'gastrocnemius', 'calves'],
    ['髂肋肌', 'erector_spinae', 'lower_back'],
    ['冈下肌', 'rotator_cuff_ext', 'shoulders'],
  ])('finds the muscle and group by Chinese search “%s”', (term, muscleId, groupId) => {
    const result = searchCatalog(term);
    expect(result.muscles.map(({ id }) => id)).toContain(muscleId);
    expect(result.groups.map(({ id }) => id)).toContain(groupId);
  });

  it('normalizes case and whitespace, searches exercise aliases and returns empty for blank terms', () => {
    expect(searchCatalog('  LATISSIMUS dorsi  ').muscles.map(({ id }) => id)).toEqual(['latissimus_dorsi']);
    expect(searchCatalog('  rDl  ').exercises.map(({ id }) => id)).toEqual(['romanian_deadlift']);
    expect(searchCatalog('伏地挺身').exercises.map(({ id }) => id)).toEqual(['push_up']);
    expect(searchCatalog('  \t　')).toEqual({ groups: [], muscles: [], exercises: [] });
  });
});

describe('anatomical and biomechanics guards', () => {
  it('guards against the Complete Anatomy whole-deltoid shoulder-flexion error', () => {
    const shoulderFlexionId = 'shoulder_flexion';
    const deltoids = jointMuscleIds(shoulderFlexionId).filter((id) => id.startsWith('delt_'));
    expect(deltoids).toEqual(['delt_anterior']);
    expect(getDetailedMuscleById('delt_anterior').proTip).toContain('Complete Anatomy');
    for (const id of ['delt_lateral', 'delt_posterior'] as const) {
      const result = queryMuscle({ mode: 'detailed', id });
      expect(result.jointActions.some((action) => action.id === shoulderFlexionId)).toBe(false);
      expect(getExerciseHeatmap('dumbbell_front_raise')?.muscleRoles[id]).toBeUndefined();
    }
    expect(jointMuscleIds('shoulder_abduction')).toContain('delt_lateral');
    expect(jointMuscleIds('shoulder_external_rotation')).toContain('delt_posterior');
  });

  it('reports the shoulder-flexion problem if a middle deltoid mapping is accidentally added', () => {
    const action = JOINT_ACTIONS.find(({ id }) => id === 'shoulder_flexion')!;
    action.sourceMuscles.push({ nameZh: '三角肌中束', mappedMuscleIds: ['delt_lateral'] });
    try {
      expect(validateDataIntegrity()).toContain('Shoulder flexion must map to the anterior deltoid only among the deltoid heads');
    } finally {
      action.sourceMuscles.pop();
    }
  });

  it('keeps straight-knee and bent-knee calf raises distinct and models dorsiflexion', () => {
    const standing = getExerciseHeatmap('standing_calf_raise');
    const seated = getExerciseHeatmap('seated_calf_raise');
    expect(standing?.exercise.jointActionIds).toContain('ankle_plantar_flexion');
    expect(seated?.exercise.jointActionIds).toContain('ankle_plantar_flexion');
    expect(standing?.muscleRoles).toMatchObject({ gastrocnemius: 'primary', soleus: 'secondary' });
    expect(seated?.muscleRoles).toMatchObject({ soleus: 'primary', gastrocnemius: 'secondary' });
    expect(queryMuscle({ mode: 'detailed', id: 'gastrocnemius' }).bestExercises[0].exercise.id)
      .toBe('standing_calf_raise');
    expect(queryMuscle({ mode: 'detailed', id: 'soleus' }).bestExercises[0].exercise.id).toBe('seated_calf_raise');
    expect(getExerciseById('wall_tibialis_raise')?.jointActionIds).toEqual(['ankle_dorsiflexion']);
    expect(getExerciseHeatmap('wall_tibialis_raise')?.muscleRoles).toEqual({ tibialis_anterior: 'primary' });
  });

  it('links knee extension to the quadriceps and pelvic curling to the rectus abdominis', () => {
    expect(jointMuscleIds('knee_extension')).toEqual(['rectus_femoris', 'vastus_lateralis', 'vastus_medialis']);
    expect(getExerciseHeatmap('seated_leg_extension')?.muscleRoles).toMatchObject({
      rectus_femoris: 'primary', vastus_lateralis: 'primary', vastus_medialis: 'primary',
    });
    expect(getExerciseHeatmap('romanian_deadlift')?.muscleRoles).toMatchObject({
      gluteus_maximus: 'primary', biceps_femoris: 'primary', semitendinosus_membranosus: 'primary',
      erector_spinae: 'secondary', hip_adductors: 'secondary', forearm_flexors: 'secondary',
    });
    expect(getExerciseById('hanging_leg_raise')?.jointActionIds).toContain('pelvic_posterior_tilt');
    expect(getExerciseHeatmap('hanging_leg_raise')?.muscleRoles.rectus_abdominis).toBe('primary');
  });

  it('keeps both horizontal shoulder errata and the corrected hallux abductor', () => {
    expect(jointMuscleIds('shoulder_horizontal_adduction')).toEqual(expect.arrayContaining([
      'pec_upper', 'pec_middle', 'pec_lower', 'delt_anterior',
    ]));
    const abduction = getAllJointActions().find(({ id }) => id === 'shoulder_horizontal_abduction');
    expect(abduction?.sourceMuscles).toContainEqual(expect.objectContaining({
      nameZh: '冈下肌', qualifier: '补注：协同', mappedMuscleIds: ['rotator_cuff_ext'],
    }));
    expect(jointMuscleIds('shoulder_horizontal_abduction')).toContain('delt_posterior');
    const hallux = getAllJointActions().find(({ actionZh }) => actionZh === '𧿹趾的外展');
    expect(hallux?.sourceMuscles.map(({ nameZh }) => nameZh)).toEqual(['𧿹展肌']);
    expect(hallux?.fitnessCore).toBe(false);
    expect(hallux?.errataNote).toContain('𧿹收肌');
    expect(hallux?.errataNote).toContain('𧿹展肌');
  });

  it('preserves active heatmap exercise primary target when switching from simple to detailed mode', () => {
    expect(
      mapSelectionAcrossModes({ mode: 'simple', id: 'calves' }, 'detailed', 'wall_tibialis_raise'),
    ).toEqual({ mode: 'detailed', id: 'tibialis_anterior' });

    expect(
      mapSelectionAcrossModes({ mode: 'simple', id: 'shoulders' }, 'detailed', 'dumbbell_front_raise'),
    ).toEqual({ mode: 'detailed', id: 'delt_anterior' });

    // Cross-group case: viewing bench press heatmap from traps (where traps is only stabilizer) jumps to primary pec_middle
    expect(
      mapSelectionAcrossModes({ mode: 'simple', id: 'traps' }, 'detailed', 'barbell_bench_press'),
    ).toEqual({ mode: 'detailed', id: 'pec_middle' });
  });

  it('does not misclassify vastus intermedius under vastus lateralis while keeping it searchable via quads', () => {
    const vl = getDetailedMuscleById('vastus_lateralis');
    expect(vl.anatomicalSubparts.some((part) => part.includes('股中间肌'))).toBe(false);
    const hit = searchCatalog('股中间肌');
    expect(hit.muscles.map(({ id }) => id)).not.toContain('vastus_lateralis');
    expect(hit.groups.map(({ id }) => id)).toContain('quads');
  });

  it('distinguishes isometric anti-movement spinal stabilization from active spinal motion', () => {
    const pallof = getExerciseById('pallof_press')!;
    expect(pallof.jointActionIds).not.toContain('spinal_rotation');
    expect(pallof.resistedJointActionIds).toContain('spinal_rotation');

    for (const id of ['side_plank', 'suitcase_carry', 'copenhagen_plank', 'farmer_carry'] as const) {
      const ex = getExerciseById(id)!;
      expect(ex.jointActionIds).not.toContain('spinal_lateral_flexion');
      expect(ex.resistedJointActionIds).toContain('spinal_lateral_flexion');
    }

    for (const id of ['front_plank', 'dead_bug'] as const) {
      const ex = getExerciseById(id)!;
      expect(ex.jointActionIds).not.toContain('spinal_extension');
      expect(ex.resistedJointActionIds).toContain('spinal_extension');
    }

    for (const id of ['barbell_row', 'romanian_deadlift', 'conventional_deadlift', 'sumo_deadlift'] as const) {
      const ex = getExerciseById(id)!;
      expect(ex.jointActionIds).not.toContain('spinal_extension');
      expect(ex.resistedJointActionIds).toContain('spinal_flexion');
    }
  });

  it('resolves every exercise jointActionId and resistedJointActionId in the global joint action catalog', () => {
    const allJointIds = new Set(getAllJointActions(false).map(({ id }) => id));
    for (const group of getSimpleGroups()) {
      for (const { exercise } of queryMuscle({ mode: 'simple', id: group.id }).allRelatedExercises) {
        for (const jid of [...exercise.jointActionIds, ...(exercise.resistedJointActionIds ?? [])]) {
          expect(allJointIds.has(jid), `Unresolved joint action "${jid}" on ${exercise.id}`).toBe(true);
        }
      }
    }
  });
});
