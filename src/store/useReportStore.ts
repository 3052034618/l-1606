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

  getReportByDate: (date) => {
    return get().reports.find((r) => r.date === date);
  },

  generateDailyReport: () => {
    const taskStore = useTaskStore.getState();
    const noticeStore = useNoticeStore.getState();
    const shoppingStore = useShoppingStore.getState();
    const { family, currentUser } = useFamilyStore.getState();

    const todayStr = formatDate(new Date());

    const taskStats = taskStore.getTaskStats();
    const taskCompletionRate =
      taskStats.total > 0
        ? Math.round((taskStats.done / taskStats.total) * 100)
        : 100;

    const newTasks = taskStore.tasks
      .filter((t) => {
        if (!t.createdAt) return false;
        return formatDate(new Date(t.createdAt)) === todayStr;
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
        return formatDate(new Date(t.completedAt)) === todayStr;
      })
      .map<TaskBrief>((t) => ({
        id: t.id,
        title: t.title,
        assigneeName: t.assigneeName,
        deadline: t.deadline,
        status: t.status,
      }));

    const overdueTaskList = taskStore.tasks
      .filter((t) => t.status === 'overdue')
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
      const memberTasks = taskStore.tasks.filter(
        (t) => t.assigneeId === member.id && t.status === 'done'
      );
      const completedToday = memberTasks.filter((t) => {
        if (!t.completedAt) return false;
        return formatDate(new Date(t.completedAt)) === todayStr;
      }).length;

      const ratingsForMember = memberTasks
        .flatMap((t) => t.ratings)
        .filter((r, index, arr) => {
          const firstIdx = arr.findIndex(
            (x) => x.fromUserId === r.fromUserId
          );
          return firstIdx === index;
        });
      const earnedScore = ratingsForMember.reduce((sum, r) => sum + r.score, 0);

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
      date: todayStr,
      taskCompletionRate,
      totalTasks: taskStats.total,
      completedTasks: taskStats.done,
      overdueTasks: taskStats.overdue,
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
      return { reports: [newReport, ...filtered] };
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
