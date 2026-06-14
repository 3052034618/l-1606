import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(date);
};

export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isPast = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs());
};

export const isFuture = (date: string | Date): boolean => {
  return dayjs(date).isAfter(dayjs());
};

export const isDateBeforeToday = (date: string | Date): boolean => {
  return dayjs(date).startOf('day').isBefore(dayjs().startOf('day'));
};

export const addHours = (date: string | Date, hours: number): Date => {
  return dayjs(date).add(hours, 'hour').toDate();
};

export const addDays = (date: string | Date, days: number): Date => {
  return dayjs(date).add(days, 'day').toDate();
};

export const getTodayString = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getTodayDate = (): Date => {
  return new Date();
};

export const getTodayTimeString = (): string => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
};

export const getDaysInMonth = (year: number, month: number): number => {
  return dayjs(`${year}-${month + 1}-01`).daysInMonth();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return dayjs(`${year}-${month + 1}-01`).day();
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
