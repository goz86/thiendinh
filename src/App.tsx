import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BarChart3, BookOpen, House, UserCircle2 } from 'lucide-react';
import { Library } from './components/Library';
import { techniques } from './data';
import { supabase } from './lib/supabase';
import type { BreathingTechnique } from './types';
import { isAdminEmail } from './utils/auth';
import { setActiveStorageScope, syncWithCloud } from './utils/storage';
import { hasTrackedVisitThisSession, resetVisitTrackingSession, trackSiteVisit } from './utils/visits';

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
const APP_STATE_SESSION_KEY = 'mindful-app-state';
const DIRECT_ROUTE_VIEWS: View[] = ['stats', 'journal', 'profile', 'admin', 'mala', 'temple_tools', 'auth', 'custom', 'visualizer'];

const routeByView: Record<View, string> = {
  library: '/',
  custom: '/custom',
  visualizer: '/visualizer',
  stats: '/stats',
  auth: '/auth',
  admin: '/admin',
  mala: '/mala',
  temple_tools: '/temple-tools',
  journal: '/journal',
  profile: '/profile',
};

const viewByPathname = (pathname: string): View => {
  switch (pathname) {
    case '/custom':
      return 'custom';
    case '/visualizer':
      return 'visualizer';
    case '/stats':
      return 'stats';
    case '/auth':
      return 'auth';
    case '/admin':
      return 'admin';
    case '/mala':
      return 'mala';
    case '/temple-tools':
      return 'temple_tools';
    case '/journal':
      return 'journal';
    case '/profile':
      return 'profile';
    default:
      return 'library';
  }
};

function App() {
  const resolveStateFromLocation = (): { view: View; activeTechnique: BreathingTechnique | null } => {
    const viewFromPath = viewByPathname(window.location.pathname);
    const params = new URLSearchParams(window.location.search);
    const techniqueId = params.get('technique');
    const techniqueFromQuery = techniqueId ? techniques.find((item) => item.id === techniqueId) ?? null : null;

    try {
      const raw = sessionStorage.getItem(APP_STATE_SESSION_KEY);
      if (!raw) {
        return {
          view: techniqueFromQuery ? 'visualizer' : viewFromPath,
          activeTechnique: techniqueFromQuery,
        };
      }

      const parsed = JSON.parse(raw) as { view?: View; activeTechnique?: BreathingTechnique | null; path?: string };
      if (parsed.path === window.location.pathname) {
        return {
          view: parsed.view ?? (techniqueFromQuery ? 'visualizer' : viewFromPath),
          activeTechnique: techniqueFromQuery ?? parsed.activeTechnique ?? null,
        };
      }
    } catch {
      // Ignore malformed session state and fall back to URL-only resolution.
    }

    return {
      view: techniqueFromQuery ? 'visualizer' : viewFromPath,
      activeTechnique: techniqueFromQuery,
    };
  };

  const initialRouteStateRef = useRef(resolveStateFromLocation());
  const [view, setView] = useState<View>(initialRouteStateRef.current.view);
  const [user, setUser] = useState<any>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [activeTechnique, setActiveTechnique] = useState<BreathingTechnique | null>(initialRouteStateRef.current.activeTechnique);
  const libraryScrollYRef = useRef(0);
  const historyInitializedRef = useRef(false);
  const applyingPopStateRef = useRef(false);
  const lastHistoryKeyRef = useRef('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mindful-dark-mode');
    return saved === 'true';
  });

  type AppHistoryState = {
    __mindfulApp: true;
    view: View;
    activeTechnique: BreathingTechnique | null;
  };

  const getUrlForState = (nextView: View, nextTechnique: BreathingTechnique | null) => {
    const path = routeByView[nextView] ?? '/';
    const url = new URL(window.location.origin + path);

    if (nextView === 'visualizer' && nextTechnique?.id) {
      url.searchParams.set('technique', nextTechnique.id);
    }

    return `${url.pathname}${url.search}`;
  };

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
      setActiveStorageScope(session?.user?.id ?? null);
      if (session?.user) {
        void syncWithCloud();
      }
      setAuthResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setActiveStorageScope(session?.user?.id ?? null);
      if (session?.user) {
        void syncWithCloud();
      }
      if (!session?.user) {
        resetVisitTrackingSession();
      }
      setAuthResolved(true);
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

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as AppHistoryState | null;
      if (!state || !state.__mindfulApp) {
        const locationState = resolveStateFromLocation();
        applyingPopStateRef.current = true;
        setActiveTechnique(locationState.activeTechnique);
        setView(locationState.view);
        return;
      }

      applyingPopStateRef.current = true;
      setActiveTechnique(state.activeTechnique ?? null);
      setView(state.view ?? 'library');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
  const showLibraryShell = view === 'library';
  const activeOverlayView = ['stats', 'journal', 'mala', 'temple_tools', 'profile'].includes(view) ? view : null;
  const fullscreenRouteFallback = DIRECT_ROUTE_VIEWS.includes(view);
  const mobileNavItems: Array<{ view: View; label: string; icon: typeof House }> = [
    { view: 'library', label: 'Trang chủ', icon: House },
    { view: 'stats', label: 'Tiến trình', icon: BarChart3 },
    { view: 'journal', label: 'Nhật ký', icon: BookOpen },
    { view: 'profile', label: 'Hồ sơ', icon: UserCircle2 },
  ];

  useEffect(() => {
    if (authResolved && view === 'admin' && !isAdmin) {
      setView('library');
    }
  }, [authResolved, view, isAdmin]);

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
    const historyState: AppHistoryState = {
      __mindfulApp: true,
      view,
      activeTechnique,
    };
    const historyKey = JSON.stringify({
      view,
      activeTechniqueId: activeTechnique?.id ?? null,
    });
    const nextUrl = getUrlForState(view, activeTechnique);

    sessionStorage.setItem(
      APP_STATE_SESSION_KEY,
      JSON.stringify({
        path: routeByView[view] ?? '/',
        view,
        activeTechnique,
      })
    );

    if (!historyInitializedRef.current) {
      window.history.replaceState(historyState, '', nextUrl);
      historyInitializedRef.current = true;
      lastHistoryKeyRef.current = historyKey;
      return;
    }

    if (applyingPopStateRef.current) {
      applyingPopStateRef.current = false;
      lastHistoryKeyRef.current = historyKey;
      return;
    }

    if (lastHistoryKeyRef.current === historyKey) {
      return;
    }

    window.history.pushState(historyState, '', nextUrl);
    lastHistoryKeyRef.current = historyKey;
  }, [view, activeTechnique]);

  useEffect(() => {
    if (!authResolved || hasTrackedVisitThisSession()) return;

    void trackSiteVisit(user?.id ?? null, window.location.pathname);

    const retryTimer = window.setTimeout(() => {
      if (!hasTrackedVisitThisSession()) {
        void trackSiteVisit(user?.id ?? null, window.location.pathname);
      }
    }, 3000);

    return () => window.clearTimeout(retryTimer);
  }, [authResolved, user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const syncChannel = supabase
      .channel(`user-cloud-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meditation_sessions', filter: `user_id=eq.${user.id}` },
        () => void syncWithCloud()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries', filter: `user_id=eq.${user.id}` },
        () => void syncWithCloud()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(syncChannel);
    };
  }, [user?.id]);

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
          <div
            className={`fixed inset-0 z-40 flex items-center justify-center ${
              fullscreenRouteFallback
                ? 'bg-[#FCF9F3] dark:bg-[#0d0b09]'
                : 'bg-[#FCF9F3]/70 backdrop-blur-sm dark:bg-[#0d0b09]/70'
            }`}
          >
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
