import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useReportStore } from '@/store/useReportStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { useNoticeStore } from '@/store/useNoticeStore';
import { useTaskStore } from '@/store/useTaskStore';
import { formatDateTime, formatDate } from '@/utils/date';
import { DailyReport, TaskBrief } from '@/types/report';
import EmptyState from '@/components/EmptyState';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  todo: { label: '待认领', cls: styles.statusTodo },
  doing: { label: '进行中', cls: styles.statusDoing },
  done: { label: '已完成', cls: styles.statusDone },
  overdue: { label: '已逾期', cls: styles.statusOverdue },
};

const renderTaskList = (tasks: TaskBrief[], emptyText: string) => {
  if (tasks.length === 0) {
    return <View className={styles.emptyTaskList}>{emptyText}</View>;
  }
  return tasks.map((task) => (
    <View key={task.id} className={styles.taskListItem}>
      <Text className={styles.taskItemTitle}>{task.title}</Text>
      <View className={styles.taskItemMeta}>
        <Text>
          {task.assigneeName ? `执行人：${task.assigneeName}` : '待认领'}
        </Text>
        <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
          <Text>截止: {formatDate(new Date(task.deadline))}</Text>
          <Text
            className={classNames(
              styles.statusTag,
              STATUS_MAP[task.status]?.cls || styles.statusTodo
            )}
          >
            {STATUS_MAP[task.status]?.label || task.status}
          </Text>
        </View>
      </View>
    </View>
  ));
};

