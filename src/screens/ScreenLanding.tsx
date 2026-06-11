import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGym } from '../hooks/useGym';
import type { Routine } from '../db';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onStartSession: (routine: Routine) => void;
  onViewHistory: () => void;
  onEditRoutine: (routine: Routine) => void;
}

export const ScreenLanding: React.FC<Props> = ({
  theme,
  onToggleTheme,
  onStartSession,
  onViewHistory,
  onEditRoutine,
}) => {
  const { routines } = useGym();
  const [selectedSplit, setSelectedSplit] = useState<'PPL' | 'UL' | 'FULL'>('PPL');
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredRoutines = routines?.filter(r => r.type === selectedSplit) || [];
  const currentRoutine = filteredRoutines[currentIndex];

  const nextRoutine = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredRoutines.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container landing"
    >
      <span className="wordmark" aria-label="Mosh Pit Gym">mosh pit gym</span>

      <div className="landing__picker">
        <div className="landing__split-tabs" role="tablist" aria-label="Workout split type">
          {(['PPL', 'UL', 'FULL'] as const).map(split => (
            <button
              key={split}
              role="tab"
              aria-selected={selectedSplit === split}
              aria-label={`Select ${split} split`}
              id={`split-tab-${split}`}
              onClick={() => { setSelectedSplit(split); setCurrentIndex(0); }}
              className={`landing__split-tab landing__split-tab--${selectedSplit === split ? 'active' : 'inactive'}`}
            >
              {split}
            </button>
          ))}
        </div>

        <motion.h1
          key={currentRoutine?.name}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="landing__routine-name"
          onClick={nextRoutine}
          role="button"
          tabIndex={0}
          aria-label={`Current routine: ${currentRoutine?.name ?? 'Loading'}. Click to cycle routines.`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') nextRoutine(); }}
        >
          {currentRoutine?.name ?? 'LOADING'}
        </motion.h1>
      </div>

      <div className="landing__actions">
        <button
          id="btn-start-session"
          className="brutalist-button"
          aria-label="Start workout session"
          onClick={() => currentRoutine && onStartSession(currentRoutine)}
        >
          [start_session]
        </button>

        <button
          id="btn-edit-routine"
          className="label-bracket"
          aria-label="Edit current routine"
          onClick={() => currentRoutine && onEditRoutine(currentRoutine)}
        >
          edit_routine
        </button>

        <button
          id="btn-view-history"
          className="label-bracket"
          aria-label="View workout history"
          onClick={onViewHistory}
        >
          view_history
        </button>
      </div>

      <button
        id="btn-theme-toggle"
        className="landing__theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? 'light' : 'dark'}
      </button>

      <span className="tagline" aria-hidden="true">Raw energy logged locally.</span>
    </motion.div>
  );
};
