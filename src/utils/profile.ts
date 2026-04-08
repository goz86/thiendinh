import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as UserProfile | null) ?? null;
};

export const syncProfile = async ({
  id,
  email,
}: {
  id: string;
  email: string;
}) => {
  const { error } = await supabase.from('profiles').upsert(
    {
      id,
      email,
    },
    { onConflict: 'id' }
  );

  if (error) throw error;
};
