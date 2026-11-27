/**
 * Headless Core Domain Contracts for Muscle Atlas (Web + future WeChat Mini Program)
 * Zero DOM / React / WeChat runtime dependencies allowed in src/core/*.
 */

export type DetailMode = 'simple' | 'detailed';
export type BodyView = 'front' | 'back';
export type BodyZone = 'upper_push' | 'upper_pull' | 'arms' | 'core' | 'lower';

/** 14 beginner-friendly macro muscle groups */
export type SimpleGroupId =
  | 'chest'
  | 'shoulders'
  | 'traps'
  | 'back'
  | 'lower_back'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'adductors'
  | 'hamstrings'
  | 'calves';

/** 37 anatomically distinct detailed muscles/subdivisions */
export type DetailedMuscleId =
  // Chest (3)
  | 'pec_upper'
  | 'pec_middle'
  | 'pec_lower'
  // Shoulders (4)
  | 'delt_anterior'
  | 'delt_lateral'
  | 'delt_posterior'
  | 'rotator_cuff_ext'
  // Traps (3)
  | 'trap_upper'
  | 'trap_middle'
  | 'trap_lower'
  // Back (3)
  | 'latissimus_dorsi'
  | 'teres_major'
  | 'rhomboids'
  // Lower back (1)
  | 'erector_spinae'
  // Biceps / Anterior upper arm (2)
  | 'biceps_brachii'
  | 'brachialis'
  // Triceps / Posterior upper arm (3)
  | 'triceps_long'
  | 'triceps_lateral'
  | 'triceps_medial'
  // Forearms (3)
  | 'brachioradialis'
  | 'forearm_flexors'
  | 'forearm_extensors'
  // Core (3)
  | 'rectus_abdominis'
  | 'obliques'
  | 'serratus_anterior'
  // Glutes (2)
  | 'gluteus_maximus'
  | 'gluteus_medius'
  // Quads & Hip Flexors (4)
  | 'rectus_femoris'
  | 'vastus_lateralis'
  | 'vastus_medialis'
  | 'hip_flexors'
  // Adductors (1)
  | 'hip_adductors'
  // Hamstrings (2)
  | 'biceps_femoris'
  | 'semitendinosus_membranosus'
  // Calves & Shin (3)
  | 'gastrocnemius'
  | 'soleus'
  | 'tibialis_anterior';

export type SelectionTarget =
  | { mode: 'simple'; id: SimpleGroupId }
  | { mode: 'detailed'; id: DetailedMuscleId };

export type MuscleRole = 'primary' | 'secondary' | 'stabilizer';

export type EquipmentType =
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'band_or_kettlebell';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type MovementPattern =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'lunge_unilateral'
  | 'hip_extension_isolation'
  | 'elbow_flexion'
  | 'elbow_extension'
  | 'shoulder_isolation'
  | 'core_flexion_stability'
  | 'calf_ankle'
  | 'forearm_grip'
  | 'hip_abduction_adduction';

export interface SimpleMuscleGroup {
  id: SimpleGroupId;
  nameZh: string;
  nameEn: string;
  zone: BodyZone;
  views: BodyView[];
  /** Child detailed muscles aggregated in simple mode */
  childMuscles: DetailedMuscleId[];
  /** Concise beginner-friendly 1-sentence summary of what this area does & why train it */
  beginnerSummary: string;
  /** Curated top exercise IDs for this macro group in beginner mode */
  featuredExerciseIds: string[];
}

export interface DetailedMuscle {
  id: DetailedMuscleId;
  groupId: SimpleGroupId;
  nameZh: string;
  shortLabelZh: string;
  nameEn: string;
  aliases: string[];
  /** Standard anatomical breakdown (e.g. erector_spinae -> 髂肋肌/最长肌/棘肌) */
  anatomicalSubparts: string[];
  views: BodyView[];
  /** Key origin/insertion or fiber direction note in plain Chinese */
  fiberNote: string;
  /** Key joint action IDs from the standard anatomy reference (PDF 1) */
  jointActionIds: string[];
  /** Common misconception or training insight (e.g. CA deltoid bug note) */
  proTip?: string;
}

/** Standard joint movement entry sourced from PDF 1 (《推拿按摩的解剖学基础 第6版》附录) */
export interface JointActionEntry {
  id: string;
  jointZh: string;
  jointAnatomicalZh: string;
  actionZh: string;
  antagonistActionZh?: string;
  /** Whether this joint action is directly core to gym resistance training */
  fitnessCore: boolean;
  /** Exact muscles listed in source PDF (after cleaning & documented errata fix) */
  sourceMuscles: {
    nameZh: string;
    qualifier?: string; // e.g., '辅助', '薄弱', '双侧', '单侧', '起点固定', '补注'
    mappedMuscleIds?: DetailedMuscleId[];
  }[];
  /** Optional errata / fitness-biomechanics clarification note */
  errataNote?: string;
}

