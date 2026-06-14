import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTaskStore } from '@/store/useTaskStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { TaskStatus, TASK_STATUS_OPTIONS } from '@/types/task';
import TaskCard from '@/components/TaskCard';
import EmptyState from '@/components/EmptyState';

const TasksPage: React.FC = () => {
  const {
    getTasks,
    filter,
    setFilter,
    claimTask,
    completeTask,
    getTaskStats,
    checkOverdueTasks,
  } = useTaskStore();
  const { isCurrentUserAdmin } = useFamilyStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkOverdueTasks();
  }, []);

  useDidShow(() => {
    checkOverdueTasks();
  });

  const tasks = getTasks();
  const stats = getTaskStats();

  const filterOptions: { value: TaskStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    ...TASK_STATUS_OPTIONS,
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    checkOverdueTasks();
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const handleClaim = (taskId: string) => {
    claimTask(taskId);
    Taro.showToast({ title: '认领成功', icon: 'success' });
  };

  const handleComplete = (taskId: string) => {
    completeTask(taskId);
    Taro.showToast({ title: '已标记完成', icon: 'success' });
  };

  const handleCreate = () => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可发布任务', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url: '/pages/create-task/index' });
  };

  const getEmptyText = () => {
    switch (filter) {
      case 'todo':
        return { title: '暂无待认领任务', description: '所有任务都被认领啦~' };
      case 'doing':
        return { title: '暂无进行中任务', description: '快认领一个任务吧！' };
      case 'done':
        return { title: '暂无已完成任务', description: '完成任务后会显示在这里' };
      case 'overdue':
        return { title: '太棒了！', description: '没有逾期任务' };
      default:
        return { title: '暂无任务', description: '快去发布第一个任务吧~' };
    }
  };

  const emptyText = getEmptyText();

  return (
    <View className={styles.page}>
      <ScrollView
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        <View className={styles.filterBar}>
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              className={classNames(styles.filterItem, {
                [styles.active]: filter === opt.value,
              })}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={classNames(styles.statValue, styles.todo)}>{stats.todo}</Text>
            <Text className={styles.statLabel}>待认领</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={classNames(styles.statValue, styles.doing)}>{stats.doing}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={classNames(styles.statValue, styles.done)}>{stats.done}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={classNames(styles.statValue, styles.overdue)}>{stats.overdue}</Text>
            <Text className={styles.statLabel}>已逾期</Text>
          </View>
        </View>

        <View className={styles.taskList}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClaim={() => handleClaim(task.id)}
                onComplete={() => handleComplete(task.id)}
              />
            ))
          ) : (
            <EmptyState
              title={emptyText.title}
              description={emptyText.description}
              actionText={isCurrentUserAdmin() ? '发布任务' : undefined}
              onAction={isCurrentUserAdmin() ? handleCreate : undefined}
            />
          )}
        </View>
      </ScrollView>

      <Button className={styles.fab} onClick={handleCreate}>
        +
      </Button>
    </View>
  );
};

export default TasksPage;
