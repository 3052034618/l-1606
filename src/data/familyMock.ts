import { Family, FamilyMember } from '@/types/family';
import { getTodayTimeString, addDays } from '@/utils/date';

export const mockMembers: FamilyMember[] = [
  {
    id: 'user_1',
    name: '爸爸',
    avatar: 'https://picsum.photos/id/1005/200/200',
    role: 'admin',
    joinDate: addDays(new Date(), -100).toISOString(),
    totalScore: 156,
    taskCount: 45,
  },
  {
    id: 'user_2',
    name: '妈妈',
    avatar: 'https://picsum.photos/id/1011/200/200',
    role: 'admin',
    joinDate: addDays(new Date(), -100).toISOString(),
    totalScore: 203,
    taskCount: 58,
  },
  {
    id: 'user_3',
    name: '小明',
    avatar: 'https://picsum.photos/id/1012/200/200',
    role: 'member',
    joinDate: addDays(new Date(), -80).toISOString(),
    totalScore: 89,
    taskCount: 28,
  },
  {
    id: 'user_4',
    name: '小红',
    avatar: 'https://picsum.photos/id/1027/200/200',
    role: 'member',
    joinDate: addDays(new Date(), -80).toISOString(),
    totalScore: 75,
    taskCount: 22,
  },
];

export const mockFamily: Family = {
  id: 'family_1',
  name: '幸福一家人',
  createTime: addDays(new Date(), -100).toISOString(),
  members: mockMembers,
  currentUserId: 'user_1',
};

export const getCurrentUser = (): FamilyMember => {
  return mockMembers.find((m) => m.id === mockFamily.currentUserId) || mockMembers[0];
};
