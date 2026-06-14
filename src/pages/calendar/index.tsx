import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useFamilyStore } from '@/store/useFamilyStore';
import { formatDate, getTodayDate, getDaysInMonth, getFirstDayOfMonth } from '@/utils/date';
import { CALENDAR_EVENT_TYPE_OPTIONS } from '@/types/calendar';
import EmptyState from '@/components/EmptyState';

const CalendarPage: React.FC = () => {
  const events = useCalendarStore((state) => state.events);
  const { addEvent, removeEvent } = useCalendarStore();
  const { currentUser, isCurrentUserAdmin } = useFamilyStore();

  const today = getTodayDate();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatDate(today));

  useDidShow(() => {
    console.log('[Calendar] 页面显示');
  });

  const monthEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
  });

  const upcomingEvents = (() => {
    const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= future;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

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

  const handleAddEvent = () => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可添加', icon: 'none' });
      return;
    }

    Taro.showActionSheet({
      itemList: CALENDAR_EVENT_TYPE_OPTIONS.map((t) => t.label),
      success: (res) => {
        const type = CALENDAR_EVENT_TYPE_OPTIONS[res.tapIndex];
        Taro.showModal({
          title: `添加${type.label}`,
          editable: true,
          placeholderText: `请输入${type.label}名称`,
          success: (modalRes) => {
            if (modalRes.confirm && modalRes.content) {
              const result = addEvent({
                title: modalRes.content,
                type: type.value,
                date: selectedDate,
                description: '',
                reminderDays: 1,
              });
              if (result.success) {
                Taro.showToast({ title: '添加成功', icon: 'success' });
              }
            }
          },
        });
      },
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!isCurrentUserAdmin()) {
      Taro.showToast({ title: '仅管理员可删除', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个日程吗？',
      success: (res) => {
        if (res.confirm) {
          removeEvent(eventId);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  };

  const getEventTypeLabel = (type: string) => {
    return CALENDAR_EVENT_TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
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
          const dayEvents = getEventsForDate(item.date);
          const isToday = item.date === todayStr;
          const isSelected = item.date === selectedDate;
          const hasEvent = dayEvents.length > 0;
          const dayOfWeek = idx % 7;
          return (
            <View
              key={idx}
              className={styles.dayCell}
            >
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
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <View key={i} className={styles.dot} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
      </View>

      {upcomingEvents.length > 0 && (
        <View className={styles.upcomingSection}>
          <Text className={styles.sectionTitle}>
            <Text style={{ fontSize: '32rpx' }}>近期日程</Text>
          </Text>
          <ScrollView className={styles.upcomingList} scrollX showScrollbar={false}>
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.date);
              const daysDiff = Math.ceil(
                (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <View key={event.id} className={styles.upcomingCard}>
                  <Text className={styles.upcomingDate}>
                    {eventDate.getDate()}日
                  </Text>
                  <Text className={styles.upcomingTitle}>{event.title}</Text>
                  <Text className={styles.upcomingDays}>
                    {daysDiff === 0 ? '今天' : `还有${daysDiff}天`}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View className={styles.eventsSection}>
        <View className={styles.sectionTitle}>
          <Text>{selectedDate} 日程</Text>
          <Button className={styles.addBtn} onClick={handleAddEvent}>
            +
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
                    key={event.id} className={styles.eventCard}
                    onLongPress={() => handleDeleteEvent(event.id)}
                  >
                    <View className={styles.eventTime}>
                      <Text className={styles.eventDate}>
                        {eventDate.getDate()}
                      </Text>
                      <Text className={styles.eventMonth}>
                        {eventDate.getMonth() + 1}月
                      </Text>
                    </View>
                    <View className={styles.eventContent}>
                      <Text className={styles.eventTitle}>{event.title}</Text>
                      {event.description && (
                        <Text className={styles.eventDesc}>{event.description}</Text>
                      )}
                      <View className={styles.eventMeta}>
                        <Text className={styles.eventTypeTag}>
                          {getEventTypeLabel(event.type)}
                        </Text>
                        {event.reminderDays > 0 && (
                          <Text>提前{event.reminderDays}天提醒</Text>
                        )}
                      </View>
                    </View>
                  </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default CalendarPage;
