import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';
import { ShoppingItem } from '@/types/shopping';
import { SHOPPING_CATEGORIES } from '@/types/shopping';
import { formatRelativeTime } from '@/utils/date';

interface ShoppingItemProps {
  item: ShoppingItem;
  onToggle: () => void;
  onRemove?: () => void;
}

const getCategoryLabel = (category: string) => {
  return SHOPPING_CATEGORIES.find((c) => c.value === category)?.label || '其他';
};

const ShoppingItemComponent: React.FC<ShoppingItemProps> = ({ item, onToggle, onRemove }) => {
  const categoryLabel = getCategoryLabel(item.category);

  return (
    <View
      className={classNames(styles.shoppingItem, {
        [styles.checked]: item.isChecked,
      })}
    >
      <View className={styles.checkBox} onClick={onToggle}>
        <View
          className={classNames(styles.checkBoxInner, {
            [styles.checked]: item.isChecked,
          })}
        >
          {item.isChecked && <Text className={styles.checkMark}>✓</Text>}
        </View>
      </View>

      <View className={styles.itemContent} onClick={onToggle}>
        <View className={styles.itemHeader}>
          <Text
            className={classNames(styles.itemName, {
              [styles.strikethrough]: item.isChecked,
            })}
          >
            {item.name}
          </Text>
          <View className={classNames('tag', styles.categoryTag)}>
            {categoryLabel}
          </View>
        </View>

        <View className={styles.itemMeta}>
          <Text className={styles.quantity}>
            {item.quantity}{item.unit || ''}
          </Text>
          {item.note && (
            <Text className={styles.note}>· {item.note}</Text>
          )}
        </View>

        <View className={styles.itemFooter}>
          <Text className={styles.addedBy}>
            {item.addedByName} 添加 · {formatRelativeTime(item.createdAt)}
          </Text>
          {item.isChecked && item.checkedByName && (
            <Text className={styles.checkedBy}>
              {item.checkedByName} 已购
            </Text>
          )}
        </View>
      </View>

      {onRemove && (
        <Button
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </Button>
      )}
    </View>
  );
};

export default ShoppingItemComponent;
