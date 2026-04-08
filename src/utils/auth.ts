export const ADMIN_EMAILS = ['heeffgh123@gmail.com'];

export const ACCOUNT_AVATARS = [
  '🐻',
  '🐼',
  '🐰',
  '🦊',
  '🐯',
  '🐱',
  '🐶',
  '🐹',
  '🐨',
  '🦄',
  '🐸',
  '🦁',
  '🐷',
  '🐮',
  '🐵',
  '🐙',
  '🐧',
  '🐥',
  '🦋',
  '🐝',
];

export const isAdminEmail = (email?: string | null) =>
  Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));

export const getUserDisplayName = (user: any) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split('@')[0] ||
  'Tài khoản';

export const getUserAvatar = (user: any) => {
  const selectedAvatar = user?.user_metadata?.avatar;
  if (selectedAvatar && ACCOUNT_AVATARS.includes(selectedAvatar)) {
    return selectedAvatar;
  }

  const seed = String(user?.email || user?.id || getUserDisplayName(user));
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return ACCOUNT_AVATARS[hash % ACCOUNT_AVATARS.length];
};
