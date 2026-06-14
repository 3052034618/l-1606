import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { formatDate, getTodayDate, getDaysInMonth, getFirstDayOfMonth } from '@/utils/date';
import {
  CALENDAR_EVENT_TYPE_OPTIONS,
  REMINDER_DAY_OPTIONS,
  CalendarEventType,
} from '@/types/calendar';
import EmptyState from '@/components/EmptyState';

const CalendarPage: React.FC = () => {
  const events = useCalendarStore((state) => state.events);
  const { addEvent, removeEvent } = useCalendarStore();
  const { isCurrentUserAdmin } = useFamilyStore();

  const today = getTodayDate();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatDate(today));

  const [showAddModal, setShowAddModal] = useState(false);
  const [addEventType, setAddEventType] = useState<CalendarEventType>('reminder');
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addReminder, setAddReminder] = useState(0);

  useDidShow(() => {
    console.log('[Calendar] 页面显示');
  });

  const monthEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
  });

  const upcomingEvents = useMemo(() => {
    const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const futureEnd = new Date(future.getFullYear(), future.getMonth(), future.getDate(), 23, 59, 59);
    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= todayStart && eventDate <= futureEnd;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, today]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

    const days: Array<{ day: number; date: string; isCurrentMonth: boolean }> = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        day,
        date: formatDate(date),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({
        day: i,
        date: formatDate(date),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      days.push({
        day: i,
        date: formatDate(date),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const t = getTodayDate();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
    setSelectedDate(formatDate(t));
  };

  const getEventsForDate = (dateStr: string) => {
    return monthEvents.filter((e) => e.date === dateStr);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const openAddModal = () => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可添加', icon: 'none' });
      return;
    }
    setAddTitle('');
    setAddDesc('');
    setAddReminder(0);
    setAddEventType('reminder');
    setShowAddModal(true);
  };

  const handleConfirmAdd = () => {
    if (!addTitle.trim()) {
      Taro.showToast({ title: '请输入日程名称', icon: 'none' });
      return;
    }
    const result = addEvent({
      title: addTitle.trim(),
      type: addEventType,
      date: selectedDate,
      description: addDesc.trim() || undefined,
      reminderDays: addReminder,
    });
    if (result.success) {
      Taro.showToast({ title: '添加成功', icon: 'success' });
      setShowAddModal(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可删除', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个日程吗？删除后日历标记和列表将同步移除。',
      success: (res) => {
        if (res.confirm) {
          const result = removeEvent(eventId);
          if (result.success) {
            Taro.showToast({ title: '已删除', icon: 'success' });
          }
        }
      },
    });
  };

  const getEventTypeLabel = (type: string) => {
    return CALENDAR_EVENT_TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
  };

  const getReminderLabel = (days: number) => {
    return REMINDER_DAY_OPTIONS.find((r) => r.value === days)?.label || `${days}天`;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const todayStr = formatDate(today);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.monthNav}>
          <Button className={styles.navBtn} onClick={handlePrevMonth}>
            ‹
          </Button>
          <Text className={styles.monthText}>
            {currentYear}年{currentMonth + 1}月
          </Text>
          <Button className={styles.navBtn} onClick={handleNextMonth}>
            ›
          </Button>
        </View>
        <Button className={styles.todayBtn} onClick={handleToday}>
          今天
        </Button>
      </View>

      <View className={styles.calendar}>
        <View className={styles.weekRow}>
          {weekDays.map((day, idx) => (
            <Text
              key={day}
              className={classNames(styles.weekDay, {
                [styles.weekend]: idx === 0 || idx === 6,
              })}
            >
              {day}
            </Text>
          ))}
        </View>
        <View className={styles.daysGrid}>
          {calendarDays.map((item, idx) => {
            const dayEvents = events.filter((e) => e.date === item.date);
            const isToday = item.date === todayStr;
            const isSelected = item.date === selectedDate;
            const hasEvent = dayEvents.length > 0;
            return (
              <View key={idx} className={styles.dayCell}>
                <Button
                  className={classNames(styles.dayBtn, {
                    [styles.otherMonth]: !item.isCurrentMonth,
                    [styles.today]: isToday,
                    [styles.selected]: isSelected,
                    [styles.hasEvent]: hasEvent,
                  })}
                  onClick={() => handleDateClick(item.date)}
                >
                  {item.day}
                </Button>
                {hasEvent && (
                  <View className={styles.eventDot}>
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <View
                        key={i}
                        className={classNames(styles.dot, styles[`dot_${e.type}`])}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.upcomingSection}>
        <Text className={styles.sectionTitle}>
          <Text style={{ fontSize: '32rpx' }}>🔔 近期日程</Text>
          <Text style={{ fontSize: '22rpx', color: '#999', marginLeft: '16rpx' }}>
            未来7天 · 共{upcomingEvents.length}项
          </Text>
        </Text>
        {upcomingEvents.length === 0 ? (
          <View className={styles.emptyUpcoming}>近期暂无日程~</View>
        ) : (
          <ScrollView className={styles.upcomingList} scrollX showScrollbar={false}>
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.date);
              const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const daysDiff = Math.ceil(
                (new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime() -
                  todayOnly.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return (
                <View key={event.id} className={styles.upcomingCard}>
                  <Text className={classNames(styles.upcomingType, styles[`type_${event.type}`])}>
                    {getEventTypeLabel(event.type)}
                  </Text>
                  <Text className={styles.upcomingDate}>
                    {eventDate.getMonth() + 1}月{eventDate.getDate()}日
                  </Text>
                  <Text className={styles.upcomingTitle}>{event.title}</Text>
                  <Text className={styles.upcomingDays}>
                    {daysDiff === 0
                      ? '今天'
                      : daysDiff === 1
                      ? '明天'
                      : `还有${daysDiff}天`}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View className={styles.eventsSection}>
        <View className={styles.sectionTitle}>
          <Text>📅 {selectedDate} 日程</Text>
          <Button className={styles.addBtn} onClick={openAddModal}>
            + 添加
          </Button>
        </View>
        {selectedDateEvents.length === 0 ? (
          <EmptyState
            title="暂无日程"
            description="点击右上角添加新日程~"
          />
        ) : (
          <View className={styles.eventList}>
            {selectedDateEvents.map((event) => {
              const eventDate = new Date(event.date);
              return (
                <View
                  key={event.id}
                  className={styles.eventCard}
                  onLongPress={() => handleDeleteEvent(event.id)}
                  onClick={() =>
                    Taro.showActionSheet({
                      itemList: ['查看详情', '删除'],
                      success: (r) => {
                        if (r.tapIndex === 0) {
                          Taro.showModal({
                            title: event.title,
                            content: `${event.description || '无描述'}\n\n提醒：${getReminderLabel(event.reminderDays)}\n创建者：${event.creatorName}`,
                            showCancel: false,
                          });
                        } else if (r.tapIndex === 1) {
                          handleDeleteEvent(event.id);
                        }
                      },
                    })
                  }
                >
                  <View className={styles.eventTime}>
                    <Text className={styles.eventDate}>{eventDate.getDate()}</Text>
                    <Text className={styles.eventMonth}>{eventDate.getMonth() + 1}月</Text>
                  </View>
                  <View className={styles.eventContent}>
                    <View style={{ display: 'flex', alignItems: 'center' }}>
                      <Text className={classNames(styles.eventTypeTag, styles[`tag_${event.type}`])}>
                        {getEventTypeLabel(event.type)}
                      </Text>
                      <Text className={styles.eventTitle}>{event.title}</Text>
                    </View>
                    {event.description && (
                      <Text className={styles.eventDesc}>{event.description}</Text>
                    )}
                    <View className={styles.eventMeta}>
                      <Text>🔔 {getReminderLabel(event.reminderDays)}提醒</Text>
                      <Text style={{ color: '#aaa', fontSize: '22rpx' }}>长按删除</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {showAddModal && (
        <View className={styles.modalMask} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>添加日程</Text>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>日程类型</Text>
              <View className={styles.typeSelect}>
                {CALENDAR_EVENT_TYPE_OPTIONS.map((t) => (
                  <View
                    key={t.value}
                    className={classNames(styles.typeOption, {
                      [styles.typeActive]: addEventType === t.value,
                    })}
                    onClick={() => setAddEventType(t.value)}
                  >
                    {t.label}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>日程名称</Text>
              <Input
                className={styles.formInput}
                placeholder={`请输入${getEventTypeLabel(addEventType)}名称`}
                value={addTitle}
                onInput={(e) => setAddTitle(e.detail.value)}
                maxLength={30}
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>日程日期</Text>
              <Text className={styles.formValue}>{selectedDate}</Text>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>描述（可选）</Text>
              <Input
                className={styles.formInput}
                placeholder="添加备注..."
                value={addDesc}
                onInput={(e) => setAddDesc(e.detail.value)}
                maxLength={100}
              />
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>提醒时间</Text>
              <View className={styles.typeSelect}>
                {REMINDER_DAY_OPTIONS.map((r) => (
                  <View
                    key={r.value}
                    className={classNames(styles.typeOption, {
                      [styles.typeActive]: addReminder === r.value,
                    })}
                    onClick={() => setAddReminder(r.value)}
                  >
                    {r.label}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modalActions}>
              <Button className={styles.modalCancel} onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button className={styles.modalConfirm} onClick={handleConfirmAdd}>
                添加
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CalendarPage;
