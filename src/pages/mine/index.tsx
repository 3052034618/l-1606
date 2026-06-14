import React from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useFamilyStore } from '@/store/useFamilyStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useNoticeStore } from '@/store/useNoticeStore';
import { useShoppingStore } from '@/store/useShoppingStore';

const MinePage: React.FC = () => {
  const { currentUser, family, isCurrentUserAdmin } = useFamilyStore();
  const { getTaskStats } = useTaskStore();
  const { getUnreadCount } = useNoticeStore();
  const { getItems } = useShoppingStore();

  const unreadCount = getUnreadCount(currentUser.id);
  const taskStats = getTaskStats();
  const allItems = getItems();

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'calendar':
        Taro.navigateTo({ url: '/pages/calendar/index' });
        break;
      case 'report':
        if (!isCurrentUserAdmin()) {
          Taro.showToast({ title: '仅管理员可查看', icon: 'none' });
          return;
        }
        Taro.navigateTo({ url: '/pages/report/index' });
        break;
      case 'family':
        if (!isCurrentUserAdmin()) {
          Taro.showToast({ title: '仅管理员可管理', icon: 'none' });
          return;
        }
        Taro.navigateTo({ url: '/pages/family-manage/index' });
        break;
      case 'about':
        Taro.showModal({
          title: '关于',
          content: '家庭共享事务管理APP v1.0\n让家庭协作更高效！',
          showCancel: false,
        });
        break;
    }
  };

  const menuItems = [
    { icon: '📅', text: '家庭日历', action: 'calendar' },
    {
      icon: '📊',
      text: '每日简报',
      action: 'report',
      badge: isCurrentUserAdmin() ? '管理员' : undefined,
    },
    {
      icon: '👨‍👩‍👧‍👦',
      text: '家庭管理',
      action: 'family',
      badge: isCurrentUserAdmin() ? '管理员' : undefined,
    },
    { icon: 'ℹ️', text: '关于', action: 'about' },
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Image className={styles.avatar} src={currentUser.avatar} mode="aspectFill" />
        <View className={styles.userInfo}>
          <Text className={styles.userName}>{currentUser.name}</Text>
          <Text className={styles.userRole}>
            {currentUser.role === 'admin' ? '管理员' : '成员'}
          </Text>
          <Text className={styles.familyInfo}>🏠 {family.name}</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{currentUser.totalScore}</Text>
          <Text className={styles.statLabel}>累计积分</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{currentUser.taskCount}</Text>
          <Text className={styles.statLabel}>完成任务</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{taskStats.done}</Text>
          <Text className={styles.statLabel}>全家完成</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{allItems.length}</Text>
          <Text className={styles.statLabel}>购物清单</Text>
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.sectionTitle}>家庭成员</Text>
        <ScrollView className={styles.memberList} scrollX showScrollbar={false}>
          {family.members.map((member) => (
            <View key={member.id} className={styles.memberItem}>
              <Image
                className={classNames(styles.memberAvatar, {
                  [styles.isAdmin]: member.role === 'admin',
                })}
                src={member.avatar}
                mode="aspectFill"
              />
              <Text className={styles.memberName}>{member.name}</Text>
              <Text className={styles.memberRole}>
                {member.role === 'admin' ? '管理员' : ''}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.sectionTitle}>功能菜单</Text>
        <View className={styles.menuList}>
          {menuItems.map((item) => (
            <View
              key={item.action}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item.action)}
            >
              <Text className={styles.menuIcon}>{item.icon}</Text>
              <Text className={styles.menuText}>{item.text}</Text>
              {item.badge && (
                <Text className={styles.menuBadge}>{item.badge}</Text>
              )}
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
