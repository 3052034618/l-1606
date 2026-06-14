import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useNoticeStore } from '@/store/useNoticeStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import NoticeCard from '@/components/NoticeCard';
import EmptyState from '@/components/EmptyState';

type FilterType = 'all' | 'unread' | 'read' | 'expired';

const NoticesPage: React.FC = () => {
  const notices = useNoticeStore((state) => state.notices);
  const { checkExpiredNotices, getUnreadCount } = useNoticeStore();
  const { currentUser, isCurrentUserAdmin } = useFamilyStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkExpiredNotices();
  }, []);

  useDidShow(() => {
    checkExpiredNotices();
  });

  const activeNotices = useMemo(
    () => notices.filter((n) => !n.isExpired),
    [notices]
  );
  const expiredNotices = useMemo(
    () => notices.filter((n) => n.isExpired),
    [notices]
  );
  const unreadCount = getUnreadCount(currentUser.id);
  const activeReadCount = activeNotices.filter((n) =>
    n.readBy.includes(currentUser.id)
  ).length;

  const visibleList = useMemo(() => {
    if (isCurrentUserAdmin()) {
      if (filter === 'expired') return expiredNotices;
      if (filter === 'unread') {
        return activeNotices.filter((n) => !n.readBy.includes(currentUser.id));
      }
      if (filter === 'read') {
        return activeNotices.filter((n) => n.readBy.includes(currentUser.id));
      }
      return activeNotices;
    } else {
      if (filter === 'unread') {
        return activeNotices.filter((n) => !n.readBy.includes(currentUser.id));
      }
      if (filter === 'read') {
        return activeNotices.filter((n) => n.readBy.includes(currentUser.id));
      }
      return activeNotices;
    }
  }, [notices, activeNotices, expiredNotices, filter, currentUser.id, isCurrentUserAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    checkExpiredNotices();
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const handleCreate = () => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可发布公告', icon: 'none' });
      return;
    }
    Taro.navigateTo({ url: '/pages/create-notice/index' });
  };

  const getEmptyText = () => {
    if (isCurrentUserAdmin() && filter === 'expired') {
      return { title: '暂无已过期公告', description: '过期公告会自动移到这里' };
    }
    switch (filter) {
      case 'unread':
        return { title: '没有未读公告', description: '所有公告都已阅读' };
      case 'read':
        return { title: '没有已读公告', description: '快去阅读公告吧' };
      default:
        return { title: '暂无公告', description: '家庭一切安好~' };
    }
  };

  const emptyText = getEmptyText();

  const displayTotal = isCurrentUserAdmin() ? activeNotices.length + expiredNotices.length : activeNotices.length;
  const displayActive = activeNotices.length;

  return (
    <View className={styles.page}>
      <ScrollView
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        <View className={styles.header}>
          <Text className={styles.title}>📢 家庭公告</Text>
          <Text className={styles.subtitle}>
            {isCurrentUserAdmin() ? (
              <>
                共 {displayTotal} 条（进行中 {displayActive} / 已过期 {expiredNotices.length}），{unreadCount} 条未读
              </>
            ) : (
              <>
                共 {displayActive} 条公告，{unreadCount} 条未读
              </>
            )}
          </Text>
        </View>

        <View className={styles.filterBar}>
          <Button
            className={classNames(styles.filterBtn, { [styles.active]: filter === 'all' })}
            onClick={() => setFilter('all')}
          >
            全部 ({displayActive})
          </Button>
          <Button
            className={classNames(styles.filterBtn, { [styles.active]: filter === 'unread' })}
            onClick={() => setFilter('unread')}
          >
            未读 ({unreadCount})
          </Button>
          <Button
            className={classNames(styles.filterBtn, { [styles.active]: filter === 'read' })}
            onClick={() => setFilter('read')}
          >
            已读 ({activeReadCount})
          </Button>
          {isCurrentUserAdmin() && (
            <Button
              className={classNames(styles.filterBtn, styles.expiredBtn, { [styles.active]: filter === 'expired' })}
              onClick={() => setFilter('expired')}
            >
              已过期 ({expiredNotices.length})
            </Button>
          )}
        </View>

        {isCurrentUserAdmin() && filter === 'expired' && expiredNotices.length > 0 && (
          <View className={styles.adminTip}>
            <Text className={styles.adminTipText}>
              ℹ️ 仅管理员可见。已过期公告不会出现在普通成员的列表里。
            </Text>
          </View>
        )}

        <View className={styles.noticeList}>
          {visibleList.length > 0 ? (
            visibleList.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))
          ) : (
            <EmptyState
              title={emptyText.title}
              description={emptyText.description}
              actionText={isCurrentUserAdmin() ? '发布公告' : undefined}
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

export default NoticesPage;
