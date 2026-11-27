/**
 * Canonical 2D Vector Human Anatomy Geometry (viewBox: 0 0 360 720, symmetric centerline x = 180).
 * Platform-agnostic pure data: directly rendered by Web <svg>, and directly consumable by
 * future WeChat Mini Program Canvas 2D (Path2D + isPointInPath).
 */

import type { BodyView, DetailedMuscleId, SimpleGroupId } from '../core/types';

export interface AnatomyPathRegion {
  id: string;
  muscleId: DetailedMuscleId;
  groupId: SimpleGroupId;
  view: BodyView;
  side: 'left' | 'right' | 'center';
  /** SVG path string in canonical 0..360 x 0..720 space */
  d: string;
  /** Label / tooltip anchor point */
  anchor: { x: number; y: number };
}

export const ANATOMY_VIEWBOX = {
  width: 360,
  height: 720,
  centerX: 180,
} as const;

/**
 * Mirrors an SVG path horizontally around `axisX` (supports absolute M, L, C, Q, Z commands).
 * Ensures left/right anatomical symmetry with zero manual drift.
 */
export function mirrorSvgPathX(pathD: string, axisX = 180): string {
  const tokens = pathD.match(/[A-Za-z]|-?\d*\.?\d+/g);
  if (!tokens) return pathD;

  const out: string[] = [];
  let i = 0;
  let cmd = '';

  const mirrorX = (val: string) => {
    const n = Number(val);
    const m = Math.round((2 * axisX - n) * 10) / 10;
    return String(m);
  };

  while (i < tokens.length) {
    const tok = tokens[i];
    if (/^[A-Za-z]$/.test(tok)) {
      cmd = tok;
      out.push(cmd);
      i += 1;
      continue;
    }

    if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
      out.push(mirrorX(tokens[i]), tokens[i + 1]);
      i += 2;
    } else if (cmd === 'C') {
      out.push(
        mirrorX(tokens[i]),
        tokens[i + 1],
        mirrorX(tokens[i + 2]),
        tokens[i + 3],
        mirrorX(tokens[i + 4]),
        tokens[i + 5],
      );
      i += 6;
    } else if (cmd === 'Q' || cmd === 'S') {
      out.push(mirrorX(tokens[i]), tokens[i + 1], mirrorX(tokens[i + 2]), tokens[i + 3]);
      i += 4;
    } else if (cmd === 'H') {
      out.push(mirrorX(tokens[i]));
      i += 1;
    } else if (cmd === 'V') {
      out.push(tokens[i]);
      i += 1;
    } else {
      out.push(tokens[i]);
      i += 1;
    }
  }

  return out.join(' ');
}

interface HalfRegionSpec {
  muscleId: DetailedMuscleId;
  groupId: SimpleGroupId;
  view: BodyView;
  /** Path drawn on the viewer's LEFT half (x <= 180) */
  leftD: string;
  anchorLeft: { x: number; y: number };
}

function expandSymmetric(specs: HalfRegionSpec[]): AnatomyPathRegion[] {
  const result: AnatomyPathRegion[] = [];
  for (const s of specs) {
    result.push({
      id: `${s.view}_${s.muscleId}_L`,
      muscleId: s.muscleId,
      groupId: s.groupId,
      view: s.view,
      side: 'left',
      d: s.leftD,
      anchor: s.anchorLeft,
    });
    result.push({
      id: `${s.view}_${s.muscleId}_R`,
      muscleId: s.muscleId,
      groupId: s.groupId,
      view: s.view,
      side: 'right',
      d: mirrorSvgPathX(s.leftD, ANATOMY_VIEWBOX.centerX),
      anchor: {
        x: 2 * ANATOMY_VIEWBOX.centerX - s.anchorLeft.x,
        y: s.anchorLeft.y,
      },
    });
  }
  return result;
}

