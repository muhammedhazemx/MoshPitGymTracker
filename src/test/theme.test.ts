/**
 * theme.test.ts — Tests for the useTheme hook and theme toggle.
 * Verifies data-theme attribute on <html>, localStorage persistence, and OS preference fallback.
 * window.matchMedia is mocked in setup.ts as a vi.fn().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';

const STORAGE_KEY = 'mosh-pit-gym-theme';

// Helper to configure the matchMedia mock's return value
function mockMatchMedia(prefersLight: boolean) {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: prefersLight && query === '(prefers-color-scheme: light)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList));
}

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark when no storage value and OS is dark', () => {
    mockMatchMedia(false); // OS prefers dark

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('defaults to light when OS prefers light and no stored value', () => {
    mockMatchMedia(true); // OS prefers light

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('reads stored theme from localStorage over OS preference', () => {
    mockMatchMedia(false); // OS is dark
    localStorage.setItem(STORAGE_KEY, 'light'); // but user stored 'light'

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('sets data-theme attribute on <html> on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme switches from dark to light', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('light');
  });

  it('toggleTheme switches from light to dark', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('dark');
  });

  it('persists theme choice to localStorage after toggle', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('updates data-theme attribute on <html> after toggle', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('reads back persisted theme on re-render (simulated reload)', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });
});