const ReportPage: React.FC = () => {
  const reports = useReportStore((state) => state.reports);
  const { generateDailyReport, getReportByDate } = useReportStore();
  const { isCurrentUserAdmin, getMemberById } = useFamilyStore();
  const { checkExpiredNotices } = useNoticeStore();
  const { checkOverdueTasks } = useTaskStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可查看', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, []);

  useDidShow(() => {
    console.log('[Report] 页面显示，刷新状态并重新生成简报');
    checkExpiredNotices();
    checkOverdueTasks();
    generateDailyReport();
  });

  useEffect(() => {
    if (reports.length > 0 && !selectedDate) {
      setSelectedDate(reports[0].date);
    }
  }, [reports]);

  const availableDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      dates.push(dateStr);
    }
    return dates;
  }, []);

  const currentReport: DailyReport | null = useMemo(() => {
    if (selectedDate) {
      return getReportByDate(selectedDate) || null;
    }
    return null;
  }, [selectedDate, reports, getReportByDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekData = reports.slice(0, 7).reverse();

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return styles.successFill;
    if (rate >= 60) return '';
    return styles.warningFill;
  };

  const sortedContributions = currentReport?.memberContributions
    ? [...currentReport.memberContributions].sort((a, b) => b.completedTasks - a.completedTasks)
    : [];

  const newTaskList = currentReport?.newTasks || [];
  const doneTaskList = currentReport?.doneTasks || [];
  const overdueTaskList = currentReport?.overdueTaskList || [];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.reportTitle}>📊 每日简报</Text>
        <Text className={styles.reportDate}>
          {currentReport ? currentReport.date : selectedDate || '请选择日期'}
        </Text>
        {currentReport && (
          <Text className={styles.generateTime}>
            生成时间: {formatDateTime(currentReport.createdAt)}
          </Text>
        )}
      </View>

      <View className={styles.dateSelector}>
        <View className={styles.dateTabs}>
          {availableDates.map((date) => {
            const reportExist = reports.some((r) => r.date === date);
            return (
              <View
                key={date}
                className={classNames(styles.dateTab, {
                  [styles.active]: selectedDate === date,
                  [styles.hasData]: reportExist,
                  [styles.noData]: !reportExist,
                })}
                onClick={() => handleDateSelect(date)}
              >
                {date.slice(5)}
                {reportExist ? '' : ' · 无'}
              </View>
            );
          })}
        </View>
      </View>

      {!currentReport && selectedDate && (
        <View className={styles.noReportWrap}>
          <EmptyState
            title={`${selectedDate} 暂无简报`}
            description="该日期还没有生成过简报，点击下方按钮基于当前数据生成一份历史快照"
            actionText="生成当日简报"
            onAction={() => generateDailyReport(selectedDate)}
          />
        </View>
      )}

      {!currentReport && !selectedDate && (
        <View className={styles.noReportWrap}>
          <EmptyState
            title="请选择日期查看简报"
            description="每日凌晨将自动生成当日简报，也可手动选择日期生成"
          />
        </View>
      )}

      {currentReport && (
        <>
          <View className={styles.summarySection}>
            <View className={styles.summaryGrid}>
              <View className={styles.summaryCard}>
                <Text className={classNames(styles.summaryValue, styles.primaryColor)}>
                  {currentReport.taskCompletionRate}%
                </Text>
                <Text className={styles.summaryLabel}>任务完成率</Text>
              </View>
              <View className={styles.summaryCard}>
                <Text className={classNames(styles.summaryValue, styles.successColor)}>
                  {currentReport.noticeReadRate}%
                </Text>
                <Text className={styles.summaryLabel}>公告阅读率</Text>
              </View>
              <View className={styles.summaryCard}>
                <Text className={classNames(styles.summaryValue, styles.infoColor)}>
                  {currentReport.shoppingCompletionRate}%
                </Text>
                <Text className={styles.summaryLabel}>购物完成度</Text>
              </View>
              <View className={styles.summaryCard}>
                <Text className={classNames(styles.summaryValue, styles.warningColor)}>
                  {currentReport.overdueTasks}
                </Text>
                <Text className={styles.summaryLabel}>逾期任务</Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📈</Text>
              完成度详情
            </Text>
            <View className={styles.progressRow}>
              <View className={styles.progressHeader}>
                <Text className={styles.progressLabel}>任务完成</Text>
                <Text className={styles.progressValue}>
                  {currentReport.completedTasks}/{currentReport.totalTasks} 项
                </Text>
              </View>
              <View className={styles.progressBar}>
                <View
                  className={classNames(styles.progressFill, getProgressColor(currentReport.taskCompletionRate))}
                  style={{ width: `${currentReport.taskCompletionRate}%` }}
                />
              </View>
            </View>
            <View className={styles.progressRow}>
              <View className={styles.progressHeader}>
                <Text className={styles.progressLabel}>公告阅读</Text>
                <Text className={styles.progressValue}>
                  {currentReport.readNotices}/{currentReport.totalNotices} 条
                </Text>
              </View>
              <View className={styles.progressBar}>
                <View
                  className={classNames(styles.progressFill, getProgressColor(currentReport.noticeReadRate))}
                  style={{ width: `${currentReport.noticeReadRate}%` }}
                />
              </View>
            </View>
            <View className={styles.progressRow}>
              <View className={styles.progressHeader}>
                <Text className={styles.progressLabel}>购物清单</Text>
                <Text className={styles.progressValue}>
                  {currentReport.checkedShoppingItems}/{currentReport.totalShoppingItems} 项
                </Text>
              </View>
              <View className={styles.progressBar}>
                <View
                  className={classNames(styles.progressFill, getProgressColor(currentReport.shoppingCompletionRate))}
                  style={{ width: `${currentReport.shoppingCompletionRate}%` }}
                />
              </View>
            </View>
          </View>

          <View className={styles.taskListSection}>
            <View className={styles.taskListHeader}>
              <Text className={styles.taskListTitle}>
                🆕 今日新增任务
                <Text className={styles.taskCountBadge}>{newTaskList.length}</Text>
              </Text>
            </View>
            {renderTaskList(newTaskList, '今天暂无新增任务')}
          </View>

          <View className={styles.taskListSection}>
            <View className={styles.taskListHeader}>
              <Text className={styles.taskListTitle}>
                ✅ 今日完成任务
                <Text className={styles.taskCountBadge}>{doneTaskList.length}</Text>
              </Text>
            </View>
            {renderTaskList(doneTaskList, '今天暂无完成任务')}
          </View>

          <View className={styles.taskListSection}>
            <View className={styles.taskListHeader}>
              <Text className={styles.taskListTitle}>
                ⚠️ 逾期任务明细
                <Text className={styles.taskCountBadge}>{overdueTaskList.length}</Text>
              </Text>
            </View>
            {renderTaskList(overdueTaskList, '暂无逾期任务，继续保持！')}
          </View>

          {weekData.length > 0 && (
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>📊</Text>
                近7天趋势
              </Text>
              <View className={styles.weekChart}>
                {weekData.map((item, idx) => (
                  <View key={idx} className={styles.chartBar}>
                    <Text className={styles.barValue}>{item.taskCompletionRate}%</Text>
                    <View
                      className={styles.barFill}
                      style={{ height: `${Math.max(item.taskCompletionRate * 1.5, 8)}rpx` }}
                    />
                    <Text className={styles.barLabel}>{weekDays[idx % 7] || ''}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {sortedContributions.length > 0 && (
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>🏆</Text>
                成员贡献榜
              </Text>
              <View className={styles.rankingList}>
                {sortedContributions.map((contrib, idx) => {
                  const member = getMemberById(contrib.memberId);
                  if (!member) return null;
                  return (
                    <View key={contrib.memberId} className={styles.rankingItem}>
                      <Text
                        className={classNames(styles.rankingNum, {
                          [styles.top1]: idx === 0,
                          [styles.top2]: idx === 1,
                          [styles.top3]: idx === 2,
                        })}
                      >
                        {idx + 1}
                      </Text>
                      <Image
                        className={styles.memberAvatar}
                        src={member.avatar}
                        mode="aspectFill"
                      />
                      <View className={styles.memberInfo}>
                        <Text className={styles.memberName}>{member.name}</Text>
                        <Text className={styles.memberTasks}>
                          完成 {contrib.completedTasks} 项任务
                        </Text>
                      </View>
                      <Text className={styles.memberScore}>
                        +{contrib.earnedScore} 分
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {currentReport.overdueTasks > 0 && (
            <View className={styles.tipBox}>
              <Text className={styles.tipTitle}>⚠️ 注意事项</Text>
              <Text className={styles.tipContent}>
                当前有 {currentReport.overdueTasks} 项任务已逾期，请及时提醒家庭成员处理。
                逾期任务将影响家庭整体协作效率。
              </Text>
            </View>
          )}

          {reports.length > 0 && (
            <View className={styles.historySection}>
              <Text className={styles.historyTitle}>历史简报列表</Text>
              <View className={styles.historyList}>
                {reports.map((item) => (
                  <View
                    key={item.id}
                    className={classNames(styles.historyItem, {
                      [styles.active]: selectedDate === item.date,
                    })}
                    onClick={() => handleDateSelect(item.date)}
                  >
                    <Text className={styles.historyDate}>
                      {item.date}
                      {item.date === formatDate(new Date()) ? '（今日）' : ''}
                    </Text>
                    <View className={styles.historyItemDetail}>
                      <Text className={styles.historyRate}>任务 {item.taskCompletionRate}%</Text>
                      <Text className={styles.historyRate}>公告 {item.noticeReadRate}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default ReportPage;