export interface ExerciseMuscleLink {
  muscleId: DetailedMuscleId;
  role: MuscleRole;
  /** 1-100 effectiveness/activation priority for this specific muscle (used to rank "最适合") */
  effectiveness: number;
}

export interface Exercise {
  id: string;
  nameZh: string;
  nameEn: string;
  aliases: string[];
  equipment: EquipmentType[];
  difficulty: DifficultyLevel;
  mechanics: 'compound' | 'isolation';
  pattern: MovementPattern;
  /** Linked dynamic/concentric joint actions explaining WHY this exercise trains the target muscles */
  jointActionIds: string[];
  /** Optional joint movements isometrically resisted (e.g. anti-rotation / anti-lateral-flexion / anti-extension core drills) */
  resistedJointActionIds?: string[];
  muscles: ExerciseMuscleLink[];
  /** Short, high-value execution cues (1-3 bullets) */
  cues: string[];
  /** Common mistake / injury prevention warning */
  pitfall: string;
  /** Why it ranks highly for its primary targets */
  whyEffective: string;
  /** Future extensibility: GIF/video asset URL or Bilibili tutorial query */
  media?: {
    videoSearchQuery: string;
    gifUrl?: string;
  };
}

export interface StretchItem {
  id: string;
  nameZh: string;
  targetMuscles: DetailedMuscleId[];
  secondaryMuscles: DetailedMuscleId[];
  source: 'pdf_stretching_collection' | 'supplemented_gap';
  setup: string;
  execution: string;
  caution: string;
  benefit: string;
  dosage: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
}

export interface RankedExerciseItem {
  exercise: Exercise;
  /** Highest role among the queried target muscle(s) */
  matchedRole: MuscleRole;
  /** Best effectiveness score among the queried target muscle(s) */
  matchedEffectiveness: number;
  /** Which specific detailed muscles inside the selection this exercise hits */
  matchedMuscleIds: DetailedMuscleId[];
}

export interface MuscleQueryFilter {
  equipment?: EquipmentType | 'all';
  difficulty?: DifficultyLevel | 'all';
  mechanics?: 'compound' | 'isolation' | 'all';
}

export interface MuscleQueryResult {
  target: SelectionTarget;
  titleZh: string;
  subtitleEn: string;
  summary: string;
  proTip?: string;
  views: BodyView[];
  /** Detailed muscles represented by this selection (1 in detailed mode, 1..N in simple mode) */
  includedMuscles: DetailedMuscle[];
  /** Primary / best-fit exercises ranked by effectiveness */
  bestExercises: RankedExerciseItem[];
  /** All exercises involving this muscle (primary + secondary + stabilizer), sorted by role & effectiveness */
  allRelatedExercises: RankedExerciseItem[];
  /** Standard anatomical joint actions involving this muscle (from PDF 1) */
  jointActions: JointActionEntry[];
  /** Matching post-workout stretches (from PDF 2 + P1 supplements) */
  stretches: StretchItem[];
}

export interface ExerciseHeatmap {
  exercise: Exercise;
  /** Map of DetailedMuscleId -> MuscleRole for direct SVG / Canvas coloring */
  muscleRoles: Partial<Record<DetailedMuscleId, MuscleRole>>;
  /** Map of SimpleGroupId -> highest MuscleRole for simple mode coloring */
  groupRoles: Partial<Record<SimpleGroupId, MuscleRole>>;
}

export interface GlobalSearchResult {
  groups: SimpleMuscleGroup[];
  muscles: DetailedMuscle[];
  exercises: Exercise[];
}

/**
 * Forward-compatible extension hook for future 《超级套表》 Workout Plan Module.
 * Not populated in v0.1, kept in core types so plan schedules plug cleanly into Exercise IDs.
 */
export interface WorkoutPlanSlot {
  exerciseId: string;
  sets: number;
  repRange: string;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutPlanDay {
  id: string;
  titleZh: string;
  focusGroups: SimpleGroupId[];
  slots: WorkoutPlanSlot[];
}

export interface WorkoutPlanTemplate {
  id: string;
  nameZh: string;
  splitType: '3-day' | '4-day' | '5-day' | 'home' | 'custom';
  days: WorkoutPlanDay[];
}
