import React, { useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useReportStore } from '@/store/useReportStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { formatDateTime, formatDate } from '@/utils/date';
import EmptyState from '@/components/EmptyState';

const ReportPage: React.FC = () => {
  const reports = useReportStore((state) => state.reports);
  const { generateDailyReport } = useReportStore();
  const { isCurrentUserAdmin, getMemberById } = useFamilyStore();

  useEffect(() => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可查看', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, []);

  useDidShow(() => {
    console.log('[Report] 页面显示');
    generateDailyReport();
  });

  const latestReport = reports.length > 0 ? reports[0] : null;

  if (!latestReport) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View style={{ padding: '200rpx' }}>
          <EmptyState
            title="暂无简报数据"
            description="每日凌晨将自动生成简报"
          />
        </View>
      </ScrollView>
    );
  }

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekData = reports.slice(0, 7).reverse();

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return styles.successFill;
    if (rate >= 60) return '';
    return styles.warningFill;
  };

  const sortedContributions = [...latestReport.memberContributions].sort(
    (a, b) => b.completedTasks - a.completedTasks
  );

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.reportTitle}>📊 每日简报</Text>
        <Text className={styles.reportDate}>{latestReport.date}</Text>
        <Text className={styles.generateTime}>
          生成时间: {formatDateTime(latestReport.createdAt)}
        </Text>
      </View>

      <View className={styles.summarySection}>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.primaryColor)}>
              {latestReport.taskCompletionRate}%
            </Text>
            <Text className={styles.summaryLabel}>任务完成率</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.successColor)}>
              {latestReport.noticeReadRate}%
            </Text>
            <Text className={styles.summaryLabel}>公告阅读率</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.infoColor)}>
              {latestReport.shoppingCompletionRate}%
            </Text>
            <Text className={styles.summaryLabel}>购物完成度</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.warningColor)}>
              {latestReport.overdueTasks}
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
              {latestReport.completedTasks}/{latestReport.totalTasks} 项
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classNames(styles.progressFill, getProgressColor(latestReport.taskCompletionRate))}
              style={{ width: `${latestReport.taskCompletionRate}%` }}
            />
          </View>
        </View>
        <View className={styles.progressRow}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>公告阅读</Text>
            <Text className={styles.progressValue}>
              {latestReport.readNotices}/{latestReport.totalNotices} 条
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classNames(styles.progressFill, getProgressColor(latestReport.noticeReadRate))}
              style={{ width: `${latestReport.noticeReadRate}%` }}
            />
          </View>
        </View>
        <View className={styles.progressRow}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>购物清单</Text>
            <Text className={styles.progressValue}>
              {latestReport.checkedShoppingItems}/{latestReport.totalShoppingItems} 项
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classNames(styles.progressFill, getProgressColor(latestReport.shoppingCompletionRate))}
              style={{ width: `${latestReport.shoppingCompletionRate}%` }}
            />
          </View>
        </View>
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

      {latestReport.overdueTasks > 0 && (
        <View className={styles.tipBox}>
          <Text className={styles.tipTitle}>⚠️ 注意事项</Text>
          <Text className={styles.tipContent}>
            当前有 {latestReport.overdueTasks} 项任务已逾期，请及时提醒家庭成员处理。
            逾期任务将影响家庭整体协作效率。
          </Text>
        </View>
      )}

      {reports.length > 1 && (
        <View className={styles.historySection}>
          <Text className={styles.historyTitle}>历史简报</Text>
          <View className={styles.historyList}>
            {reports.slice(1, 6).map((item, idx) => (
              <View key={idx} className={styles.historyItem}>
                <Text className={styles.historyDate}>{item.date}</Text>
                <View className={styles.historyStats}>
                  <Text className={styles.historyRate}>
                    任务 {item.taskCompletionRate}%
                  </Text>
                  <Text className={styles.historyRate}>
                    公告 {item.noticeReadRate}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReportPage;
