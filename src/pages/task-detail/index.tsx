import React, { useState } from 'react';
import { View, Text, Image, Button, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTaskStore } from '@/store/useTaskStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { formatDate, formatDateTime } from '@/utils/date';
import { TASK_REPEAT_OPTIONS } from '@/types/task';

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

  if (!task) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909C' }}>任务不存在</Text>
        </View>
      </View>
    );
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      todo: '待认领',
      pending: '进行中',
      done: '已完成',
      overdue: '已逾期',
    };
    return map[status] || status;
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
          const result = claimTask(task.id, currentUser.id);
          if (result.success) {
            Taro.showToast({ title: '认领成功', icon: 'success' });
          } else {
            Taro.showToast({ title: result.message || '认领失败', icon: 'none' });
          }
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
          const result = completeTask(task.id, currentUser.id);
          if (result.success) {
            Taro.showToast({ title: '已标记完成', icon: 'success' });
            if (task.assigneeIds.length > 1) {
              setShowRating(true);
            }
          } else {
            Taro.showToast({ title: result.message || '操作失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      Taro.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }
    const result = rateTask(task.id, currentUser.id, rating, ratingComment);
    if (result.success) {
      Taro.showToast({ title: '评分成功', icon: 'success' });
      setShowRating(false);
    } else {
      Taro.showToast({ title: result.message || '评分失败', icon: 'none' });
    }
  };

  const isAssignee = task.assigneeIds.includes(currentUser.id);
  const canClaim = task.status === 'todo';
  const canComplete = task.status === 'pending' && isAssignee;
  const canRate = task.status === 'done' && isAssignee && !task.ratings.find((r) => r.memberId === currentUser.id);

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
          <Text className={styles.metaLabel}>截止日期</Text>
          <Text className={styles.metaValue}>{formatDate(task.deadline)}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>重复周期</Text>
          <Text className={styles.metaValue}>{getRepeatText(task.repeatCycle)}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>任务奖励</Text>
          <Text className={styles.metaValue} style={{ color: '#FF7A45' }}>
            +{task.points} 积分
          </Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>执行人</Text>
          <View className={styles.memberRow}>
            {task.assigneeIds.length === 0 ? (
              <Text style={{ color: '#86909C' }}>待认领</Text>
            ) : (
              task.assigneeIds.map((id) => {
                const member = getMemberById(id);
                return member ? (
                  <View key={id} className={styles.assigneeItem}>
                    <Image
                      className={styles.assigneeAvatar}
                      src={member.avatar}
                      mode="aspectFill"
                    />
                    <Text className={styles.assigneeName}>{member.name}</Text>
                  </View>
                ) : null;
              })
            )}
          </View>
        </View>
      </View>

      {task.status === 'done' && task.ratings.length > 0 && (
        <View className={styles.metaSection}>
          <View className={styles.metaRow}>
            <Text className={styles.metaLabel}>平均评分</Text>
            <Text className={styles.metaValue}>
              ⭐ {task.ratings.reduce((sum, r) => sum + r.score, 0) / task.ratings.length}
              <Text style={{ color: '#86909C', fontSize: '24rpx' }}>
                （{task.ratings.length}人评分）
              </Text>
            </Text>
          </View>
        </View>
      )}

      {showRating && (
        <View className={styles.ratingSection}>
          <Text className={styles.sectionTitle}>为同伴评分</Text>
          <View className={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                className={classNames(styles.star, { [styles.active]: star <= rating })}
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

      {task.operationHistory.length > 0 && (
        <View className={styles.historySection}>
          <Text className={styles.sectionTitle}>操作记录</Text>
          {task.operationHistory.map((record, idx) => {
            const member = getMemberById(record.memberId);
            return (
              <View key={idx} className={styles.historyItem}>
                <View className={styles.historyContent}>
                  <Text className={styles.historyText}>
                    {member?.name || '未知'} - {record.action}
                  </Text>
                  <Text className={styles.historyTime}>
                    {formatDateTime(record.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })}
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
            {task.status === 'done' ? '已完成' : '已认领'}
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default TaskDetailPage;
