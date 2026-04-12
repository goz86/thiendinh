const FAVORITE_TECHNIQUES_KEY = 'mindful-favorite-techniques';
const LEGACY_FAVORITE_TECHNIQUE_KEY = 'mindful-favorite-technique';
const FAVORITE_UPDATED_EVENT = 'mindful-favorite-technique-updated';

const notifyFavoriteUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FAVORITE_UPDATED_EVENT));
};

const normalizeFavoriteIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .filter((item, index, array) => array.indexOf(item) === index);
};

export const loadFavoriteTechniqueIds = () => {
  if (typeof window === 'undefined') return [] as string[];

  const raw = localStorage.getItem(FAVORITE_TECHNIQUES_KEY);
  if (raw) {
    try {
      return normalizeFavoriteIds(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  const legacyFavorite = localStorage.getItem(LEGACY_FAVORITE_TECHNIQUE_KEY);
  return legacyFavorite ? [legacyFavorite] : [];
};

export const loadFavoriteTechniqueId = () => loadFavoriteTechniqueIds()[0] ?? null;

export const saveFavoriteTechniqueIds = (techniqueIds: string[]) => {
  if (typeof window === 'undefined') return;

  const normalized = normalizeFavoriteIds(techniqueIds);
  localStorage.setItem(FAVORITE_TECHNIQUES_KEY, JSON.stringify(normalized));

  if (normalized.length > 0) {
    localStorage.setItem(LEGACY_FAVORITE_TECHNIQUE_KEY, normalized[0]);
  } else {
    localStorage.removeItem(LEGACY_FAVORITE_TECHNIQUE_KEY);
  }

  notifyFavoriteUpdated();
};

export const toggleFavoriteTechnique = (techniqueId: string) => {
  const currentFavorites = loadFavoriteTechniqueIds();
  const alreadyFavorite = currentFavorites.includes(techniqueId);
  const nextFavorites = alreadyFavorite
    ? currentFavorites.filter((id) => id !== techniqueId)
    : [...currentFavorites, techniqueId];

  saveFavoriteTechniqueIds(nextFavorites);
  return nextFavorites;
};

export const subscribeToFavoriteTechnique = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(FAVORITE_UPDATED_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(FAVORITE_UPDATED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const FAVORITE_TECHNIQUE_SHORTCUT_URL = '/visualizer?technique=favorite';
