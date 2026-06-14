import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTaskStore } from '@/store/useTaskStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { validateTaskForm } from '@/utils/validator';
import { TASK_REPEAT_OPTIONS } from '@/types/task';
import { formatDate, getTodayDate } from '@/utils/date';

const CreateTaskPage: React.FC = () => {
  const { createTask } = useTaskStore();
  const { family, currentUser, isCurrentUserAdmin } = useFamilyStore();

  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: formatDate(getTodayDate()),
    repeatCycle: 'none',
    points: '10',
    assigneeIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可发布任务', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, []);

  useDidShow(() => {
    console.log('[CreateTask] 页面显示');
  });

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleToggleAssignee = (memberId: string) => {
    setForm((prev) => {
      const ids = prev.assigneeIds.includes(memberId)
        ? prev.assigneeIds.filter((id) => id !== memberId)
        : [...prev.assigneeIds, memberId];
      return { ...prev, assigneeIds: ids };
    });
  };

  const handleSelectAll = () => {
    if (form.assigneeIds.length === family.members.length) {
      setForm((prev) => ({ ...prev, assigneeIds: [] }));
    } else {
      setForm((prev) => ({ ...prev, assigneeIds: family.members.map((m) => m.id) }));
    }
  };

  const handleSubmit = () => {
    console.log('[CreateTask] 提交表单:', form);

    const validation = validateTaskForm(form);
    if (!validation.success) {
      console.log('[CreateTask] 校验失败:', validation.errors);
      setErrors(validation.errors || {});
      const firstError = Object.values(validation.errors || {})[0];
      if (firstError) {
        Taro.showToast({ title: firstError, icon: 'none' });
      }
      return;
    }

    const result = createTask({
      title: form.title,
      description: form.description,
      deadline: form.deadline,
      repeatCycle: form.repeatCycle as any,
      points: parseInt(form.points) || 10,
      assigneeIds: form.assigneeIds,
    });

    if (result.success) {
      console.log('[CreateTask] 任务创建成功');
      Taro.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1000);
    } else {
      console.log('[CreateTask] 任务创建失败:', result.message);
      Taro.showToast({ title: result.message || '发布失败', icon: 'none' });
    }
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消发布吗？已填写的内容将不会保存。',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack();
        }
      },
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.form}>
        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>
            任务标题
          </Text>
          <Input
            className={styles.input}
            placeholder="请输入任务标题"
            value={form.title}
            onInput={(e) => handleInputChange('title', e.detail.value)}
            maxlength={50}
          />
          {errors.title && (
            <Text className={styles.errorText}>{errors.title}</Text>
          )}
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>任务描述</Text>
          <Input
            className={styles.textarea}
            placeholder="请输入任务描述（选填）"
            value={form.description}
            onInput={(e) => handleInputChange('description', e.detail.value)}
            maxlength={500}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>
            截止日期
          </Text>
          <Input
            className={styles.input}
            type="date"
            value={form.deadline}
            onInput={(e) => handleInputChange('deadline', e.detail.value)}
          />
          {errors.deadline && (
            <Text className={styles.errorText}>{errors.deadline}</Text>
          )}
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>
            重复周期
          </Text>
          <View className={styles.optionsRow}>
            {TASK_REPEAT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                className={classNames(styles.optionBtn, {
                  [styles.active]: form.repeatCycle === opt.value,
                })}
                onClick={() => handleInputChange('repeatCycle', opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </View>
          {errors.repeatCycle && (
            <Text className={styles.errorText}>{errors.repeatCycle}</Text>
          )}
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>任务奖励</Text>
          <View className={styles.pointsRow}>
            <Input
              className={styles.pointsInput}
              type="number"
              value={form.points}
              onInput={(e) => handleInputChange('points', e.detail.value)}
            />
            <Text className={styles.pointsUnit}>积分</Text>
          </View>
        </View>

        <View className={styles.formGroup}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24rpx' }}>
            <Text className={styles.label} style={{ marginBottom: 0 }}>指定执行人</Text>
            <Button
              className={styles.optionBtn}
              onClick={handleSelectAll}
              style={{ padding: '8rpx 24rpx', fontSize: '24rpx' }}
            >
              {form.assigneeIds.length === family.members.length ? '取消全选' : '全选'}
            </Button>
          </View>
          <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '24rpx', display: 'block' }}>
            不选择则任务开放认领
          </Text>
          <View className={styles.memberList}>
            {family.members.map((member) => (
              <View
                key={member.id}
                className={classNames(styles.memberOption, {
                  [styles.active]: form.assigneeIds.includes(member.id),
                })}
                onClick={() => handleToggleAssignee(member.id)}
              >
                <Image
                  className={styles.memberAvatar}
                  src={member.avatar}
                  mode="aspectFill"
                />
                <Text className={styles.memberName}>{member.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classNames(styles.btn, styles.secondary)} onClick={handleCancel}>
          取消
        </Button>
        <Button className={classNames(styles.btn, styles.primary)} onClick={handleSubmit}>
          发布任务
        </Button>
      </View>
    </ScrollView>
  );
};

export default CreateTaskPage;
