import { supabase } from '../lib/supabase';
import type { SiteVisit } from '../types';

const VISITOR_ID_KEY = 'mindful-visitor-id';
const VISIT_SESSION_KEY = 'mindful-visit-tracked';

const createVisitorId = () =>
  `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const getVisitorId = () => {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const next = createVisitorId();
  localStorage.setItem(VISITOR_ID_KEY, next);
  return next;
};

export const trackSiteVisit = async (userId?: string | null, pagePath = '/') => {
  if (sessionStorage.getItem(VISIT_SESSION_KEY) === 'true') return;

  try {
    const visitorId = getVisitorId();
    const { error } = await supabase.from('site_visits').insert({
      visitor_id: visitorId,
      user_id: userId || null,
      page_path: pagePath,
    });

    if (!error) {
      sessionStorage.setItem(VISIT_SESSION_KEY, 'true');
    } else {
      console.warn('Không thể ghi lượt ghé:', error.message);
    }
  } catch (error) {
    console.warn('Không thể ghi lượt ghé:', error);
  }
};

export const fetchSiteVisits = async (): Promise<SiteVisit[]> => {
  const { data, error } = await supabase
    .from('site_visits')
    .select('id, visitor_id, user_id, page_path, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as SiteVisit[]) || [];
};
