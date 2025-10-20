const DEFAULT_LOCALE = "ar-SA";

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DEFAULT_DATE_OPTIONS,
  hour: "2-digit",
  minute: "2-digit",
};

const safeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatAdminDate = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
): string => {
  const date = safeDate(value);
  return date
    ? new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(date)
    : "—";
};

export const formatAdminDateTime = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_OPTIONS,
): string => formatAdminDate(value, options);
