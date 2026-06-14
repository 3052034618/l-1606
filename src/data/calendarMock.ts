import { CalendarEvent } from '@/types/calendar';
import { addDays, getTodayTimeString } from '@/utils/date';

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event_1',
    title: '爸爸生日',
    type: 'birthday',
    date: addDays(new Date(), 5).toISOString().split('T')[0],
    time: '18:00',
    description: '爸爸的40岁生日，记得准备礼物',
    reminderDays: 3,
    isNotified: false,
    creatorId: 'user_2',
    creatorName: '妈妈',
    createdAt: addDays(new Date(), -10).toISOString(),
  },
  {
    id: 'event_2',
    title: '家庭聚会',
    type: 'meeting',
    date: addDays(new Date(), 7).toISOString().split('T')[0],
    time: '12:00',
    description: '爷爷奶奶来家里吃饭',
    reminderDays: 1,
    isNotified: false,
    creatorId: 'user_1',
    creatorName: '爸爸',
    createdAt: addDays(new Date(), -5).toISOString(),
  },
  {
    id: 'event_3',
    title: '交物业费',
    type: 'reminder',
    date: addDays(new Date(), 10).toISOString().split('T')[0],
    description: '本季度物业费',
    reminderDays: 1,
    isNotified: false,
    creatorId: 'user_1',
    creatorName: '爸爸',
    createdAt: addDays(new Date(), -3).toISOString(),
  },
  {
    id: 'event_4',
    title: '小红生日',
    type: 'birthday',
    date: addDays(new Date(), 20).toISOString().split('T')[0],
    time: '19:00',
    description: '小红10岁生日',
    reminderDays: 7,
    isNotified: false,
    creatorId: 'user_2',
    creatorName: '妈妈',
    createdAt: addDays(new Date(), -1).toISOString(),
  },
  {
    id: 'event_5',
    title: '小明家长会',
    type: 'other',
    date: addDays(new Date(), 3).toISOString().split('T')[0],
    time: '14:00',
    description: '下午2点学校家长会',
    reminderDays: 1,
    isNotified: false,
    creatorId: 'user_2',
    creatorName: '妈妈',
    createdAt: addDays(new Date(), 0).toISOString(),
  },
  {
    id: 'event_6',
    title: '结婚纪念日',
    type: 'other',
    date: addDays(new Date(), 30).toISOString().split('T')[0],
    time: '18:30',
    description: '结婚15周年纪念',
    reminderDays: 7,
    isNotified: false,
    creatorId: 'user_1',
    creatorName: '爸爸',
    createdAt: addDays(new Date(), 0).toISOString(),
  },
];

export const getMonthEvents = (year: number, month: number): CalendarEvent[] => {
  return mockCalendarEvents.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
};

export const getUpcomingEvents = (days = 7): CalendarEvent[] => {
  const today = new Date();
  const future = addDays(today, days);
  return mockCalendarEvents
    .filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= future;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
