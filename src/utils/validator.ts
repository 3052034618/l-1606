import { isDateBeforeToday, getTodayString } from './date';
import { TASK_REPEAT_OPTIONS } from '@/types/task';
import { NOTICE_EXPIRE_OPTIONS } from '@/types/notice';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const validateTaskDeadline = (deadline: string): ValidationResult => {
  if (!deadline) {
    return { valid: false, message: '请选择截止日期' };
  }

  if (isDateBeforeToday(deadline)) {
    return {
      valid: false,
      message: `截止日期不得早于今天（${getTodayString()}），请重新选择`,
    };
  }

  return { valid: true };
};

export const validateTaskRepeatCycle = (cycle: string): ValidationResult => {
  const validValues = TASK_REPEAT_OPTIONS.map((opt) => opt.value);
  if (!validValues.includes(cycle as any)) {
    return {
      valid: false,
      message: `重复周期仅限预设选项：${validValues.join('、')}`,
    };
  }
  return { valid: true };
};

export const validateTaskTitle = (title: string): ValidationResult => {
  if (!title || title.trim().length === 0) {
    return { valid: false, message: '请输入任务标题' };
  }
  if (title.length > 50) {
    return { valid: false, message: '任务标题不能超过50个字符' };
  }
  return { valid: true };
};

export const validateNoticeExpireHours = (hours: number): ValidationResult => {
  const validValues = NOTICE_EXPIRE_OPTIONS.map((opt) => opt.value);
  if (!validValues.includes(hours)) {
    return {
      valid: false,
      message: `自动消失时间仅限预设选项`,
    };
  }
  return { valid: true };
};

export const validateNoticeTitle = (title: string): ValidationResult => {
  if (!title || title.trim().length === 0) {
    return { valid: false, message: '请输入公告标题' };
  }
  if (title.length > 30) {
    return { valid: false, message: '公告标题不能超过30个字符' };
  }
  return { valid: true };
};

export const validateNoticeContent = (content: string): ValidationResult => {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: '请输入公告内容' };
  }
  if (content.length > 500) {
    return { valid: false, message: '公告内容不能超过500个字符' };
  }
  return { valid: true };
};

export const validateShoppingItemName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: '请输入商品名称' };
  }
  if (name.length > 30) {
    return { valid: false, message: '商品名称不能超过30个字符' };
  }
  return { valid: true };
};

export const validateShoppingItemQuantity = (quantity: number): ValidationResult => {
  if (!quantity || quantity <= 0) {
    return { valid: false, message: '数量必须大于0' };
  }
  if (quantity > 999) {
    return { valid: false, message: '数量不能超过999' };
  }
  return { valid: true };
};

export const validateRatingScore = (score: number): ValidationResult => {
  if (score < 1 || score > 5) {
    return { valid: false, message: '评分必须在1-5分之间' };
  }
  return { valid: true };
};

export interface FormValidationResult {
  success: boolean;
  errors?: Record<string, string>;
}

export const validateTaskForm = (form: {
  title: string;
  deadline: string;
  repeatCycle: string;
}): FormValidationResult => {
  const errors: Record<string, string> = {};

  const titleResult = validateTaskTitle(form.title);
  if (!titleResult.valid) {
    errors.title = titleResult.message || '';
  }

  const deadlineResult = validateTaskDeadline(form.deadline);
  if (!deadlineResult.valid) {
    errors.deadline = deadlineResult.message || '';
  }

  const repeatResult = validateTaskRepeatCycle(form.repeatCycle);
  if (!repeatResult.valid) {
    errors.repeatCycle = repeatResult.message || '';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true };
};

export const validateNoticeForm = (form: {
  title: string;
  content: string;
  expireDays: number;
}): FormValidationResult => {
  const errors: Record<string, string> = {};

  const titleResult = validateNoticeTitle(form.title);
  if (!titleResult.valid) {
    errors.title = titleResult.message || '';
  }

  const contentResult = validateNoticeContent(form.content);
  if (!contentResult.valid) {
    errors.content = contentResult.message || '';
  }

  const expireResult = validateNoticeExpireHours(form.expireDays);
  if (!expireResult.valid) {
    errors.expireDays = expireResult.message || '';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true };
};
