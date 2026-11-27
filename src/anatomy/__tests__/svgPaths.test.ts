import { describe, expect, it } from 'vitest';
import { ANATOMY_REGIONS, ANATOMY_VIEWBOX, BODY_SILHOUETTE_PATH, mirrorSvgPathX } from '../svgPaths';
import { getDetailedMuscles, getSimpleGroups } from '../../core/engine';
import type { BodyView, DetailedMuscleId, SimpleGroupId } from '../../core/types';

const ALL_SIMPLE_GROUPS: SimpleGroupId[] = [
  'chest',
  'shoulders',
  'traps',
  'back',
  'lower_back',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'glutes',
  'quads',
  'adductors',
  'hamstrings',
  'calves',
];

const ALL_DETAILED_MUSCLES: DetailedMuscleId[] = [
  'pec_upper',
  'pec_middle',
  'pec_lower',
  'delt_anterior',
  'delt_lateral',
  'delt_posterior',
  'rotator_cuff_ext',
  'trap_upper',
  'trap_middle',
  'trap_lower',
  'latissimus_dorsi',
  'teres_major',
  'rhomboids',
  'erector_spinae',
  'biceps_brachii',
  'brachialis',
  'triceps_long',
  'triceps_lateral',
  'triceps_medial',
  'brachioradialis',
  'forearm_flexors',
  'forearm_extensors',
  'rectus_abdominis',
  'obliques',
  'serratus_anterior',
  'gluteus_maximus',
  'gluteus_medius',
  'rectus_femoris',
  'vastus_lateralis',
  'vastus_medialis',
  'hip_flexors',
  'hip_adductors',
  'biceps_femoris',
  'semitendinosus_membranosus',
  'gastrocnemius',
  'soleus',
  'tibialis_anterior',
];

describe('SVG Anatomy Map Integrity', () => {
  const allRegions = [...ANATOMY_REGIONS.front, ...ANATOMY_REGIONS.back];

  it('covers every single one of the 37 detailed muscles and 14 simple groups on the SVG map', () => {
    const presentMuscles = new Set(allRegions.map((r) => r.muscleId));
    const presentGroups = new Set(allRegions.map((r) => r.groupId));

    for (const id of ALL_DETAILED_MUSCLES) {
      expect(presentMuscles.has(id), `Missing detailed muscle on SVG: ${id}`).toBe(true);
    }
    for (const gid of ALL_SIMPLE_GROUPS) {
      expect(presentGroups.has(gid), `Missing simple group on SVG: ${gid}`).toBe(true);
    }
  });

  it('has unique region IDs and valid symmetric pairs within the viewBox bounds', () => {
    const ids = new Set<string>();
    for (const r of allRegions) {
      expect(ids.has(r.id), `Duplicate SVG region id: ${r.id}`).toBe(false);
      ids.add(r.id);
      expect(r.d.length).toBeGreaterThan(10);
      expect(r.anchor.x).toBeGreaterThan(0);
      expect(r.anchor.x).toBeLessThan(ANATOMY_VIEWBOX.width);
      expect(r.anchor.y).toBeGreaterThan(0);
      expect(r.anchor.y).toBeLessThan(ANATOMY_VIEWBOX.height);
    }
  });

  it('mirrors SVG paths accurately around x=180', () => {
    expect(mirrorSvgPathX('M 150 100 L 170 200 Z', 180)).toBe('M 210 100 L 190 200 Z');
  });

  it('uses a single closed outer silhouette path', () => {
    expect(BODY_SILHOUETTE_PATH.startsWith('M ')).toBe(true);
    expect(BODY_SILHOUETTE_PATH.endsWith(' Z')).toBe(true);
  });

  it('keeps DetailedMuscle.views and SimpleMuscleGroup.views 100% synced with actual SVG paths', () => {
    const svgViewsByMuscle = new Map<DetailedMuscleId, Set<BodyView>>();
    const svgViewsByGroup = new Map<SimpleGroupId, Set<BodyView>>();
    for (const r of allRegions) {
      const ms = svgViewsByMuscle.get(r.muscleId) ?? new Set<BodyView>();
      ms.add(r.view);
      svgViewsByMuscle.set(r.muscleId, ms);
      const gs = svgViewsByGroup.get(r.groupId) ?? new Set<BodyView>();
      gs.add(r.view);
      svgViewsByGroup.set(r.groupId, gs);
    }

    for (const m of getDetailedMuscles()) {
      const expected = [...(svgViewsByMuscle.get(m.id) ?? [])].sort();
      const declared = [...m.views].sort();
      expect(declared, `DetailedMuscle "${m.id}" views mismatch SVG`).toEqual(expected);
    }

    for (const g of getSimpleGroups()) {
      const expected = [...(svgViewsByGroup.get(g.id) ?? [])].sort();
      const declared = [...g.views].sort();
      expect(declared, `SimpleMuscleGroup "${g.id}" views mismatch SVG`).toEqual(expected);
    }
  });
});
