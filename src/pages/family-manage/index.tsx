import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useFamilyStore } from '@/store/useFamilyStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useNoticeStore } from '@/store/useNoticeStore';
import EmptyState from '@/components/EmptyState';
import { formatDateTime } from '@/utils/date';

const FamilyManagePage: React.FC = () => {
  const { family, currentUser, isCurrentUserAdmin, updateMemberRole, removeMember, addMember } = useFamilyStore();
  const { getTaskStats } = useTaskStore();
  const { getReadRate } = useNoticeStore();

  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可管理', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, []);

  useDidShow(() => {
    console.log('[FamilyManage] 页面显示');
  });

  const taskStats = getTaskStats();

  const handleSetAdmin = (memberId: string) => {
    const member = family.members.find((m) => m.id === memberId);
    if (!member) return;

    Taro.showModal({
      title: '确认设置',
      content: `确定要将「${member.name}」设置为管理员吗？`,
      success: (res) => {
        if (res.confirm) {
          const result = updateMemberRole(memberId, 'admin');
          if (result.success) {
            Taro.showToast({ title: '设置成功', icon: 'success' });
          }
        }
      },
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (memberId === currentUser.id) {
      Taro.showToast({ title: '不能移除自己', icon: 'none' });
      return;
    }

    const member = family.members.find((m) => m.id === memberId);
    if (!member) return;

    Taro.showModal({
      title: '确认移除',
      content: `确定要将「${member.name}」移出家庭吗？`,
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          const result = removeMember(memberId);
          if (result.success) {
            Taro.showToast({ title: '已移除', icon: 'success' });
          }
        }
      },
    });
  };

  const handleAddMember = () => {
    Taro.showModal({
      title: '添加成员',
      editable: true,
      placeholderText: '请输入成员名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const result = addMember({
            name: res.content,
            role: 'member',
          });
          if (result.success) {
            Taro.showToast({ title: '添加成功', icon: 'success' });
          } else {
            Taro.showToast({ title: result.message || '添加失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleCopyId = () => {
    Taro.setClipboardData({
      data: family.id,
      success: () => {
        Taro.showToast({ title: '已复制家庭ID', icon: 'success' });
      },
    });
  };

  const handleEditName = () => {
    Taro.showModal({
      title: '修改家庭名称',
      editable: true,
      placeholderText: '请输入新的家庭名称',
      content: family.name,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const newName = res.content.trim();
          const { setFamily } = useFamilyStore.getState();
          setFamily({ ...family, name: newName });
          Taro.showToast({ title: '修改成功', icon: 'success' });
        }
      },
    });
  };

  const handleDissolveFamily = () => {
    Taro.showModal({
      title: '⚠️ 解散家庭',
      content: '确定要解散家庭吗？此操作不可恢复，所有数据将被清空！',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '再次确认',
            content: '真的要解散家庭吗？',
            confirmColor: '#F53F3F',
            success: (res2) => {
              if (res2.confirm) {
                Taro.showToast({ title: '功能演示', icon: 'none' });
              }
            },
          });
        }
      },
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.familyHeader}>
        <Text className={styles.familyName}>🏠 {family.name}</Text>
        <Text className={styles.familyId} onClick={handleCopyId}>
          ID: {family.id} (点击复制)
        </Text>
        <Text className={styles.memberCount}>
          共 {family.members.length} 位家庭成员
        </Text>
      </View>

      <View className={styles.section}>
        <View className={styles.tabBar}>
          <Button
            className={classNames(styles.tabBtn, { [styles.active]: activeTab === 'members' })}
            onClick={() => setActiveTab('members')}
          >
            👨‍👩‍👧‍👦 成员管理
          </Button>
          <Button
            className={classNames(styles.tabBtn, { [styles.active]: activeTab === 'info' })}
            onClick={() => setActiveTab('info')}
          >
            ⚙️ 家庭信息
          </Button>
          <Button
            className={classNames(styles.tabBtn, { [styles.active]: activeTab === 'stats' })}
            onClick={() => setActiveTab('stats')}
          >
            📊 数据统计
          </Button>
        </View>

        {activeTab === 'members' && (
          <>
            <View className={styles.sectionTitle}>
              <Text>
                <Text className={styles.sectionIcon}>👥</Text>
                成员列表
              </Text>
              <Button className={styles.addBtn} onClick={handleAddMember}>
                +
              </Button>
            </View>

            {family.members.length === 0 ? (
              <View className={styles.emptyState}>
                <EmptyState title="暂无成员" description="点击右上角添加成员" />
              </View>
            ) : (
              <View className={styles.memberList}>
                {family.members.map((member) => (
                  <View key={member.id} className={styles.memberCard}>
                    <Image
                      className={classNames(styles.memberAvatar, {
                        [styles.isAdmin]: member.role === 'admin',
                      })}
                      src={member.avatar}
                      mode="aspectFill"
                    />
                    <View className={styles.memberInfo}>
                      <Text className={styles.memberName}>{member.name}</Text>
                      <Text className={styles.memberRole}>
                        <Text
                          className={classNames(styles.roleBadge, styles[member.role])}>
                          {member.role === 'admin' ? '管理员' : '成员'}
                        </Text>
                        {member.id === currentUser.id && <Text>(我)</Text>}
                      </Text>
                      <Text className={styles.memberStats}>
                        完成 {member.taskCount} 项任务 · {member.totalScore} 积分
                      </Text>
                    </View>
                    <View className={styles.memberActions}>
                      {member.role !== 'admin' && (
                        <Button
                          className={classNames(styles.actionBtn, styles.primary)}
                          onClick={() => handleSetAdmin(member.id)}
                        >
                          设为管理员
                        </Button>
                      )}
                      <Button
                        className={classNames(styles.actionBtn, styles.danger)}
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={member.id === currentUser.id}
                      >
                        移除
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'info' && (
          <View className={styles.familyInfo}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>家庭名称</Text>
              <Text className={styles.infoValue}>{family.name}</Text>
              <Button className={styles.editBtn} onClick={handleEditName}>
                编辑
              </Button>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(family.createTime)}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>成员数量</Text>
              <Text className={styles.infoValue}>
                {family.members.length} 人
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>家庭ID</Text>
              <Text className={styles.infoValue}>{family.id}</Text>
              <Button className={styles.editBtn} onClick={handleCopyId}>
                复制
              </Button>
            </View>
          </View>
        )}

        {activeTab === 'stats' && (
          <View className={styles.statsGrid}>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{family.members.length}</Text>
              <Text className={styles.statLabel}>家庭成员</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{taskStats.total}</Text>
              <Text className={styles.statLabel}>任务总数</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{taskStats.done}</Text>
              <Text className={styles.statLabel}>已完成</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{taskStats.overdue}</Text>
              <Text className={styles.statLabel}>逾期任务</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.dangerZone}>
        <Text className={styles.dangerTitle}>⚠️ 危险操作</Text>
        <Text className={styles.dangerDesc}>
          解散家庭将清除所有数据，包括任务、公告、购物清单等。此操作不可撤销，请谨慎操作。
        </Text>
        <Button className={styles.dangerBtn} onClick={handleDissolveFamily}>
          解散家庭
        </Button>
      </View>
    </ScrollView>
  );
};

export default FamilyManagePage;
