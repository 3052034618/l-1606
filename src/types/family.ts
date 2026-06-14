export type FamilyRole = 'admin' | 'member';

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: FamilyRole;
  joinDate: string;
  totalScore: number;
  taskCount: number;
}

export interface Family {
  id: string;
  name: string;
  createTime: string;
  members: FamilyMember[];
  currentUserId: string;
}

export interface Invitation {
  id: string;
  familyId: string;
  inviterName: string;
  expireTime: string;
}
