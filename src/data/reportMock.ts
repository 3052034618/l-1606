import { DailyReport } from '@/types/report';
import { addDays, getTodayString, getTodayTimeString } from '@/utils/date';
import { mockMembers } from './familyMock';

export const mockDailyReports: DailyReport[] = [
  {
    id: 'report_1',
    date: addDays(new Date(), -1).toISOString().split('T')[0],
    taskCompletionRate: 75,
    totalTasks: 8,
    completedTasks: 6,
    overdueTasks: 1,
    noticeReadRate: 80,
    totalNotices: 5,
    readNotices: 4,
    shoppingCompletionRate: 60,
    totalShoppingItems: 10,
    checkedShoppingItems: 6,
    memberContributions: [
      {
        memberId: 'user_2',
        memberName: '妈妈',
        avatar: mockMembers[1].avatar,
        completedTasks: 3,
        earnedScore: 15,
        addedShoppingItems: 4,
        checkedShoppingItems: 2,
      },
      {
        memberId: 'user_1',
        memberName: '爸爸',
        avatar: mockMembers[0].avatar,
        completedTasks: 2,
        earnedScore: 9,
        addedShoppingItems: 2,
        checkedShoppingItems: 3,
      },
      {
        memberId: 'user_4',
        memberName: '小红',
        avatar: mockMembers[3].avatar,
        completedTasks: 1,
        earnedScore: 4,
        addedShoppingItems: 2,
        checkedShoppingItems: 1,
      },
      {
        memberId: 'user_3',
        memberName: '小明',
        avatar: mockMembers[2].avatar,
        completedTasks: 0,
        earnedScore: 0,
        addedShoppingItems: 2,
        checkedShoppingItems: 0,
      },
    ],
    createdAt: addDays(new Date(), 0).toISOString(),
  },
  {
    id: 'report_2',
    date: addDays(new Date(), -2).toISOString().split('T')[0],
    taskCompletionRate: 88,
    totalTasks: 8,
    completedTasks: 7,
    overdueTasks: 0,
    noticeReadRate: 100,
    totalNotices: 3,
    readNotices: 3,
    shoppingCompletionRate: 78,
    totalShoppingItems: 9,
    checkedShoppingItems: 7,
    memberContributions: [
      {
        memberId: 'user_1',
        memberName: '爸爸',
        avatar: mockMembers[0].avatar,
        completedTasks: 3,
        earnedScore: 14,
        addedShoppingItems: 3,
        checkedShoppingItems: 4,
      },
      {
        memberId: 'user_2',
        memberName: '妈妈',
        avatar: mockMembers[1].avatar,
        completedTasks: 2,
        earnedScore: 10,
        addedShoppingItems: 3,
        checkedShoppingItems: 2,
      },
      {
        memberId: 'user_3',
        memberName: '小明',
        avatar: mockMembers[2].avatar,
        completedTasks: 1,
        earnedScore: 5,
        addedShoppingItems: 2,
        checkedShoppingItems: 1,
      },
      {
        memberId: 'user_4',
        memberName: '小红',
        avatar: mockMembers[3].avatar,
        completedTasks: 1,
        earnedScore: 5,
        addedShoppingItems: 1,
        checkedShoppingItems: 0,
      },
    ],
    createdAt: addDays(new Date(), -1).toISOString(),
  },
  {
    id: 'report_3',
    date: addDays(new Date(), -3).toISOString().split('T')[0],
    taskCompletionRate: 63,
    totalTasks: 8,
    completedTasks: 5,
    overdueTasks: 2,
    noticeReadRate: 67,
    totalNotices: 3,
    readNotices: 2,
    shoppingCompletionRate: 50,
    totalShoppingItems: 8,
    checkedShoppingItems: 4,
    memberContributions: [
      {
        memberId: 'user_2',
        memberName: '妈妈',
        avatar: mockMembers[1].avatar,
        completedTasks: 2,
        earnedScore: 9,
        addedShoppingItems: 2,
        checkedShoppingItems: 2,
      },
      {
        memberId: 'user_1',
        memberName: '爸爸',
        avatar: mockMembers[0].avatar,
        completedTasks: 2,
        earnedScore: 8,
        addedShoppingItems: 3,
        checkedShoppingItems: 1,
      },
      {
        memberId: 'user_4',
        memberName: '小红',
        avatar: mockMembers[3].avatar,
        completedTasks: 1,
        earnedScore: 4,
        addedShoppingItems: 2,
        checkedShoppingItems: 1,
      },
      {
        memberId: 'user_3',
        memberName: '小明',
        avatar: mockMembers[2].avatar,
        completedTasks: 0,
        earnedScore: 0,
        addedShoppingItems: 1,
        checkedShoppingItems: 0,
      },
    ],
    createdAt: addDays(new Date(), -2).toISOString(),
  },
];

export const getLatestReport = (): DailyReport | undefined => {
  return mockDailyReports[0];
};

export const getWeeklyAverage = () => {
  const reports = mockDailyReports.slice(0, 7);
  if (reports.length === 0) return null;

  return {
    avgTaskCompletionRate: Math.round(
      reports.reduce((sum, r) => sum + r.taskCompletionRate, 0) / reports.length
    ),
    avgNoticeReadRate: Math.round(
      reports.reduce((sum, r) => sum + r.noticeReadRate, 0) / reports.length
    ),
    avgShoppingCompletionRate: Math.round(
      reports.reduce((sum, r) => sum + r.shoppingCompletionRate, 0) / reports.length
    ),
  };
};
