import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color = 'primary',
  onClick,
}) => {
  return (
    <View
      className={classNames(styles.statCard, 'card', 'clickable', styles[color])}
      onClick={onClick}
    >
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.value}>{value}</Text>
      {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

export default StatCard;
