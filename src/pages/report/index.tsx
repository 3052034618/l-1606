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
  const { latestReport, reports, generateDailyReport, getWeeklyAverage } = useReportStore();
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

  const report = latestReport;
  const weeklyAvg = getWeeklyAverage();
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekData = reports.slice(0, 7).reverse();

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return styles.successFill;
    if (rate >= 60) return '';
    return styles.warningFill;
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.reportTitle}>📊 每日简报</Text>
        <Text className={styles.reportDate}>{report.date}</Text>
        <Text className={styles.generateTime}>生成时间: {formatDateTime(report.generatedAt)}</Text>
      </View>

      <View className={styles.summarySection}>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.primaryColor)}>
              {report.taskCompletionRate}%
            </Text>
            <Text className={styles.summaryLabel}>任务完成率</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.successColor)}>
              {report.noticeReadRate}%
            </Text>
            <Text className={styles.summaryLabel}>公告阅读率</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.infoColor)}>
              {report.shoppingCompletionRate}%
            </Text>
            <Text className={styles.summaryLabel}>购物完成度</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={classNames(styles.summaryValue, styles.warningColor)}>
              {report.overdueTaskCount}
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
              {report.completedTasks}/{report.totalTasks} 项
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classNames(styles.progressFill, getProgressColor(report.taskCompletionRate))}
              style={{ width: `${report.taskCompletionRate}%` }}
            />
          </View>
        </View>
        <View className={styles.progressRow}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>公告阅读</Text>
            <Text className={styles.progressValue}>
              {report.readNotices}/{report.totalNotices} 条
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classNames(styles.progressFill, getProgressColor(report.noticeReadRate))}
              style={{ width: `${report.noticeReadRate}%` }}
            />
          </View>
        </View>
        <View className={styles.progressRow}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>购物清单</Text>
            <Text className={styles.progressValue}>
              {report.completedShoppingItems}/{report.totalShoppingItems} 项
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classNames(styles.progressFill, getProgressColor(report.shoppingCompletionRate))}
              style={{ width: `${report.shoppingCompletionRate}%` }}
            />
          </View>
        </View>
      </View>

      {weeklyAvg.taskCompletionRate > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📊</Text>
            近7天平均
          </Text>
          <View className={styles.summaryGrid}>
            <View className={styles.summaryCard}>
              <Text className={classNames(styles.summaryValue, styles.primaryColor)}>
                {weeklyAvg.taskCompletionRate}%
              </Text>
              <Text className={styles.summaryLabel}>任务完成率</Text>
            </View>
            <View className={styles.summaryCard}>
              <Text className={classNames(styles.summaryValue, styles.successColor)}>
                {weeklyAvg.noticeReadRate}%
              </Text>
              <Text className={styles.summaryLabel}>公告阅读率</Text>
            </View>
          </View>
          <View className={styles.weekChart}>
            {weekData.map((item, idx) => (
              <View key={idx} className={styles.chartBar}>
                <Text className={styles.barValue}>{item.taskCompletionRate}%</Text>
                <View
                  className={styles.barFill}
                  style={{ height: `${Math.max(item.taskCompletionRate * 1.5, 8)}rpx` }}
                />
                <Text className={styles.barLabel}>{weekDays[6 - idx] || ''}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {report.memberContributions.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🏆</Text>
            成员贡献榜
          </Text>
          <View className={styles.rankingList}>
            {report.memberContributions.map((contrib, idx) => {
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
                    +{contrib.totalScore}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {report.overdueTaskCount > 0 && (
        <View className={styles.tipBox}>
          <Text className={styles.tipTitle}>⚠️ 注意事项</Text>
          <Text className={styles.tipContent}>
            当前有 {report.overdueTaskCount} 项任务已逾期，请及时提醒家庭成员处理。
            逾期任务将影响家庭整体协作效率。
          </Text>
        </View>
      )}

      {reports.length > 1 && (
        <View className={styles.historySection}>
          <Text className={styles.historyTitle}>历史简报</Text>
          <View className={styles.historyList}>
            {reports.slice(1, 5).map((item, idx) => (
              <View key={idx} className={styles.historyItem}>
                <Text className={styles.historyDate}>{item.date}</Text>
                <Text className={styles.historyRate}>
                  任务 {item.taskCompletionRate}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReportPage;