/** Clean unified closed athletic silhouette (head, neck, torso, limbs, hands, feet) */
const SILHOUETTE_LEFT_SEGMENTS =
  'M 180 24 ' +
  'C 162 24 152 38 152 58 ' +
  'C 152 74 158 88 164 95 ' +
  'L 164 112 ' +
  'C 150 118 134 126 116 130 ' +
  'C 96 134 88 150 86 174 ' +
  'C 84 202 82 232 76 262 ' +
  'C 68 292 60 328 54 366 ' +
  'C 47 377 41 393 42 409 ' +
  'C 43 417 48 421 53 419 ' +
  'C 57 417 61 407 65 403 ' +
  'C 67 411 70 416 74 414 ' +
  'C 78 411 78 395 77 382 ' +
  'C 82 368 87 350 93 328 ' +
  'C 101 301 108 281 114 264 ' +
  'C 120 246 124 222 126 206 ' +
  'C 128 232 130 264 126 296 ' +
  'C 122 318 114 342 112 374 ' +
  'C 110 414 114 460 124 506 ' +
  'C 126 520 128 534 126 548 ' +
  'C 120 574 122 604 132 638 ' +
  'C 136 654 138 666 136 676 ' +
  'C 128 686 122 694 126 700 ' +
  'C 134 704 156 704 164 696 ' +
  'C 168 688 164 674 162 662 ' +
  'C 164 636 168 606 168 574 ' +
  'C 168 548 166 528 168 508 ' +
  'C 172 472 175 430 177 386 ' +
  'L 180 382';

/** Reverses the left-half contour and mirrors X to build one seamless closed SVG silhouette */
function buildClosedSymmetricSilhouette(leftD: string, axisX = 180): string {
  const tokens = leftD.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  interface Seg {
    type: 'L' | 'C';
    from: [number, number];
    pts: number[];
  }
  const segs: Seg[] = [];
  let i = 0;
  let cur: [number, number] = [0, 0];
  let cmd = '';

  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[A-Za-z]$/.test(t)) {
      cmd = t;
      i += 1;
      continue;
    }
    if (cmd === 'M') {
      cur = [Number(tokens[i]), Number(tokens[i + 1])];
      i += 2;
    } else if (cmd === 'L') {
      const to: [number, number] = [Number(tokens[i]), Number(tokens[i + 1])];
      segs.push({ type: 'L', from: cur, pts: [to[0], to[1]] });
      cur = to;
      i += 2;
    } else if (cmd === 'C') {
      const p = [
        Number(tokens[i]),
        Number(tokens[i + 1]),
        Number(tokens[i + 2]),
        Number(tokens[i + 3]),
        Number(tokens[i + 4]),
        Number(tokens[i + 5]),
      ];
      segs.push({ type: 'C', from: cur, pts: p });
      cur = [p[4], p[5]];
      i += 6;
    } else {
      i += 1;
    }
  }

  const mx = (x: number) => Math.round((2 * axisX - x) * 10) / 10;
  const rightParts: string[] = [];
  for (let k = segs.length - 1; k >= 0; k -= 1) {
    const s = segs[k];
    if (s.type === 'L') {
      rightParts.push(`L ${mx(s.from[0])} ${s.from[1]}`);
    } else {
      rightParts.push(
        `C ${mx(s.pts[2])} ${s.pts[3]} ${mx(s.pts[0])} ${s.pts[1]} ${mx(s.from[0])} ${s.from[1]}`,
      );
    }
  }
  return `${leftD} ${rightParts.join(' ')} Z`;
}

export const BODY_SILHOUETTE_PATH = buildClosedSymmetricSilhouette(
  SILHOUETTE_LEFT_SEGMENTS,
  ANATOMY_VIEWBOX.centerX,
);

export const BODY_SILHOUETTE_PATHS = {
  left: SILHOUETTE_LEFT_SEGMENTS,
  right: mirrorSvgPathX(SILHOUETTE_LEFT_SEGMENTS, ANATOMY_VIEWBOX.centerX),
};

