import { create } from 'zustand';
import { DailyReport } from '@/types/report';
import { mockDailyReports, getLatestReport, getWeeklyAverage } from '@/data/reportMock';
import { getTodayTimeString } from '@/utils/date';
import { useTaskStore } from './useTaskStore';
import { useNoticeStore } from './useNoticeStore';
import { useShoppingStore } from './useShoppingStore';
import { useFamilyStore } from './useFamilyStore';

interface ReportState {
  reports: DailyReport[];
  loading: boolean;
  getReports: () => DailyReport[];
  getLatestReport: () => DailyReport | undefined;
  generateDailyReport: () => DailyReport;
  getWeeklyAverage: () => {
    avgTaskCompletionRate: number;
    avgNoticeReadRate: number;
    avgShoppingCompletionRate: number;
  } | null;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: mockDailyReports,
  loading: false,

  getReports: () => get().reports,

  getLatestReport: () => {
    const reports = get().reports;
    return reports.length > 0 ? reports[0] : undefined;
  },

  generateDailyReport: () => {
    const taskStore = useTaskStore.getState();
    const noticeStore = useNoticeStore.getState();
    const shoppingStore = useShoppingStore.getState();
    const { family } = useFamilyStore.getState();

    const taskStats = taskStore.getTaskStats();
    const taskCompletionRate =
      taskStats.total > 0
        ? Math.round((taskStats.done / (taskStats.total - taskStats.overdue)) * 100)
        : 100;

    const noticeReadRate = noticeStore.getReadRate();
    const shoppingCompletionRate = shoppingStore.getCompletionRate();

    const memberContributions = family.members.map((member) => {
      const memberTasks = taskStore.tasks.filter(
        (t) => t.assigneeId === member.id && t.status === 'done'
      );
      const completedToday = memberTasks.filter((t) => {
        if (!t.completedAt) return false;
        return (
          new Date(t.completedAt).toDateString() === new Date().toDateString()
        );
      }).length;

      const earnedScore = memberTasks
        .map((t) => t.averageScore || 0)
        .reduce((a, b) => a + b, 0);

      const addedItems = shoppingStore.items.filter(
        (i) => i.addedById === member.id
      ).length;
      const checkedItems = shoppingStore.items.filter(
        (i) => i.checkedById === member.id
      ).length;

      return {
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        completedTasks: completedToday,
        earnedScore: Math.round(earnedScore),
        addedShoppingItems: addedItems,
        checkedShoppingItems: checkedItems,
      };
    });

    const newReport: DailyReport = {
      id: `report_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      taskCompletionRate,
      totalTasks: taskStats.total,
      completedTasks: taskStats.done,
      overdueTasks: taskStats.overdue,
      noticeReadRate,
      totalNotices: noticeStore.notices.filter((n) => !n.isExpired).length,
      readNotices: noticeStore.notices.filter((n) => !n.isExpired && n.readCount > 0).length,
      shoppingCompletionRate,
      totalShoppingItems: shoppingStore.items.length,
      checkedShoppingItems: shoppingStore.items.filter((i) => i.isChecked).length,
      memberContributions,
      createdAt: getTodayTimeString(),
    };

    set((state) => ({
      reports: [newReport, ...state.reports],
    }));

    console.log('[Report] 每日简报生成完成', {
      date: newReport.date,
      taskCompletionRate,
      noticeReadRate,
      shoppingCompletionRate,
    });

    return newReport;
  },

  getWeeklyAverage: () => {
    return getWeeklyAverage();
  },
}));
