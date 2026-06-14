import { create } from 'zustand';
import { Family, FamilyMember, FamilyRole } from '@/types/family';
import { mockFamily, mockMembers, getCurrentUser } from '@/data/familyMock';
import { generateId, getTodayTimeString } from '@/utils/date';

interface FamilyState {
  family: Family;
  currentUser: FamilyMember;
  loading: boolean;
  setFamily: (family: Family) => void;
  updateMemberRole: (memberId: string, role: FamilyRole) => void;
  addMember: (name: string, avatar: string) => void;
  removeMember: (memberId: string) => void;
  getMemberById: (id: string) => FamilyMember | undefined;
  isCurrentUserAdmin: () => boolean;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: mockFamily,
  currentUser: getCurrentUser(),
  loading: false,

  setFamily: (family) => set({ family }),

  updateMemberRole: (memberId, role) =>
    set((state) => ({
      family: {
        ...state.family,
        members: state.family.members.map((m) =>
          m.id === memberId ? { ...m, role } : m
        ),
      },
    })),

  addMember: (name, avatar) =>
    set((state) => ({
      family: {
        ...state.family,
        members: [
          ...state.family.members,
          {
            id: generateId(),
            name,
            avatar,
            role: 'member',
            joinDate: getTodayTimeString(),
            totalScore: 0,
            taskCount: 0,
          },
        ],
      },
    })),

  removeMember: (memberId) =>
    set((state) => ({
      family: {
        ...state.family,
        members: state.family.members.filter((m) => m.id !== memberId),
      },
    })),

  getMemberById: (id) => {
    return get().family.members.find((m) => m.id === id);
  },

  isCurrentUserAdmin: () => {
    return get().currentUser.role === 'admin';
  },
}));
