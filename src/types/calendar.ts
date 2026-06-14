export type CalendarEventType = 'birthday' | 'meeting' | 'reminder' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  description?: string;
  reminderDays: number;
  isNotified: boolean;
  creatorId: string;
  creatorName: string;
  createdAt: string;
}

export interface CreateCalendarEventForm {
  title: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  description?: string;
  reminderDays: number;
}

export const CALENDAR_EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: 'birthday', label: '生日' },
  { value: 'meeting', label: '聚会' },
  { value: 'reminder', label: '提醒' },
  { value: 'other', label: '其他' },
];

export const REMINDER_DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '当天' },
  { value: 1, label: '提前1天' },
  { value: 3, label: '提前3天' },
  { value: 7, label: '提前7天' },
];
