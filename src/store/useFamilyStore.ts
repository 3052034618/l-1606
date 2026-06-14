import { create } from 'zustand';
import { Family, FamilyMember, FamilyRole } from '@/types/family';
import { mockFamily, mockMembers, getCurrentUser } from '@/data/familyMock';
import { generateId, getTodayTimeString } from '@/utils/date';

const AVATAR_POOL = [
  'https://picsum.photos/seed/fm1/100/100',
  'https://picsum.photos/seed/fm2/100/100',
  'https://picsum.photos/seed/fm3/100/100',
  'https://picsum.photos/seed/fm4/100/100',
  'https://picsum.photos/seed/fm5/100/100',
  'https://picsum.photos/seed/fm6/100/100',
  'https://picsum.photos/seed/fm7/100/100',
  'https://picsum.photos/seed/fm8/100/100',
];

interface FamilyState {
  family: Family;
  currentUser: FamilyMember;
  loading: boolean;
  setFamily: (family: Family) => void;
  updateMemberRole: (memberId: string, role: FamilyRole) => { success: boolean; message?: string };
  addMember: (data: { name: string; role?: FamilyRole; avatar?: string }) => {
    success: boolean;
    message?: string;
    member?: FamilyMember;
  };
  removeMember: (memberId: string) => { success: boolean; message?: string };
  getMemberById: (id: string) => FamilyMember | undefined;
  isCurrentUserAdmin: () => boolean;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: mockFamily,
  currentUser: getCurrentUser(),
  loading: false,

  setFamily: (family) => set({ family }),

  updateMemberRole: (memberId, role) => {
    const state = get();
    const exists = state.family.members.some((m) => m.id === memberId);
    if (!exists) {
      console.log('[Family] 设置角色失败，成员不存在', { memberId });
      return { success: false, message: '成员不存在' };
    }
    set({
      family: {
        ...state.family,
        members: state.family.members.map((m) =>
          m.id === memberId ? { ...m, role } : m
        ),
      },
    });
    console.log('[Family] 成员角色更新成功', { memberId, role });
    return { success: true };
  },

  addMember: ({ name, role = 'member', avatar }) => {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      console.log('[Family] 添加成员失败：名称为空');
      return { success: false, message: '成员名称不能为空' };
    }
    if (trimmedName.length > 20) {
      return { success: false, message: '成员名称长度超过限制（20字）' };
    }
    const state = get();
    if (state.family.members.some((m) => m.name === trimmedName)) {
      return { success: false, message: '家庭中已有同名成员' };
    }
    const poolIdx = state.family.members.length % AVATAR_POOL.length;
    const finalAvatar = avatar || AVATAR_POOL[poolIdx];
    const newMember: FamilyMember = {
      id: generateId(),
      name: trimmedName,
      avatar: finalAvatar,
      role,
      joinDate: getTodayTimeString(),
      totalScore: 0,
      taskCount: 0,
    };
    set({
      family: {
        ...state.family,
        members: [...state.family.members, newMember],
      },
    });
    console.log('[Family] 成员添加成功', { memberName: trimmedName });
    return { success: true, member: newMember };
  },

  removeMember: (memberId) => {
    const state = get();
    if (memberId === state.currentUser.id) {
      return { success: false, message: '不能移除自己' };
    }
    const exists = state.family.members.some((m) => m.id === memberId);
    if (!exists) {
      return { success: false, message: '成员不存在' };
    }
    set({
      family: {
        ...state.family,
        members: state.family.members.filter((m) => m.id !== memberId),
      },
    });
    console.log('[Family] 成员移除成功', { memberId });
    return { success: true };
  },

  getMemberById: (id) => {
    return get().family.members.find((m) => m.id === id);
  },

  isCurrentUserAdmin: () => {
    return get().currentUser.role === 'admin';
  },
}));
