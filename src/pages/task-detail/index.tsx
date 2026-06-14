import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTaskStore } from '@/store/useTaskStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { formatDate, formatDateTime } from '@/utils/date';
import { TASK_REPEAT_OPTIONS, TASK_STATUS_OPTIONS } from '@/types/task';
import { validateRatingScore } from '@/utils/validator';

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id as string;

  const { tasks, claimTask, completeTask, rateTask } = useTaskStore();
  const { currentUser, getMemberById, isCurrentUserAdmin } = useFamilyStore();

  const task = tasks.find((t) => t.id === taskId);

  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showRating, setShowRating] = useState(false);

  useDidShow(() => {
    console.log('[TaskDetail] 页面显示，任务ID:', taskId);
  });

  useEffect(() => {
    if (task && task.status === 'done') {
      const hasRated = task.ratings.some((r) => r.fromUserId === currentUser.id);
      if (!hasRated && task.assigneeId !== currentUser.id) {
        setShowRating(true);
      }
    }
  }, [task?.id, task?.status]);

  if (!task) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View style={{ padding: '200rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909C' }}>任务不存在</Text>
        </View>
      </ScrollView>
    );
  }

  const getStatusText = (status: string) => {
    const opt = TASK_STATUS_OPTIONS.find((o) => o.value === status);
    return opt?.label || status;
  };

  const getRepeatText = (cycle: string) => {
    const opt = TASK_REPEAT_OPTIONS.find((o) => o.value === cycle);
    return opt?.label || cycle;
  };

  const handleClaim = () => {
    Taro.showModal({
      title: '确认认领',
      content: '确定要认领这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          claimTask(task.id);
          Taro.showToast({ title: '认领成功', icon: 'success' });
          console.log('[TaskDetail] 任务认领成功', { taskId: task.id });
        }
      },
    });
  };

  const handleComplete = () => {
    Taro.showModal({
      title: '确认完成',
      content: '确定要标记这个任务为完成吗？',
      success: (res) => {
        if (res.confirm) {
          completeTask(task.id);
          Taro.showToast({ title: '已标记完成', icon: 'success' });
          console.log('[TaskDetail] 任务完成', { taskId: task.id });
        }
      },
    });
  };

  const handleSubmitRating = () => {
    const validation = validateRatingScore(rating);
    if (!validation.valid) {
      Taro.showToast({ title: validation.message || '评分无效', icon: 'none' });
      return;
    }
    rateTask(task.id, rating, ratingComment);
    Taro.showToast({ title: '评分成功', icon: 'success' });
    setShowRating(false);
    console.log('[TaskDetail] 任务评分完成', { taskId: task.id, score: rating });
  };

  const isAssignee = task.assigneeId === currentUser.id;
  const canClaim = task.status === 'todo';
  const canComplete = (task.status === 'doing' || task.status === 'overdue') && isAssignee;
  const hasRated = task.ratings.some((r) => r.fromUserId === currentUser.id);
  const canRate = task.status === 'done' && !hasRated && isCurrentUserAdmin();

  const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null;

  const averageScore = task.ratings.length > 0
    ? (task.ratings.reduce((sum, r) => sum + r.score, 0) / task.ratings.length).toFixed(1)
    : null;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerSection}>
        <Text className={classNames(styles.statusTag, styles[task.status])}>
          {getStatusText(task.status)}
        </Text>
        <Text className={styles.taskTitle}>{task.title}</Text>
        {task.description && (
          <Text className={styles.taskDesc}>{task.description}</Text>
        )}
      </View>

      <View className={styles.metaSection}>
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>发布者</Text>
          <Text className={styles.metaValue}>{task.creatorName}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>截止日期</Text>
          <Text className={classNames(styles.metaValue, { [styles.overdue]: task.status === 'overdue' })}>
            {formatDate(task.deadline)}
          </Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>重复周期</Text>
          <Text className={styles.metaValue}>{getRepeatText(task.repeatCycle)}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>执行人</Text>
          {assignee ? (
            <View className={styles.assigneeInfo}>
              <Image
                className={styles.assigneeAvatar}
                src={assignee.avatar}
                mode="aspectFill"
              />
              <Text className={styles.assigneeName}>{assignee.name}</Text>
            </View>
          ) : (
            <Text style={{ color: '#86909C' }}>待认领</Text>
          )}
        </View>
        {task.completedAt && (
          <View className={styles.metaRow}>
            <Text className={styles.metaLabel}>完成时间</Text>
            <Text className={styles.metaValue}>{formatDateTime(task.completedAt)}</Text>
          </View>
        )}
      </View>

      {averageScore !== null && (
        <View className={styles.metaSection}>
          <View className={styles.metaRow}>
            <Text className={styles.metaLabel}>平均评分</Text>
            <Text className={styles.metaValue}>
              <Text className={styles.stars}>
                {'★'.repeat(Math.round(Number(averageScore)))}
              </Text>
              <Text style={{ marginLeft: '16rpx' }}>{averageScore}</Text>
              <Text style={{ color: '#86909C', fontSize: '24rpx', marginLeft: '8rpx' }}>
                （{task.ratings.length}人评分）
              </Text>
            </Text>
          </View>
        </View>
      )}

      {task.ratings.length > 0 && (
        <View className={styles.ratingListSection}>
          <Text className={styles.sectionTitle}>评分详情</Text>
          {task.ratings.map((r, idx) => (
            <View key={idx} className={styles.ratingItem}>
              <View className={styles.ratingHeader}>
                <Text className={styles.ratingFrom}>{r.fromUserName}</Text>
                <Text className={styles.ratingStars}>
                  {'★'.repeat(r.score)}
                </Text>
              </View>
              {r.comment && (
                <Text className={styles.ratingComment}>{r.comment}</Text>
              )}
              <Text className={styles.ratingTime}>{formatDateTime(r.createTime)}</Text>
            </View>
          ))}
        </View>
      )}

      {showRating && (
        <View className={styles.ratingSection}>
          <Text className={styles.sectionTitle}>为任务评分</Text>
          <View className={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                className={classNames(styles.starBtn, { [styles.active]: star <= rating })}
                onClick={() => setRating(star)}
              >
                ★
              </Text>
            ))}
          </View>
          <Input
            className={styles.ratingInput}
            placeholder="评价一下吧（选填）"
            value={ratingComment}
            onInput={(e) => setRatingComment(e.detail.value)}
          />
          <View style={{ display: 'flex', gap: '16rpx', marginTop: '24rpx' }}>
            <Button
              className={classNames(styles.btn, styles.secondary)}
              onClick={() => setShowRating(false)}
            >
              取消
            </Button>
            <Button
              className={classNames(styles.btn, styles.primary)}
              onClick={handleSubmitRating}
            >
              提交评分
            </Button>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        {canClaim && (
          <Button className={classNames(styles.btn, styles.primary)} onClick={handleClaim}>
            认领任务
          </Button>
        )}
        {canComplete && (
          <Button className={classNames(styles.btn, styles.primary)} onClick={handleComplete}>
            标记完成
          </Button>
        )}
        {canRate && !showRating && (
          <Button
            className={classNames(styles.btn, styles.primary)}
            onClick={() => setShowRating(true)}
          >
            去评分
          </Button>
        )}
        {!canClaim && !canComplete && !canRate && (
          <Button className={classNames(styles.btn, styles.secondary)} disabled>
            {task.status === 'done' ? '已完成' : '进行中'}
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default TaskDetailPage;
