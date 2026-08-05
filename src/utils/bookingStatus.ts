/**
 * Shared helpers for classifying a booking as upcoming vs. past based on
 * its actual session end time, instead of a naive "is the date today"
 * check (which incorrectly marked future-dated bookings as past).
 *
 * Rule of thumb: a booking only becomes "past" once its calendar day has
 * fully elapsed (i.e. starting the day after the session). This means:
 *   - Any future-dated booking is always "upcoming".
 *   - ALL of today's bookings are "upcoming", even if their computed end
 *     time is earlier than the current clock time.
 *   - Any booking dated before today is "past".
 */

/** Resolves the real Date this session ends at, from its raw string fields. */
export const getSessionEndDate = (
  dateStr: string,
  timeSlotLabel: string,
  durationMins: number
): Date => {
  // Resolve the calendar date the session falls on.
  let base: Date;
  if (dateStr === 'Today') {
    base = new Date();
  } else {
    const parsed = new Date(dateStr);
    base = isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();

  // Resolve the start time from labels like "18:00 (60m)" -> "18:00".
  // Labels like "Open Access (All Day)" have no parseable clock time.
  const rawTime = (timeSlotLabel || '').split(' ')[0];
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(rawTime);

  if (!timeMatch) {
    // No specific time (e.g. all-day gym access) — treat the entire
    // calendar day as the session window.
    return new Date(year, month, day, 23, 59, 59, 999);
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const start = new Date(year, month, day, hours, minutes, 0, 0);
  return new Date(start.getTime() + (durationMins || 60) * 60000);
};

/** True once the booking's calendar day has fully elapsed (i.e. it's before today). */
export const isSessionPast = (
  dateStr: string,
  timeSlotLabel: string,
  durationMins: number
): boolean => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return getSessionEndDate(dateStr, timeSlotLabel, durationMins).getTime() < startOfToday.getTime();
};
