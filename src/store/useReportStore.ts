import { create } from 'zustand';
import { DailyReport, TaskBrief } from '@/types/report';
import { mockDailyReports } from '@/data/reportMock';
import { getTodayTimeString, formatDate } from '@/utils/date';
import { useTaskStore } from './useTaskStore';
import { useNoticeStore } from './useNoticeStore';
import { useShoppingStore } from './useShoppingStore';
import { useFamilyStore } from './useFamilyStore';

interface ReportState {
  reports: DailyReport[];
  loading: boolean;
  getReports: () => DailyReport[];
  getLatestReport: () => DailyReport | undefined;
  getReportByDate: (date: string) => DailyReport | undefined;
  generateDailyReport: (dateStr?: string) => DailyReport;
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

  getReportByDate: (date) => {
    return get().reports.find((r) => r.date === date);
  },

  generateDailyReport: (dateStr) => {
    const taskStore = useTaskStore.getState();
    const noticeStore = useNoticeStore.getState();
    const shoppingStore = useShoppingStore.getState();
    const { family, currentUser } = useFamilyStore.getState();

    const targetDateStr = dateStr || formatDate(new Date());
    const targetDate = new Date(targetDateStr + 'T00:00:00');
    const targetDateEnd = new Date(targetDateStr + 'T23:59:59');

    const taskStats = taskStore.getTaskStats();
    const taskCompletionRate =
      taskStats.total > 0
        ? Math.round((taskStats.done / taskStats.total) * 100)
        : 100;

    const newTasks = taskStore.tasks
      .filter((t) => {
        if (!t.createdAt) return false;
        const cd = new Date(t.createdAt);
        return cd >= targetDate && cd <= targetDateEnd;
      })
      .map<TaskBrief>((t) => ({
        id: t.id,
        title: t.title,
        assigneeName: t.assigneeName,
        deadline: t.deadline,
        status: t.status,
      }));

    const doneTasks = taskStore.tasks
      .filter((t) => {
        if (!t.completedAt) return false;
        const cd = new Date(t.completedAt);
        return cd >= targetDate && cd <= targetDateEnd;
      })
      .map<TaskBrief>((t) => ({
        id: t.id,
        title: t.title,
        assigneeName: t.assigneeName,
        deadline: t.deadline,
        status: t.status,
      }));

    const overdueTaskList = taskStore.tasks
      .filter((t) => {
        if (t.status !== 'overdue') return false;
        const dl = new Date(t.deadline);
        return dl <= targetDateEnd;
      })
      .map<TaskBrief>((t) => ({
        id: t.id,
        title: t.title,
        assigneeName: t.assigneeName,
        deadline: t.deadline,
        status: t.status,
      }));

    const activeNotices = noticeStore.notices.filter((n) => !n.isExpired);
    const noticeReadRate = (() => {
      if (activeNotices.length === 0) return 100;
      const totalReads = activeNotices.reduce((sum, n) => sum + n.readCount, 0);
      const totalPossible = activeNotices.reduce((sum, n) => sum + n.totalMembers, 0);
      return totalPossible > 0 ? Math.round((totalReads / totalPossible) * 100) : 100;
    })();

    const readNotices = activeNotices.filter((n) => n.readBy.includes(currentUser.id)).length;

    const shoppingCompletionRate = shoppingStore.getCompletionRate();

    const memberContributions = family.members.map((member) => {
      const memberDoneTasksOnTargetDay = taskStore.tasks.filter((t) => {
        if (t.assigneeId !== member.id || t.status !== 'done') return false;
        if (!t.completedAt) return false;
        const cd = new Date(t.completedAt);
        return cd >= targetDate && cd <= targetDateEnd;
      });

      let earnedScore = 0;
      memberDoneTasksOnTargetDay.forEach((task) => {
        task.ratings.forEach((rating) => {
          earnedScore += rating.score;
        });
      });

      const addedItems = shoppingStore.items.filter(
        (i) => {
          if (!i.createdAt) return i.addedById === member.id;
          const cd = new Date(i.createdAt);
          return i.addedById === member.id && cd >= targetDate && cd <= targetDateEnd;
        }
      ).length;
      const checkedItems = shoppingStore.items.filter(
        (i) => {
          if (!i.checkedAt) return i.checkedById === member.id;
          const cd = new Date(i.checkedAt);
          return i.checkedById === member.id && cd >= targetDate && cd <= targetDateEnd;
        }
      ).length;

      return {
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        completedTasks: memberDoneTasksOnTargetDay.length,
        earnedScore: Math.round(earnedScore),
        addedShoppingItems: addedItems,
        checkedShoppingItems: checkedItems,
      };
    });

    const newReport: DailyReport = {
      id: `report_${targetDateStr}_${Date.now()}`,
      date: targetDateStr,
      taskCompletionRate,
      totalTasks: taskStats.total,
      completedTasks: taskStats.done,
      overdueTasks: overdueTaskList.length,
      newTasks,
      doneTasks,
      overdueTaskList,
      noticeReadRate,
      totalNotices: activeNotices.length,
      readNotices,
      shoppingCompletionRate,
      totalShoppingItems: shoppingStore.items.length,
      checkedShoppingItems: shoppingStore.items.filter((i) => i.isChecked).length,
      memberContributions,
      createdAt: getTodayTimeString(),
    };

    set((state) => {
      const filtered = state.reports.filter((r) => r.date !== newReport.date);
      const newArr = [newReport, ...filtered];
      newArr.sort((a, b) => (a.date < b.date ? 1 : -1));
      return { reports: newArr };
    });

    console.log('[Report] 每日简报生成完成', {
      date: newReport.date,
      taskCompletionRate,
      noticeReadRate,
      shoppingCompletionRate,
      newTasks: newTasks.length,
      doneTasks: doneTasks.length,
      overdueTasks: overdueTaskList.length,
    });

    return newReport;
  },

  getWeeklyAverage: () => {
    const reports = get().reports.slice(0, 7);
    if (reports.length === 0) return null;

    const avgTask = Math.round(
      reports.reduce((sum, r) => sum + r.taskCompletionRate, 0) / reports.length
    );
    const avgNotice = Math.round(
      reports.reduce((sum, r) => sum + r.noticeReadRate, 0) / reports.length
    );
    const avgShopping = Math.round(
      reports.reduce((sum, r) => sum + r.shoppingCompletionRate, 0) / reports.length
    );

    return {
      avgTaskCompletionRate: avgTask,
      avgNoticeReadRate: avgNotice,
      avgShoppingCompletionRate: avgShopping,
    };
  },
}));