/** Subtle decorative anatomical reference lines (non-clickable visual fidelity) */
export const ANATOMY_LANDMARKS: Record<BodyView, string[]> = {
  front: [
    // Clavicles
    'M 176 132 Q 150 129 124 136',
    'M 184 132 Q 210 129 236 136',
    // Linea alba & ab tendinous intersections
    'M 180 140 L 180 350',
    'M 157 244 L 177 246 M 183 246 L 203 244',
    'M 158 274 L 177 276 M 183 276 L 202 274',
    'M 160 304 L 177 306 M 183 306 L 200 304',
    // Kneecaps (patella)
    'M 138 522 Q 147 514 156 522 Q 147 536 138 522 Z',
    'M 222 522 Q 213 514 204 522 Q 213 536 222 522 Z',
  ],
  back: [
    // Spine groove
    'M 180 112 L 180 356',
    // Scapula subtle spine hints
    'M 126 164 Q 144 156 156 162',
    'M 234 164 Q 216 156 204 162',
    // Popliteal knee creases
    'M 129 522 Q 146 526 163 522',
    'M 231 522 Q 214 526 197 522',
    // Achilles tendons
    'M 146 616 L 146 668',
    'M 214 616 L 214 668',
  ],
};

/** Front view: 19 symmetric detailed muscle zones */
const FRONT_HALF_SPECS: HalfRegionSpec[] = [
  // Traps upper visible from front
  {
    muscleId: 'trap_upper',
    groupId: 'traps',
    view: 'front',
    leftD: 'M 164 111 C 154 119 140 126 125 131 L 136 136 C 150 133 162 130 172 128 L 166 111 Z',
    anchorLeft: { x: 149, y: 124 },
  },
  // Deltoid anterior
  {
    muscleId: 'delt_anterior',
    groupId: 'shoulders',
    view: 'front',
    leftD: 'M 128 134 C 117 136 108 145 104 160 C 102 172 105 184 111 190 C 118 182 124 168 128 154 C 130 146 132 138 128 134 Z',
    anchorLeft: { x: 115, y: 161 },
  },
  // Deltoid lateral (outer cap)
  {
    muscleId: 'delt_lateral',
    groupId: 'shoulders',
    view: 'front',
    leftD: 'M 118 132 C 101 135 90 148 88 168 C 87 180 91 191 98 197 C 104 191 106 177 107 162 C 109 147 115 138 122 134 Z',
    anchorLeft: { x: 97, y: 164 },
  },
  // Pectoralis major - Upper (clavicular)
  {
    muscleId: 'pec_upper',
    groupId: 'chest',
    view: 'front',
    leftD: 'M 177 137 C 160 136 144 137 131 141 C 127 148 125 157 123 166 C 139 162 158 159 177 159 Z',
    anchorLeft: { x: 152, y: 149 },
  },
  // Pectoralis major - Middle (sternal)
  {
    muscleId: 'pec_middle',
    groupId: 'chest',
    view: 'front',
    leftD: 'M 177 161 C 158 161 138 164 123 169 C 122 178 123 187 126 193 C 141 194 159 194 177 192 Z',
    anchorLeft: { x: 151, y: 178 },
  },
  // Pectoralis major - Lower (abdominal/costal)
  {
    muscleId: 'pec_lower',
    groupId: 'chest',
    view: 'front',
    leftD: 'M 177 194 C 160 196 142 196 127 195 C 131 206 143 213 159 213 C 168 213 175 210 177 206 Z',
    anchorLeft: { x: 154, y: 204 },
  },
  // Biceps brachii
  {
    muscleId: 'biceps_brachii',
    groupId: 'biceps',
    view: 'front',
    leftD: 'M 111 193 C 102 199 96 214 94 234 C 93 248 97 260 105 264 C 114 257 120 242 122 222 C 123 207 119 196 111 193 Z',
    anchorLeft: { x: 108, y: 229 },
  },
  // Brachialis (lateral wedge between biceps & outer arm)
  {
    muscleId: 'brachialis',
    groupId: 'biceps',
    view: 'front',
    leftD: 'M 96 199 C 88 206 83 224 81 244 C 81 254 85 262 92 264 C 94 253 93 240 94 226 C 95 214 97 205 96 199 Z',
    anchorLeft: { x: 88, y: 234 },
  },
  // Brachioradialis (lateral forearm ridge)
  {
    muscleId: 'brachioradialis',
    groupId: 'forearms',
    view: 'front',
    leftD: 'M 81 258 C 75 276 68 302 62 332 C 60 344 62 354 66 356 C 72 344 79 320 85 294 C 88 280 90 268 88 260 Z',
    anchorLeft: { x: 75, y: 304 },
  },
  // Forearm flexors (medial/anterior forearm)
  {
    muscleId: 'forearm_flexors',
    groupId: 'forearms',
    view: 'front',
    leftD: 'M 106 266 C 98 266 91 271 88 284 C 82 308 75 336 69 364 C 72 368 78 369 82 365 C 90 342 99 314 107 288 C 110 278 110 269 106 266 Z',
    anchorLeft: { x: 91, y: 318 },
  },
  // Serratus anterior (lateral ribcage scalloped edge)
  {
    muscleId: 'serratus_anterior',
    groupId: 'core',
    view: 'front',
    leftD: 'M 126 205 C 127 224 128 242 132 256 C 141 250 148 241 153 230 C 154 222 153 216 149 213 C 140 212 132 209 126 205 Z',
    anchorLeft: { x: 139, y: 231 },
  },
  // Rectus abdominis
  {
    muscleId: 'rectus_abdominis',
    groupId: 'core',
    view: 'front',
    leftD: 'M 178 216 L 156 218 C 155 246 155 278 158 308 C 161 330 168 348 178 354 Z',
    anchorLeft: { x: 167, y: 282 },
  },
  // Obliques (external obliques)
  {
    muscleId: 'obliques',
    groupId: 'core',
    view: 'front',
    leftD: 'M 153 236 C 147 246 139 254 131 259 C 129 282 126 304 122 322 C 134 331 147 338 159 340 C 155 314 153 276 153 236 Z',
    anchorLeft: { x: 141, y: 294 },
  },
  // Hip flexors (iliopsoas / TFL)
  {
    muscleId: 'hip_flexors',
    groupId: 'quads',
    view: 'front',
    leftD: 'M 121 325 C 116 341 114 358 114 374 C 127 368 142 361 157 355 C 159 351 159 346 158 342 C 145 340 133 333 121 325 Z',
    anchorLeft: { x: 134, y: 350 },
  },
  // Vastus lateralis (outer quad)
  {
    muscleId: 'vastus_lateralis',
    groupId: 'quads',
    view: 'front',
    leftD: 'M 114 378 C 111 416 115 460 126 504 C 130 508 135 508 138 504 C 134 468 132 426 134 373 C 126 374 119 376 114 378 Z',
    anchorLeft: { x: 124, y: 440 },
  },
  // Rectus femoris (central quad)
  {
    muscleId: 'rectus_femoris',
    groupId: 'quads',
    view: 'front',
    leftD: 'M 136 372 C 134 422 136 466 141 506 C 146 509 152 508 155 503 C 156 462 157 416 156 364 C 149 367 142 370 136 372 Z',
    anchorLeft: { x: 146, y: 436 },
  },
  // Vastus medialis (teardrop inner lower quad)
  {
    muscleId: 'vastus_medialis',
    groupId: 'quads',
    view: 'front',
    leftD: 'M 159 426 C 158 458 157 486 157 506 C 162 511 168 509 170 501 C 173 479 174 454 173 434 C 168 430 163 428 159 426 Z',
    anchorLeft: { x: 165, y: 472 },
  },
  // Hip adductors (inner upper thigh)
  {
    muscleId: 'hip_adductors',
    groupId: 'adductors',
    view: 'front',
    leftD: 'M 159 361 C 159 384 159 406 160 422 C 165 426 170 429 174 431 C 176 410 177 390 177 374 C 171 367 165 363 159 361 Z',
    anchorLeft: { x: 168, y: 396 },
  },
  // Tibialis anterior (front lateral shin)
  {
    muscleId: 'tibialis_anterior',
    groupId: 'calves',
    view: 'front',
    leftD: 'M 129 550 C 125 578 128 614 138 652 C 142 654 147 652 149 646 C 147 612 146 578 145 548 C 139 547 133 548 129 550 Z',
    anchorLeft: { x: 138, y: 598 },
  },
];

