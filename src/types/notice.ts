export interface Notice {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  autoExpireAt: string;
  isExpired: boolean;
  readBy: string[];
  readCount: number;
  totalMembers: number;
}

export interface CreateNoticeForm {
  title: string;
  content: string;
  autoExpireHours: number;
}

export const NOTICE_EXPIRE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1小时后' },
  { value: 6, label: '6小时后' },
  { value: 12, label: '12小时后' },
  { value: 24, label: '1天后' },
  { value: 72, label: '3天后' },
  { value: 168, label: '7天后' },
];
