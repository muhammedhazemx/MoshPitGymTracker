import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGym } from '../hooks/useGym';
import type { Routine } from '../db';

interface Props {
  routine: Routine;
  onBack: () => void;
}

export const ScreenEditRoutine: React.FC<Props> = ({ routine, onBack }) => {
  const { updateRoutine } = useGym();
  const [exercises, setExercises] = useState<string[]>(routine.exercises);
  const [newExercise, setNewExercise] = useState('');

  const handleAdd = () => {
    if (!newExercise) return;
    const updated = [...exercises, newExercise.toUpperCase()];
    setExercises(updated);
    setNewExercise('');
    updateRoutine(routine.id!, updated);
  };

  const handleRemove = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    setExercises(updated);
    updateRoutine(routine.id!, updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container edit-routine"
    >
      <div className="screen-header">
        <button className="label-bracket" aria-label="Go back to home" onClick={onBack}>
          [back]
        </button>
      </div>

      <h1 className="edit-routine__title">EDIT {routine.name}</h1>
      <span className="label-bracket edit-routine__subtitle">config_routine</span>

      <div className="edit-routine__list">
        {exercises.map((ex, idx) => (
          <div key={idx} className="edit-routine__item">
            <h2 className="edit-routine__item-name">{ex}</h2>
            <button
              className="edit-routine__remove-btn"
              aria-label={`Remove ${ex} from routine`}
              onClick={() => handleRemove(idx)}
            >
              [remove]
            </button>
          </div>
        ))}

        <div className="edit-routine__add-block">
          <input
            type="text"
            id="input-new-exercise"
            placeholder="NEW EXERCISE"
            value={newExercise}
            aria-label="New exercise name"
            onChange={e => setNewExercise(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            className="input-field"
          />
          <button
            id="btn-add-to-routine"
            className="edit-routine__add-btn"
            aria-label="Add exercise to routine"
            onClick={handleAdd}
          >
            [add_to_routine]
          </button>
        </div>
      </div>
    </motion.div>
  );
};
