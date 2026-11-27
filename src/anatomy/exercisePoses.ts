/**
 * Pure TypeScript Capsule-Figure Kinematic Pose Engine (viewBox 176x110).
 * Zero React/DOM dependencies — renders directly in Web SVG and is directly portable
 * to future WeChat Mini Program Canvas 2D.
 */

export type PoseViewTag = '侧视示意' | '正视示意' | '俯视示意';

export type PoseSceneId =
  | 'bench_flat'
  | 'bench_incline'
  | 'bench_decline'
  | 'push_up'
  | 'push_up_elevated'
  | 'push_up_scapular'
  | 'chest_dip'
  | 'seated_chest_press'
  | 'cable_fly'
  | 'low_to_high_fly'
  | 'supine_punch'
  | 'overhead_press'
  | 'pike_push_up'
  | 'front_raise'
  | 'lateral_raise'
  | 'cable_lateral_raise'
  | 'reverse_pec_deck'
  | 'bent_reverse_fly'
  | 'face_pull'
  | 'cable_external_rotation'
  | 'side_lying_external_rotation'
  | 'pull_up'
  | 'scapular_pull_up'
  | 'dead_hang'
  | 'lat_pulldown'
  | 'seated_row'
  | 'bent_row'
  | 'one_arm_row'
  | 'straight_arm_pulldown'
  | 'dumbbell_pullover'
  | 'shrug'
  | 'prone_y_raise'
  | 'cable_y_raise'
  | 'wall_slide'
  | 'standing_curl'
  | 'incline_curl'
  | 'preacher_curl'
  | 'triceps_pushdown'
  | 'overhead_triceps'
  | 'lying_triceps'
  | 'wrist_curl'
  | 'wrist_roller'
  | 'farmer_carry'
  | 'suitcase_carry'
  | 'hip_thrust'
  | 'glute_bridge'
  | 'split_squat'
  | 'reverse_lunge'
  | 'squat'
  | 'hack_squat'
  | 'leg_press'
  | 'leg_extension'
  | 'reverse_nordic'
  | 'hinge_rdl'
  | 'conventional_deadlift'
  | 'sumo_deadlift'
  | 'seated_leg_curl'
  | 'lying_leg_curl'
  | 'sliding_leg_curl'
  | 'seated_hip_abduction'
  | 'side_lying_abduction'
  | 'seated_hip_adduction'
  | 'standing_cable_adduction'
  | 'copenhagen_plank'
  | 'hip_flexor_march'
  | 'cable_kickback'
  | 'standing_calf_raise'
  | 'seated_calf_raise'
  | 'bent_knee_calf_raise'
  | 'wall_tibialis_raise'
  | 'band_dorsiflexion'
  | 'hanging_leg_raise'
  | 'cable_crunch'
  | 'reverse_crunch'
  | 'front_plank'
  | 'side_plank'
  | 'pallof_press'
  | 'cable_woodchop'
  | 'dead_bug'
  | 'back_extension'
  | 'seated_back_extension'
  | 'prone_trunk_extension';

export type PosePropKind = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'band' | 'bodyweight';

export interface ExercisePoseConfig {
  scene: PoseSceneId;
  prop: PosePropKind;
  viewTag: PoseViewTag;
  phases: [startLabel: string, peakLabel: string];
  /** Optional static rest phase in [0..1] chosen for maximum instant readability */
  idleT?: number;
}

export type PosePrimitive =
  | {
      kind: 'limb';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      w: number;
      tone?: 'body' | 'muted' | 'accent';
    }
  | {
      kind: 'head';
      cx: number;
      cy: number;
      r: number;
    }
  | {
      kind: 'glow';
      cx: number;
      cy: number;
      r: number;
      opacity: number;
    }
  | {
      kind: 'rect';
      x: number;
      y: number;
      w: number;
      h: number;
      rx?: number;
      tone?: 'equip' | 'accent';
      rotate?: { deg: number; cx: number; cy: number };
    }
  | {
      kind: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      w?: number;
      tone?: 'equip' | 'cable' | 'arrow';
    }
  | {
      kind: 'circle';
      cx: number;
      cy: number;
      r: number;
      tone?: 'plate' | 'handle' | 'pivot';
    }
  | {
      kind: 'path';
      d: string;
      w?: number;
      tone?: 'arrow' | 'equip' | 'cable';
    };

export const POSE_VIEWBOX = { width: 176, height: 110 } as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const r1 = (n: number) => Math.round(n * 10) / 10;

const limb = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  tone: 'body' | 'muted' | 'accent' = 'body',
): PosePrimitive => ({ kind: 'limb', x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), w, tone });

const head = (cx: number, cy: number, r = 7.5): PosePrimitive => ({
  kind: 'head',
  cx: r1(cx),
  cy: r1(cy),
  r,
});

const glow = (cx: number, cy: number, r: number, t: number): PosePrimitive => ({
  kind: 'glow',
  cx: r1(cx),
  cy: r1(cy),
  r: r1(r),
  opacity: r1(0.32 + 0.56 * t),
});

const equipRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  rx = 3,
  rotate?: { deg: number; cx: number; cy: number },
): PosePrimitive => ({ kind: 'rect', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rx, tone: 'equip', rotate });

const accentRect = (x: number, y: number, w: number, h: number, rx = 2.5): PosePrimitive => ({
  kind: 'rect',
  x: r1(x),
  y: r1(y),
  w: r1(w),
  h: r1(h),
  rx,
  tone: 'accent',
});

const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tone: 'equip' | 'cable' | 'arrow' = 'equip',
  w = 1.6,
): PosePrimitive => ({ kind: 'line', x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), w, tone });

const floor = (y = 98): PosePrimitive => line(18, y, 158, y, 'equip', 1.4);

const plate = (cx: number, cy: number, r = 9.5): PosePrimitive => ({
  kind: 'circle',
  cx: r1(cx),
  cy: r1(cy),
  r,
  tone: 'plate',
});

const handle = (cx: number, cy: number, r = 3.6): PosePrimitive => ({
  kind: 'circle',
  cx: r1(cx),
  cy: r1(cy),
  r,
  tone: 'handle',
});

const pivot = (cx: number, cy: number, r = 3.4): PosePrimitive => ({
  kind: 'circle',
  cx: r1(cx),
  cy: r1(cy),
  r,
  tone: 'pivot',
});

const arrowPath = (d: string, w = 1.6): PosePrimitive => ({ kind: 'path', d, w, tone: 'arrow' });

function propWeight(prop: PosePropKind, x: number, y: number): PosePrimitive[] {
  if (prop === 'barbell') return [plate(x, y, 9.5), handle(x, y, 2.8)];
  if (prop === 'dumbbell') return [accentRect(x - 7, y - 3, 14, 6, 2.5)];
  if (prop === 'cable' || prop === 'band' || prop === 'machine') return [handle(x, y, 3.8)];
  return [];
}

