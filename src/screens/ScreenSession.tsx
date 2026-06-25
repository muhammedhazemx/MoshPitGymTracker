import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPersonalRecord, useGym } from '../hooks/useGym';
import type { Session } from '../db';

interface Props {
  session: Session;
  onEndSession: () => void;
}

export const ScreenSession: React.FC<Props> = ({ session, onEndSession }) => {
  const { routines, logSet, useLastSetForExercise, usePrForExercise, useSetsForExercise, endSession, updateRoutine } = useGym();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const routine = routines?.find(r => r.id === session.routineId);
  const exercises = routine?.exercises ?? ['BENCH PRESS'];
  const currentExercise = exercises[currentExerciseIndex];

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isResting, setIsResting] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [restTime, setRestTime] = useState(90);
  const [timer, setTimer] = useState(0);

  const lastSet = useLastSetForExercise(currentExercise);
  const pr = usePrForExercise(currentExercise);
  const exerciseSets = useSetsForExercise(currentExercise);

  const adjustRestTime = (amount: number) => {
    setRestTime(prev => Math.max(0, prev + amount));
  };

  const adjustTimer = (amount: number) => {
    setTimer(prev => Math.max(0, prev + amount));
  };

  const togglePause = () => {
    setIsTimerPaused(!isTimerPaused);
  };

  const handleAddExercise = async () => {
    if (!newExerciseName || !routine) return;
    const updated = [...exercises, newExerciseName.toUpperCase()];
    await updateRoutine(routine.id!, updated);
    setNewExerciseName('');
    setIsAddingExercise(false);
    setCurrentExerciseIndex(updated.length - 1);
  };

  const handleRemoveExercise = async () => {
    if (!routine || exercises.length <= 1) return;
    const updated = exercises.filter((_, i) => i !== currentExerciseIndex);
    await updateRoutine(routine.id!, updated);
    setCurrentExerciseIndex(0);
  };

  useEffect(() => {
    let interval: number;
    if (isResting && !isTimerPaused && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, isTimerPaused, timer]);

  const handleLogSet = async () => {
    if (!weight || !reps) return;

    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }

    const currentSet = {
      sessionId: session.id!,
      exerciseName: currentExercise,
      weight: parseFloat(weight),
      reps: parseInt(reps),
    };
    const didHitPr = isPersonalRecord(currentSet, exerciseSets ?? []);

    await logSet({
      ...currentSet,
      isPr: didHitPr,
    });

    // PR celebration - mix-blend-mode:difference works in both themes
    if (didHitPr) {
      const flash = document.createElement('div');
      flash.className = 'pr-celebration';
      document.body.appendChild(flash);

      setTimeout(() => {
        flash.style.display = 'none';
        setTimeout(() => {
          flash.style.display = 'block';
          setTimeout(() => flash.remove(), 100);
        }, 50);
      }, 100);

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 50, 400]);
      }
    }

    setTimer(restTime);
    setIsResting(true);
    setIsTimerPaused(false);
  };

  const handleEndSession = async () => {
    await endSession(session.id!);
    onEndSession();
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // -------------------------------------------------------------------------
  // REST TIMER SCREEN
  // -------------------------------------------------------------------------
  if (isResting && timer > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="container timer-screen"
      >
        <div className="timer__display-row">
          <button
            className="timer__adj-btn"
            aria-label="Decrease rest by 10 seconds"
            onClick={() => adjustTimer(-10)}
          >
            -
          </button>

          <h1 className="timer__countdown numeral" aria-live="polite" aria-atomic="true">
            {formatTime(timer)}
          </h1>

          <button
            className="timer__adj-btn"
            aria-label="Increase rest by 10 seconds"
            onClick={() => adjustTimer(10)}
          >
            +
          </button>
        </div>

        <h2 className="timer__label">RESTING</h2>

        <div className="timer__controls">
          <button
            className="timer__pause-btn"
            aria-label={isTimerPaused ? 'Resume rest timer' : 'Pause rest timer'}
            onClick={togglePause}
          >
            {isTimerPaused ? '[resume]' : '[pause]'}
          </button>
          <button
            className="timer__skip-btn"
            aria-label="Skip rest and return to logging"
            onClick={() => setIsResting(false)}
          >
            [skip]
          </button>
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------------------
  // ACTIVE LOGGING SCREEN
  // -------------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container"
    >
      {/* Nav bar */}
      <div className="session__nav">
        <span className="session__nav-label">{session.routineName}</span>
        <button
          className="session__finish-btn"
          aria-label="Finish workout session"
          onClick={handleEndSession}
        >
          [finish_session]
        </button>
      </div>

      {/* Main logging area */}
      <div className="session__main">

        {/* Exercise header */}
        <div className="session__exercise-header">
          <h1 className="session__exercise-name">{currentExercise}</h1>
          <div className="session__stats">
            {lastSet && (
              <span className="label-bracket" aria-label={`Last set: ${lastSet.weight} kg x ${lastSet.reps} reps`}>
                last: {lastSet.weight}kg x {lastSet.reps}
              </span>
            )}
            {pr && (
              <span className="label-bracket" aria-label={`Personal record: ${pr.weight} kg`}>
                pr: {pr.weight}kg
              </span>
            )}
            <button
              className="session__remove-btn"
              aria-label={`Remove ${currentExercise} from session`}
              onClick={handleRemoveExercise}
            >
              [remove_ex]
            </button>
          </div>
        </div>

        {/* Add exercise panel */}
        <AnimatePresence>
          {isAddingExercise && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="session__add-exercise-panel"
            >
              <input
                autoFocus
                type="text"
                placeholder="NEW EXERCISE"
                value={newExerciseName}
                aria-label="New exercise name"
                onChange={e => setNewExerciseName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddExercise(); }}
                className="session__add-exercise-input"
              />
              <div className="session__add-exercise-controls">
                <button
                  className="label-bracket"
                  aria-label="Confirm add exercise"
                  onClick={handleAddExercise}
                >
                  [confirm]
                </button>
                <button
                  className="label-bracket"
                  aria-label="Cancel add exercise"
                  onClick={() => setIsAddingExercise(false)}
                >
                  [cancel]
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weight & reps inputs */}
        <div className="session__inputs">
          <div className="session__input-group">
            <input
              type="number"
              id="input-weight"
              placeholder="00"
              value={weight}
              aria-label="Weight in kilograms"
              onChange={e => setWeight(e.target.value)}
              className="session__number-input"
            />
            <label htmlFor="input-weight" className="session__input-label">weight_kg</label>
          </div>

          <div className="session__input-group">
            <input
              type="number"
              id="input-reps"
              placeholder="00"
              value={reps}
              aria-label="Number of repetitions"
              onChange={e => setReps(e.target.value)}
              className="session__number-input"
            />
            <label htmlFor="input-reps" className="session__input-label">reps</label>
          </div>

          <button
            id="btn-log-set"
            className="session__log-btn"
            onClick={handleLogSet}
            disabled={!weight || !reps}
            aria-label="Log this set"
          >
            [log_set]
          </button>
        </div>
      </div>

      {/* Rest time adjuster */}
      <div className="session__rest-adjuster">
        <button
          className="session__rest-adj-btn"
          aria-label="Decrease rest time by 10 seconds"
          onClick={() => adjustRestTime(-10)}
        >
          -
        </button>
        <span className="session__rest-display" aria-label={`Rest time: ${formatTime(restTime)}`}>
          rest: {formatTime(restTime)}
        </span>
        <button
          className="session__rest-adj-btn"
          aria-label="Increase rest time by 10 seconds"
          onClick={() => adjustRestTime(10)}
        >
          +
        </button>
      </div>

      {/* Exercise tab strip */}
      <div className="session__exercise-tabs" role="tablist" aria-label="Exercises in this session">
        {exercises.map((ex, idx) => (
          <button
            key={ex}
            role="tab"
            aria-selected={idx === currentExerciseIndex}
            aria-label={`Switch to ${ex}`}
            onClick={() => setCurrentExerciseIndex(idx)}
            className={`session__exercise-tab session__exercise-tab--${idx === currentExerciseIndex ? 'active' : 'inactive'}`}
          >
            {ex}
          </button>
        ))}
        <button
          className="session__add-tab"
          aria-label="Add a new exercise to this session"
          onClick={() => setIsAddingExercise(true)}
        >
          [add_ex]
        </button>
      </div>
    </motion.div>
  );
};
