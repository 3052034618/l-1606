import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useFamilyStore } from '@/store/useFamilyStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useNoticeStore } from '@/store/useNoticeStore';
import { useShoppingStore } from '@/store/useShoppingStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useReportStore } from '@/store/useReportStore';
import TaskCard from '@/components/TaskCard';
import NoticeCard from '@/components/NoticeCard';
import EmptyState from '@/components/EmptyState';
import { formatDate, getTodayDate } from '@/utils/date';
import { CALENDAR_EVENT_TYPE_OPTIONS } from '@/types/calendar';

const HomePage: React.FC = () => {
  const { currentUser, family, isCurrentUserAdmin } = useFamilyStore();
  const { claimTask, completeTask, checkOverdueTasks } = useTaskStore();
  const { checkExpiredNotices, getUnreadCount } = useNoticeStore();
  const { getCompletionRate: getShoppingCompletionRate } = useShoppingStore();
  const { checkReminders } = useCalendarStore();

  const tasks = useTaskStore((state) => state.tasks);
  const notices = useNoticeStore((state) => state.notices);
  const events = useCalendarStore((state) => state.events);
  const reports = useReportStore((state) => state.reports);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkOverdueTasks();
    checkExpiredNotices();
    checkReminders();
  }, []);

  useDidShow(() => {
    checkOverdueTasks();
    checkExpiredNotices();
    checkReminders();
  });

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'todo' || t.status === 'doing')
        .slice(0, 3),
    [tasks]
  );

  const activeNotices = useMemo(
    () => notices.filter((n) => !n.isExpired).slice(0, 2),
    [notices]
  );

  const today = getTodayDate();
  const upcomingEvents = useMemo(() => {
    const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const futureEnd = new Date(future.getFullYear(), future.getMonth(), future.getDate(), 23, 59, 59);
    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= todayStart && eventDate <= futureEnd;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [events, today]);

  const latestReport = useMemo(
    () => (reports.length > 0 ? reports[0] : null),
    [reports]
  );

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const doing = tasks.filter((t) => t.status === 'doing').length;
    const overdue = tasks.filter((t) => t.status === 'overdue').length;
    return { total, done, todo, doing, overdue };
  }, [tasks]);

  const unreadCount = getUnreadCount(currentUser.id);
  const todayCount = taskStats.todo + taskStats.doing;
  const overdueCount = taskStats.overdue;
  const shoppingRate = getShoppingCompletionRate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  const getEventTypeLabel = (type: string) => {
    return CALENDAR_EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label || '其他';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'task':
        Taro.switchTab({ url: '/pages/tasks/index' });
        break;
      case 'notice':
        if (isCurrentUserAdmin()) {
          Taro.navigateTo({ url: '/pages/create-notice/index' });
        } else {
          Taro.switchTab({ url: '/pages/notices/index' });
        }
        break;
      case 'shopping':
        Taro.switchTab({ url: '/pages/shopping/index' });
        break;
      case 'calendar':
        Taro.navigateTo({ url: '/pages/calendar/index' });
        break;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    checkOverdueTasks();
    checkReminders();
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  useEffect(() => {
    if (refreshing) {
      handleRefresh();
    }
  }, [refreshing]);

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={() => setRefreshing(true)}
    >
      <View className={styles.header}>
        <Text className={styles.greeting}>{getGreeting()}，{currentUser.name}！</Text>
        <Text className={styles.familyName}>🏠 {family.name}</Text>

        <View className={styles.quickStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{todayCount}</Text>
            <Text className={styles.statLabel}>今日待办</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{overdueCount}</Text>
            <Text className={styles.statLabel}>逾期任务</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{unreadCount}</Text>
            <Text className={styles.statLabel}>未读公告</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <View className={styles.quickActions}>
            <View className={styles.actionCard} onClick={() => handleQuickAction('task')}>
              <Text className={styles.actionIcon}>📋</Text>
              <Text className={styles.actionLabel}>任务</Text>
            </View>
            <View className={styles.relative}>
              {unreadCount > 0 && (
                <View className={styles.noticeBadge}>{unreadCount}</View>
              )}
              <View className={styles.actionCard} onClick={() => handleQuickAction('notice')}>
                <Text className={styles.actionIcon}>📢</Text>
                <Text className={styles.actionLabel}>公告</Text>
              </View>
            </View>
            <View className={styles.actionCard} onClick={() => handleQuickAction('shopping')}>
              <Text className={styles.actionIcon}>🛒</Text>
              <Text className={styles.actionLabel}>购物</Text>
            </View>
            <View className={styles.actionCard} onClick={() => handleQuickAction('calendar')}>
              <Text className={styles.actionIcon}>📅</Text>
              <Text className={styles.actionLabel}>日历</Text>
            </View>
          </View>
        </View>

        {latestReport && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>数据概览</Text>
              <Text
                className={styles.viewAll}
                onClick={() => Taro.navigateTo({ url: '/pages/report/index' })}
              >
                查看详情 →
              </Text>
            </View>
            <View className={styles.statsGrid}>
              <View className={styles.statCard}>
                <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '8rpx' }}>
                  任务完成率
                </Text>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#00B42A' }}>
                  {latestReport.taskCompletionRate}%
                </Text>
                <Text style={{ fontSize: '20rpx', color: '#86909C', marginTop: '4rpx' }}>
                  {latestReport.completedTasks}/{latestReport.totalTasks - latestReport.overdueTasks} 已完成
                </Text>
              </View>
              <View className={styles.statCard}>
                <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '8rpx' }}>
                  公告阅读率
                </Text>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#165DFF' }}>
                  {latestReport.noticeReadRate}%
                </Text>
                <Text style={{ fontSize: '20rpx', color: '#86909C', marginTop: '4rpx' }}>
                  {latestReport.readNotices}/{latestReport.totalNotices} 已读
                </Text>
              </View>
              <View className={styles.statCard}>
                <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '8rpx' }}>
                  购物完成度
                </Text>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#FF7A45' }}>
                  {shoppingRate}%
                </Text>
                <Text style={{ fontSize: '20rpx', color: '#86909C', marginTop: '4rpx' }}>
                  {latestReport.checkedShoppingItems}/{latestReport.totalShoppingItems} 已购
                </Text>
              </View>
              <View className={styles.statCard}>
                <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '8rpx' }}>
                  逾期任务
                </Text>
                <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#F53F3F' }}>
                  {latestReport.overdueTasks}
                </Text>
                <Text style={{ fontSize: '20rpx', color: '#86909C', marginTop: '4rpx' }}>
                  需要及时处理
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>今日待办</Text>
            <Text
              className={styles.viewAll}
              onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}
            >
              全部任务 →
            </Text>
          </View>
          <View className={styles.listContainer}>
            {todayTasks.length > 0 ? (
              todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClaim={() => claimTask(task.id)}
                  onComplete={() => completeTask(task.id)}
                />
              ))
            ) : (
              <EmptyState
                title="暂无待办任务"
                description="今天的任务都完成啦，太棒了！"
              />
            )}
          </View>
        </View>

        {upcomingEvents.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>近期日程</Text>
              <Text
                className={styles.viewAll}
                onClick={() => Taro.navigateTo({ url: '/pages/calendar/index' })}
              >
                查看全部 →
              </Text>
            </View>
            <View className={styles.upcomingEvents}>
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                return (
                  <View key={event.id} className={styles.eventItem}>
                    <View className={styles.eventDate}>
                      <Text className={styles.eventDay}>{eventDate.getDate()}</Text>
                      <Text className={styles.eventMonth}>{eventDate.getMonth() + 1}月</Text>
                    </View>
                    <View className={styles.eventInfo}>
                      <Text className={styles.eventTitle}>{event.title}</Text>
                      {event.description && (
                        <Text className={styles.eventDesc}>{event.description}</Text>
                      )}
                      {event.time && (
                        <Text className={styles.eventDesc}>⏰ {event.time}</Text>
                      )}
                    </View>
                    <View className={styles.eventType}>{getEventTypeLabel(event.type)}</View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>最新公告</Text>
            <Text
              className={styles.viewAll}
              onClick={() => Taro.switchTab({ url: '/pages/notices/index' })}
            >
              全部公告 →
            </Text>
          </View>
          <View className={styles.listContainer}>
            {activeNotices.length > 0 ? (
              activeNotices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)
            ) : (
              <EmptyState title="暂无公告" description="家庭一切安好~" />
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
