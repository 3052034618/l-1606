import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useNoticeStore } from '@/store/useNoticeStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { validateNoticeForm } from '@/utils/validator';
import { NOTICE_EXPIRE_OPTIONS } from '@/types/notice';

const CreateNoticePage: React.FC = () => {
  const { createNotice } = useNoticeStore();
  const { currentUser, isCurrentUserAdmin } = useFamilyStore();

  const [form, setForm] = useState({
    title: '',
    content: '',
    expireDays: '7',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可发布公告', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, []);

  useDidShow(() => {
    console.log('[CreateNotice] 页面显示');
  });

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    console.log('[CreateNotice] 提交表单:', form);

    const validation = validateNoticeForm(form);
    if (!validation.success) {
      console.log('[CreateNotice] 校验失败:', validation.errors);
      setErrors(validation.errors || {});
      const firstError = Object.values(validation.errors || {})[0];
      if (firstError) {
        Taro.showToast({ title: firstError, icon: 'none' });
      }
      return;
    }

    const result = createNotice({
      title: form.title,
      content: form.content,
      expireDays: parseInt(form.expireDays) || 7,
    });

    if (result.success) {
      console.log('[CreateNotice] 公告创建成功');
      Taro.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1000);
    } else {
      console.log('[CreateNotice] 公告创建失败:', result.message);
      Taro.showToast({ title: result.message || '发布失败', icon: 'none' });
    }
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消发布吗？已填写的内容将不会保存。',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack();
        }
      },
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.form}>
        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>
            公告标题
          </Text>
          <Input
            className={styles.input}
            placeholder="请输入公告标题"
            value={form.title}
            onInput={(e) => handleInputChange('title', e.detail.value)}
            maxlength={50}
          />
          {errors.title && (
            <Text className={styles.errorText}>{errors.title}</Text>
          )}
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>
            公告内容
          </Text>
          <Input
            className={styles.textarea}
            placeholder="请输入公告内容"
            value={form.content}
            onInput={(e) => handleInputChange('content', e.detail.value)}
            maxlength={1000}
          />
          {errors.content && (
            <Text className={styles.errorText}>{errors.content}</Text>
          )}
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>
            自动消失时间
          </Text>
          <View className={styles.optionsRow}>
            {NOTICE_EXPIRE_OPTIONS.map((opt) => (
              <Button
                key={opt.value.toString()}
                className={classNames(styles.optionBtn, {
                  [styles.active]: form.expireDays === opt.value.toString(),
                })}
                onClick={() => handleInputChange('expireDays', opt.value.toString())}
              >
                {opt.label}
              </Button>
            ))}
          </View>
          <Text className={styles.tip}>
            到期后公告将自动隐藏，不再显示在列表中
          </Text>
          {errors.expireDays && (
            <Text className={styles.errorText}>{errors.expireDays}</Text>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classNames(styles.btn, styles.secondary)} onClick={handleCancel}>
          取消
        </Button>
        <Button className={classNames(styles.btn, styles.primary)} onClick={handleSubmit}>
          发布公告
        </Button>
      </View>
    </ScrollView>
  );
};

export default CreateNoticePage;
