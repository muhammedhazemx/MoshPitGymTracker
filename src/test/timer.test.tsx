/**
 * timer.test.tsx — Tests for rest timer countdown, pause/resume, skip, and ±10s adjustments.
 * Uses vi.useFakeTimers() + fireEvent to avoid userEvent async timing conflicts.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useState, useEffect } from 'react';

// ─── Minimal self-contained timer component for testing ──────────────────────
function RestTimer({
  initialSeconds,
  onDone,
}: {
  initialSeconds: number;
  onDone: () => void;
}) {
  const [timer, setTimer] = useState(initialSeconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || timer === 0) {
      if (timer === 0) onDone();
      return;
    }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [paused, timer, onDone]);

  const adjust = (amount: number) =>
    setTimer(t => Math.max(0, t + amount));

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div>
      <button onClick={() => adjust(-10)} data-testid="minus">-</button>
      <span data-testid="countdown">{fmt(timer)}</span>
      <button onClick={() => adjust(10)} data-testid="plus">+</button>
      <button onClick={() => setPaused(p => !p)} data-testid="pause-btn">
        {paused ? 'resume' : 'pause'}
      </button>
      <button onClick={() => { setTimer(0); onDone(); }} data-testid="skip-btn">skip</button>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

describe('Rest timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays the correct initial formatted time', () => {
    render(<RestTimer initialSeconds={90} onDone={() => {}} />);
    expect(screen.getByTestId('countdown').textContent).toBe('1:30');
  });

  it('counts down one second per interval tick', () => {
    render(<RestTimer initialSeconds={90} onDone={() => {}} />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByTestId('countdown').textContent).toBe('1:25');
  });

  it('pauses when pause button is clicked', () => {
    render(<RestTimer initialSeconds={90} onDone={() => {}} />);

    act(() => { fireEvent.click(screen.getByTestId('pause-btn')); });
    act(() => { vi.advanceTimersByTime(10000); });

    // Timer should NOT have moved while paused
    expect(screen.getByTestId('countdown').textContent).toBe('1:30');
    expect(screen.getByTestId('pause-btn').textContent).toBe('resume');
  });

  it('resumes after being paused', () => {
    render(<RestTimer initialSeconds={90} onDone={() => {}} />);

    // Pause
    act(() => { fireEvent.click(screen.getByTestId('pause-btn')); });
    act(() => { vi.advanceTimersByTime(5000); });
    // Time should still be 1:30

    // Resume
    act(() => { fireEvent.click(screen.getByTestId('pause-btn')); });
    act(() => { vi.advanceTimersByTime(3000); });

    expect(screen.getByTestId('countdown').textContent).toBe('1:27');
  });

  it('skip button calls onDone immediately', () => {
    const onDone = vi.fn();
    render(<RestTimer initialSeconds={90} onDone={onDone} />);

    act(() => { fireEvent.click(screen.getByTestId('skip-btn')); });

    expect(onDone).toHaveBeenCalled();
  });

  it('adjusts timer down by 10 seconds', () => {
    render(<RestTimer initialSeconds={90} onDone={() => {}} />);

    act(() => { fireEvent.click(screen.getByTestId('minus')); });

    expect(screen.getByTestId('countdown').textContent).toBe('1:20');
  });

  it('adjusts timer up by 10 seconds', () => {
    render(<RestTimer initialSeconds={90} onDone={() => {}} />);

    act(() => { fireEvent.click(screen.getByTestId('plus')); });

    expect(screen.getByTestId('countdown').textContent).toBe('1:40');
  });

  it('does not go below 0 seconds', () => {
    render(<RestTimer initialSeconds={5} onDone={() => {}} />);

    // Click minus 5 times (each -10, starting from 5)
    for (let i = 0; i < 5; i++) {
      act(() => { fireEvent.click(screen.getByTestId('minus')); });
    }

    expect(screen.getByTestId('countdown').textContent).toBe('0:00');
  });

  it('calls onDone when countdown reaches zero naturally', () => {
    const onDone = vi.fn();
    render(<RestTimer initialSeconds={3} onDone={onDone} />);

    act(() => { vi.advanceTimersByTime(3000); });

    expect(onDone).toHaveBeenCalled();
  });
});
