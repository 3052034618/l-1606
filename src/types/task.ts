export type TaskStatus = 'todo' | 'doing' | 'done' | 'overdue';

export type TaskRepeatCycle = 'none' | 'daily' | 'weekly' | 'monthly';

export interface TaskRating {
  fromUserId: string;
  fromUserName: string;
  score: number;
  comment?: string;
  createTime: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  creatorId: string;
  creatorName: string;
  assigneeId?: string;
  assigneeName?: string;
  deadline: string;
  repeatCycle: TaskRepeatCycle;
  createdAt: string;
  completedAt?: string;
  ratings: TaskRating[];
  averageScore?: number;
  isOverdueNotified: boolean;
}

export interface CreateTaskForm {
  title: string;
  description: string;
  deadline: string;
  repeatCycle: TaskRepeatCycle;
  assigneeId?: string;
}

export const TASK_REPEAT_OPTIONS: { value: TaskRepeatCycle; label: string }[] = [
  { value: 'none', label: '不重复' },
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: '待认领' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
  { value: 'overdue', label: '已逾期' },
];
