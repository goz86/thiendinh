export const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateTimeString = (date: Date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${getLocalDateString(date)}T${hours}:${minutes}:${seconds}`;
};

export const isDateOnlyString = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export const getDateKey = (value?: string) => (value ? value.split('T')[0] : '');

export const parseLocalDateString = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const parseStoredDate = (value?: string) => {
  if (!value) return new Date(0);
  if (isDateOnlyString(value)) return parseLocalDateString(value);
  return new Date(value);
};

export const formatStoredDate = (
  value: string,
  locale = 'vi-VN',
  options?: Intl.DateTimeFormatOptions
) => parseStoredDate(value).toLocaleDateString(locale, options);

export const formatStoredDateTime = (value: string, locale = 'vi-VN') => {
  const date = parseStoredDate(value);

  if (isDateOnlyString(value)) {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return date.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const getLocalTimeFromLegacyId = (id?: string, dateValue?: string) => {
  if (!id || !/^\d{10,}$/.test(id) || !dateValue || !isDateOnlyString(dateValue)) return null;

  const timestamp = Number(id);
  if (!Number.isFinite(timestamp)) return null;

  const localDateTime = new Date(timestamp);
  if (getLocalDateString(localDateTime) !== dateValue) return null;

  return localDateTime;
};

export const formatSessionDisplayDateTime = (
  session: { id?: string; date: string },
  locale = 'vi-VN'
) => {
  const legacyLocalTime = getLocalTimeFromLegacyId(session.id, session.date);

  if (legacyLocalTime) {
    return legacyLocalTime.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return formatStoredDateTime(session.date, locale);
};
