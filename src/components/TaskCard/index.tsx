import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { Task } from '@/types/task';
import { formatDate, formatRelativeTime } from '@/utils/date';
import { TASK_REPEAT_OPTIONS } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onClaim?: () => void;
  onComplete?: () => void;
  onClick?: () => void;
  showActions?: boolean;
}

const getStatusInfo = (status: Task['status']) => {
  const map = {
    todo: { text: '待认领', className: 'tagPrimary' },
    doing: { text: '进行中', className: 'tagInfo' },
    done: { text: '已完成', className: 'tagSuccess' },
    overdue: { text: '已逾期', className: 'tagError' },
  };
  return map[status];
};

const getRepeatText = (cycle: Task['repeatCycle']) => {
  return TASK_REPEAT_OPTIONS.find((o) => o.value === cycle)?.label || '';
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClaim,
  onComplete,
  onClick,
  showActions = true,
}) => {
  const statusInfo = getStatusInfo(task.status);
  const repeatText = getRepeatText(task.repeatCycle);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/task-detail/index?id=${task.id}`,
      });
    }
  };

  return (
    <View
      className={classNames(styles.taskCard, 'card', 'clickable')}
      onClick={handleClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{task.title}</Text>
          <View className={classNames('tag', styles[statusInfo.className])}>
            {statusInfo.text}
          </View>
        </View>
        <Text className={styles.creator}>
          发布者：{task.creatorName} · {formatRelativeTime(task.createdAt)}
        </Text>
      </View>

      <View className={styles.cardBody}>
        <Text className={styles.description}>{task.description}</Text>
      </View>

      <View className={styles.cardMeta}>
        {task.assigneeName && (
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>执行人：</Text>
            <Text className={styles.metaValue}>{task.assigneeName}</Text>
          </View>
        )}
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>截止：</Text>
          <Text
            className={classNames(styles.metaValue, {
              [styles.overdue]: task.status === 'overdue',
            })}
          >
            {formatDate(task.deadline)}
          </Text>
        </View>
        {task.repeatCycle !== 'none' && (
          <View className={styles.metaItem}>
            <View className={classNames('tag', styles.repeatTag)}>
              {repeatText}
            </View>
          </View>
        )}
        {task.averageScore !== undefined && (
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>评分：</Text>
            <Text className={styles.score}>{'★'.repeat(Math.round(task.averageScore))}</Text>
            <Text className={styles.scoreNum}>({task.averageScore})</Text>
          </View>
        )}
      </View>

      {showActions && (
        <View className={styles.cardActions}>
          {task.status === 'todo' && onClaim && (
            <Button
              className={classNames(styles.actionBtn, styles.primaryBtn)}
              onClick={(e) => {
                e.stopPropagation();
                onClaim();
              }}
            >
              认领任务
            </Button>
          )}
          {task.status === 'doing' && onComplete && (
            <Button
              className={classNames(styles.actionBtn, styles.successBtn)}
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
            >
              标记完成
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

export default TaskCard;
