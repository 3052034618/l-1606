import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useNoticeStore } from '@/store/useNoticeStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import NoticeCard from '@/components/NoticeCard';
import EmptyState from '@/components/EmptyState';

type FilterType = 'all' | 'unread' | 'read';

const NoticesPage: React.FC = () => {
  const { getNotices, getUnreadCount, checkExpiredNotices } = useNoticeStore();
  const { currentUser, isCurrentUserAdmin } = useFamilyStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkExpiredNotices();
  }, []);

  useDidShow(() => {
    checkExpiredNotices();
  });

  const allNotices = getNotices();
  const unreadCount = getUnreadCount(currentUser.id);
  const readCount = allNotices.length - unreadCount;

  const filteredNotices = allNotices.filter((notice) => {
    const isUnread = !notice.readBy.includes(currentUser.id);
    if (filter === 'unread') return isUnread;
    if (filter === 'read') return !isUnread;
    return true;
  });

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
            共 {allNotices.length} 条公告，{unreadCount} 条未读
          </Text>
        </View>

        <View className={styles.filterBar}>
          <Button
            className={classNames(styles.filterBtn, { [styles.active]: filter === 'all' })}
            onClick={() => setFilter('all')}
          >
            全部 ({allNotices.length})
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
            已读 ({readCount})
          </Button>
        </View>

        <View className={styles.noticeList}>
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => (
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
