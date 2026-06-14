export interface TaskBrief {
  id: string;
  title: string;
  assigneeName?: string;
  deadline: string;
  status: string;
}

export interface DailyReport {
  id: string;
  date: string;
  taskCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  newTasks?: TaskBrief[];
  doneTasks?: TaskBrief[];
  overdueTaskList?: TaskBrief[];
  noticeReadRate: number;
  totalNotices: number;
  readNotices: number;
  shoppingCompletionRate: number;
  totalShoppingItems: number;
  checkedShoppingItems: number;
  memberContributions: MemberContribution[];
  createdAt: string;
}

export interface MemberContribution {
  memberId: string;
  memberName: string;
  avatar: string;
  completedTasks: number;
  earnedScore: number;
  addedShoppingItems: number;
  checkedShoppingItems: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  avgTaskCompletionRate: number;
  avgNoticeReadRate: number;
  avgShoppingCompletionRate: number;
  topContributors: MemberContribution[];
}
