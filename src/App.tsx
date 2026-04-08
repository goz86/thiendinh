import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BarChart3, BookOpen, House, UserCircle2 } from 'lucide-react';
import { Library } from './components/Library';
import { supabase } from './lib/supabase';
import type { BreathingTechnique } from './types';
import { isAdminEmail } from './utils/auth';
import { trackSiteVisit } from './utils/visits';

type View =
  | 'library'
  | 'custom'
  | 'visualizer'
  | 'stats'
  | 'auth'
  | 'admin'
  | 'mala'
  | 'temple_tools'
  | 'journal'
  | 'profile';

const Visualizer = lazy(() => import('./components/Visualizer').then((module) => ({ default: module.Visualizer })));
const CustomForm = lazy(() => import('./components/CustomForm').then((module) => ({ default: module.CustomForm })));
const Stats = lazy(() => import('./components/Stats').then((module) => ({ default: module.Stats })));
const Auth = lazy(() => import('./components/Auth').then((module) => ({ default: module.Auth })));
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const MalaCounter = lazy(() => import('./components/MalaCounter').then((module) => ({ default: module.MalaCounter })));
const TempleTools = lazy(() => import('./components/TempleTools').then((module) => ({ default: module.TempleTools })));
const Journal = lazy(() => import('./components/Journal').then((module) => ({ default: module.Journal })));
const Profile = lazy(() => import('./components/Profile').then((module) => ({ default: module.Profile })));

function App() {
  const [view, setView] = useState<View>('library');
  const [user, setUser] = useState<any>(null);
  const [activeTechnique, setActiveTechnique] = useState<BreathingTechnique | null>(null);
  const libraryScrollYRef = useRef(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mindful-dark-mode');
    return saved === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mindful-dark-mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && view === 'auth') {
        setView('library');
      }
    });

    return () => subscription.unsubscribe();
  }, [view]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          window.setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          });
        })
        .catch((error) => {
          console.error('Lỗi đăng ký Service Worker:', error);
        });
    }
  }, []);

  const saveLibraryScrollPosition = () => {
    libraryScrollYRef.current = window.scrollY;
  };

  const navigateFromLibrary = (nextView: View) => {
    if (view === 'library') {
      saveLibraryScrollPosition();
    }
    setView(nextView);
  };

  const goBackToLibrary = () => {
    setActiveTechnique(null);
    setView('library');
  };

  const scrollToTechniqueStart = () => {
    const target = document.getElementById('library-techniques-start');
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelect = (technique: BreathingTechnique) => {
    setActiveTechnique(technique);
    navigateFromLibrary('visualizer');
  };

  const handleCustomStart = (technique: BreathingTechnique) => {
    setActiveTechnique(technique);
    navigateFromLibrary('visualizer');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    goBackToLibrary();
  };

  const isAdmin = isAdminEmail(user?.email);
  const showLibraryShell = !['visualizer', 'custom', 'auth', 'admin'].includes(view);
  const activeOverlayView = ['stats', 'journal', 'mala', 'temple_tools', 'profile'].includes(view) ? view : null;
  const mobileNavItems: Array<{ view: View; label: string; icon: typeof House }> = [
    { view: 'library', label: 'Trang chủ', icon: House },
    { view: 'stats', label: 'Tiến trình', icon: BarChart3 },
    { view: 'journal', label: 'Nhật ký', icon: BookOpen },
    { view: 'profile', label: 'Hồ sơ', icon: UserCircle2 },
  ];

  useEffect(() => {
    if (view === 'admin' && !isAdmin) {
      setView('library');
    }
  }, [view, isAdmin]);

  useEffect(() => {
    if (view === 'library') {
      const restoreScroll = () => {
        window.scrollTo({ top: libraryScrollYRef.current, behavior: 'auto' });
      };

      window.requestAnimationFrame(() => {
        restoreScroll();
        window.requestAnimationFrame(restoreScroll);
      });

      const timeoutId = window.setTimeout(restoreScroll, 80);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [view]);

  useEffect(() => {
    trackSiteVisit(user?.id ?? null, window.location.pathname);
  }, [user]);

  return (
    <div className="min-h-screen bg-transparent text-[#5A4D41] transition-colors duration-500 dark:text-[#F5EDE0]">
      {showLibraryShell && (
        <Library
          onSelect={handleSelect}
          onCustom={() => navigateFromLibrary('custom')}
          onStats={() => navigateFromLibrary('stats')}
          onAuth={() => navigateFromLibrary('auth')}
          onProfile={() => navigateFromLibrary('profile')}
          onAdmin={() => navigateFromLibrary('admin')}
          onMala={() => navigateFromLibrary('mala')}
          onTempleTools={() => navigateFromLibrary('temple_tools')}
          onJournal={() => navigateFromLibrary('journal')}
          user={user}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
        />
      )}

      <Suspense
        fallback={
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#FCF9F3]/70 backdrop-blur-sm dark:bg-[#0d0b09]/70">
            <div className="rounded-full border border-[#E8DFC9] bg-white/80 px-4 py-2 text-sm font-medium text-[#5A4D41] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#F5EDE0]">
              Đang tải...
            </div>
          </div>
        }
      >
        {view === 'visualizer' && activeTechnique ? (
          <Visualizer
            technique={activeTechnique}
            onClose={goBackToLibrary}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode((prev) => !prev)}
          />
        ) : view === 'custom' ? (
          <CustomForm onStart={handleCustomStart} onBack={goBackToLibrary} />
        ) : view === 'auth' ? (
          <Auth onSuccess={goBackToLibrary} onBack={goBackToLibrary} />
        ) : view === 'stats' ? (
          <Stats onBack={goBackToLibrary} />
        ) : view === 'journal' ? (
          <Journal onBack={goBackToLibrary} />
        ) : view === 'admin' ? (
          isAdmin ? <AdminDashboard onBack={goBackToLibrary} /> : null
        ) : activeOverlayView === 'mala' ? (
          <MalaCounter onBack={goBackToLibrary} />
        ) : activeOverlayView === 'temple_tools' ? (
          <TempleTools onBack={goBackToLibrary} />
        ) : activeOverlayView === 'profile' ? (
          <Profile
            user={user}
            onBack={goBackToLibrary}
            onLogout={handleLogout}
            onUserUpdated={setUser}
            onAdmin={() => navigateFromLibrary('admin')}
          />
        ) : null}
      </Suspense>

      {view === 'library' && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[#E8DFC9] bg-white/85 px-3 pb-3 pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#15110d]/90 md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-2xl border border-[#E8DFC9] bg-[#FCF9F3]/95 p-1.5 shadow-lg dark:border-white/10 dark:bg-[#1b1611]/95">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.view;

              return (
                <button
                  key={item.view}
                  onClick={() => {
                    if (item.view === 'library') {
                      goBackToLibrary();
                      window.setTimeout(scrollToTechniqueStart, 100);
                      return;
                    }

                    navigateFromLibrary(item.view);
                  }}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#5A4D41] text-white shadow-sm'
                      : 'text-[#7B6B5B] hover:bg-white dark:text-[#DECAA4] dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
