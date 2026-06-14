import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description = '这里空空如也，快去添加吧~',
  actionText,
  onAction,
}) => {
  return (
    <View className={styles.emptyState}>
      <View className={styles.icon}>
        <Text className={styles.iconText}>📭</Text>
      </View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
      {actionText && onAction && (
        <Button className={styles.actionBtn} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
