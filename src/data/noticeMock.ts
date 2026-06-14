import { Notice } from '@/types/notice';
import { addHours, addDays, getTodayTimeString } from '@/utils/date';

export const mockNotices: Notice[] = [
  {
    id: 'notice_1',
    title: '周末家庭聚餐',
    content: '本周六晚上6点在家聚餐，请大家准时参加。妈妈准备做红烧肉和糖醋排骨，有想吃的菜可以提前说。',
    creatorId: 'user_2',
    creatorName: '妈妈',
    createdAt: addDays(new Date(), -1).toISOString(),
    autoExpireAt: addDays(new Date(), 3).toISOString(),
    isExpired: false,
    readBy: ['user_1', 'user_3'],
    readCount: 2,
    totalMembers: 4,
  },
  {
    id: 'notice_2',
    title: '水电费已缴纳',
    content: '本月水电费已缴纳，共计328元。大家注意节约用水用电。',
    creatorId: 'user_1',
    creatorName: '爸爸',
    createdAt: addDays(new Date(), -2).toISOString(),
    autoExpireAt: addHours(new Date(), 12).toISOString(),
    isExpired: false,
    readBy: ['user_1', 'user_2', 'user_3', 'user_4'],
    readCount: 4,
    totalMembers: 4,
  },
  {
    id: 'notice_3',
    title: '小明考试成绩公布',
    content: '小明这次期末考试考得不错，数学98分，语文92分，英语95分。继续保持！周末奖励去游乐园。',
    creatorId: 'user_1',
    creatorName: '爸爸',
    createdAt: addDays(new Date(), -3).toISOString(),
    autoExpireAt: addDays(new Date(), 7).toISOString(),
    isExpired: false,
    readBy: ['user_1', 'user_2'],
    readCount: 2,
    totalMembers: 4,
  },
  {
    id: 'notice_4',
    title: '快递到了',
    content: '快递放在门口保安室了，记得下班回家时取一下。',
    creatorId: 'user_2',
    creatorName: '妈妈',
    createdAt: addHours(new Date(), -2).toISOString(),
    autoExpireAt: addHours(new Date(), 4).toISOString(),
    isExpired: false,
    readBy: ['user_2'],
    readCount: 1,
    totalMembers: 4,
  },
  {
    id: 'notice_5',
    title: '下周三家电维修',
    content: '下周三上午9点有人来修空调，请大家安排好时间留人在家。',
    creatorId: 'user_1',
    creatorName: '爸爸',
    createdAt: addDays(new Date(), 0).toISOString(),
    autoExpireAt: addDays(new Date(), 5).toISOString(),
    isExpired: false,
    readBy: ['user_1', 'user_2'],
    readCount: 2,
    totalMembers: 4,
  },
];

export const getUnreadNotices = (userId: string): Notice[] => {
  return mockNotices.filter((notice) => !notice.readBy.includes(userId) && !notice.isExpired);
};

export const getActiveNotices = (): Notice[] => {
  return mockNotices.filter((notice) => !notice.isExpired);
};