/** Explicit 1-to-1 pose configuration for all 104 exercises */
export const EXERCISE_POSE_MAP: Record<string, ExercisePoseConfig> = {
  // Chest & Horizontal Push
  barbell_bench_press: { scene: 'bench_flat', prop: 'barbell', viewTag: '侧视示意', phases: ['控制下放', '推起锁定'], idleT: 0.68 },
  dumbbell_bench_press: { scene: 'bench_flat', prop: 'dumbbell', viewTag: '侧视示意', phases: ['下放展胸', '推起夹紧'], idleT: 0.68 },
  incline_dumbbell_press: { scene: 'bench_incline', prop: 'dumbbell', viewTag: '侧视示意', phases: ['下放上胸', '斜上推起'], idleT: 0.65 },
  incline_barbell_press: { scene: 'bench_incline', prop: 'barbell', viewTag: '侧视示意', phases: ['下放锁骨', '斜上推起'], idleT: 0.65 },
  decline_dumbbell_press: { scene: 'bench_decline', prop: 'dumbbell', viewTag: '侧视示意', phases: ['控制下放', '下胸推起'], idleT: 0.65 },
  push_up: { scene: 'push_up', prop: 'bodyweight', viewTag: '侧视示意', phases: ['屈肘下放', '推地撑起'], idleT: 0.35 },
  feet_elevated_push_up: { scene: 'push_up_elevated', prop: 'bodyweight', viewTag: '侧视示意', phases: ['下放胸口', '推地撑起'], idleT: 0.35 },
  chest_dip: { scene: 'chest_dip', prop: 'bodyweight', viewTag: '侧视示意', phases: ['前倾下沉', '撑起伸肘'], idleT: 0.38 },
  machine_chest_press: { scene: 'seated_chest_press', prop: 'machine', viewTag: '侧视示意', phases: ['控制回位', '向前推展'], idleT: 0.68 },
  cable_fly: { scene: 'cable_fly', prop: 'cable', viewTag: '俯视示意', phases: ['双臂展开', '胸前夹拢'], idleT: 0.65 },
  low_to_high_cable_fly: { scene: 'low_to_high_fly', prop: 'cable', viewTag: '正视示意', phases: ['低位展臂', '斜上夹胸'], idleT: 0.68 },
  band_chest_press: { scene: 'seated_chest_press', prop: 'band', viewTag: '侧视示意', phases: ['控制回收', '向前推直'], idleT: 0.68 },

  // Shoulders & Rotator Cuff
  dumbbell_overhead_press: { scene: 'overhead_press', prop: 'dumbbell', viewTag: '正视示意', phases: ['下放耳侧', '过头推举'], idleT: 0.68 },
  barbell_overhead_press: { scene: 'overhead_press', prop: 'barbell', viewTag: '正视示意', phases: ['落回锁骨', '垂直推起'], idleT: 0.68 },
  machine_shoulder_press: { scene: 'overhead_press', prop: 'machine', viewTag: '正视示意', phases: ['控制回落', '向上推举'], idleT: 0.68 },
  pike_push_up: { scene: 'pike_push_up', prop: 'bodyweight', viewTag: '侧视示意', phases: ['额头探地', '推离地面'], idleT: 0.42 },
  dumbbell_front_raise: { scene: 'front_raise', prop: 'dumbbell', viewTag: '侧视示意', phases: ['控制下放', '前平抬起'], idleT: 0.72 },
  dumbbell_lateral_raise: { scene: 'lateral_raise', prop: 'dumbbell', viewTag: '正视示意', phases: ['控制下放', '侧平外展'], idleT: 0.72 },
  cable_lateral_raise: { scene: 'cable_lateral_raise', prop: 'cable', viewTag: '正视示意', phases: ['控制回收', '单臂外展'], idleT: 0.72 },
  reverse_pec_deck: { scene: 'reverse_pec_deck', prop: 'machine', viewTag: '俯视示意', phases: ['控制还原', '后拉收缩'], idleT: 0.68 },
  dumbbell_reverse_fly: { scene: 'bent_reverse_fly', prop: 'dumbbell', viewTag: '俯视示意', phases: ['控制回落', '水平外展'], idleT: 0.68 },
  face_pull: { scene: 'face_pull', prop: 'cable', viewTag: '侧视示意', phases: ['伸臂还原', '高肘拉面'], idleT: 0.68 },
  cable_external_rotation: { scene: 'cable_external_rotation', prop: 'cable', viewTag: '俯视示意', phases: ['缓慢内收', '向外旋开'], idleT: 0.65 },
  side_lying_external_rotation: { scene: 'side_lying_external_rotation', prop: 'dumbbell', viewTag: '正视示意', phases: ['控制下放', '向上外旋'], idleT: 0.68 },

  // Back & Traps
  pull_up: { scene: 'pull_up', prop: 'bodyweight', viewTag: '正视示意', phases: ['控制下放', '拉起过杠'], idleT: 0.65 },
  chin_up: { scene: 'pull_up', prop: 'bodyweight', viewTag: '正视示意', phases: ['控制下放', '反握拉起'], idleT: 0.65 },
  lat_pulldown: { scene: 'lat_pulldown', prop: 'cable', viewTag: '正视示意', phases: ['控制还原', '拉至上胸'], idleT: 0.68 },
  seated_cable_row: { scene: 'seated_row', prop: 'cable', viewTag: '侧视示意', phases: ['前伸还原', '后拉收背'], idleT: 0.68 },
  one_arm_dumbbell_row: { scene: 'one_arm_row', prop: 'dumbbell', viewTag: '侧视示意', phases: ['直臂下放', '拉向髋侧'], idleT: 0.68 },
  barbell_row: { scene: 'bent_row', prop: 'barbell', viewTag: '侧视示意', phases: ['控制下放', '拉向腹下'], idleT: 0.68 },
  chest_supported_high_row: { scene: 'seated_row', prop: 'machine', viewTag: '侧视示意', phases: ['前伸还原', '高肘后收'], idleT: 0.68 },
  straight_arm_pulldown: { scene: 'straight_arm_pulldown', prop: 'cable', viewTag: '侧视示意', phases: ['控制上抬', '直臂下压'], idleT: 0.68 },
  dumbbell_pullover: { scene: 'dumbbell_pullover', prop: 'dumbbell', viewTag: '侧视示意', phases: ['过头拉长', '画弧拉回'], idleT: 0.42 },
  dumbbell_shrug: { scene: 'shrug', prop: 'dumbbell', viewTag: '正视示意', phases: ['肩部下沉', '向上耸肩'], idleT: 0.72 },
  barbell_shrug: { scene: 'shrug', prop: 'barbell', viewTag: '正视示意', phases: ['肩部下沉', '向上耸肩'], idleT: 0.72 },
  prone_y_raise: { scene: 'prone_y_raise', prop: 'dumbbell', viewTag: '俯视示意', phases: ['控制回落', 'Y字抬起'], idleT: 0.7 },
  cable_y_raise: { scene: 'cable_y_raise', prop: 'cable', viewTag: '正视示意', phases: ['斜下还原', '斜上Y举'], idleT: 0.72 },
  scapular_pull_up: { scene: 'scapular_pull_up', prop: 'bodyweight', viewTag: '正视示意', phases: ['肩胛放松', '沉肩上提'], idleT: 0.7 },

  // Biceps, Triceps & Forearms
  dumbbell_curl: { scene: 'standing_curl', prop: 'dumbbell', viewTag: '侧视示意', phases: ['控制下放', '屈肘弯举'], idleT: 0.68 },
  barbell_curl: { scene: 'standing_curl', prop: 'barbell', viewTag: '侧视示意', phases: ['控制下放', '屈肘弯举'], idleT: 0.68 },
  incline_dumbbell_curl: { scene: 'incline_curl', prop: 'dumbbell', viewTag: '侧视示意', phases: ['后伸拉长', '屈肘弯举'], idleT: 0.65 },
  preacher_curl: { scene: 'preacher_curl', prop: 'barbell', viewTag: '侧视示意', phases: ['控制下放', '贴垫弯举'], idleT: 0.65 },
  cable_curl: { scene: 'standing_curl', prop: 'cable', viewTag: '侧视示意', phases: ['控制回放', '绳索弯举'], idleT: 0.68 },
  band_curl: { scene: 'standing_curl', prop: 'band', viewTag: '侧视示意', phases: ['控制回放', '屈肘拉起'], idleT: 0.68 },
  dumbbell_hammer_curl: { scene: 'standing_curl', prop: 'dumbbell', viewTag: '侧视示意', phases: ['控制下放', '锤式弯举'], idleT: 0.68 },
  dumbbell_reverse_curl: { scene: 'standing_curl', prop: 'dumbbell', viewTag: '侧视示意', phases: ['控制下放', '反握弯举'], idleT: 0.68 },
  cable_triceps_pushdown: { scene: 'triceps_pushdown', prop: 'cable', viewTag: '侧视示意', phases: ['控制屈肘', '下压伸直'], idleT: 0.7 },
  overhead_cable_triceps_extension: { scene: 'overhead_triceps', prop: 'cable', viewTag: '侧视示意', phases: ['屈肘拉长', '过头伸直'], idleT: 0.68 },
  close_grip_bench_press: { scene: 'bench_flat', prop: 'barbell', viewTag: '侧视示意', phases: ['夹肘下放', '推起伸肘'], idleT: 0.68 },
  lying_dumbbell_triceps_extension: { scene: 'lying_triceps', prop: 'dumbbell', viewTag: '侧视示意', phases: ['屈肘贴额', '向上伸肘'], idleT: 0.65 },
  close_grip_push_up: { scene: 'push_up', prop: 'bodyweight', viewTag: '侧视示意', phases: ['夹肘下放', '推起伸肘'], idleT: 0.38 },
  overhead_dumbbell_triceps_extension: { scene: 'overhead_triceps', prop: 'dumbbell', viewTag: '侧视示意', phases: ['屈肘下放', '过头伸直'], idleT: 0.68 },
  band_triceps_pushdown: { scene: 'triceps_pushdown', prop: 'band', viewTag: '侧视示意', phases: ['控制屈肘', '下压伸直'], idleT: 0.7 },
  dumbbell_wrist_curl: { scene: 'wrist_curl', prop: 'dumbbell', viewTag: '侧视示意', phases: ['松腕下垂', '屈腕卷起'], idleT: 0.7 },
  dumbbell_reverse_wrist_curl: { scene: 'wrist_curl', prop: 'dumbbell', viewTag: '侧视示意', phases: ['手背下放', '伸腕抬起'], idleT: 0.7 },
  band_wrist_extension: { scene: 'wrist_curl', prop: 'band', viewTag: '侧视示意', phases: ['控制回放', '抗阻伸腕'], idleT: 0.7 },
  wrist_roller: { scene: 'wrist_roller', prop: 'dumbbell', viewTag: '侧视示意', phases: ['缓慢下放', '交替卷起'], idleT: 0.65 },
  farmer_carry: { scene: 'farmer_carry', prop: 'dumbbell', viewTag: '正视示意', phases: ['稳步迈进', '核心锁定'], idleT: 0.5 },
  dead_hang: { scene: 'dead_hang', prop: 'bodyweight', viewTag: '正视示意', phases: ['稳定抓握', '静态悬垂'], idleT: 0.5 },

  // Glutes, Quads, Hamstrings, Adductors & Calves
  barbell_hip_thrust: { scene: 'hip_thrust', prop: 'barbell', viewTag: '侧视示意', phases: ['控制降髋', '顶髋夹臀'], idleT: 0.72 },
  glute_bridge: { scene: 'glute_bridge', prop: 'bodyweight', viewTag: '侧视示意', phases: ['缓慢落臀', '顶髋伸直'], idleT: 0.72 },
  bulgarian_split_squat: { scene: 'split_squat', prop: 'dumbbell', viewTag: '侧视示意', phases: ['前腿蹬起', '底部蓄力'], idleT: 0.65 },
  dumbbell_reverse_lunge: { scene: 'reverse_lunge', prop: 'dumbbell', viewTag: '侧视示意', phases: ['蹬回直立', '后撤下蹲'], idleT: 0.65 },
  barbell_back_squat: { scene: 'squat', prop: 'barbell', viewTag: '侧视示意', phases: ['伸髋站起', '屈髋深蹲'], idleT: 0.65 },
  goblet_squat: { scene: 'squat', prop: 'dumbbell', viewTag: '侧视示意', phases: ['站起伸膝', '胸前深蹲'], idleT: 0.65 },
  hack_squat: { scene: 'hack_squat', prop: 'machine', viewTag: '侧视示意', phases: ['蹬起伸膝', '控制下蹲'], idleT: 0.65 },
  leg_press: { scene: 'leg_press', prop: 'machine', viewTag: '侧视示意', phases: ['屈膝回收', '斜上蹬出'], idleT: 0.65 },
  seated_leg_extension: { scene: 'leg_extension', prop: 'machine', viewTag: '侧视示意', phases: ['控制屈膝', '踢直伸膝'], idleT: 0.72 },
  reverse_nordic_curl: { scene: 'reverse_nordic', prop: 'bodyweight', viewTag: '侧视示意', phases: ['股四拉回', '直身后仰'], idleT: 0.65 },
  romanian_deadlift: { scene: 'hinge_rdl', prop: 'barbell', viewTag: '侧视示意', phases: ['伸髋站直', '屈髋后移'], idleT: 0.68 },
  conventional_deadlift: { scene: 'conventional_deadlift', prop: 'barbell', viewTag: '侧视示意', phases: ['控制落杠', '蹬地拉起'], idleT: 0.68 },
  sumo_deadlift: { scene: 'sumo_deadlift', prop: 'barbell', viewTag: '正视示意', phases: ['宽距落杠', '蹬地站直'], idleT: 0.65 },
  seated_leg_curl: { scene: 'seated_leg_curl', prop: 'machine', viewTag: '侧视示意', phases: ['控制回伸', '屈膝下勾'], idleT: 0.7 },
  lying_leg_curl: { scene: 'lying_leg_curl', prop: 'machine', viewTag: '侧视示意', phases: ['控制伸膝', '脚跟勾臀'], idleT: 0.7 },
  sliding_leg_curl: { scene: 'sliding_leg_curl', prop: 'bodyweight', viewTag: '侧视示意', phases: ['脚跟滑远', '屈膝拉回'], idleT: 0.7 },
  seated_hip_abduction: { scene: 'seated_hip_abduction', prop: 'machine', viewTag: '俯视示意', phases: ['控制合拢', '双腿外展'], idleT: 0.7 },
  side_lying_hip_abduction: { scene: 'side_lying_abduction', prop: 'bodyweight', viewTag: '正视示意', phases: ['控制下放', '侧向抬腿'], idleT: 0.72 },
  seated_hip_adduction: { scene: 'seated_hip_adduction', prop: 'machine', viewTag: '俯视示意', phases: ['控制展开', '大腿夹拢'], idleT: 0.7 },
  standing_cable_hip_adduction: { scene: 'standing_cable_adduction', prop: 'cable', viewTag: '正视示意', phases: ['外展拉长', '向内夹过'], idleT: 0.7 },
  copenhagen_plank: { scene: 'copenhagen_plank', prop: 'bodyweight', viewTag: '正视示意', phases: ['内收托举', '等长稳定'], idleT: 0.5 },
  standing_band_hip_flexion: { scene: 'hip_flexor_march', prop: 'band', viewTag: '侧视示意', phases: ['控制落脚', '抗阻抬膝'], idleT: 0.72 },
  seated_psoas_march: { scene: 'hip_flexor_march', prop: 'bodyweight', viewTag: '侧视示意', phases: ['控制落脚', '坐姿抬膝'], idleT: 0.72 },
  cable_glute_kickback: { scene: 'cable_kickback', prop: 'cable', viewTag: '侧视示意', phases: ['控制收回', '后蹬伸髋'], idleT: 0.72 },
  standing_calf_raise: { scene: 'standing_calf_raise', prop: 'machine', viewTag: '侧视示意', phases: ['脚跟下沉', '直膝踮起'], idleT: 0.72 },
  seated_calf_raise: { scene: 'seated_calf_raise', prop: 'machine', viewTag: '侧视示意', phases: ['脚跟下沉', '屈膝踮起'], idleT: 0.72 },
  single_leg_calf_raise: { scene: 'standing_calf_raise', prop: 'bodyweight', viewTag: '侧视示意', phases: ['脚跟下沉', '单腿踮起'], idleT: 0.72 },
  bent_knee_calf_raise: { scene: 'bent_knee_calf_raise', prop: 'bodyweight', viewTag: '侧视示意', phases: ['微蹲沉跟', '屈膝踮起'], idleT: 0.72 },
  wall_tibialis_raise: { scene: 'wall_tibialis_raise', prop: 'bodyweight', viewTag: '侧视示意', phases: ['脚掌放下', '脚尖勾起'], idleT: 0.72 },
  band_ankle_dorsiflexion: { scene: 'band_dorsiflexion', prop: 'band', viewTag: '侧视示意', phases: ['脚尖回位', '抗阻勾脚'], idleT: 0.72 },

  // Core & Lower Back
  hanging_leg_raise: { scene: 'hanging_leg_raise', prop: 'bodyweight', viewTag: '侧视示意', phases: ['控制下放', '卷骨盆抬腿'], idleT: 0.7 },
  cable_crunch: { scene: 'cable_crunch', prop: 'cable', viewTag: '侧视示意', phases: ['控制抬起', '卷腹下压'], idleT: 0.7 },
  reverse_crunch: { scene: 'reverse_crunch', prop: 'bodyweight', viewTag: '侧视示意', phases: ['分段回垫', '卷起尾骨'], idleT: 0.7 },
  side_plank: { scene: 'side_plank', prop: 'bodyweight', viewTag: '正视示意', phases: ['侧腹收紧', '等长抗侧屈'], idleT: 0.5 },
  pallof_press: { scene: 'pallof_press', prop: 'cable', viewTag: '俯视示意', phases: ['收回胸前', '推直抗旋转'], idleT: 0.7 },
  push_up_plus: { scene: 'push_up_scapular', prop: 'bodyweight', viewTag: '侧视示意', phases: ['胸口微沉', '肩胛推远'], idleT: 0.7 },
  cable_woodchop: { scene: 'cable_woodchop', prop: 'cable', viewTag: '正视示意', phases: ['控制回位', '斜向转体'], idleT: 0.7 },
  back_extension: { scene: 'back_extension', prop: 'bodyweight', viewTag: '侧视示意', phases: ['受控前屈', '伸直躯干'], idleT: 0.7 },
  seated_machine_back_extension: { scene: 'seated_back_extension', prop: 'machine', viewTag: '侧视示意', phases: ['前屈蓄力', '向后伸展'], idleT: 0.7 },
  prone_trunk_extension: { scene: 'prone_trunk_extension', prop: 'bodyweight', viewTag: '侧视示意', phases: ['缓慢放回', '胸口微抬'], idleT: 0.7 },
  supine_serratus_punch: { scene: 'supine_punch', prop: 'dumbbell', viewTag: '侧视示意', phases: ['肩胛回落', '直臂送拳'], idleT: 0.7 },
  serratus_wall_slide: { scene: 'wall_slide', prop: 'bodyweight', viewTag: '侧视示意', phases: ['贴墙滑回', '前臂上滑'], idleT: 0.7 },
  front_plank: { scene: 'front_plank', prop: 'bodyweight', viewTag: '侧视示意', phases: ['收肋收臀', '等长抗伸展'], idleT: 0.5 },
  dead_bug: { scene: 'dead_bug', prop: 'bodyweight', viewTag: '侧视示意', phases: ['收回中立', '对侧伸展'], idleT: 0.68 },
  suitcase_carry: { scene: 'suitcase_carry', prop: 'dumbbell', viewTag: '正视示意', phases: ['保持等肩', '抗侧弯行走'], idleT: 0.5 },
};

