import { create } from 'zustand';
import { Task, TaskStatus, CreateTaskForm, TaskRating } from '@/types/task';
import { mockTasks } from '@/data/taskMock';
import { generateId, getTodayTimeString, isPast } from '@/utils/date';
import { validateTaskDeadline, validateTaskRepeatCycle, validateTaskTitle } from '@/utils/validator';
import { useFamilyStore } from './useFamilyStore';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  filter: TaskStatus | 'all';
  setFilter: (filter: TaskStatus | 'all') => void;
  getTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  createTask: (form: CreateTaskForm) => { success: boolean; message?: string };
  claimTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  rateTask: (taskId: string, score: number, comment?: string) => void;
  checkOverdueTasks: () => void;
  getTodayTasksCount: () => number;
  getOverdueTasksCount: () => number;
  getTaskStats: () => { total: number; todo: number; doing: number; done: number; overdue: number };
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: mockTasks,
  loading: false,
  filter: 'all',

  setFilter: (filter) => set({ filter }),

  getTasks: () => {
    const { tasks, filter } = get();
    get().checkOverdueTasks();
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  },

  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id);
  },

  createTask: (form) => {
    const titleValidation = validateTaskTitle(form.title);
    if (!titleValidation.valid) {
      return { success: false, message: titleValidation.message };
    }

    const deadlineValidation = validateTaskDeadline(form.deadline);
    if (!deadlineValidation.valid) {
      return { success: false, message: deadlineValidation.message };
    }

    const cycleValidation = validateTaskRepeatCycle(form.repeatCycle);
    if (!cycleValidation.valid) {
      return { success: false, message: cycleValidation.message };
    }

    const { currentUser } = useFamilyStore.getState();
    const newTask: Task = {
      id: generateId(),
      title: form.title,
      description: form.description,
      status: form.assigneeId ? 'doing' : 'todo',
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      assigneeId: form.assigneeId,
      assigneeName: form.assigneeId
        ? useFamilyStore.getState().getMemberById(form.assigneeId)?.name
        : undefined,
      deadline: form.deadline,
      repeatCycle: form.repeatCycle,
      createdAt: getTodayTimeString(),
      ratings: [],
      isOverdueNotified: false,
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));

    console.log('[Task] 任务创建成功', { taskId: newTask.id, title: newTask.title });
    return { success: true };
  },

  claimTask: (taskId) => {
    const { currentUser } = useFamilyStore.getState();
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'doing',
              assigneeId: currentUser.id,
              assigneeName: currentUser.name,
            }
          : t
      ),
    }));
    console.log('[Task] 任务认领成功', { taskId, userId: currentUser.id });
  },

  completeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'done',
              completedAt: getTodayTimeString(),
            }
          : t
      ),
    }));
    console.log('[Task] 任务完成', { taskId });
  },

  rateTask: (taskId, score, comment) => {
    const { currentUser, isCurrentUserAdmin } = useFamilyStore.getState();

    if (!isCurrentUserAdmin()) {
      console.log('[Task] 非管理员无法评分', { userId: currentUser.id });
      return;
    }

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;

        const existingIdx = t.ratings.findIndex(
          (r) => r.fromUserId === currentUser.id
        );

        let newRatings: TaskRating[];
        if (existingIdx >= 0) {
          newRatings = t.ratings.map((r, idx) =>
            idx === existingIdx
              ? { ...r, score, comment, createTime: getTodayTimeString() }
              : r
          );
        } else {
          const rating: TaskRating = {
            fromUserId: currentUser.id,
            fromUserName: currentUser.name,
            score,
            comment,
            createTime: getTodayTimeString(),
          };
          newRatings = [...t.ratings, rating];
        }

        const uniqueMap = new Map<string, TaskRating>();
        newRatings.forEach((r) => uniqueMap.set(r.fromUserId, r));
        const dedupedRatings = Array.from(uniqueMap.values());

        const averageScore = Math.round(
          dedupedRatings.reduce((sum, r) => sum + r.score, 0) / dedupedRatings.length * 10
        ) / 10;

        console.log('[Task] 任务评分完成', {
          taskId,
          fromUser: currentUser.name,
          score,
          isUpdate: existingIdx >= 0,
          averageScore,
        });

        return { ...t, ratings: dedupedRatings, averageScore };
      }),
    }));
  },

  checkOverdueTasks: () => {
    const now = new Date();
    set((state) => {
      let hasChanges = false;
      const updatedTasks = state.tasks.map((t) => {
        if (t.status === 'done' || t.status === 'overdue') return t;
        if (isPast(t.deadline) && new Date(t.deadline).toDateString() !== now.toDateString()) {
          hasChanges = true;
          if (!t.isOverdueNotified) {
            console.log('[Task] 任务逾期，通知管理员', { taskId: t.id, title: t.title });
          }
          return { ...t, status: 'overdue' as const, isOverdueNotified: true };
        }
        return t;
      });
      return hasChanges ? { tasks: updatedTasks } : state;
    });
  },

  getTodayTasksCount: () => {
    const today = new Date().toDateString();
    return get().tasks.filter(
      (t) =>
        (t.status === 'todo' || t.status === 'doing') &&
        new Date(t.deadline).toDateString() === today
    ).length;
  },

  getOverdueTasksCount: () => {
    return get().tasks.filter((t) => t.status === 'overdue').length;
  },

  getTaskStats: () => {
    const tasks = get().tasks;
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      doing: tasks.filter((t) => t.status === 'doing').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => t.status === 'overdue').length,
    };
  },
}));
