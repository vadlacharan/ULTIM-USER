const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseLocalDate = (value?: string): Date | null => {
  if (!value) return null;
  if (value === 'Today') return new Date();
  const datePart = value.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
};

/** "5 Nov" — compact date used inside dense rows. */
export const formatDateShort = (value?: string): string => {
  const date = parseLocalDate(value);
  if (!date) return value || '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

/** "THU, 5 NOV" — eyebrow date used above session names. */
export const formatDateLong = (value?: string): string => {
  const date = parseLocalDate(value);
  if (!date) return value || '—';
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`.toUpperCase();
};

/** "18:00" → "6:00 PM". Leaves other strings untouched. */
export const formatClock = (value?: string): string => {
  if (!value) return '—';
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const hour24 = Number(match[1]);
  const minute = match[2];
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${suffix}`;
};
