import React, {useState, useCallback, useMemo} from 'react';
import {View, TouchableOpacity, ScrollView, Dimensions} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import AppText from './customs/AppText';
import {useThemeStore} from '../stores/useThemeStore';
import AppIcon from './customs/AppIcon';

const {width: screenWidth} = Dimensions.get('window');

export type DatePickerMode = 'date' | 'dateRange' | 'time';

export interface DatePickerSheetPayload {
  mode: DatePickerMode;
  onDateSelect?: (date: Date) => void;
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  onTimeSelect?: (time: {hours: number; minutes: number}) => void;
  initialDate?: Date;
  initialStartDate?: Date;
  initialEndDate?: Date;
  initialTime?: {hours: number; minutes: number};
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  is24Hour?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DatePickerSheet: React.FC = () => {
  const payload = useSheetPayload() as DatePickerSheetPayload;
  const {AppTheme} = useThemeStore();
  const isDark = AppTheme === 'dark';

  // Extract payload with defaults
  const {
    mode = 'date',
    onDateSelect,
    onDateRangeSelect,
    onTimeSelect,
    initialDate = new Date(),
    initialStartDate,
    initialEndDate,
    initialTime = {
      hours: new Date().getHours(),
      minutes: new Date().getMinutes(),
    },
    minimumDate,
    maximumDate,
    title,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    is24Hour = true,
  } = payload || {};

  // Helper function to get the display month based on mode and selected dates
  const getInitialDisplayDate = () => {
    if (mode === 'date' && initialDate) {
      return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    } else if (mode === 'dateRange') {
      // Prioritize start date, fallback to end date, then current date
      const referenceDate = initialStartDate || initialEndDate || new Date();
      return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    } else {
      return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    }
  };

  // State management
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dateRange, setDateRange] = useState<{start?: Date; end?: Date}>({
    start: initialStartDate,
    end: initialEndDate,
  });
  const [time, setTime] = useState(initialTime);
  const [currentDate, setCurrentDate] = useState(getInitialDisplayDate());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Utility functions
  const isSameDay = (date1: Date, date2: Date) =>
    date1.toDateString() === date2.toDateString();

  const isDateDisabled = useCallback(
    (date: Date) => {
      if (minimumDate && date < minimumDate) return true;
      if (maximumDate && date > maximumDate) return true;
      return false;
    },
    [minimumDate, maximumDate],
  );

  const isInRange = useCallback(
    (date: Date) => {
      const {start, end} = dateRange;
      if (!start || !end) return false;
      return date >= start && date <= end;
    },
    [dateRange],
  );