export function getExercisePoseConfig(exerciseId: string): ExercisePoseConfig {
  return (
    EXERCISE_POSE_MAP[exerciseId] ?? {
      scene: 'squat',
      prop: 'bodyweight',
      viewTag: '侧视示意',
      phases: ['控制还原', '发力收缩'],
      idleT: 0.6,
    }
  );
}

/** Computes Capsule-Figure SVG primitives for any exercise at normalized cycle t in [0..1] */
export function buildPoseFrame(config: ExercisePoseConfig, rawT: number): PosePrimitive[] {
  const t = Math.max(0, Math.min(1, rawT));
  const { scene, prop } = config;

  switch (scene) {
    case 'bench_flat':
    case 'bench_incline':
    case 'bench_decline': {
      const shX = scene === 'bench_incline' ? 66 : 64;
      const shY = scene === 'bench_incline' ? 50 : scene === 'bench_decline' ? 72 : 64;
      const hipX = 110;
      const hipY = scene === 'bench_incline' ? 72 : scene === 'bench_decline' ? 58 : 67;
      const headX = scene === 'bench_incline' ? 54 : 45;
      const headY = scene === 'bench_incline' ? 37 : scene === 'bench_decline' ? 78 : 62;
      const barX = lerp(shX + 6, shX + 1, t);
      const barY = lerp(shY - 12, shY - 40, t);
      const elbX = lerp(shX - 7, shX + 1, t);
      const elbY = lerp(shY + 12, shY - 20, t);
      return [
        floor(),
        scene === 'bench_incline'
          ? equipRect(48, 56, 66, 7, 3, { deg: 26, cx: 82, cy: 64 })
          : scene === 'bench_decline'
            ? equipRect(40, 66, 76, 7, 3, { deg: -15, cx: 78, cy: 68 })
            : equipRect(36, 72, 84, 7, 3),
        line(scene === 'bench_incline' ? 62 : 48, scene === 'bench_incline' ? 60 : 79, scene === 'bench_incline' ? 62 : 48, 98, 'equip', 2.4),
        line(110, 79, 110, 98, 'equip', 2.4),
        line(shX + 22, shY - 10, shX + 22, shY - 40, 'arrow', 1.6),
        arrowPath(`M ${shX + 19} ${shY - 35} L ${shX + 22} ${shY - 41} L ${shX + 25} ${shY - 35}`),
        limb(hipX, hipY, 134, 70, 8.5),
        limb(134, 70, 138, 95, 7.5),
        limb(shX, shY, hipX, hipY, 11),
        glow(shX + 7, shY - 1, lerp(4.5, 6.8, t), t),
        head(headX, headY, 8),
        limb(shX, shY, elbX, elbY, 7),
        limb(elbX, elbY, barX, barY, 6.5),
        ...propWeight(prop, barX, barY),
      ];
    }

    case 'push_up':
    case 'push_up_elevated':
    case 'push_up_scapular': {
      const elevated = scene === 'push_up_elevated';
      const scap = scene === 'push_up_scapular';
      const footY = elevated ? 72 : 93;
      const shY = scap ? lerp(64, 55, t) : lerp(78, 54, t);
      const hipY = scap ? lerp(74, 70, t) : lerp(84, 67, t);
      const elbX = scap ? 115 : lerp(103, 116, t);
      const elbY = scap ? lerp(79, 75, t) : lerp(82, 74, t);
      return [
        floor(),
        ...(elevated ? [equipRect(22, 72, 26, 26, 3)] : []),
        line(138, 52, 138, 82, 'arrow', 1.6),
        arrowPath('M 135 57 L 138 51 L 141 57 M 135 77 L 138 83 L 141 77'),
        limb(38, footY, 78, hipY, 8),
        limb(78, hipY, 116, shY, 10.5),
        glow(scap ? 110 : 114, shY + 4, lerp(4.5, 6.8, t), t),
        head(131, shY - 6, 7.5),
        limb(116, shY, elbX, elbY, 6.8),
        limb(elbX, elbY, 118, 94, 6.2),
      ];
    }

    case 'chest_dip': {
      const shY = lerp(52, 34, t);
      const hipY = lerp(74, 56, t);
      const elbX = lerp(72, 92, t);
      const elbY = lerp(54, 48, t);
      return [
        floor(),
        line(72, 62, 116, 62, 'equip', 3),
        line(78, 62, 78, 98, 'equip', 2.4),
        line(110, 62, 110, 98, 'equip', 2.4),
        line(132, 32, 132, 60, 'arrow', 1.6),
        arrowPath('M 129 37 L 132 31 L 135 37'),
        limb(80, hipY, 68, hipY + 18, 8),
        limb(95, shY, 80, hipY, 10.5),
        glow(98, shY + 6, lerp(4.5, 6.8, t), t),
        head(107, shY - 9, 7.5),
        limb(95, shY, elbX, elbY, 6.8),
        limb(elbX, elbY, 94, 61, 6.2),
      ];
    }

    case 'seated_chest_press': {
      const handX = lerp(84, 126, t);
      const elbX = lerp(58, 98, t);
      const elbY = lerp(58, 52, t);
      return [
        floor(),
        equipRect(52, 42, 8, 34, 3),
        equipRect(56, 72, 30, 7, 3),
        ...(prop === 'band' ? [line(44, 52, handX, 50, 'cable', 2)] : [line(134, 34, handX, 50, 'equip', 2.2)]),
        line(90, 34, 126, 34, 'arrow', 1.6),
        arrowPath('M 121 31 L 127 34 L 121 37'),
        limb(70, 70, 96, 72, 8.5),
        limb(96, 72, 98, 95, 7.5),
        limb(68, 46, 70, 70, 11),
        glow(76, 49, lerp(4.5, 6.8, t), t),
        head(70, 32, 7.5),
        limb(68, 48, elbX, elbY, 7),
        limb(elbX, elbY, handX, 50, 6.5),
        handle(handX, 50, 3.8),
      ];
    }

    case 'cable_fly': {
      const ang = lerp(0.12, -1.2, t);
      const cx = 88, cy = 62;
      const shL = cx - 18, shR = cx + 18;
      const hLx = shL - Math.cos(ang) * 36;
      const hLy = cy + Math.sin(ang) * 36;
      const hRx = shR + Math.cos(ang) * 36;
      const hRy = cy + Math.sin(ang) * 36;
      return [
        line(18, 66, hLx, hLy, 'cable', 1.8),
        line(158, 66, hRx, hRy, 'cable', 1.8),
        arrowPath('M 38 66 A 38 38 0 0 1 76 24'),
        arrowPath('M 138 66 A 38 38 0 0 0 100 24'),
        limb(shL, cy, shR, cy, 14),
        limb(shL, cy, hLx, hLy, 7.2),
        limb(shR, cy, hRx, hRy, 7.2),
        glow(cx - 8, cy - 5, lerp(4, 6.6, t), t),
        glow(cx + 8, cy - 5, lerp(4, 6.6, t), t),
        handle(hLx, hLy),
        handle(hRx, hRy),
        head(cx, cy + 2, 10),
      ];
    }

    case 'low_to_high_fly': {
      const hLx = lerp(42, 79, t);
      const hRx = lerp(134, 97, t);
      const hY = lerp(76, 36, t);
      return [
        floor(),
        line(20, 92, hLx, hY, 'cable', 1.8),
        line(156, 92, hRx, hY, 'cable', 1.8),
        arrowPath('M 42 74 Q 56 48 76 34'),
        arrowPath('M 134 74 Q 120 48 100 34'),
        limb(80, 62, 76, 95, 7.5),
        limb(96, 62, 100, 95, 7.5),
        limb(88, 34, 88, 62, 13),
        limb(73, 38, hLx, hY, 6.5),
        limb(103, 38, hRx, hY, 6.5),
        glow(82, 39, lerp(4, 6.2, t), t),
        glow(94, 39, lerp(4, 6.2, t), t),
        handle(hLx, hY),
        handle(hRx, hY),
        head(88, 22, 7.5),
      ];
    }

    case 'supine_punch': {
      const handY = lerp(34, 21, t);
      const shY = lerp(68, 59, t);
      return [
        floor(),
        line(96, 38, 96, 18, 'arrow', 1.6),
        arrowPath('M 93 23 L 96 17 L 99 23'),
        limb(110, 74, 130, 60, 8),
        limb(130, 60, 140, 94, 7.5),
        limb(68, shY + 6, 110, 74, 10.5),
        glow(74, shY + 9, lerp(4, 6.5, t), t),
        head(48, 72, 7.8),
        limb(72, shY, 76, handY, 6.8),
        ...propWeight('dumbbell', 76, handY),
      ];
    }

    case 'overhead_press': {
      const hY = lerp(42, 15, t);
      const elbY = lerp(55, 29, t);
      const elbXOff = lerp(24, 17, t);
      return [
        floor(),
        line(142, 42, 142, 15, 'arrow', 1.6),
        arrowPath('M 139 20 L 142 14 L 145 20'),
        limb(80, 68, 76, 95, 7.5),
        limb(96, 68, 100, 95, 7.5),
        limb(88, 38, 88, 68, 13),
        glow(73, 41, lerp(4, 6.2, t), t),
        glow(103, 41, lerp(4, 6.2, t), t),
        limb(73, 42, 88 - elbXOff, elbY, 6.5),
        limb(88 - elbXOff, elbY, 68, hY, 6),
        limb(103, 42, 88 + elbXOff, elbY, 6.5),
        limb(88 + elbXOff, elbY, 108, hY, 6),
        ...(prop === 'barbell'
          ? [line(54, hY, 122, hY, 'equip', 2.4), plate(54, hY, 7), plate(122, hY, 7)]
          : [...propWeight(prop, 68, hY), ...propWeight(prop, 108, hY)]),
        head(88, 25, 7.5),
      ];
    }

    case 'pike_push_up': {
      const shY = lerp(74, 54, t);
      const shX = lerp(114, 106, t);
      const hipY = lerp(38, 28, t);
      return [
        floor(),
        line(136, 52, 136, 84, 'arrow', 1.6),
        arrowPath('M 133 57 L 136 51 L 139 57'),
        limb(52, 94, 78, hipY, 8),
        limb(78, hipY, shX, shY, 10),
        glow(shX, shY + 2, lerp(4.5, 6.6, t), t),
        head(shX + 10, shY + 12, 7.2),
        limb(shX, shY, 108, 94, 6.8),
      ];
    }

    case 'front_raise': {
      const ang = lerp(1.38, -0.05, t);
      const shX = 78, shY = 38;
      const hx = shX + Math.cos(ang) * 34;
      const hy = shY + Math.sin(ang) * 34;
      return [
        floor(),
        arrowPath('M 90 72 A 34 34 0 0 0 116 36'),
        limb(78, 66, 80, 95, 8),
        limb(78, 36, 78, 66, 10.5),
        glow(81, 38, lerp(4.2, 6.6, t), t),
        head(78, 23, 7.5),
        limb(shX, shY, hx, hy, 6.8),
        ...propWeight('dumbbell', hx, hy),
      ];
    }

    case 'lateral_raise': {
      const ang = lerp(1.35, 0.05, t);
      const hLx = 73 - Math.cos(ang) * 34;
      const hRx = 103 + Math.cos(ang) * 34;
      const hY = 40 + Math.sin(ang) * 34;
      return [
        floor(),
        arrowPath('M 58 72 A 35 35 0 0 1 36 38'),
        arrowPath('M 118 72 A 35 35 0 0 0 140 38'),
        limb(80, 66, 76, 95, 7.5),
        limb(96, 66, 100, 95, 7.5),
        limb(88, 37, 88, 66, 13),
        glow(71, 39, lerp(4, 6.6, t), t),
        glow(105, 39, lerp(4, 6.6, t), t),
        limb(73, 40, hLx, hY, 6.5),
        limb(103, 40, hRx, hY, 6.5),
        ...propWeight('dumbbell', hLx, hY),
        ...propWeight('dumbbell', hRx, hY),
        head(88, 24, 7.5),
      ];
    }

    case 'cable_lateral_raise': {
      const ang = lerp(1.3, 0.05, t);
      const hRx = 102 + Math.cos(ang) * 36;
      const hRy = 40 + Math.sin(ang) * 36;
      return [
        floor(),
        equipRect(22, 24, 7, 74, 3),
        line(29, 86, hRx, hRy, 'cable', 1.8),
        arrowPath('M 118 72 A 36 36 0 0 0 142 38'),
        limb(80, 66, 76, 95, 7.5),
        limb(94, 66, 98, 95, 7.5),
        limb(87, 37, 87, 66, 13),
        limb(73, 40, 64, 64, 6.2, 'muted'),
        glow(104, 39, lerp(4, 6.8, t), t),
        limb(101, 40, hRx, hRy, 6.8),
        handle(hRx, hRy),
        head(87, 24, 7.5),
      ];
    }

    case 'reverse_pec_deck':
    case 'bent_reverse_fly': {
      const ang = lerp(-1.25, 0.25, t);
      const cx = 88, cy = 58;
      const shL = cx - 18, shR = cx + 18;
      const hLx = shL - Math.cos(ang) * 38;
      const hLy = cy + Math.sin(ang) * 38;
      const hRx = shR + Math.cos(ang) * 38;
      const hRy = cy + Math.sin(ang) * 38;
      return [
        ...(scene === 'reverse_pec_deck'
          ? [equipRect(64, 34, 48, 9, 4), line(88, 22, hLx, hLy, 'equip', 2), line(88, 22, hRx, hRy, 'equip', 2)]
          : []),
        arrowPath('M 60 22 A 38 38 0 0 0 34 68'),
        arrowPath('M 116 22 A 38 38 0 0 1 142 68'),
        limb(shL, cy, shR, cy, 14),
        limb(shL, cy, hLx, hLy, 7.2),
        limb(shR, cy, hRx, hRy, 7.2),
        ...propWeight(prop, hLx, hLy),
        ...propWeight(prop, hRx, hRy),
        head(cx, cy - 4, 10),
        glow(shL, cy + 4, lerp(4.2, 7.2, t), t),
        glow(shR, cy + 4, lerp(4.2, 7.2, t), t),
      ];
    }

    case 'face_pull': {
      const hx = lerp(52, 92, t);
      const hy = lerp(34, 28, t);
      const elbX = lerp(74, 114, t);
      const elbY = lerp(38, 30, t);
      return [
        floor(),
        equipRect(16, 18, 8, 80, 3),
        line(24, 32, hx, hy, 'cable', 1.8),
        line(56, 18, 96, 18, 'arrow', 1.6),
        arrowPath('M 91 15 L 97 18 L 91 21'),
        limb(106, 66, 98, 95, 7.5),
        limb(106, 66, 118, 95, 7.5),
        limb(102, 36, 106, 66, 10.5),
        glow(108, 37, lerp(4.5, 6.8, t), t),
        head(98, 23, 7.5),
        limb(102, 37, elbX, elbY, 6.8),
        limb(elbX, elbY, hx, hy, 6.2),
        handle(hx, hy),
      ];
    }

    case 'cable_external_rotation': {
      const elbX = 110, elbY = 58;
      const ang = lerp(-2.2, -0.28, t);
      const hx = elbX + Math.cos(ang) * 34;
      const hy = elbY + Math.sin(ang) * 34;
      return [
        equipRect(14, 34, 8, 44, 3),
        line(22, 54, hx, hy, 'cable', 1.8),
        arrowPath('M 90 29 A 34 34 0 0 1 144 46'),
        limb(72, 58, 108, 58, 14),
        limb(72, 58, 64, 70, 6.8, 'muted'),
        limb(elbX, elbY, hx, hy, 7.2),
        pivot(elbX, elbY),
        handle(hx, hy),
        head(90, 56, 10),
        glow(108, 63, lerp(4, 7, t), t),
      ];
    }

    case 'side_lying_external_rotation': {
      const elbX = 90, elbY = 66;
      const ang = lerp(0.25, -1.25, t);
      const hx = elbX + Math.cos(ang) * 28;
      const hy = elbY + Math.sin(ang) * 28;
      return [
        floor(),
        arrowPath('M 118 68 A 28 28 0 0 0 96 36'),
        limb(44, 86, 128, 86, 10),
        head(34, 82, 7.8),
        limb(66, 80, elbX, elbY, 6.8),
        limb(elbX, elbY, hx, hy, 6.2),
        pivot(elbX, elbY),
        ...propWeight('dumbbell', hx, hy),
        glow(68, 76, lerp(4, 6.8, t), t),
      ];
    }

    case 'pull_up':
    case 'scapular_pull_up':
    case 'dead_hang': {
      const isScap = scene === 'scapular_pull_up';
      const isHang = scene === 'dead_hang';
      const lift = isHang ? lerp(0, 2, t) : isScap ? lerp(0, 7, t) : lerp(0, 24, t);
      const shY = 48 - lift;
      const hipY = 74 - lift;
      const elbY = isHang || isScap ? 31 - lift * 0.5 : lerp(32, 46, t);
      const elbXOff = isHang || isScap ? 18 : lerp(18, 28, t);
      return [
        line(38, 14, 138, 14, 'equip', 3.2),
        ...(isHang ? [] : [line(140, 48, 140, 22, 'arrow', 1.6), arrowPath('M 137 27 L 140 21 L 143 27')]),
        limb(82, hipY, 78, Math.min(98, hipY + 24), 7.5),
        limb(94, hipY, 98, Math.min(98, hipY + 24), 7.5),
        limb(88, shY, 88, hipY, 13),
        ...(isHang
          ? [glow(68, 16, lerp(3.5, 5.5, t), t), glow(108, 16, lerp(3.5, 5.5, t), t)]
          : [glow(76, shY + 10, lerp(4.2, 6.6, t), t), glow(100, shY + 10, lerp(4.2, 6.6, t), t)]),
        limb(74, shY, 88 - elbXOff, elbY, 6.5),
        limb(88 - elbXOff, elbY, 68, 15, 6),
        limb(102, shY, 88 + elbXOff, elbY, 6.5),
        limb(88 + elbXOff, elbY, 108, 15, 6),
        head(88, shY - 12, 7.5),
      ];
    }

    case 'lat_pulldown': {
      const barY = lerp(18, 44, t);
      const elbY = lerp(34, 58, t);
      const elbXOff = lerp(28, 22, t);
      return [
        floor(),
        equipRect(70, 74, 36, 7, 3),
        line(88, 6, 88, barY, 'cable', 1.8),
        line(52, barY, 124, barY, 'equip', 2.8),
        line(142, 20, 142, 46, 'arrow', 1.6),
        arrowPath('M 139 41 L 142 47 L 145 41'),
        limb(88, 42, 88, 72, 13),
        glow(75, 52, lerp(4.2, 6.8, t), t),
        glow(101, 52, lerp(4.2, 6.8, t), t),
        limb(74, 44, 88 - elbXOff, elbY, 6.5),
        limb(88 - elbXOff, elbY, 56, barY, 6),
        limb(102, 44, 88 + elbXOff, elbY, 6.5),
        limb(88 + elbXOff, elbY, 120, barY, 6),
        head(88, 30, 7.5),
      ];
    }

    case 'seated_row': {
      const hx = lerp(60, 94, t);
      const elbX = lerp(82, 118, t);
      return [
        floor(),
        equipRect(16, 20, 8, 78, 3),
        equipRect(74, 74, 36, 7, 3),
        line(24, 54, hx, 54, 'cable', 1.8),
        line(64, 34, 104, 34, 'arrow', 1.6),
        arrowPath('M 99 31 L 105 34 L 99 37'),
        limb(92, 72, 62, 82, 8),
        limb(62, 82, 34, 78, 7.2),
        limb(94, 42, 92, 72, 11),
        glow(100, 48, lerp(4.5, 7, t), t),
        head(93, 28, 7.5),
        limb(94, 45, elbX, 56, 6.8),
        limb(elbX, 56, hx, 54, 6.2),
        handle(hx, 54),
      ];
    }

    case 'bent_row':
    case 'one_arm_row': {
      const bench = scene === 'one_arm_row';
      const hx = lerp(96, 86, t);
      const hy = lerp(74, 50, t);
      const elbX = lerp(94, 78, t);
      const elbY = lerp(56, 36, t);
      return [
        floor(),
        ...(bench ? [equipRect(66, 66, 56, 7, 3), line(76, 73, 76, 98, 'equip', 2.2), line(114, 73, 114, 98, 'equip', 2.2)] : []),
        line(118, 74, 118, 48, 'arrow', 1.6),
        arrowPath('M 115 53 L 118 47 L 121 53'),
        limb(62, 56, 54, 95, 8.2),
        limb(62, 56, 100, 40, 11),
        glow(82, 46, lerp(4.5, 7, t), t),
        head(113, 35, 7.5),
        ...(bench ? [limb(100, 42, 108, 66, 6, 'muted')] : []),
        limb(96, 42, elbX, elbY, 6.8),
        limb(elbX, elbY, hx, hy, 6.2),
        ...propWeight(prop, hx, hy),
      ];
    }

    case 'straight_arm_pulldown': {
      const ang = lerp(-2.5, -1.7, t);
      const shX = 104, shY = 40;
      const hx = shX + Math.cos(ang) * 38;
      const hy = shY - Math.sin(ang) * 38;
      return [
        floor(),
        equipRect(18, 14, 8, 84, 3),
        line(26, 20, hx, hy, 'cable', 1.8),
        arrowPath('M 64 26 A 38 38 0 0 0 88 74'),
        limb(94, 68, 100, 95, 8),
        limb(94, 68, shX, shY, 10.5),
        glow(98, 52, lerp(4.5, 7, t), t),
        head(112, 27, 7.5),
        limb(shX, shY, hx, hy, 6.8),
        handle(hx, hy),
      ];
    }

    case 'dumbbell_pullover': {
      const ang = lerp(-2.75, -1.55, t);
      const shX = 68, shY = 64;
      const hx = shX + Math.cos(ang) * 38;
      const hy = shY + Math.sin(ang) * 38;
      return [
        floor(),
        equipRect(42, 72, 78, 7, 3),
        line(52, 79, 52, 98, 'equip', 2.4),
        line(110, 79, 110, 98, 'equip', 2.4),
        arrowPath('M 30 48 A 38 38 0 0 1 70 24'),
        limb(110, 68, 134, 70, 8.5),
        limb(134, 70, 138, 95, 7.5),
        limb(shX, shY, 110, 68, 11),
        glow(78, 63, lerp(4.5, 6.8, t), t),
        head(48, 63, 7.8),
        limb(shX, shY, hx, hy, 6.8),
        ...propWeight('dumbbell', hx, hy),
      ];
    }

    case 'shrug': {
      const shY = lerp(42, 33, t);
      const hy = lerp(74, 65, t);
      return [
        floor(),
        line(138, 46, 138, 28, 'arrow', 1.6),
        arrowPath('M 135 33 L 138 27 L 141 33'),
        limb(80, 68, 76, 95, 7.5),
        limb(96, 68, 100, 95, 7.5),
        limb(88, shY, 88, 68, 13),
        glow(78, shY - 3, lerp(4, 6.5, t), t),
        glow(98, shY - 3, lerp(4, 6.5, t), t),
        limb(73, shY, 68, hy, 6.5),
        limb(103, shY, 108, hy, 6.5),
        ...(prop === 'barbell'
          ? [line(54, hy, 122, hy, 'equip', 2.4), plate(54, hy, 7), plate(122, hy, 7)]
          : [...propWeight('dumbbell', 68, hy), ...propWeight('dumbbell', 108, hy)]),
        head(88, 22, 7.5),
      ];
    }

    case 'prone_y_raise': {
      const ang = lerp(0.55, -0.78, t);
      const cx = 88, cy = 62;
      const hLx = cx - 16 - Math.cos(ang) * 34;
      const hLy = cy + Math.sin(ang) * 34;
      const hRx = cx + 16 + Math.cos(ang) * 34;
      const hRy = cy + Math.sin(ang) * 34;
      return [
        arrowPath('M 42 74 Q 44 42 64 26'),
        arrowPath('M 134 74 Q 132 42 112 26'),
        limb(cx - 16, cy, cx + 16, cy, 13),
        limb(cx - 16, cy, hLx, hLy, 6.8),
        limb(cx + 16, cy, hRx, hRy, 6.8),
        ...propWeight('dumbbell', hLx, hLy),
        ...propWeight('dumbbell', hRx, hRy),
        glow(cx - 6, cy + 4, lerp(4, 6.5, t), t),
        glow(cx + 6, cy + 4, lerp(4, 6.5, t), t),
        head(cx, cy - 8, 9),
      ];
    }

    case 'cable_y_raise': {
      const hLx = lerp(74, 48, t);
      const hRx = lerp(102, 128, t);
      const hY = lerp(74, 22, t);
      return [
        floor(),
        line(24, 92, hRx, hY, 'cable', 1.6),
        line(152, 92, hLx, hY, 'cable', 1.6),
        arrowPath('M 64 68 L 46 22'),
        arrowPath('M 112 68 L 130 22'),
        limb(80, 66, 76, 95, 7.5),
        limb(96, 66, 100, 95, 7.5),
        limb(88, 38, 88, 66, 13),
        glow(82, 46, lerp(4, 6.4, t), t),
        glow(94, 46, lerp(4, 6.4, t), t),
        limb(74, 40, hLx, hY, 6.4),
        limb(102, 40, hRx, hY, 6.4),
        handle(hLx, hY),
        handle(hRx, hY),
        head(88, 25, 7.5),
      ];
    }

    case 'wall_slide': {
      const elbY = lerp(52, 26, t);
      const handY = lerp(34, 12, t);
      return [
        floor(),
        line(124, 10, 124, 98, 'equip', 3),
        line(136, 48, 136, 18, 'arrow', 1.6),
        arrowPath('M 133 23 L 136 17 L 139 23'),
        limb(88, 66, 90, 95, 8),
        limb(88, 38, 88, 66, 10.5),
        glow(95, 50, lerp(4.2, 6.6, t), t),
        head(88, 24, 7.5),
        limb(90, 40, 118, elbY, 6.8),
        limb(118, elbY, 120, handY, 6.2),
      ];
    }

    case 'standing_curl':
    case 'incline_curl':
    case 'preacher_curl': {
      const isIncline = scene === 'incline_curl';
      const isPreacher = scene === 'preacher_curl';
      const shX = isIncline ? 76 : 82;
      const shY = isIncline ? 40 : 38;
      const elbX = isIncline ? 70 : isPreacher ? 104 : 84;
      const elbY = isIncline ? 64 : isPreacher ? 60 : 62;
      const ang = lerp(1.2, -1.05, t);
      const hx = elbX + Math.cos(ang) * 24;
      const hy = elbY + Math.sin(ang) * 24;
      return [
        floor(),
        ...(isIncline ? [equipRect(54, 52, 46, 7, 3, { deg: 52, cx: 72, cy: 58 })] : []),
        ...(isPreacher ? [equipRect(88, 56, 30, 7, 3, { deg: -36, cx: 102, cy: 60 }), line(102, 64, 102, 98, 'equip', 2.4)] : []),
        ...(prop === 'cable' || prop === 'band' ? [line(138, 92, hx, hy, 'cable', 1.8)] : []),
        arrowPath(`M ${(elbX + 16).toFixed(0)} ${(elbY + 18).toFixed(0)} A 24 24 0 0 0 ${(elbX + 16).toFixed(0)} ${(elbY - 18).toFixed(0)}`),
        limb(isIncline ? 92 : 80, 68, isIncline ? 116 : 82, 95, 8),
        limb(shX, shY, isIncline ? 92 : 80, 68, 10.5),
        head(shX - (isIncline ? 4 : 0), shY - 13, 7.5),
        limb(shX, shY, elbX, elbY, 7),
        glow((shX + elbX) / 2 + 2, (shY + elbY) / 2, lerp(4, 6.6, t), t),
        limb(elbX, elbY, hx, hy, 6.4),
        ...propWeight(prop, hx, hy),
      ];
    }

    case 'triceps_pushdown': {
      const elbX = 92, elbY = 54;
      const ang = lerp(-2.75, -1.62, t);
      const hx = elbX + Math.cos(ang) * 26;
      const hy = elbY - Math.sin(ang) * 26;
      return [
        floor(),
        equipRect(22, 14, 8, 84, 3),
        line(30, 18, hx, hy, 'cable', 1.8),
        arrowPath('M 64 46 A 26 26 0 0 0 88 80'),
        limb(100, 68, 102, 95, 8),
        limb(98, 36, 100, 68, 10.5),
        head(98, 22, 7.5),
        limb(98, 38, elbX, elbY, 7),
        glow(101, 46, lerp(4, 6.6, t), t),
        limb(elbX, elbY, hx, hy, 6.4),
        handle(hx, hy),
      ];
    }

    case 'overhead_triceps': {
      const elbX = 94, elbY = 24;
      const ang = lerp(2.55, -0.35, t);
      const hx = elbX + Math.cos(ang) * 25;
      const hy = elbY + Math.sin(ang) * 25;
      return [
        floor(),
        ...(prop === 'cable' ? [equipRect(22, 24, 8, 74, 3), line(30, 62, hx, hy, 'cable', 1.8)] : []),
        arrowPath('M 70 30 A 26 26 0 0 1 118 18'),
        limb(86, 68, 88, 95, 8),
        limb(88, 40, 86, 68, 10.5),
        head(90, 26, 7.5),
        limb(88, 42, elbX, elbY, 7),
        glow(88, 34, lerp(4, 6.6, t), t),
        limb(elbX, elbY, hx, hy, 6.2),
        ...propWeight(prop, hx, hy),
      ];
    }

    case 'lying_triceps': {
      const elbX = 68, elbY = 44;
      const ang = lerp(-2.75, -1.45, t);
      const hx = elbX + Math.cos(ang) * 23;
      const hy = elbY + Math.sin(ang) * 23;
      return [
        floor(),
        equipRect(36, 72, 84, 7, 3),
        line(48, 79, 48, 98, 'equip', 2.4),
        line(110, 79, 110, 98, 'equip', 2.4),
        arrowPath('M 42 48 A 24 24 0 0 1 74 20'),
        limb(110, 68, 134, 70, 8.5),
        limb(134, 70, 138, 95, 7.5),
        limb(66, 65, 110, 68, 11),
        head(46, 63, 7.8),
        limb(68, 64, elbX, elbY, 7),
        glow(64, 54, lerp(4, 6.4, t), t),
        limb(elbX, elbY, hx, hy, 6.2),
        ...propWeight('dumbbell', hx, hy),
      ];
    }

    case 'wrist_curl':
    case 'wrist_roller': {
      const isRoller = scene === 'wrist_roller';
      if (isRoller) {
        const dropY = lerp(84, 54, t);
        return [
          floor(),
          line(132, 82, 132, 54, 'arrow', 1.6),
          arrowPath('M 129 59 L 132 53 L 135 59'),
          limb(66, 66, 68, 95, 8),
          limb(66, 36, 66, 66, 10.5),
          head(66, 22, 7.5),
          limb(66, 40, 112, 42, 6.8),
          glow(98, 42, lerp(4, 6.4, t), t),
          line(112, 42, 112, dropY, 'cable', 1.8),
          plate(112, dropY, 7.5),
        ];
      }
      const wristX = 108, wristY = 62;
      const hy = lerp(74, 48, t);
      return [
        floor(),
        equipRect(52, 66, 56, 8, 3),
        line(64, 74, 64, 98, 'equip', 2.2),
        line(98, 74, 98, 98, 'equip', 2.2),
        arrowPath('M 134 74 A 22 22 0 0 0 134 48'),
        limb(58, 60, wristX, wristY, 8.5),
        glow(88, 60, lerp(4.2, 6.8, t), t),
        limb(wristX, wristY, 126, hy, 5.5),
        ...propWeight(prop, 126, hy),
      ];
    }

    case 'farmer_carry':
    case 'suitcase_carry': {
      const stride = lerp(-8, 8, t);
      const isSuit = scene === 'suitcase_carry';
      return [
        floor(),
        line(48, 22, 128, 22, 'arrow', 1.4),
        limb(82, 62, 78 + stride * 0.4, 95, 7.5),
        limb(94, 62, 98 - stride * 0.4, 95, 7.5),
        limb(88, 36, 88, 62, 13),
        limb(73, 38, 68, 68, 6.5),
        limb(103, 38, 108, 68, 6.5),
        ...propWeight('dumbbell', 108, 70),
        ...(isSuit ? [glow(76, 52, lerp(4.5, 6.8, t), t)] : [...propWeight('dumbbell', 68, 70), glow(68, 62, lerp(4, 6.2, t), t), glow(108, 62, lerp(4, 6.2, t), t)]),
        head(88, 23, 7.5),
      ];
    }

    case 'hip_thrust':
    case 'glute_bridge': {
      const bench = scene === 'hip_thrust';
      const shX = 56, shY = bench ? 64 : 90;
      const hipX = 96;
      const hipY = bench ? lerp(88, 62, t) : lerp(92, 68, t);
      const kneeX = 128, kneeY = 66;
      return [
        floor(),
        ...(bench ? [equipRect(26, 66, 36, 32, 4)] : []),
        line(96, 86, 96, 54, 'arrow', 1.6),
        arrowPath('M 93 59 L 96 53 L 99 59'),
        limb(hipX, hipY, kneeX, kneeY, 9),
        limb(kneeX, kneeY, 132, 95, 7.5),
        limb(shX, shY, hipX, hipY, 11),
        glow(hipX - 2, hipY + 3, lerp(4.5, 7.2, t), t),
        head(bench ? 44 : 40, bench ? 56 : 86, 7.5),
        ...(prop === 'barbell' ? propWeight('barbell', hipX, hipY - 4) : []),
      ];
    }

    case 'split_squat':
    case 'reverse_lunge': {
      const bench = scene === 'split_squat';
      const hipX = lerp(84, 88, t);
      const hipY = lerp(52, 72, t);
      const shX = lerp(88, 97, t);
      const shY = lerp(28, 48, t);
      const fKneeX = lerp(114, 126, t);
      const fKneeY = lerp(74, 73, t);
      const rKneeX = lerp(69, 64, t);
      const rKneeY = lerp(76, 90, t);
      const rFootX = bench ? 44 : lerp(62, 42, t);
      const rFootY = bench ? 72 : 95;
      return [
        floor(),
        ...(bench ? [equipRect(26, 72, 32, 26, 4)] : []),
        line(145, 40, 145, 76, 'arrow', 1.6),
        arrowPath('M 142 45 L 145 39 L 148 45 M 142 71 L 145 77 L 148 71'),
        limb(hipX, hipY, rKneeX, rKneeY, 7.5, 'muted'),
        limb(rKneeX, rKneeY, rFootX, rFootY, 6.5, 'muted'),
        limb(hipX, hipY, fKneeX, fKneeY, 9),
        limb(fKneeX, fKneeY, 121, 95, 7.5),
        glow(hipX - 4, hipY + 2, lerp(4.5, 7, t), t),
        glow((hipX + fKneeX) / 2, (hipY + fKneeY) / 2 - 2, lerp(4, 6, t), t),
        limb(hipX, hipY, shX, shY, 10.5),
        head(shX + 3, shY - 11, 7.5),
        limb(shX, shY, shX + 6, shY + 30, 6),
        ...propWeight('dumbbell', shX + 6, shY + 32),
      ];
    }

    case 'squat':
    case 'hack_squat': {
      const isHack = scene === 'hack_squat';
      const hipX = lerp(82, 66, t);
      const hipY = lerp(54, 76, t);
      const shX = lerp(88, 86, t);
      const shY = lerp(28, 50, t);
      const kneeX = lerp(92, 108, t);
      const kneeY = lerp(74, 72, t);
      return [
        floor(),
        ...(isHack ? [line(42, 96, 98, 22, 'equip', 3)] : []),
        line(134, 34, 134, 72, 'arrow', 1.6),
        arrowPath('M 131 39 L 134 33 L 137 39 M 131 67 L 134 73 L 137 67'),
        limb(hipX, hipY, kneeX, kneeY, 9),
        limb(kneeX, kneeY, 92, 95, 7.5),
        glow((hipX + kneeX) / 2, (hipY + kneeY) / 2 - 2, lerp(4.5, 7, t), t),
        glow(hipX - 4, hipY + 2, lerp(4, 6.2, t), t),
        limb(hipX, hipY, shX, shY, 10.5),
        head(shX + 2, shY - 11, 7.5),
        ...(prop === 'barbell'
          ? [limb(shX, shY, shX - 6, shY - 4, 6), ...propWeight('barbell', shX - 6, shY - 4)]
          : prop === 'dumbbell'
            ? [limb(shX, shY, shX + 14, shY + 8, 6), ...propWeight('dumbbell', shX + 15, shY + 8)]
            : []),
      ];
    }

    case 'leg_press': {
      const kneeX = lerp(86, 112, t);
      const kneeY = lerp(52, 46, t);
      const footX = lerp(110, 138, t);
      const footY = lerp(42, 26, t);
      return [
        floor(),
        equipRect(40, 68, 42, 7, 3, { deg: 32, cx: 60, cy: 70 }),
        equipRect(footX - 2, footY - 14, 7, 28, 3, { deg: -30, cx: footX, cy: footY }),
        line(110, 22, 138, 12, 'arrow', 1.6),
        limb(72, 76, kneeX, kneeY, 9),
        limb(kneeX, kneeY, footX, footY, 7.5),
        glow((72 + kneeX) / 2, (76 + kneeY) / 2 - 3, lerp(4.5, 7, t), t),
        limb(52, 54, 72, 76, 10.5),
        head(42, 44, 7.5),
      ];
    }

    case 'leg_extension': {
      const ankleX = lerp(94, 136, t);
      const ankleY = lerp(90, 64, t);
      return [
        floor(),
        equipRect(52, 40, 8, 34, 3),
        equipRect(56, 68, 44, 7, 3),
        arrowPath('M 102 92 A 34 34 0 0 0 138 66'),
        limb(70, 65, 102, 65, 9.5),
        glow(86, 61, lerp(4.5, 7, t), t),
        limb(102, 65, ankleX, ankleY, 7.5),
        handle(ankleX, ankleY, 4.2),
        limb(68, 40, 70, 65, 10.5),
        head(68, 27, 7.5),
      ];
    }

    case 'reverse_nordic': {
      const ang = lerp(-1.52, -2.28, t);
      const kneeX = 96, kneeY = 90;
      const hipX = kneeX + Math.cos(ang) * 28;
      const hipY = kneeY + Math.sin(ang) * 28;
      const shX = kneeX + Math.cos(ang) * 56;
      const shY = kneeY + Math.sin(ang) * 56;
      return [
        floor(),
        arrowPath('M 94 30 A 52 52 0 0 0 54 46'),
        limb(kneeX, kneeY, 130, 92, 7.5),
        limb(kneeX, kneeY, hipX, hipY, 9),
        glow((kneeX + hipX) / 2 + 2, (kneeY + hipY) / 2, lerp(4.5, 7, t), t),
        limb(hipX, hipY, shX, shY, 10),
        head(shX + Math.cos(ang) * 10, shY + Math.sin(ang) * 10, 7.5),
      ];
    }

    case 'hinge_rdl':
    case 'conventional_deadlift': {
      const isConv = scene === 'conventional_deadlift';
      const hipX = lerp(84, 62, t);
      const hipY = lerp(52, isConv ? 66 : 56, t);
      const shX = lerp(86, 106, t);
      const shY = lerp(26, isConv ? 52 : 48, t);
      const kneeX = lerp(88, isConv ? 100 : 86, t);
      const kneeY = lerp(74, 74, t);
      const barX = lerp(96, 108, t);
      const barY = lerp(64, isConv ? 88 : 80, t);
      return [
        floor(),
        line(134, 86, 134, 52, 'arrow', 1.6),
        arrowPath('M 131 57 L 134 51 L 137 57'),
        limb(hipX, hipY, kneeX, kneeY, 9),
        limb(kneeX, kneeY, 90, 95, 7.5),
        glow(hipX - 4, hipY + 3, lerp(4.5, 7, t), t),
        glow((hipX + kneeX) / 2 - 4, (hipY + kneeY) / 2 + 2, lerp(4, 6.2, t), t),
        limb(hipX, hipY, shX, shY, 10.5),
        head(shX + 9, shY - 8, 7.5),
        limb(shX, shY, barX, barY, 6.5),
        ...propWeight('barbell', barX, barY),
      ];
    }

    case 'sumo_deadlift': {
      const hipY = lerp(58, 72, t);
      const shY = lerp(34, 52, t);
      const barY = lerp(64, 86, t);
      return [
        floor(),
        line(146, 84, 146, 56, 'arrow', 1.6),
        arrowPath('M 143 61 L 146 55 L 149 61'),
        limb(80, hipY, 60, 74, 8.5),
        limb(60, 74, 54, 95, 7.2),
        limb(96, hipY, 116, 74, 8.5),
        limb(116, 74, 122, 95, 7.2),
        glow(72, hipY + 6, lerp(4.2, 6.5, t), t),
        glow(104, hipY + 6, lerp(4.2, 6.5, t), t),
        limb(88, shY, 88, hipY, 12),
        limb(78, shY + 2, 78, barY, 6),
        limb(98, shY + 2, 98, barY, 6),
        line(46, barY, 130, barY, 'equip', 2.4),
        plate(46, barY, 8),
        plate(130, barY, 8),
        head(88, shY - 11, 7.5),
      ];
    }

    case 'seated_leg_curl': {
      const ankleX = lerp(136, 98, t);
      const ankleY = lerp(66, 92, t);
      return [
        floor(),
        equipRect(52, 40, 8, 34, 3),
        equipRect(56, 68, 44, 7, 3),
        arrowPath('M 138 68 A 34 34 0 0 1 104 94'),
        limb(70, 65, 102, 65, 9.5),
        glow(86, 70, lerp(4.5, 7, t), t),
        limb(102, 65, ankleX, ankleY, 7.5),
        handle(ankleX, ankleY, 4.2),
        limb(68, 40, 70, 65, 10.5),
        head(68, 27, 7.5),
      ];
    }

    case 'lying_leg_curl': {
      const ankleX = lerp(142, 108, t);
      const ankleY = lerp(70, 38, t);
      return [
        floor(),
        equipRect(36, 74, 84, 7, 3),
        line(48, 81, 48, 98, 'equip', 2.2),
        line(108, 81, 108, 98, 'equip', 2.2),
        arrowPath('M 144 68 A 34 34 0 0 0 112 36'),
        limb(52, 68, 84, 68, 10.5),
        limb(84, 68, 114, 70, 9),
        glow(98, 65, lerp(4.5, 7, t), t),
        limb(114, 70, ankleX, ankleY, 7.5),
        handle(ankleX, ankleY, 4),
        head(38, 66, 7.5),
      ];
    }

    case 'sliding_leg_curl': {
      const hipY = lerp(72, 66, t);
      const kneeX = lerp(118, 108, t);
      const kneeY = lerp(80, 64, t);
      const footX = lerp(148, 124, t);
      return [
        floor(),
        line(148, 88, 120, 88, 'arrow', 1.6),
        arrowPath('M 125 85 L 119 88 L 125 91'),
        limb(50, 90, 84, hipY, 10.5),
        limb(84, hipY, kneeX, kneeY, 9),
        glow((84 + kneeX) / 2, (hipY + kneeY) / 2 + 4, lerp(4.5, 7, t), t),
        limb(kneeX, kneeY, footX, 94, 7.5),
        accentRect(footX - 6, 93, 12, 4, 2),
        head(36, 87, 7.5),
      ];
    }

    case 'seated_hip_abduction':
    case 'seated_hip_adduction': {
      const isAbd = scene === 'seated_hip_abduction';
      const spread = isAbd ? lerp(10, 34, t) : lerp(34, 10, t);
      return [
        equipRect(64, 76, 48, 12, 4),
        arrowPath(isAbd ? 'M 68 32 L 44 32 M 108 32 L 132 32' : 'M 44 32 L 68 32 M 132 32 L 108 32'),
        limb(78, 74, 88 - spread, 34, 9.5),
        limb(98, 74, 88 + spread, 34, 9.5),
        ...(isAbd
          ? [glow(70, 66, lerp(4.2, 6.8, t), t), glow(106, 66, lerp(4.2, 6.8, t), t)]
          : [glow(83, 56, lerp(4.2, 6.8, t), t), glow(93, 56, lerp(4.2, 6.8, t), t)]),
        head(88, 78, 9),
      ];
    }

    case 'side_lying_abduction': {
      const footY = lerp(82, 42, t);
      return [
        floor(),
        arrowPath('M 142 82 A 48 48 0 0 0 132 38'),
        limb(50, 88, 86, 86, 10),
        limb(86, 88, 138, 90, 7.5, 'muted'),
        limb(86, 82, 136, footY, 8.5),
        glow(88, 78, lerp(4.2, 7, t), t),
        head(36, 84, 7.8),
      ];
    }

    case 'standing_cable_adduction': {
      const footX = lerp(128, 74, t);
      return [
        floor(),
        equipRect(148, 24, 8, 74, 3),
        line(148, 90, footX, 92, 'cable', 1.8),
        arrowPath('M 126 84 Q 102 74 74 84'),
        limb(82, 62, 82, 95, 7.5, 'muted'),
        limb(92, 62, footX, 92, 8.2),
        glow(90, 72, lerp(4.2, 6.8, t), t),
        limb(87, 36, 87, 62, 12.5),
        head(87, 23, 7.5),
      ];
    }

    case 'copenhagen_plank':
    case 'side_plank': {
      const isCop = scene === 'copenhagen_plank';
      const lift = lerp(0, 3, t);
      return [
        floor(),
        ...(isCop ? [equipRect(120, 66, 32, 32, 4)] : []),
        limb(54, 62 - lift, 54, 94, 6.5),
        limb(54, 62 - lift, 96, 68 - lift, 10),
        limb(96, 68 - lift, 136, isCop ? 68 - lift : 92, 8.2),
        ...(isCop ? [limb(96, 74 - lift, 128, 86, 6.8, 'muted'), glow(108, 74, lerp(4.5, 6.8, t), t)] : []),
        glow(78, 70, lerp(4.5, 6.8, t), t),
        head(42, 56 - lift, 7.5),
      ];
    }

    case 'hip_flexor_march': {
      const kneeX = lerp(94, 114, t);
      const kneeY = lerp(78, 56, t);
      const footY = lerp(94, 74, t);
      return [
        floor(),
        ...(prop === 'band' ? [line(88, 94, kneeX, footY, 'cable', 1.8)] : []),
        arrowPath('M 124 84 L 124 54'),
        limb(84, 64, 84, 95, 7.5, 'muted'),
        limb(86, 62, kneeX, kneeY, 8.5),
        limb(kneeX, kneeY, kneeX + 2, footY, 7),
        glow(92, 60, lerp(4.2, 6.8, t), t),
        limb(84, 34, 84, 64, 10.5),
        head(84, 21, 7.5),
      ];
    }

    case 'cable_kickback': {
      const footX = lerp(90, 44, t);
      const footY = lerp(92, 72, t);
      return [
        floor(),
        equipRect(146, 20, 8, 78, 3),
        line(146, 90, footX, footY, 'cable', 1.8),
        arrowPath('M 82 88 A 42 42 0 0 1 44 68'),
        limb(94, 60, 96, 95, 7.5, 'muted'),
        limb(92, 58, footX, footY, 8.5),
        glow(88, 58, lerp(4.5, 7, t), t),
        limb(94, 58, 116, 40, 10.5),
        limb(116, 40, 144, 46, 6, 'muted'),
        head(126, 32, 7.5),
      ];
    }

    case 'standing_calf_raise':
    case 'bent_knee_calf_raise': {
      const bent = scene === 'bent_knee_calf_raise';
      const heelY = lerp(91, 78, t);
      const lift = lerp(0, 10, t);
      const kneeX = bent ? 102 : 88;
      return [
        floor(),
        equipRect(72, 88, 32, 10, 3),
        line(124, 84, 124, 56, 'arrow', 1.6),
        arrowPath('M 121 61 L 124 55 L 127 61'),
        limb(86, 60 - lift, kneeX, 74 - lift, 8.5),
        limb(kneeX, 74 - lift, 88, heelY, 7.5),
        limb(88, heelY, 98, 88, 5.5),
        glow(88, (74 - lift + heelY) / 2, lerp(4.5, 7, t), t),
        limb(86, 36 - lift, 86, 60 - lift, 10.5),
        head(86, 24 - lift, 7),
      ];
    }

    case 'seated_calf_raise': {
      const kneeY = lerp(66, 54, t);
      const heelY = lerp(92, 78, t);
      return [
        floor(),
        equipRect(52, 72, 34, 7, 3),
        equipRect(96, 88, 22, 10, 3),
        line(126, 78, 126, 52, 'arrow', 1.6),
        arrowPath('M 123 57 L 126 51 L 129 57'),
        limb(68, 66, 104, kneeY, 9),
        limb(104, kneeY, 102, heelY, 7.5),
        limb(102, heelY, 112, 88, 5.5),
        glow(101, (kneeY + heelY) / 2 + 4, lerp(4.5, 7, t), t),
        accentRect(96, kneeY - 8, 16, 6, 2),
        limb(68, 38, 68, 66, 10.5),
        head(68, 25, 7.5),
      ];
    }

    case 'wall_tibialis_raise': {
      const toeY = lerp(95, 81, t);
      return [
        floor(),
        line(52, 14, 52, 98, 'equip', 3),
        arrowPath('M 124 94 A 18 18 0 0 0 120 76'),
        limb(60, 56, 86, 74, 8.8),
        limb(86, 74, 104, 94, 7.5),
        limb(104, 94, 120, toeY, 5.5),
        glow(98, 82, lerp(4.5, 7, t), t),
        limb(60, 28, 60, 56, 10.5),
        head(62, 16, 7.5),
      ];
    }

    case 'band_dorsiflexion': {
      const toeX = lerp(128, 116, t);
      const toeY = lerp(84, 72, t);
      return [
        floor(),
        line(152, 82, toeX, toeY, 'cable', 1.8),
        arrowPath('M 134 72 A 18 18 0 0 0 116 64'),
        limb(62, 86, 94, 86, 9),
        limb(94, 86, 122, 88, 7.5),
        limb(122, 88, toeX, toeY, 5.5),
        glow(108, 83, lerp(4.2, 6.8, t), t),
        limb(56, 56, 62, 86, 10.5),
        head(56, 43, 7.5),
      ];
    }

    case 'hanging_leg_raise': {
      const kneeX = lerp(84, 112, t);
      const kneeY = lerp(74, 48, t);
      const footX = lerp(84, 134, t);
      const footY = lerp(95, 42, t);
      return [
        line(58, 12, 112, 12, 'equip', 3),
        arrowPath('M 102 88 A 40 40 0 0 0 132 46'),
        limb(84, 34, 84, 13, 6.2),
        limb(84, 34, 84, 56, 10.5),
        glow(89, 48, lerp(4.5, 7, t), t),
        limb(84, 56, kneeX, kneeY, 8.5),
        limb(kneeX, kneeY, footX, footY, 7),
        head(86, 25, 7),
      ];
    }

    case 'cable_crunch': {
      const shX = lerp(94, 74, t);
      const shY = lerp(42, 68, t);
      return [
        floor(),
        equipRect(142, 12, 8, 86, 3),
        line(142, 18, shX + 6, shY - 4, 'cable', 1.8),
        arrowPath('M 64 42 A 30 30 0 0 0 60 72'),
        limb(98, 74, 98, 94, 8),
        limb(98, 94, 124, 94, 7),
        limb(98, 74, shX, shY, 10.5),
        glow((98 + shX) / 2 - 4, (74 + shY) / 2 + 4, lerp(4.5, 7, t), t),
        head(shX - 8, shY - 8, 7.5),
      ];
    }

    case 'reverse_crunch': {
      const hipY = lerp(88, 74, t);
      const kneeX = lerp(118, 92, t);
      const kneeY = lerp(66, 48, t);
      return [
        floor(),
        arrowPath('M 122 60 A 26 26 0 0 0 92 42'),
        limb(56, 88, 94, hipY, 10.5),
        glow(82, 82, lerp(4.5, 7, t), t),
        limb(94, hipY, kneeX, kneeY, 8.5),
        limb(kneeX, kneeY, kneeX + 18, kneeY + 14, 7),
        head(42, 85, 7.5),
      ];
    }

    case 'front_plank': {
      const pulse = lerp(0, 1.8, t);
      return [
        floor(),
        limb(42, 92, 84, 76 - pulse, 8.5),
        limb(84, 76 - pulse, 122, 66 - pulse, 10.5),
        glow(98, 74, lerp(4.5, 7, t), t),
        limb(122, 66 - pulse, 120, 92, 6.5),
        limb(120, 92, 134, 93, 5.5),
        head(136, 62 - pulse, 7.5),
      ];
    }

    case 'pallof_press': {
      const hy = lerp(52, 22, t);
      return [
        equipRect(16, 36, 8, 42, 3),
        line(24, 56, 88, hy, 'cable', 1.8),
        line(110, 52, 110, 22, 'arrow', 1.6),
        arrowPath('M 107 27 L 110 21 L 113 27'),
        limb(70, 68, 106, 68, 14),
        limb(72, 66, 88, hy, 6.8),
        limb(104, 66, 88, hy, 6.8),
        glow(74, 64, lerp(4.2, 7, t), t),
        handle(88, hy),
        head(88, 68, 10),
      ];
    }

    case 'cable_woodchop': {
      const hx = lerp(124, 54, t);
      const hy = lerp(24, 76, t);
      return [
        floor(),
        equipRect(148, 12, 8, 86, 3),
        line(148, 18, hx, hy, 'cable', 1.8),
        line(118, 22, 54, 72, 'arrow', 1.6),
        limb(80, 64, 74, 95, 7.5),
        limb(96, 64, 102, 95, 7.5),
        limb(88, 36, 88, 64, 13),
        glow(82, 52, lerp(4.5, 7, t), t),
        limb(74, 40, hx, hy, 6.2),
        limb(102, 40, hx, hy, 6.2),
        handle(hx, hy),
        head(88, 24, 7.5),
      ];
    }

    case 'dead_bug': {
      const armX = lerp(70, 42, t);
      const armY = lerp(54, 78, t);
      const footX = lerp(118, 148, t);
      const footY = lerp(64, 82, t);
      return [
        floor(),
        limb(58, 88, 96, 88, 10.5),
        glow(80, 84, lerp(4.5, 7, t), t),
        limb(66, 84, armX, armY, 6.2),
        limb(96, 84, 98, 64, 7.5, 'muted'),
        limb(96, 86, footX, footY, 8),
        head(44, 85, 7.5),
      ];
    }

    case 'back_extension': {
      const ang = lerp(0.55, -0.58, t);
      const hipX = 88, hipY = 66;
      const shX = hipX + Math.cos(ang) * 34;
      const shY = hipY + Math.sin(ang) * 34;
      return [
        floor(),
        line(46, 94, 88, 68, 'equip', 3),
        line(84, 70, 84, 98, 'equip', 2.4),
        arrowPath('M 122 80 A 34 34 0 0 0 120 42'),
        limb(54, 88, hipX, hipY, 8.5),
        limb(hipX, hipY, shX, shY, 10.5),
        glow((hipX + shX) / 2 - 2, (hipY + shY) / 2 - 4, lerp(4.5, 7, t), t),
        head(shX + Math.cos(ang) * 10, shY + Math.sin(ang) * 10, 7.5),
      ];
    }

    case 'seated_back_extension': {
      const shX = lerp(92, 64, t);
      const shY = lerp(42, 46, t);
      return [
        floor(),
        equipRect(58, 72, 36, 7, 3),
        arrowPath('M 94 28 A 30 30 0 0 0 64 32'),
        limb(76, 70, 104, 72, 8.5),
        limb(104, 72, 108, 95, 7.5),
        limb(76, 70, shX, shY, 10.5),
        glow((76 + shX) / 2 - 4, (70 + shY) / 2 + 2, lerp(4.5, 7, t), t),
        head(shX - 2, shY - 12, 7.5),
      ];
    }

    case 'prone_trunk_extension': {
      const shY = lerp(88, 74, t);
      return [
        floor(),
        line(126, 88, 126, 66, 'arrow', 1.6),
        arrowPath('M 123 71 L 126 65 L 129 71'),
        limb(34, 92, 78, 90, 8.2),
        limb(78, 90, 114, shY, 10.5),
        glow(92, lerp(86, 80, t), lerp(4.5, 7, t), t),
        head(128, shY - 5, 7.5),
      ];
    }
  }
}
