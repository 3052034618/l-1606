import React, { useState, useEffect } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useShoppingStore } from '@/store/useShoppingStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { SHOPPING_CATEGORIES } from '@/types/shopping';
import ShoppingItemComponent from '@/components/ShoppingItem';
import EmptyState from '@/components/EmptyState';

const ShoppingPage: React.FC = () => {
  const {
    getItems,
    getUncheckedItems,
    getCheckedItems,
    addItem,
    toggleItem,
    removeItem,
    clearChecked,
    getCompletionRate,
  } = useShoppingStore();

  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('[Shopping] 页面加载');
  }, []);

  useDidShow(() => {
    console.log('[Shopping] 页面显示');
  });

  const allItems = getItems();
  const uncheckedItems = getUncheckedItems();
  const checkedItems = getCheckedItems();
  const completionRate = getCompletionRate();

  const filteredUnchecked =
    categoryFilter === 'all'
      ? uncheckedItems
      : uncheckedItems.filter((i) => i.category === categoryFilter);

  const filteredChecked =
    categoryFilter === 'all'
      ? checkedItems
      : checkedItems.filter((i) => i.category === categoryFilter);

  const categoryOptions = [
    { value: 'all', label: '全部' },
    ...SHOPPING_CATEGORIES,
  ];

  const handleAddItem = () => {
    const name = newItemName.trim();
    if (!name) {
      Taro.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }

    const quantity = parseInt(newItemQuantity) || 1;
    const result = addItem({
      name,
      quantity,
      category: 'other',
    });

    if (result.success) {
      setNewItemName('');
      setNewItemQuantity('1');
      Taro.showToast({ title: '添加成功', icon: 'success' });
    } else {
      Taro.showToast({ title: result.message || '添加失败', icon: 'none' });
    }
  };

  const handleToggle = (itemId: string) => {
    toggleItem(itemId);
  };

  const handleRemove = (itemId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          removeItem(itemId);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  };

  const handleClearChecked = () => {
    if (checkedItems.length === 0) return;
    Taro.showModal({
      title: '确认清空',
      content: `确定要清空已购买的 ${checkedItems.length} 项商品吗？`,
      success: (res) => {
        if (res.confirm) {
          clearChecked();
          Taro.showToast({ title: '已清空', icon: 'success' });
        }
      },
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  return (
    <View className={styles.page}>
      <ScrollView
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        <View className={styles.header}>
          <Text className={styles.title}>🛒 购物清单</Text>
          <Text className={styles.subtitle}>
            共 {allItems.length} 项商品
          </Text>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${completionRate}%` }}
            />
          </View>
          <Text className={styles.progressText}>
            已完成 {completionRate}%（{checkedItems.length}/{allItems.length}）
          </Text>
        </View>

        <View className={styles.addBar}>
          <View className={styles.inputWrapper}>
            <Input
              className={styles.input}
              placeholder="输入商品名称..."
              value={newItemName}
              onInput={(e) => setNewItemName(e.detail.value)}
              confirmType="done"
              onConfirm={handleAddItem}
            />
          </View>
          <Input
            className={styles.quantityInput}
            type="number"
            value={newItemQuantity}
            onInput={(e) => setNewItemQuantity(e.detail.value)}
          />
          <Button className={styles.addBtn} onClick={handleAddItem}>
            +
          </Button>
        </View>

        <ScrollView
          className={styles.categoryFilter}
          scrollX
          showScrollbar={false}
        >
          {categoryOptions.map((opt) => (
            <Button
              key={opt.value}
              className={classNames(styles.categoryBtn, {
                [styles.active]: categoryFilter === opt.value,
              })}
              onClick={() => setCategoryFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </ScrollView>

        {filteredUnchecked.length > 0 && (
          <View className={styles.listSection}>
            <Text className={styles.sectionTitle}>
              待购买
              <Text style={{ fontSize: '24rpx', color: '#86909C', fontWeight: 'normal' }}>
                ({filteredUnchecked.length})
              </Text>
            </Text>
            <View className={styles.itemList}>
              {filteredUnchecked.map((item) => (
                <ShoppingItemComponent
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggle(item.id)}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </View>
          </View>
        )}

        {filteredChecked.length > 0 && (
          <View className={styles.listSection}>
            <Text className={styles.sectionTitle}>
              已购买
              <Text style={{ fontSize: '24rpx', color: '#86909C', fontWeight: 'normal' }}>
                ({filteredChecked.length})
              </Text>
              <Button className={styles.clearBtn} onClick={handleClearChecked}>
                清空已购
              </Button>
            </Text>
            <View className={styles.itemList}>
              {filteredChecked.map((item) => (
                <ShoppingItemComponent
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggle(item.id)}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </View>
          </View>
        )}

        {filteredUnchecked.length === 0 && filteredChecked.length === 0 && (
          <View style={{ padding: '0 32rpx' }}>
            <EmptyState
              title="购物清单为空"
              description="添加一些需要购买的商品吧~"
            />
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.summary}>
          <Text className={styles.summaryText}>
            待购买 <Text className={styles.summaryHighlight}>{uncheckedItems.length}</Text> 项
          </Text>
          <Text className={styles.summaryText}>
            已完成 <Text className={styles.summaryHighlight}>{completionRate}%</Text>
          </Text>
        </View>
        <Button
          className={classNames(styles.actionBtn, styles.secondaryBtn)}
          onClick={handleClearChecked}
          disabled={checkedItems.length === 0}
        >
          清空已购
        </Button>
        <Button
          className={classNames(styles.actionBtn, styles.primaryBtn)}
          onClick={() => setNewItemName('')}
        >
          添加商品
        </Button>
      </View>
    </View>
  );
};

export default ShoppingPage;