/** Back view: 22 symmetric detailed muscle zones */
const BACK_HALF_SPECS: HalfRegionSpec[] = [
  // Trapezius upper
  {
    muscleId: 'trap_upper',
    groupId: 'traps',
    view: 'back',
    leftD: 'M 178 106 L 164 111 C 151 120 135 127 120 132 C 128 140 144 146 178 147 Z',
    anchorLeft: { x: 155, y: 131 },
  },
  // Trapezius middle
  {
    muscleId: 'trap_middle',
    groupId: 'traps',
    view: 'back',
    leftD: 'M 178 149 L 152 149 C 152 162 153 173 155 184 L 178 184 Z',
    anchorLeft: { x: 165, y: 166 },
  },
  // Trapezius lower
  {
    muscleId: 'trap_lower',
    groupId: 'traps',
    view: 'back',
    leftD: 'M 178 186 L 156 186 C 159 208 167 228 178 246 Z',
    anchorLeft: { x: 169, y: 208 },
  },
  // Rhomboids (medial scapular zone alongside mid/lower traps)
  {
    muscleId: 'rhomboids',
    groupId: 'back',
    view: 'back',
    leftD: 'M 150 151 L 136 154 C 135 170 137 186 142 202 L 154 202 C 152 186 150 168 150 151 Z',
    anchorLeft: { x: 144, y: 177 },
  },
  // Deltoid lateral (outer shoulder edge)
  {
    muscleId: 'delt_lateral',
    groupId: 'shoulders',
    view: 'back',
    leftD: 'M 116 133 C 100 136 90 149 88 168 C 88 179 91 188 96 194 C 102 187 104 174 105 160 C 107 146 112 138 119 135 Z',
    anchorLeft: { x: 96, y: 163 },
  },
  // Deltoid posterior (rear delt cap)
  {
    muscleId: 'delt_posterior',
    groupId: 'shoulders',
    view: 'back',
    leftD: 'M 134 142 C 122 136 112 139 107 154 C 105 167 105 180 109 189 C 118 184 127 175 134 162 Z',
    anchorLeft: { x: 118, y: 163 },
  },
  // Infraspinatus & Teres minor (external rotator cuff over scapula)
  {
    muscleId: 'rotator_cuff_ext',
    groupId: 'shoulders',
    view: 'back',
    leftD: 'M 134 165 C 127 177 119 186 113 192 C 116 200 123 204 138 205 C 135 191 134 178 134 165 Z',
    anchorLeft: { x: 127, y: 190 },
  },
  // Teres major (bridge above latissimus)
  {
    muscleId: 'teres_major',
    groupId: 'back',
    view: 'back',
    leftD: 'M 116 198 C 117 206 121 215 129 221 C 138 221 147 219 152 214 C 148 207 136 205 116 198 Z',
    anchorLeft: { x: 134, y: 211 },
  },
  // Latissimus dorsi (V-taper back wing)
  {
    muscleId: 'latissimus_dorsi',
    groupId: 'back',
    view: 'back',
    leftD: 'M 126 221 C 127 248 129 276 125 305 C 135 312 148 314 157 308 C 156 286 158 262 162 243 C 163 232 160 223 154 217 C 145 222 135 223 126 221 Z',
    anchorLeft: { x: 143, y: 266 },
  },
  // Erector spinae (sculpted lower back columns tapering smoothly into sacrum)
  {
    muscleId: 'erector_spinae',
    groupId: 'lower_back',
    view: 'back',
    leftD: 'M 178 249 C 171 250 165 253 163 260 C 160 282 159 306 162 328 C 166 334 172 336 178 335 Z',
    anchorLeft: { x: 169, y: 292 },
  },
  // Triceps lateral head (outer horseshoe)
  {
    muscleId: 'triceps_lateral',
    groupId: 'triceps',
    view: 'back',
    leftD: 'M 103 192 C 94 196 87 210 85 228 C 84 238 87 246 93 248 C 99 240 103 224 104 206 C 105 200 104 195 103 192 Z',
    anchorLeft: { x: 94, y: 221 },
  },
  // Triceps long head (inner upper triceps)
  {
    muscleId: 'triceps_long',
    groupId: 'triceps',
    view: 'back',
    leftD: 'M 114 191 C 107 192 105 204 104 222 C 103 234 103 244 107 249 C 115 245 120 232 122 214 C 123 201 120 192 114 191 Z',
    anchorLeft: { x: 113, y: 220 },
  },
  // Triceps medial head (lower triceps approaching elbow)
  {
    muscleId: 'triceps_medial',
    groupId: 'triceps',
    view: 'back',
    leftD: 'M 108 251 C 101 248 93 249 87 252 C 86 261 91 268 100 269 C 107 268 111 261 112 254 Z',
    anchorLeft: { x: 99, y: 259 },
  },
  // Brachioradialis (outer forearm ridge visible from back)
  {
    muscleId: 'brachioradialis',
    groupId: 'forearms',
    view: 'back',
    leftD: 'M 83 262 C 76 280 69 304 64 330 C 62 340 64 348 68 350 C 74 338 80 316 86 292 C 88 280 89 270 87 262 Z',
    anchorLeft: { x: 76, y: 304 },
  },
  // Forearm extensors (posterior forearm)
  {
    muscleId: 'forearm_extensors',
    groupId: 'forearms',
    view: 'back',
    leftD: 'M 106 271 C 99 271 92 276 89 288 C 82 312 75 339 69 365 C 73 369 78 369 82 365 C 91 342 100 316 107 290 C 110 280 110 273 106 271 Z',
    anchorLeft: { x: 91, y: 320 },
  },
  // Gluteus medius (upper-outer hip shelf)
  {
    muscleId: 'gluteus_medius',
    groupId: 'glutes',
    view: 'back',
    leftD: 'M 124 313 C 119 326 116 340 115 354 C 127 346 141 341 157 338 L 157 318 C 145 316 134 315 124 313 Z',
    anchorLeft: { x: 135, y: 332 },
  },
  // Gluteus maximus
  {
    muscleId: 'gluteus_maximus',
    groupId: 'glutes',
    view: 'back',
    leftD: 'M 178 338 C 154 340 132 346 116 358 C 114 382 117 404 128 416 C 146 420 166 414 178 400 Z',
    anchorLeft: { x: 147, y: 382 },
  },
  // Biceps femoris (outer hamstring curving cleanly under glute fold)
  {
    muscleId: 'biceps_femoris',
    groupId: 'hamstrings',
    view: 'back',
    leftD: 'M 120 412 C 117 446 121 482 128 514 C 134 517 140 516 144 512 C 143 482 144 452 145 422 C 135 422 126 418 120 412 Z',
    anchorLeft: { x: 132, y: 468 },
  },
  // Semitendinosus & semimembranosus (inner hamstring following glute fold)
  {
    muscleId: 'semitendinosus_membranosus',
    groupId: 'hamstrings',
    view: 'back',
    leftD: 'M 147 422 C 146 452 146 482 147 513 C 153 516 159 514 163 511 C 165 486 165 454 164 416 C 158 420 152 422 147 422 Z',
    anchorLeft: { x: 155, y: 468 },
  },
  // Hip adductors (innermost upper posterior thigh edge)
  {
    muscleId: 'hip_adductors',
    groupId: 'adductors',
    view: 'back',
    leftD: 'M 166 414 C 167 434 167 454 166 472 C 170 470 173 462 174 448 C 176 430 177 415 177 405 C 173 409 170 412 166 414 Z',
    anchorLeft: { x: 171, y: 438 },
  },
  // Gastrocnemius (upper twin-belly calf)
  {
    muscleId: 'gastrocnemius',
    groupId: 'calves',
    view: 'back',
    leftD: 'M 129 544 C 123 564 124 586 130 606 C 137 612 153 612 161 605 C 166 586 167 564 163 544 C 155 538 137 538 129 544 Z',
    anchorLeft: { x: 146, y: 576 },
  },
  // Soleus (lower deeper calf tapering into Achilles)
  {
    muscleId: 'soleus',
    groupId: 'calves',
    view: 'back',
    leftD: 'M 131 610 C 133 628 137 644 140 656 C 144 659 152 659 156 655 C 158 642 160 626 161 610 C 152 615 139 615 131 610 Z',
    anchorLeft: { x: 146, y: 634 },
  },
];

export const ANATOMY_REGIONS: Record<BodyView, AnatomyPathRegion[]> = {
  front: expandSymmetric(FRONT_HALF_SPECS),
  back: expandSymmetric(BACK_HALF_SPECS),
};
