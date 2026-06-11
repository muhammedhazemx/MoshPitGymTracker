import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGym } from '../hooks/useGym';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WorkoutSet } from '../db';

interface Props {
  onBack: () => void;
}

const SessionItem: React.FC<{ session: any; onDelete: (id: number) => void }> = ({ session, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const { deleteSet } = useGym();

  const sets = useLiveQuery(
    () => db.sets.where('sessionId').equals(session.id).toArray(),
    [session.id]
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const groupedSets = sets?.reduce((acc: Record<string, WorkoutSet[]>, set) => {
    if (!acc[set.exerciseName]) acc[set.exerciseName] = [];
    acc[set.exerciseName].push(set);
    return acc;
  }, {});

  const getExerciseTally = (exSets: WorkoutSet[]) => {
    if (exSets.length < 2) return '0m 0s';
    const start = exSets[0].timestamp.getTime();
    const end = exSets[exSets.length - 1].timestamp.getTime();
    return formatDuration(Math.floor((end - start) / 1000));
  };

  const handleDeleteSet = async (e: React.MouseEvent, setId: number) => {
    e.stopPropagation();
    if (confirm('Delete this set?')) {
      await deleteSet(setId);
    }
  };

  return (
    <div className="session-item">
      <div
        className="session-item__header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${session.routineName} on ${session.date.toLocaleDateString()}. Click to ${expanded ? 'hide' : 'show'} details.`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded); }}
      >
        <div className="session-item__title-row">
          <h2 className="session-item__name">{session.routineName}</h2>
          <span className="label-bracket">{session.date.toLocaleDateString()}</span>
        </div>
        <div className="session-item__meta">
          <div className="session-item__meta-left">
            <span className="label-bracket">
              {expanded ? 'hide_details' : 'energy_logged'}
            </span>
            <span className="session-item__duration">{formatDuration(session.duration)}</span>
          </div>
          <button
            className="session-item__delete-btn"
            aria-label={`Delete session ${session.routineName}`}
            onClick={(e) => { e.stopPropagation(); onDelete(session.id!); }}
          >
            [delete_session]
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="session-item__details"
          >
            {groupedSets && Object.entries(groupedSets).map(([name, exSets]) => (
              <div key={name} className="session-item__exercise-block">
                <div className="session-item__exercise-header">
                  <h3 className="session-item__exercise-name">{name}</h3>
                  <span className="session-item__exercise-tally">tally: {getExerciseTally(exSets)}</span>
                </div>
                <div className="session-item__sets">
                  {exSets.map((set) => (
                    <div key={set.id} className="session-item__set-row">
                      <span className="session-item__set-data">
                        {set.weight}KG × {set.reps}
                        <span className="session-item__set-time">
                          {set.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <button
                        className="session-item__delete-set-btn"
                        aria-label={`Delete set: ${set.weight}kg × ${set.reps} reps`}
                        onClick={(e) => handleDeleteSet(e, set.id!)}
                      >
                        [x]
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ScreenHistory: React.FC<Props> = ({ onBack }) => {
  const { history, deleteSession, exportData } = useGym();

  const handleDelete = async (id: number) => {
    if (confirm('Permanently delete this session log?')) {
      await deleteSession(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container"
    >
      <div className="screen-header">
        <button className="label-bracket" aria-label="Go back to home" onClick={onBack}>
          [back]
        </button>
        <button className="label-bracket" aria-label="Export data as JSON" onClick={exportData}>
          [export_json]
        </button>
      </div>

      <h1 className="history__title">HISTORY</h1>

      <div className="history__list">
        {history?.map(session => (
          <SessionItem key={session.id} session={session} onDelete={handleDelete} />
        ))}

        {history?.length === 0 && (
          <p className="history__empty">no sessions logged yet.</p>
        )}
      </div>
    </motion.div>
  );
};
