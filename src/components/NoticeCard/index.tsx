import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';
import { Notice } from '@/types/notice';
import { formatRelativeTime, formatDate } from '@/utils/date';
import { useFamilyStore } from '@/store/useFamilyStore';
import { useNoticeStore } from '@/store/useNoticeStore';

interface NoticeCardProps {
  notice: Notice;
  onClick?: () => void;
}

const NoticeCard: React.FC<NoticeCardProps> = ({ notice, onClick }) => {
  const { currentUser } = useFamilyStore();
  const { markAsRead } = useNoticeStore();

  const isUnread = !notice.readBy.includes(currentUser.id);

  const handleClick = () => {
    if (isUnread) {
      markAsRead(notice.id);
    }
    onClick?.();
  };

  const readProgress = notice.totalMembers > 0
    ? Math.round((notice.readCount / notice.totalMembers) * 100)
    : 100;

  return (
    <View
      className={classNames(styles.noticeCard, 'card', 'clickable', {
        [styles.unread]: isUnread,
      })}
      onClick={handleClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.titleRow}>
          {isUnread && <View className={styles.unreadDot} />}
          <Text className={classNames(styles.title, { [styles.unreadText]: isUnread })}>
            {notice.title}
          </Text>
        </View>
        <Text className={styles.time}>{formatRelativeTime(notice.createdAt)}</Text>
      </View>

      <View className={styles.cardBody}>
        <Text className={styles.content}>{notice.content}</Text>
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.metaRow}>
          <Text className={styles.meta}>发布者：{notice.creatorName}</Text>
          <Text className={styles.meta}>
            自动消失：{formatDate(notice.autoExpireAt)}
          </Text>
        </View>
        <View className={styles.readProgress}>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${readProgress}%` }}
            />
          </View>
          <Text className={styles.progressText}>
            {notice.readCount}/{notice.totalMembers} 已读
          </Text>
        </View>
      </View>
    </View>
  );
};

export default NoticeCard;
