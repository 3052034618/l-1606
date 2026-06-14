import { create } from 'zustand';
import { Notice, CreateNoticeForm } from '@/types/notice';
import { mockNotices } from '@/data/noticeMock';
import { generateId, getTodayTimeString, addHours, isPast } from '@/utils/date';
import {
  validateNoticeTitle,
  validateNoticeContent,
  validateNoticeExpireHours,
} from '@/utils/validator';
import { useFamilyStore } from './useFamilyStore';

interface NoticeState {
  notices: Notice[];
  loading: boolean;
  getNotices: () => Notice[];
  getAllNotices: () => Notice[];
  getActiveNotices: () => Notice[];
  getExpiredNotices: () => Notice[];
  getNoticeById: (id: string) => Notice | undefined;
  createNotice: (form: CreateNoticeForm) => { success: boolean; message?: string };
  markAsRead: (noticeId: string) => void;
  checkExpiredNotices: () => void;
  getUnreadCount: (userId: string) => number;
  getReadRate: () => number;
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
  notices: mockNotices,
  loading: false,

  getNotices: () => {
    get().checkExpiredNotices();
    return get().notices.filter((n) => !n.isExpired);
  },

  getAllNotices: () => {
    get().checkExpiredNotices();
    return get().notices;
  },

  getActiveNotices: () => {
    get().checkExpiredNotices();
    return get().notices.filter((n) => !n.isExpired);
  },

  getExpiredNotices: () => {
    get().checkExpiredNotices();
    return get().notices.filter((n) => n.isExpired);
  },

  getNoticeById: (id) => {
    return get().notices.find((n) => n.id === id);
  },

  createNotice: (form) => {
    const titleValidation = validateNoticeTitle(form.title);
    if (!titleValidation.valid) {
      return { success: false, message: titleValidation.message };
    }

    const contentValidation = validateNoticeContent(form.content);
    if (!contentValidation.valid) {
      return { success: false, message: contentValidation.message };
    }

    const expireValidation = validateNoticeExpireHours(form.autoExpireHours);
    if (!expireValidation.valid) {
      return { success: false, message: expireValidation.message };
    }

    const { currentUser, family } = useFamilyStore.getState();
    const newNotice: Notice = {
      id: generateId(),
      title: form.title,
      content: form.content,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      createdAt: getTodayTimeString(),
      autoExpireAt: addHours(new Date(), form.autoExpireHours).toISOString(),
      isExpired: false,
      readBy: [currentUser.id],
      readCount: 1,
      totalMembers: family.members.length,
    };

    set((state) => ({
      notices: [newNotice, ...state.notices],
    }));

    console.log('[Notice] 公告创建成功', { noticeId: newNotice.id, title: newNotice.title });
    return { success: true };
  },

  markAsRead: (noticeId) => {
    const { currentUser } = useFamilyStore.getState();
    set((state) => ({
      notices: state.notices.map((n) => {
        if (n.id !== noticeId || n.readBy.includes(currentUser.id)) return n;
        return {
          ...n,
          readBy: [...n.readBy, currentUser.id],
          readCount: n.readCount + 1,
        };
      }),
    }));
    console.log('[Notice] 公告已读', { noticeId, userId: currentUser.id });
  },

  checkExpiredNotices: () => {
    set((state) => {
      let hasChanges = false;
      const updatedNotices = state.notices.map((n) => {
        if (n.isExpired) return n;
        if (isPast(n.autoExpireAt)) {
          hasChanges = true;
          return { ...n, isExpired: true };
        }
        return n;
      });
      return hasChanges ? { notices: updatedNotices } : state;
    });
  },

  getUnreadCount: (userId) => {
    get().checkExpiredNotices();
    return get().notices.filter((n) => !n.isExpired && !n.readBy.includes(userId)).length;
  },

  getReadRate: () => {
    const notices = get().notices.filter((n) => !n.isExpired);
    if (notices.length === 0) return 100;
    const totalReads = notices.reduce((sum, n) => sum + n.readCount, 0);
    const totalPossible = notices.reduce((sum, n) => sum + n.totalMembers, 0);
    return totalPossible > 0 ? Math.round((totalReads / totalPossible) * 100) : 100;
  },
}));