  // Date manipulation
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // Navigation helpers
  const canNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      if (direction === 'prev') {
        const prevMonth =
          month === 0
            ? new Date(year - 1, 11, 1)
            : new Date(year, month - 1, 1);
        return (
          !minimumDate ||
          prevMonth >=
            new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1)
        );
      } else {
        const nextMonth =
          month === 11
            ? new Date(year + 1, 0, 1)
            : new Date(year, month + 1, 1);
        return (
          !maximumDate ||
          nextMonth <=
            new Date(maximumDate.getFullYear(), maximumDate.getMonth(), 1)
        );
      }
    },
    [currentDate, minimumDate, maximumDate],
  );

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      if (direction === 'prev') {
        setCurrentDate(
          month === 0
            ? new Date(year - 1, 11, 1)
            : new Date(year, month - 1, 1),
        );
      } else {
        setCurrentDate(
          month === 11
            ? new Date(year + 1, 0, 1)
            : new Date(year, month + 1, 1),
        );
      }
    },
    [currentDate],
  );

  // Event handlers
  const handleDatePress = useCallback(
    (day: number) => {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );

      if (isDateDisabled(date)) return;

      if (mode === 'date') {
        setSelectedDate(date);
      } else if (mode === 'dateRange') {
        const {start, end} = dateRange;

        if (!start || (start && end)) {
          // Start new selection
          setDateRange({start: date, end: undefined});
        } else if (start && !end) {
          // Complete selection
          if (date >= start) {
            setDateRange({start, end: date});
          } else {
            setDateRange({start: date, end: undefined});
          }
        }
      }
    },
    [currentDate, dateRange, mode, isDateDisabled],
  );

  const handleTimeChange = useCallback(
    (field: 'hours' | 'minutes', value: number) => {
      setTime(prev => ({...prev, [field]: value}));
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (mode === 'date' && onDateSelect && selectedDate) {
      onDateSelect(selectedDate);
      SheetManager.hide('DatePickerSheet');
    } else if (mode === 'dateRange' && onDateRangeSelect) {
      if (dateRange.start && dateRange.end) {
        onDateRangeSelect(dateRange.start, dateRange.end);
        SheetManager.hide('DatePickerSheet');
      }
    } else if (mode === 'time' && onTimeSelect && time) {
      onTimeSelect(time);
      SheetManager.hide('DatePickerSheet');
    }
  }, [
    mode,
    selectedDate,
    dateRange,
    time,
    onDateSelect,
    onDateRangeSelect,
    onTimeSelect,
  ]);

  // Year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = minimumDate?.getFullYear() || currentYear - 100;
    const endYear = maximumDate?.getFullYear() || currentYear + 100;
    return Array.from(
      {length: endYear - startYear + 1},
      (_, i) => startYear + i,
    );
  }, [minimumDate, maximumDate]);

  // Calendar renderer
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7; // Always multiple of 7
    const calendarDays = [];

    for (let i = 0; i < totalCells; i++) {
      if (i < firstDay || i >= firstDay + daysInMonth) {
        // Empty cell (before first day or after last day)
        calendarDays.push(<View key={`empty-${i}`} className="w-12 h-12" />);
      } else {
        // Day cell
        const day = i - firstDay + 1;
        const date = new Date(year, month, day);
        const isToday = isSameDay(date, today);
        const isSelected = mode === 'date' && isSameDay(date, selectedDate);
        const isRangeStart =
          mode === 'dateRange' &&
          dateRange.start &&
          isSameDay(date, dateRange.start);
        const isRangeEnd =
          mode === 'dateRange' && dateRange.end && isSameDay(date, dateRange.end);
        const isInDateRange = mode === 'dateRange' && isInRange(date);
        const disabled = isDateDisabled(date);

        let cellStyle = 'w-12 h-12 rounded-full items-center justify-center ';
        let textStyle = 'text-base ';

        if (disabled) {
          cellStyle += 'opacity-30';
          textStyle += isDark ? 'text-gray-600' : 'text-gray-400';
        } else if (isSelected || isRangeStart || isRangeEnd) {
          cellStyle += isDark ? 'bg-blue-600' : 'bg-blue-500';
          textStyle += 'text-white font-semibold';
        } else if (isInDateRange) {
          cellStyle += isDark ? 'bg-blue-200' : 'bg-blue-100';
          textStyle += isDark ? 'text-blue-800' : 'text-blue-700';
        } else if (isToday) {
          cellStyle += isDark
            ? 'bg-gray-700 border-2 border-blue-500'
            : 'bg-gray-100 border-2 border-blue-500';
          textStyle += isDark
            ? 'text-blue-400 font-medium'
            : 'text-blue-600 font-medium';
        } else {
          textStyle += isDark ? 'text-white' : 'text-gray-900';
        }

        calendarDays.push(
          <TouchableOpacity
            key={day}
            onPress={() => handleDatePress(day)}
            disabled={disabled}
            className={cellStyle}>
            <AppText className={textStyle}>{day}</AppText>
          </TouchableOpacity>,
        );
      }
    }

    // Group into weeks (guaranteed to be exactly 7 cells per week)
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekCells = calendarDays.slice(i, i + 7);
      weeks.push(
        <View key={`week-${i / 7}`} className="flex-row justify-around mb-1">
          {weekCells}
        </View>,
      );
    }

    return (
      <View className="px-2">
        {/* Day headers */}
        <View className="flex-row justify-around mb-3">
          {DAY_NAMES.map(day => (
            <View key={day} className="w-12 h-8 items-center justify-center">
              <AppText
                className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {day}
              </AppText>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View>{weeks}</View>
      </View>
    );
  };

  // Time picker renderer
  const renderTimePicker = () => {
    const hours = is24Hour
      ? Array.from({length: 24}, (_, i) => i)
      : Array.from({length: 12}, (_, i) => i + 1);
    const minutes = Array.from({length: 12}, (_, i) => i * 5); // 5-minute intervals

    return (
      <View className="flex-row justify-center space-x-4 px-4">
        {/* Hours */}
        <View className="flex-1">
          <AppText
            className={`text-center mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Hours
          </AppText>
          <ScrollView
            className="max-h-40 border rounded-lg"
            style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
            {hours.map(hour => (
              <TouchableOpacity
                key={hour}
                onPress={() => handleTimeChange('hours', hour)}
                className={`py-2 px-4 ${time.hours === hour ? (isDark ? 'bg-blue-600' : 'bg-blue-500') : ''}`}>
                <AppText
                  className={`text-center ${time.hours === hour ? 'text-white font-semibold' : isDark ? 'text-white' : 'text-gray-900'}`}>
                  {hour.toString().padStart(2, '0')}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <AppText
          className={`text-2xl font-bold self-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          :
        </AppText>

        {/* Minutes */}
        <View className="flex-1">
          <AppText
            className={`text-center mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Minutes
          </AppText>
          <ScrollView
            className="max-h-40 border rounded-lg"
            style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
            {minutes.map(minute => (
              <TouchableOpacity
                key={minute}
                onPress={() => handleTimeChange('minutes', minute)}
                className={`py-2 px-4 ${time.minutes === minute ? (isDark ? 'bg-blue-600' : 'bg-blue-500') : ''}`}>
                <AppText
                  className={`text-center ${time.minutes === minute ? 'text-white font-semibold' : isDark ? 'text-white' : 'text-gray-900'}`}>
                  {minute.toString().padStart(2, '0')}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const getTitle = () => {
    if (title) return title;
    return mode === 'date'
      ? 'Select Date'
      : mode === 'dateRange'
        ? 'Select Date Range'
        : 'Select Time';
  };

  const isConfirmDisabled = useMemo(() => {
    if (mode === 'date') {
      return !selectedDate;
    } else if (mode === 'dateRange') {
      return !dateRange.start || !dateRange.end;
    } else if (mode === 'time') {
      return !time || time.hours === undefined || time.minutes === undefined;
    }
    return false;
  }, [mode, selectedDate, dateRange, time]);

  return (
    <View>
      <ActionSheet
        id="DatePickerSheet"
        useBottomSafeAreaPadding
        gestureEnabled
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          maxHeight: '80%',
        }}
        indicatorStyle={{
          backgroundColor: isDark ? '#6b7280' : '#d1d5db',
          width: 50,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View className="px-4 py-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              onPress={() => SheetManager.hide('DatePickerSheet')}>
              <AppText
                className={`text-base ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
                {cancelText}
              </AppText>
            </TouchableOpacity>

            <AppText
              className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {getTitle()}
            </AppText>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isConfirmDisabled}>
              <AppText
                className={`text-base font-medium ${
                  isConfirmDisabled
                    ? isDark
                      ? 'text-gray-600'
                      : 'text-gray-400'
                    : isDark
                      ? 'text-blue-400'
                      : 'text-blue-500'
                }`}>
                {confirmText}
              </AppText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {mode !== 'time' && (
              <>
                {/* Month/Year Navigation */}
                <View className="flex-row justify-between items-center mb-6 px-4">
                  <TouchableOpacity
                    onPress={() => navigate('prev')}
                    disabled={!canNavigate('prev')}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      !canNavigate('prev')
                        ? 'opacity-30'
                        : isDark
                          ? 'bg-gray-800'
                          : 'bg-gray-100'
                    }`}>
                      <AppIcon type='ionicons' name='chevron-back-outline' size={18} color={isDark ? 'white' : 'gray'} style={{marginRight:2}} />
                  </TouchableOpacity>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setShowMonthPicker(true)}
                      className={`py-2 px-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <AppText
                        className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {MONTH_NAMES[currentDate.getMonth()]}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowYearPicker(true)}
                      className={`py-2 px-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <AppText
                        className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {currentDate.getFullYear()}
                      </AppText>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigate('next')}
                    disabled={!canNavigate('next')}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      !canNavigate('next')
                        ? 'opacity-30'
                        : isDark
                          ? 'bg-gray-800'
                          : 'bg-gray-100'
                    }`}>
                      <AppIcon type='ionicons' name='chevron-forward-outline' size={18} color={isDark ? 'white' : 'gray'} style={{marginLeft:2}} />
                  </TouchableOpacity>
                </View>

                {/* Year Picker */}
                {showYearPicker && (
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2 px-4">
                      <AppText
                        className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Select Year
                      </AppText>
                      <TouchableOpacity
                        onPress={() => setShowYearPicker(false)}>
                        <AppText
                          className={
                            isDark ? 'text-blue-400' : 'text-blue-500'
                          }>
                          Close
                        </AppText>
                      </TouchableOpacity>
                    </View>
                    <ScrollView
                      className="max-h-60"
                      contentContainerStyle={{paddingVertical: 8}}>
                      {yearOptions.map(year => (
                        <TouchableOpacity
                          key={year}
                          onPress={() => {
                            setCurrentDate(
                              new Date(year, currentDate.getMonth(), 1),
                            );
                            setShowYearPicker(false);
                          }}
                          className={`py-3 px-4 mx-4 my-1 rounded-lg ${
                            year === currentDate.getFullYear()
                              ? isDark
                                ? 'bg-blue-600'
                                : 'bg-blue-500'
                              : isDark
                                ? 'bg-gray-800'
                                : 'bg-gray-100'
                          }`}>
                          <AppText
                            className={`text-center text-base ${
                              year === currentDate.getFullYear()
                                ? 'text-white font-semibold'
                                : isDark
                                  ? 'text-white'
                                  : 'text-gray-900'
                            }`}>
                            {year}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Month Picker */}
                {showMonthPicker && (
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-4 px-4">
                      <AppText
                        className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Select Month
                      </AppText>
                      <TouchableOpacity
                        onPress={() => setShowMonthPicker(false)}>
                        <AppText
                          className={
                            isDark ? 'text-blue-400' : 'text-blue-500'
                          }>
                          Close
                        </AppText>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap justify-center gap-2 px-4">
                      {MONTH_NAMES.map((month, index) => (
                        <TouchableOpacity
                          key={month}
                          onPress={() => {
                            setCurrentDate(
                              new Date(currentDate.getFullYear(), index, 1),
                            );
                            setShowMonthPicker(false);
                          }}
                          className={`py-2 px-3 rounded-lg ${
                            index === currentDate.getMonth()
                              ? isDark
                                ? 'bg-blue-600'
                                : 'bg-blue-500'
                              : isDark
                                ? 'bg-gray-800'
                                : 'bg-gray-100'
                          }`}
                          style={{width: (screenWidth - 48) / 3 - 8}}>
                          <AppText
                            className={`text-center text-sm ${
                              index === currentDate.getMonth()
                                ? 'text-white font-semibold'
                                : isDark
                                  ? 'text-white'
                                  : 'text-gray-900'
                            }`}>
                            {month.substring(0, 3)}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Calendar */}
                {!showYearPicker && !showMonthPicker && (
                  <View className="mb-4">{renderCalendar()}</View>
                )}

                {/* Date Range Info */}
                {mode === 'dateRange' && (
                  <View className="px-4">
                    <View
                      className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <View className="flex-row justify-between">
                        <View className="flex-1">
                          <AppText
                            className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Start Date
                          </AppText>
                          <AppText
                            className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {dateRange.start
                              ? dateRange.start.toDateString()
                              : 'Not selected'}
                          </AppText>
                        </View>
                        <View className="flex-1">
                          <AppText
                            className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            End Date
                          </AppText>
                          <AppText
                            className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {dateRange.end
                              ? dateRange.end.toDateString()
                              : 'Not selected'}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Time Picker */}
            {mode === 'time' && (
              <View>
                <View
                  className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <AppText
                    className={`text-center text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {time.hours.toString().padStart(2, '0')}:
                    {time.minutes.toString().padStart(2, '0')}
                  </AppText>
                  <AppText
                    className={`text-center text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {is24Hour ? '24-hour format' : '12-hour format'}
                  </AppText>
                </View>
                {renderTimePicker()}
              </View>
            )}
          </ScrollView>
        </View>
      </ActionSheet>
    </View>
  );
};

export default DatePickerSheet;
