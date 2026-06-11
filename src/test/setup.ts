// Test setup: fake-indexeddb shims + jest-dom matchers
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

// Mock navigator.vibrate so haptic paths don't throw in jsdom
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

// Mock window.matchMedia — not implemented in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
