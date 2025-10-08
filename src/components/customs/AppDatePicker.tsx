import React, {
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import AppText from './AppText';
import AppIcon from './AppIcon';
import { DatePickerSheetPayload } from '../DatePickerSheet';

export type DatePickerMode = 'date' | 'dateRange' | 'time' | 'month';

type DateState = Date | undefined;
type TimeState = {hours: number; minutes: number} | undefined;

export interface DatePickerState  {
  start: DateState;
  end: DateState;
};

export type DatePickerRef = {
  reset: () => void;
};

export interface DatePickerProps {
  mode: DatePickerMode;
  visible: boolean;
  onClose: () => void;
  onDateSelect?: (date: Date) => void;
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
  onTimeSelect?: (time: {hours: number; minutes: number}) => void;
  initialDate?: Date;
  initialStartDate?: Date;
  initialEndDate?: Date;
  initialTime?: {hours: number; minutes: number};
  minimumDate?: Date;
  maximumDate?: Date;
  /** Earliest selectable month (1-indexed) and year when in month mode */
  minMonthYear?: { month: number; year: number };
  /** Latest selectable month (1-indexed) and year when in month mode */
  maxMonthYear?: { month: number; year: number };
  title?: string;
  confirmText?: string;
  cancelText?: string;
  theme?: 'light' | 'dark';
  is24Hour?: boolean;
}

export interface DatePickerInputProps {
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
  minMonthYear?: { month: number; year: number };
  maxMonthYear?: { month: number; year: number };
  title?: string;
  confirmText?: string;
  cancelText?: string;
  theme?: 'light' | 'dark';
  is24Hour?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: string;
  inputStyle?: string;
}

// Simplified AppDatePicker component that opens ActionSheet
const AppDatePicker: React.FC<DatePickerProps> = ({
  mode,
  visible,
  onClose,
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
  minMonthYear,
  maxMonthYear,
  title,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  theme = 'light',
  is24Hour = true,
}) => {

  useEffect(() => {
    if (visible) {
      const payload: DatePickerSheetPayload = {
        mode,
        onDateSelect: (date: Date) => {
          onDateSelect?.(date);
          onClose();
        },
        onDateRangeSelect: (startDate: Date, endDate: Date) => {
          onDateRangeSelect?.(startDate, endDate);
          onClose();
        },
        onTimeSelect: (time: {hours: number; minutes: number}) => {
          onTimeSelect?.(time);
          onClose();
        },
        initialDate,
        initialStartDate,
        initialEndDate,
        initialTime,
        minimumDate,
        maximumDate,
        minMonthYear,
        maxMonthYear,
        title,
        confirmText,
        cancelText,
        is24Hour,
      };

      SheetManager.show('DatePickerSheet', {
        payload,
        onClose: () => {
          onClose();
        },
      });
    }
  }, [visible, mode, onDateSelect, onDateRangeSelect, onTimeSelect, initialDate, initialStartDate, initialEndDate, initialTime, minimumDate, maximumDate, minMonthYear, maxMonthYear, title, confirmText, cancelText, is24Hour, onClose]);

  // This component doesn't render anything visible since ActionSheet handles the UI
  return null;
};

// DatePickerInput Component - Modern Input Field Interface
export const DatePickerInput = ({
  mode,
  onDateSelect,
  onDateRangeSelect,
  onTimeSelect,
  initialDate,
  initialStartDate,
  initialEndDate,
  initialTime,
  minimumDate,
  maximumDate,
  minMonthYear,
  maxMonthYear,
  title,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  theme = 'light',
  is24Hour = true,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  containerStyle = '',
  inputStyle = '',
}: DatePickerInputProps) => {

  const [selectedDate, setSelectedDate] = useState<DateState>(initialDate || undefined);
  const [selectedStartDate, setSelectedStartDate] = useState<DateState>(initialStartDate || undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<DateState>(initialEndDate || undefined);
  const [selectedTime, setSelectedTime] = useState<TimeState>(initialTime || undefined);

  const isDarkTheme = theme === 'dark';

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const formatTime = useCallback(
    (time: {hours: number; minutes: number}) => {
      if (is24Hour) {
        return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
      } else {
        const hour12 =
          time.hours === 0
            ? 12
            : time.hours <= 12
              ? time.hours
              : time.hours - 12;
        const ampm = time.hours < 12 ? 'AM' : 'PM';
        return `${hour12.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')} ${ampm}`;
      }
    },
    [is24Hour],
  );

  const getDisplayValue = useCallback(() => {
    switch (mode) {
      case 'date':
        return selectedDate ? formatDate(selectedDate) : '';
      case 'dateRange':
        if (selectedStartDate && selectedEndDate) {
          return `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`;
        } else if (selectedStartDate) {
          return `${formatDate(selectedStartDate)} - Select end date`;
        }
        return '';
      case 'time':
        return selectedTime ? formatTime(selectedTime) : '';
      case 'month':
        if (selectedStartDate && selectedEndDate) {
          return `${selectedStartDate.toLocaleString('default', {month: 'short', year: 'numeric'})} - ${selectedEndDate.toLocaleString('default', {month: 'short', year: 'numeric'})}`;
        } else if (selectedStartDate) {
          return `${selectedStartDate.toLocaleString('default', {month: 'short', year: 'numeric'})} - Select end month`;
        }
        return '';
      default:
        return '';
    }
  }, [
    mode,
    selectedDate,
    selectedStartDate,
    selectedEndDate,
    selectedTime,
    formatDate,
    formatTime,
  ]);

  const getPlaceholderText = useCallback(() => {
    if (placeholder) return placeholder;
    switch (mode) {
      case 'date':
        return 'Select a date';
      case 'dateRange':
        return 'Select date range';
      case 'time':
        return 'Select time';
      case 'month':
        return 'Select month range';
      default:
        return 'Select';
    }
  }, [mode, placeholder]);

  const getIconName = useCallback(() => {
    switch (mode) {
      case 'date':
      case 'dateRange':
        return 'calendar-outline';
      case 'time':
        return 'time-outline';
      case 'month':
        return 'calendar-outline';
      default:
        return 'calendar-outline';
    }
  }, [mode]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
    },
    [onDateSelect],
  );

  const handleDateRangeSelect = useCallback(
    (startDate: Date, endDate: Date) => {
      setSelectedStartDate(startDate);
      setSelectedEndDate(endDate);
      onDateRangeSelect?.(startDate, endDate);
    },
    [onDateRangeSelect],
  );

  const handleTimeSelect = useCallback(
    (time: {hours: number; minutes: number}) => {
      setSelectedTime(time);
      onTimeSelect?.(time);
    },
    [onTimeSelect],
  );

  const openPicker = useCallback(() => {
    if (!disabled) {
      const payload: DatePickerSheetPayload = {
        mode,
        onDateSelect: handleDateSelect,
        onDateRangeSelect: handleDateRangeSelect,
        onTimeSelect: handleTimeSelect,
        initialDate: selectedDate || initialDate,
        initialStartDate: selectedStartDate || initialStartDate,
        initialEndDate: selectedEndDate || initialEndDate,
        initialTime: selectedTime || initialTime,
        minimumDate,
        maximumDate,
        minMonthYear,
        maxMonthYear,
        title,
        confirmText,
        cancelText,
        is24Hour,
      };

      SheetManager.show('DatePickerSheet', {
        payload,
      });
    }
  }, [disabled, mode, selectedDate, selectedStartDate, selectedEndDate, selectedTime, initialDate, initialStartDate, initialEndDate, initialTime, minimumDate, maximumDate, minMonthYear, maxMonthYear, title, confirmText, cancelText, is24Hour, handleDateSelect, handleDateRangeSelect, handleTimeSelect]);

  const displayValue = getDisplayValue();
  const placeholderText = getPlaceholderText();

  useEffect(() => {
    if (!initialStartDate && !initialEndDate) reset();
  }, [initialStartDate, initialEndDate]);

  const reset = () => {
    setSelectedDate(undefined);
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setSelectedTime(undefined);
  };

  return (
    <View className={`mb-4 ${containerStyle}`}>
      {/* Label */}
      {label && (
        <AppText weight="semibold" size="md" className="mb-1 text-gray-700">
          {required && <AppText className="text-red-500">*</AppText>} {label}
        </AppText>
      )}

      {/* Input Field */}
      <TouchableOpacity
        onPress={openPicker}
        disabled={disabled}
        className={`
          flex-row items-center justify-between
          px-4 py-3.5 rounded border
          ${
            disabled
              ? 'opacity-50 bg-gray-100 dark:bg-gray-800'
              : isDarkTheme
                ? 'bg-gray-800 border-gray-600 active:border-blue-500'
                : 'bg-white border-2 border-gray-300 active:border-blue-500'
          }
          ${error ? 'border-red-500' : 'focus:border-blue-500'}
          shadow-sm
          ${inputStyle}
        `}
        activeOpacity={disabled ? 1 : 0.7}>
        <View className="flex-1 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <AppIcon
              type="ionicons"
              name={getIconName()}
              size={20}
              color={
                disabled
                  ? isDarkTheme
                    ? '#6B7280'
                    : '#9CA3AF'
                  : error
                    ? '#EF4444'
                    : isDarkTheme
                      ? '#D1D5DB'
                      : '#6B7280'
              }
              style={{marginRight: 12}}
            />
            <AppText
              size="md"
              weight="semibold"
              className={` ${
                displayValue
                  ? isDarkTheme
                    ? 'text-white'
                    : 'text-gray-900'
                  : isDarkTheme
                    ? 'text-gray-200'
                    : 'text-gray-400'
              }`}
              numberOfLines={1}>
              {displayValue || placeholderText}
            </AppText>
          </View>
          <Pressable
            style={{alignItems: 'flex-end', padding: 3}}
            onPress={reset}>
            <AppIcon
              type="feather"
              name="x-circle"
              size={20}
              color="grey"
              style={{opacity: displayValue ? 1 : 0}}
            />
          </Pressable>
        </View>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View className="mt-1 flex-row items-center">
          <AppIcon
            type="ionicons"
            name="alert-circle-outline"
            size={16}
            color="#EF4444"
            style={{marginRight: 4}}
          />
          <AppText className="text-sm text-red-500">{error}</AppText>
        </View>
      )}

      {/* Helper Text for Date Range */}
      {mode === 'dateRange' && selectedStartDate && !selectedEndDate && (
        <View className="mt-1">
          <AppText
            className={`text-xs ${
              isDarkTheme ? 'text-blue-400' : 'text-blue-600'
            }`}>
            Now select the end date
          </AppText>
        </View>
      )}
      {mode === 'month' && selectedStartDate && !selectedEndDate && (
        <View className="mt-1">
          <AppText
            className={`text-xs ${
              isDarkTheme ? 'text-blue-400' : 'text-blue-600'
            }`}>
            Now select the end month
          </AppText>
        </View>
      )}
    </View>
  );
};

export default AppDatePicker;
