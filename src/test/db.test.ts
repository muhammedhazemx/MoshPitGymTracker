/**
 * db.test.ts — Tests for core Dexie database operations.
 * Uses fake-indexeddb (auto-shimmed via setup.ts) so real Dexie code runs in jsdom.
 * Each test uses a fresh GymDatabase instance to avoid state leakage.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GymDatabase } from '../db';

let db: GymDatabase;

beforeEach(async () => {
  db = new GymDatabase();
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('Routines', () => {
  it('seeds routines into the DB', async () => {
    await db.routines.bulkAdd([
      { name: 'PUSH', type: 'PPL', exercises: ['Bench Press'] },
      { name: 'PULL', type: 'PPL', exercises: ['Pull Ups'] },
    ]);
    const count = await db.routines.count();
    expect(count).toBe(2);
  });

  it('filters routines by type', async () => {
    await db.routines.bulkAdd([
      { name: 'PUSH', type: 'PPL', exercises: ['Bench Press'] },
      { name: 'UPPER', type: 'UL', exercises: ['Bench Press'] },
    ]);
    const ppl = await db.routines.where('type').equals('PPL').toArray();
    expect(ppl).toHaveLength(1);
    expect(ppl[0].name).toBe('PUSH');
  });

  it('updates routine exercises', async () => {
    const id = await db.routines.add({ name: 'PUSH', type: 'PPL', exercises: ['Bench Press'] });
    await db.routines.update(id, { exercises: ['Bench Press', 'Overhead Press'] });
    const updated = await db.routines.get(id);
    expect(updated?.exercises).toEqual(['Bench Press', 'Overhead Press']);
  });
});

describe('Sessions', () => {
  it('creates a session with status active', async () => {
    const now = new Date();
    const id = await db.sessions.add({
      date: now,
      startTime: now,
      routineName: 'PUSH',
      duration: 0,
      status: 'active',
    });
    const session = await db.sessions.get(id);
    expect(session?.status).toBe('active');
  });

  it('marks a session completed and records duration', async () => {
    const startTime = new Date(Date.now() - 30_000);
    const id = await db.sessions.add({
      date: startTime,
      startTime,
      routineName: 'PUSH',
      duration: 0,
      status: 'active',
    });

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    await db.sessions.update(id, { status: 'completed', endTime, duration });

    const session = await db.sessions.get(id);
    expect(session?.status).toBe('completed');
    expect(session?.duration).toBeGreaterThanOrEqual(29);
  });

  it('deletes a session and its sets', async () => {
    const now = new Date();
    const sessionId = await db.sessions.add({
      date: now,
      startTime: now,
      routineName: 'PUSH',
      duration: 0,
      status: 'active',
    });
    await db.sets.add({ sessionId, exerciseName: 'Bench Press', weight: 100, reps: 5, timestamp: now });

    await db.sessions.delete(sessionId);
    await db.sets.where('sessionId').equals(sessionId).delete();

    const remainingSets = await db.sets.where('sessionId').equals(sessionId).toArray();
    const session = await db.sessions.get(sessionId);
    expect(session).toBeUndefined();
    expect(remainingSets).toHaveLength(0);
  });
});

describe('PR detection', () => {
  it('identifies a new PR correctly', async () => {
    const now = new Date();
    const sessionId = 1;

    await db.sets.bulkAdd([
      { sessionId, exerciseName: 'Bench Press', weight: 80, reps: 5, timestamp: now },
      { sessionId, exerciseName: 'Bench Press', weight: 90, reps: 4, timestamp: now },
    ]);

    const allSets = await db.sets.where('exerciseName').equals('Bench Press').toArray();
    const pr = allSets.reduce((prev, curr) => (curr.weight > prev.weight ? curr : prev), allSets[0]);
    expect(pr.weight).toBe(90);

    const newWeight = 100;
    expect(newWeight > pr.weight).toBe(true);
  });

  it('does not trigger PR for equal weight', async () => {
    const now = new Date();
    await db.sets.add({ sessionId: 1, exerciseName: 'Squat', weight: 120, reps: 3, timestamp: now });
    const allSets = await db.sets.where('exerciseName').equals('Squat').toArray();
    const pr = allSets.reduce((prev, curr) => (curr.weight > prev.weight ? curr : prev), allSets[0]);

    expect(120 > pr.weight).toBe(false);
  });

  it('does not trigger PR for lower weight', async () => {
    const now = new Date();
    await db.sets.add({ sessionId: 1, exerciseName: 'Deadlift', weight: 150, reps: 3, timestamp: now });
    const allSets = await db.sets.where('exerciseName').equals('Deadlift').toArray();
    const pr = allSets.reduce((prev, curr) => (curr.weight > prev.weight ? curr : prev), allSets[0]);

    expect(140 > pr.weight).toBe(false);
  });
});

describe('Set logging', () => {
  it('writes a set to the DB and reads it back', async () => {
    const now = new Date();
    const setId = await db.sets.add({
      sessionId: 42,
      exerciseName: 'Pull Ups',
      weight: 0,
      reps: 12,
      timestamp: now,
    });

    const set = await db.sets.get(setId);
    expect(set).toBeDefined();
    expect(set?.exerciseName).toBe('Pull Ups');
    expect(set?.reps).toBe(12);
  });

  it('retrieves all sets for a session', async () => {
    const now = new Date();
    const sessionId = 99;

    await db.sets.bulkAdd([
      { sessionId, exerciseName: 'Bench Press', weight: 80, reps: 8, timestamp: now },
      { sessionId, exerciseName: 'Bench Press', weight: 85, reps: 6, timestamp: now },
      { sessionId, exerciseName: 'Pull Ups', weight: 0, reps: 10, timestamp: now },
    ]);

    const sessionSets = await db.sets.where('sessionId').equals(sessionId).toArray();
    expect(sessionSets).toHaveLength(3);
  });

  it('deletes a single set by ID', async () => {
    const now = new Date();
    const setId = await db.sets.add({
      sessionId: 1,
      exerciseName: 'Curls',
      weight: 20,
      reps: 12,
      timestamp: now,
    });

    await db.sets.delete(setId);
    const set = await db.sets.get(setId);
    expect(set).toBeUndefined();
  });
});

describe('History grouping', () => {
  it('groups completed sessions by date correctly', async () => {
    const day1 = new Date('2024-01-15T10:00:00');
    const day2 = new Date('2024-01-16T10:00:00');

    await db.sessions.bulkAdd([
      { date: day1, startTime: day1, routineName: 'PUSH', duration: 3600, status: 'completed' },
      { date: day1, startTime: day1, routineName: 'PULL', duration: 2700, status: 'completed' },
      { date: day2, startTime: day2, routineName: 'LEGS', duration: 4200, status: 'completed' },
    ]);

    const completed = await db.sessions.where('status').equals('completed').toArray();

    const grouped = completed.reduce((acc: Record<string, typeof completed>, session) => {
      const key = session.date.toLocaleDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    const keys = Object.keys(grouped);
    expect(keys).toHaveLength(2);

    const day1Key = day1.toLocaleDateString();
    expect(grouped[day1Key]).toHaveLength(2);
  });
});
