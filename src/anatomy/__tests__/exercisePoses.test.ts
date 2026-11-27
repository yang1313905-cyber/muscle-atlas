import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../core/exerciseData';
import {
  buildPoseFrame,
  EXERCISE_POSE_MAP,
  getExercisePoseConfig,
  POSE_VIEWBOX,
} from '../exercisePoses';

describe('Exercise Capsule-Figure Pose Engine', () => {
  it('explicitly maps every single one of the 104 exercises with no unmapped fallbacks', () => {
    const exerciseIds = new Set(EXERCISES.map((e) => e.id));
    for (const ex of EXERCISES) {
      expect(EXERCISE_POSE_MAP[ex.id], `Missing explicit pose mapping for "${ex.id}"`).toBeDefined();
    }
    for (const mappedId of Object.keys(EXERCISE_POSE_MAP)) {
      expect(exerciseIds.has(mappedId), `Orphan pose mapping "${mappedId}"`).toBe(true);
    }
  });

  it('produces valid, finite SVG primitives within viewBox margins for all exercises at t=0, 0.5, 1', () => {
    for (const ex of EXERCISES) {
      const cfg = getExercisePoseConfig(ex.id);
      for (const t of [0, 0.5, 1]) {
        const prims = buildPoseFrame(cfg, t);
        expect(prims.length, `Empty pose primitives for ${ex.id}`).toBeGreaterThan(3);
        for (const p of prims) {
          if (p.kind === 'limb' || p.kind === 'line') {
            for (const v of [p.x1, p.y1, p.x2, p.y2]) {
              expect(Number.isFinite(v), `Non-finite coord in ${ex.id}`).toBe(true);
              expect(v).toBeGreaterThanOrEqual(-12);
              expect(v).toBeLessThanOrEqual(POSE_VIEWBOX.width + 12);
            }
          } else if (p.kind === 'head' || p.kind === 'glow' || p.kind === 'circle') {
            expect(Number.isFinite(p.cx) && Number.isFinite(p.cy) && Number.isFinite(p.r)).toBe(true);
            expect(p.r).toBeGreaterThan(0);
            if (p.kind === 'head') {
              expect(p.cy - p.r, `Head clips top edge in ${ex.id} at t=${t}`).toBeGreaterThanOrEqual(2);
              expect(p.cy + p.r, `Head clips bottom edge in ${ex.id} at t=${t}`).toBeLessThanOrEqual(
                POSE_VIEWBOX.height - 2,
              );
            }
          } else if (p.kind === 'rect') {
            expect(Number.isFinite(p.x) && Number.isFinite(p.y) && p.w > 0 && p.h > 0).toBe(true);
          } else if (p.kind === 'path') {
            expect(p.d.length).toBeGreaterThan(4);
            expect(p.d.includes('NaN')).toBe(false);
          }
        }
      }
    }
  });
});
