import { create } from 'zustand';
import { CalendarEvent, CreateCalendarEventForm } from '@/types/calendar';
import { mockCalendarEvents } from '@/data/calendarMock';
import { generateId, getTodayTimeString, addDays } from '@/utils/date';
import { useFamilyStore } from './useFamilyStore';

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  getEvents: () => CalendarEvent[];
  getMonthEvents: (year: number, month: number) => CalendarEvent[];
  getUpcomingEvents: (days?: number) => CalendarEvent[];
  addEvent: (form: CreateCalendarEventForm) => void;
  removeEvent: (eventId: string) => void;
  checkReminders: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: mockCalendarEvents,
  loading: false,

  getEvents: () => get().events,

  getMonthEvents: (year, month) => {
    return get().events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  },

  getUpcomingEvents: (days = 7) => {
    const today = new Date();
    const future = addDays(today, days);
    return get()
      .events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= future;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  addEvent: (form) => {
    const { currentUser } = useFamilyStore.getState();
    const newEvent: CalendarEvent = {
      id: generateId(),
      title: form.title,
      type: form.type,
      date: form.date,
      time: form.time,
      description: form.description,
      reminderDays: form.reminderDays,
      isNotified: false,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      createdAt: getTodayTimeString(),
    };

    set((state) => ({
      events: [...state.events, newEvent],
    }));

    console.log('[Calendar] 事件添加成功', { eventId: newEvent.id, title: newEvent.title });
  },

  removeEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }));
    console.log('[Calendar] 事件删除', { eventId });
  },

  checkReminders: () => {
    const today = new Date();
    set((state) => {
      let hasChanges = false;
      const updatedEvents = state.events.map((e) => {
        if (e.isNotified) return e;
        const eventDate = new Date(e.date);
        const reminderDate = addDays(eventDate, -e.reminderDays);
        if (
          reminderDate.toDateString() === today.toDateString() &&
          !e.isNotified
        ) {
          hasChanges = true;
          console.log('[Calendar] 发送日程提醒', {
            eventId: e.id,
            title: e.title,
            date: e.date,
          });
          return { ...e, isNotified: true };
        }
        return e;
      });
      return hasChanges ? { events: updatedEvents } : state;
    });
  },
}));
