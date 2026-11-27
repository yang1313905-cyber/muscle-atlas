import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import {
  buildPoseFrame,
  getExercisePoseConfig,
  POSE_VIEWBOX,
  type PosePrimitive,
} from '../anatomy/exercisePoses';

interface ExercisePosePreviewProps {
  exerciseId: string;
  exerciseNameZh: string;
}

/**
 * Capsule-figure animated exercise posture thumbnail.
 * Idle by default (zero CPU usage); animates smoothly on mouse hover or single tap/click toggle.
 */
export function ExercisePosePreview({ exerciseId, exerciseNameZh }: ExercisePosePreviewProps) {
  const config = useMemo(() => getExercisePoseConfig(exerciseId), [exerciseId]);
  const idleT = config.idleT ?? 0.65;

  const [isHovered, setIsHovered] = useState(false);
  const [isPinnedPlaying, setIsPinnedPlaying] = useState(false);
  const [t, setT] = useState<number>(idleT);

  const isPlaying = isHovered || isPinnedPlaying;
  const phaseRef = useRef<number>(Math.acos(1 - 2 * idleT));

  // Reset cleanly when switching exercises
  useEffect(() => {
    setIsHovered(false);
    setIsPinnedPlaying(false);
    setT(idleT);
    phaseRef.current = Math.acos(1 - 2 * idleT);
  }, [exerciseId, idleT]);

  // Run requestAnimationFrame ONLY when actively playing (0% CPU when idle)
  useEffect(() => {
    if (!isPlaying) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      // Gentle two-pose toggle every 900ms for reduced-motion preference
      const timer = window.setInterval(() => {
        setT((prev) => (prev > 0.5 ? 0.12 : 0.88));
      }, 900);
      return () => window.clearInterval(timer);
    }

    let rafId = 0;
    let lastTs = performance.now();

    const step = (ts: number) => {
      const dt = Math.min(0.08, (ts - lastTs) / 1000);
      lastTs = ts;
      phaseRef.current += dt * 2.25;
      const nextT = 0.5 - 0.5 * Math.cos(phaseRef.current);
      setT(nextT);
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const primitives = useMemo(() => buildPoseFrame(config, t), [config, t]);
  const phaseText = t >= 0.5 ? config.phases[1] : config.phases[0];

  return (
    <button
      type="button"
      className={`pose-preview-box ${isPlaying ? 'is-playing' : ''}`}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setIsHovered(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setIsHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isHovered && !isPinnedPlaying) {
          // Clicking while hovered locks playback so mouse-leave keeps it playing; clicking again pauses
          setIsPinnedPlaying(true);
        } else {
          setIsPinnedPlaying((prev) => !prev);
          setIsHovered(false);
        }
      }}
      aria-pressed={isPinnedPlaying}
      aria-label={`${exerciseNameZh}动作姿势示意，${isPlaying ? '正在播放，点击暂停' : '点击或悬停播放动态演示'}`}
      title={isPlaying ? '点击暂停动作演示' : '悬停或点击播放动态姿势演示'}
    >
      <svg
        className="pose-preview-svg"
        viewBox={`0 0 ${POSE_VIEWBOX.width} ${POSE_VIEWBOX.height}`}
        aria-hidden="true"
      >
        {primitives.map((prim, idx) => renderPrimitive(prim, idx))}
      </svg>

      <span className="pose-view-tag">{config.viewTag}</span>
      <span className={`pose-status-pill ${isPlaying ? 'playing' : ''}`}>
        {isPlaying ? (
          <>
            <Pause size={10} />
            <span>{phaseText}</span>
          </>
        ) : (
          <>
            <Play size={10} />
            <span>演示</span>
          </>
        )}
      </span>
    </button>
  );
}

function renderPrimitive(p: PosePrimitive, key: number) {
  switch (p.kind) {
    case 'limb': {
      const stroke =
        p.tone === 'muted'
          ? 'var(--text-muted)'
          : p.tone === 'accent'
            ? 'var(--accent-primary)'
            : 'var(--text-primary)';
      return (
        <line
          key={key}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke={stroke}
          strokeWidth={p.w}
          strokeLinecap="round"
          opacity={p.tone === 'muted' ? 0.55 : 1}
        />
      );
    }
    case 'head':
      return (
        <circle
          key={key}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="var(--bg-surface-elevated)"
          stroke="var(--text-primary)"
          strokeWidth={2.5}
        />
      );
    case 'glow':
      return (
        <circle
          key={key}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="var(--accent-primary)"
          opacity={p.opacity}
        />
      );
    case 'rect': {
      const transform = p.rotate
        ? `rotate(${p.rotate.deg} ${p.rotate.cx} ${p.rotate.cy})`
        : undefined;
      if (p.tone === 'accent') {
        return (
          <rect
            key={key}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            rx={p.rx ?? 2.5}
            fill="var(--accent-primary)"
            transform={transform}
          />
        );
      }
      return (
        <rect
          key={key}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          rx={p.rx ?? 3}
          fill="var(--text-muted)"
          fillOpacity={0.22}
          stroke="var(--text-muted)"
          strokeOpacity={0.5}
          strokeWidth={1.3}
          transform={transform}
        />
      );
    }
    case 'line': {
      if (p.tone === 'arrow') {
        return (
          <line
            key={key}
            x1={p.x1}
            y1={p.y1}
            x2={p.x2}
            y2={p.y2}
            stroke="var(--accent-primary)"
            strokeWidth={p.w ?? 1.5}
            strokeDasharray="3 3"
            opacity={0.72}
          />
        );
      }
      if (p.tone === 'cable') {
        return (
          <line
            key={key}
            x1={p.x1}
            y1={p.y1}
            x2={p.x2}
            y2={p.y2}
            stroke="var(--accent-secondary)"
            strokeWidth={p.w ?? 1.8}
            strokeDasharray="4 2"
            opacity={0.85}
          />
        );
      }
      return (
        <line
          key={key}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke="var(--text-muted)"
          strokeWidth={p.w ?? 1.6}
          strokeLinecap="round"
          opacity={0.5}
        />
      );
    }
    case 'circle': {
      if (p.tone === 'plate') {
        return (
          <circle
            key={key}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="var(--accent-primary-soft)"
            stroke="var(--accent-primary)"
            strokeWidth={2.1}
          />
        );
      }
      if (p.tone === 'pivot') {
        return (
          <circle
            key={key}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="var(--bg-surface-elevated)"
            stroke="var(--accent-secondary)"
            strokeWidth={2}
          />
        );
      }
      return <circle key={key} cx={p.cx} cy={p.cy} r={p.r} fill="var(--accent-primary)" />;
    }
    case 'path':
      return (
        <path
          key={key}
          d={p.d}
          fill="none"
          stroke={p.tone === 'cable' ? 'var(--accent-secondary)' : 'var(--accent-primary)'}
          strokeWidth={p.w ?? 1.5}
          strokeDasharray={p.d.includes('A ') || p.d.includes('Q ') ? '3 3' : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.75}
        />
      );
  }
}
