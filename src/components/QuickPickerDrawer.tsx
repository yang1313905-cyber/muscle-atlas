import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type {
  DetailMode,
  DetailedMuscle,
  DetailedMuscleId,
  ExerciseHeatmap,
  MuscleRole,
  SelectionTarget,
  SimpleGroupId,
  SimpleMuscleGroup,
} from '../core/types';

interface QuickPickerDrawerProps {
  mode: DetailMode;
  selection: SelectionTarget;
  heatmap: ExerciseHeatmap | null;
  simpleGroups: SimpleMuscleGroup[];
  detailedMuscles: DetailedMuscle[];
  onSelectSimple: (id: SimpleGroupId) => void;
  onSelectDetailed: (id: DetailedMuscleId) => void;
}

const ROLE_SHORT: Record<MuscleRole, string> = {
  primary: '主攻',
  secondary: '协同',
  stabilizer: '稳定',
};

export function QuickPickerDrawer({
  mode,
  selection,
  heatmap,
  simpleGroups,
  detailedMuscles,
  onSelectSimple,
  onSelectDetailed,
}: QuickPickerDrawerProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="quick-picker">
      <button
        type="button"
        className="quick-picker-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>
          部位直达列表（{mode === 'simple' ? `${simpleGroups.length} 大部位` : `${detailedMuscles.length} 细分肌群`}，防小肌肉误触）
        </span>
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {expanded && (
        <div className="quick-picker-grid" role="list">
          {mode === 'simple'
            ? simpleGroups.map((g) => {
                const active = !heatmap && selection.mode === 'simple' && selection.id === g.id;
                const hmRole = heatmap?.groupRoles[g.id];
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`quick-chip ${active ? 'active' : ''} ${hmRole ? `hm-${hmRole}` : ''}`}
                    aria-label={hmRole ? `${g.nameZh}（含${ROLE_SHORT[hmRole]}肌）` : g.nameZh}
                    onClick={() => onSelectSimple(g.id)}
                  >
                    {g.nameZh}
                    {hmRole && <span className="quick-chip-role">·{ROLE_SHORT[hmRole]}</span>}
                  </button>
                );
              })
            : detailedMuscles.map((m) => {
                const active = !heatmap && selection.mode === 'detailed' && selection.id === m.id;
                const hmRole = heatmap?.muscleRoles[m.id];
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`quick-chip ${active ? 'active' : ''} ${hmRole ? `hm-${hmRole}` : ''}`}
                    aria-label={hmRole ? `${m.nameZh}（${ROLE_SHORT[hmRole]}）` : m.nameZh}
                    onClick={() => onSelectDetailed(m.id)}
                  >
                    {m.shortLabelZh}
                    {hmRole && <span className="quick-chip-role">·{ROLE_SHORT[hmRole]}</span>}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}

