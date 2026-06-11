import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGym } from './hooks/useGym';
import { useTheme } from './hooks/useTheme';
import { seedDatabase, type Routine } from './db';
import { ScreenLanding } from './screens/ScreenLanding';
import { ScreenSession } from './screens/ScreenSession';
import { ScreenHistory } from './screens/ScreenHistory';
import { ScreenEditRoutine } from './screens/ScreenEditRoutine';
import './styles/main.scss';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'session' | 'history' | 'edit_routine'>('landing');
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const { activeSession, startSession } = useGym();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    seedDatabase();
  }, []);

  useEffect(() => {
    if (activeSession) {
      setCurrentScreen('session');
    }
  }, [activeSession]);

  const handleStartSession = async (routine: Routine) => {
    await startSession(routine);
    setCurrentScreen('session');
  };

  const handleEndSession = () => {
    setCurrentScreen('landing');
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        if ('vibrate' in navigator) {
          navigator.vibrate(10); // Subtle crisp click
        }
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'landing' && (
        <ScreenLanding
          key="landing"
          theme={theme}
          onToggleTheme={toggleTheme}
          onStartSession={handleStartSession}
          onViewHistory={() => setCurrentScreen('history')}
          onEditRoutine={(routine) => { setEditingRoutine(routine); setCurrentScreen('edit_routine'); }}
        />
      )}

      {currentScreen === 'session' && activeSession && (
        <ScreenSession
          key="session"
          session={activeSession}
          onEndSession={handleEndSession}
        />
      )}

      {currentScreen === 'history' && (
        <ScreenHistory
          key="history"
          onBack={() => setCurrentScreen('landing')}
        />
      )}

      {currentScreen === 'edit_routine' && editingRoutine && (
        <ScreenEditRoutine
          key="edit_routine"
          routine={editingRoutine}
          onBack={() => { setEditingRoutine(null); setCurrentScreen('landing'); }}
        />
      )}
    </AnimatePresence>
  );
}

export default App;
