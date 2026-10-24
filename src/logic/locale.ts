const detect = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    return 'en-US';
  }
};

/** The phone's locale, used for dates, month names and number formatting. */
export const deviceLocale = detect();

const region = deviceLocale.split('-').pop()?.toUpperCase() ?? '';

// Regions where calendars conventionally start on Sunday.
const SUNDAY_FIRST = new Set(['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'TW', 'HK', 'IL', 'PH', 'IN', 'SA', 'ZA']);
export const weekStartsOnSunday = SUNDAY_FIRST.has(region);

export const decimalSeparator = (() => {
  try {
    return (1.5).toLocaleString(deviceLocale).replace(/\d/g, '') || '.';
  } catch {
    return '.';
  }
})();
