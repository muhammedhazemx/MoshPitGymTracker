import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Routine, type WorkoutSet } from '../db';

type PerformanceSet = Pick<WorkoutSet, 'weight' | 'reps'>;

export function getSetScore(set: PerformanceSet) {
  return set.weight * set.reps;
}

export function getBestPerformanceSet<T extends PerformanceSet>(sets: T[]) {
  if (sets.length === 0) return null;

  return sets.reduce((best, current) => {
    const currentScore = getSetScore(current);
    const bestScore = getSetScore(best);

    if (currentScore > bestScore) return current;
    if (currentScore === bestScore && current.weight > best.weight) return current;
    return best;
  }, sets[0]);
}

export function isPersonalRecord(candidate: PerformanceSet, previousSets: PerformanceSet[]) {
  const bestSet = getBestPerformanceSet(previousSets);
  if (!bestSet) return false;

  if (getSetScore(candidate) > getSetScore(bestSet)) return true;

  const bestSameRepWeight = previousSets
    .filter((set) => set.reps === candidate.reps)
    .reduce<number | null>((best, set) => (
      best === null || set.weight > best ? set.weight : best
    ), null);

  return bestSameRepWeight !== null && candidate.weight > bestSameRepWeight;
}

export function useGym() {
  const routines = useLiveQuery(() => db.routines.toArray());
  const activeSession = useLiveQuery(() => db.sessions.where('status').equals('active').first());
  const history = useLiveQuery(() => db.sessions.where('status').equals('completed').reverse().sortBy('date'));

  const startSession = async (routine: Routine) => {
    const now = new Date();
    const id = await db.sessions.add({
      date: now,
      startTime: now,
      routineId: routine.id,
      routineName: routine.name,
      duration: 0,
      status: 'active'
    });
    return id;
  };

  const endSession = async (sessionId: number) => {
    const session = await db.sessions.get(sessionId);
    if (!session) return;
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    
    await db.sessions.update(sessionId, { 
      status: 'completed', 
      endTime,
      duration 
    });
  };

  const logSet = async (set: Omit<WorkoutSet, 'id' | 'timestamp'>) => {
    await db.sets.add({
      ...set,
      timestamp: new Date()
    });
  };

  const useSetsForSession = (sessionId: number) => {
    return useLiveQuery(() => db.sets.where('sessionId').equals(sessionId).toArray(), [sessionId]);
  };

  const usePrForExercise = (exerciseName: string) => {
    return useLiveQuery(async () => {
      const allSets = await db.sets.where('exerciseName').equals(exerciseName).toArray();
      if (allSets.length === 0) return null;
      return getBestPerformanceSet(allSets);
    }, [exerciseName]);
  };

  const useLastSetForExercise = (exerciseName: string) => {
    return useLiveQuery(async () => {
      return await db.sets.where('exerciseName').equals(exerciseName).reverse().first();
    }, [exerciseName]);
  };

  const useSetsForExercise = (exerciseName: string) => {
    return useLiveQuery(() => db.sets.where('exerciseName').equals(exerciseName).toArray(), [exerciseName]);
  };

  const updateRoutine = async (routineId: number, exercises: string[]) => {
    await db.routines.update(routineId, { exercises });
  };

  const deleteSession = async (sessionId: number) => {
    await db.sessions.delete(sessionId);
    await db.sets.where('sessionId').equals(sessionId).delete();
  };

  const deleteSet = async (setId: number) => {
    await db.sets.delete(setId);
  };

  const exportData = async () => {
    const sessions = await db.sessions.toArray();
    const sets = await db.sets.toArray();
    const routines = await db.routines.toArray();
    
    const data = {
      exportDate: new Date(),
      sessions,
      sets,
      routines
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mosh-pit-gym-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    routines,
    activeSession,
    history,
    startSession,
    endSession,
    updateRoutine,
    deleteSession,
    deleteSet,
    exportData,
    logSet,
    useSetsForSession,
    useSetsForExercise,
    usePrForExercise,
    useLastSetForExercise
  };
}
