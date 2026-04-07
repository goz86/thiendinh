import { useState, useEffect } from 'react';
import { Library } from './components/Library';
import { Visualizer } from './components/Visualizer';
import { CustomForm } from './components/CustomForm';
import { Stats } from './components/Stats';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { MalaCounter } from './components/MalaCounter';
import { TempleTools } from './components/TempleTools';
import { Journal } from './components/Journal';
import { supabase } from './lib/supabase';
import type { BreathingTechnique } from './types';

type View = 'library' | 'custom' | 'visualizer' | 'stats' | 'auth' | 'admin' | 'mala' | 'temple_tools' | 'journal';

function App() {
  const [view, setView] = useState<View>('library');
  const [user, setUser] = useState<any>(null);
  const [activeTechnique, setActiveTechnique] = useState<BreathingTechnique | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mindful-dark-mode');
    return saved === 'true';
  });

  // Apply dark class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mindful-dark-mode', String(darkMode));
  }, [darkMode]);

  // Supabase Auth State
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && view === 'auth') {
        setView('library');
      }
    });

    return () => subscription.unsubscribe();
  }, [view]);

  // Register Service Worker for PWA with auto-update logic
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        // Kiểm tra cập nhật định kỳ (mỗi 1 giờ)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Có bản cập nhật mới, thông báo và tự động reload
                console.log('Phát hiện bản cập nhật mới, đang làm mới ứng dụng...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          }
        });
      }).catch(err => {
        console.error('Lỗi đăng ký Service Worker:', err);
      });
    }
  }, []);

  const handleSelect = (technique: BreathingTechnique) => {
    setActiveTechnique(technique);
    setView('visualizer');
  };

  const handleCustomStart = (technique: BreathingTechnique) => {
    setActiveTechnique(technique);
    setView('visualizer');
  };

  const handleClose = () => {
    setActiveTechnique(null);
    setView('library');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('library');
  };

  return (
    <div className="min-h-screen transition-colors duration-500 text-[#5A4D41] dark:text-[#F5EDE0] bg-transparent">
      {view === 'visualizer' && activeTechnique ? (
        <Visualizer
          technique={activeTechnique}
          onClose={handleClose}
        />
      ) : view === 'custom' ? (
        <CustomForm
          onStart={handleCustomStart}
          onBack={() => setView('library')}
        />
      ) : view === 'auth' ? (
        <Auth
          onSuccess={() => setView('library')}
          onBack={() => setView('library')}
        />
      ) : view === 'stats' ? (
        <Stats
          onBack={() => setView('library')}
        />
      ) : view === 'journal' ? (
        <Journal
          onBack={() => setView('library')}
        />
      ) : view === 'admin' ? (
        <AdminDashboard
          onBack={() => setView('library')}
        />
      ) : view === 'mala' ? (
        <MalaCounter onBack={handleClose} />
      ) : view === 'temple_tools' ? (
        <TempleTools onBack={handleClose} />
      ) : (
        <Library
          onSelect={handleSelect}
          onCustom={() => setView('custom')}
          onStats={() => setView('stats')}
          onAuth={() => setView('auth')}
          onLogout={handleLogout}
          onAdmin={() => setView('admin')}
          onMala={() => setView('mala')}
          onTempleTools={() => setView('temple_tools')}
          onJournal={() => setView('journal')}
          user={user}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
        />
      )}
    </div>
  );
}

export default App;
