import {TouchableOpacity, View} from 'react-native';
import AppModal from '../../../../../components/customs/AppModal';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import {useCallback, useMemo, useState} from 'react';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import moment from 'moment';
import Card from '../../../../../components/Card';
import {useMarkAttendance} from '../../../../../hooks/queries/attendance';
import AppLayout from '../../../../../components/layout/AppLayout';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import {
  AttendanceToday,
  useASEAttendanceStore,
} from '../../../../../stores/useASEAttendanceStore';

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeaveWeekOffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MonthCalendarProps {
  month: moment.Moment;
  records: AttendanceToday[];
  selectedDateKey?: string | null;
  onSelectDate?: (dateKey: string) => void;
  onMonthChange?: (next: moment.Moment) => void;
}

type LeaveWeekOff = 'Leave' | 'Week Off';
type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Partial'
  | 'Leave'
  | 'WeekOff'
  | 'None';

// Utility Functions
export const toDateKey = (value: string | null) => {
  if (!value) return null;
  const parsed = moment(value, ['DD-MM-YYYY', 'YYYY-MM-DD', moment.ISO_8601]);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
};

export const isInsideGeoFence = (lat: number, lon: number,centerLat: number,centerLon: number) => {
  console.log('centerLat, centerLon',centerLat, centerLon);
  if(centerLat === null || centerLon === null) return false;
  // const {Latitude, Longitude} = useLoginStore(state => state.userInfo);

  // Office Location
  // const centerLat = 19.137887555544914;
  // const centerLon = 72.83872748527693;

  // old office Location
  // const centerLat = 19.133975;
  // const centerLon = 86.836282;

  // Home Location
  // const centerLat = 19.190455;
  // const centerLon = 86.830674;

  const radius = 100; // meters
  const R = 6371000; // Earth radius

  // console.log('current location', lat, lon);
  // console.log('geo-fence center', centerLat, centerLon);

  const toRad = (v: number) => (v * Math.PI) / 180;
  const x = toRad(lon - centerLon) * Math.cos(toRad((lat + centerLat) / 2));
  const y = toRad(lat - centerLat);
  const distance = Math.sqrt(x * x + y * y) * R;
  // console.log('distance from geo-fence center', distance);
  return distance <= radius;
};

// helpers function
const deriveStatus = (
  record?: AttendanceToday | null,
): AttendanceStatus | null => {
  if (!record) return null;
  if (record.checkInDone && record.checkOutDone) return 'Present';
  if (record.checkInDone || record.checkOutDone) return 'Partial';
  if (record.status === 'Leave') return 'Leave';
  if (record.status === 'WeekOff') return 'WeekOff';
  return 'Absent';
};

const statusStyles: Record<
  AttendanceStatus,
  {bg: string; text: string; border: string}
> = {
  None: {bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200'},
  Present: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  Absent: {bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200'},
  Partial: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Leave: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-200',
  },
  WeekOff: {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    border: 'border-warning-200',
  },
};

// Components
export const HeroStatusCard = ({
  record,
  label,
}: {
  record: AttendanceToday;
  label: string;
}) => {
  const checkedIn = !!record.checkInDone;
  const checkedOut = !!record.checkOutDone;
  const status = record.status;
  const accent = statusStyles[status];
  const s = statusStyles[status];
  return (
    <Card
      className="mb-4 rounded-3xl bg-white dark:bg-neutral-900 mt-5 border border-slate-300 dark:border-slate-800"
      noshadow>
      <View className="flex-row items-center">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center justify-between">
            <AppText size="sm" className="text-slate-500">
              {label}
            </AppText>
            <View
              className={`px-2.5 py-1 rounded-full border ${s.bg} ${s.border}`}>
              <AppText className={`text-xs font-medium ${s.text}`}>
                {status}
              </AppText>
            </View>
          </View>
          <AppText className="mt-2 w-[90%]" weight="medium" size="3xl">
            {status === 'Present' ? 'Attendance marked' : status}
          </AppText>
          <AppText className="mt-1 text-slate-500">
            Track your hours and history
          </AppText>
        </View>
        <View className="w-40">
          <View
            className={`p-3 rounded-2xl border ${accent.bg} ${accent.border}`}>
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-slate-500">⏰ Check In</AppText>
              <AppText
                className={`${checkedIn ? 'text-emerald-600' : 'text-slate-400'} text-xs`}>
                {checkedIn ? 'done' : 'pending'}
              </AppText>
            </View>
            <AppText
              className={`mt-1 text-xl font-semibold ${checkedIn ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {record.checkInTime ?? '--:--'}
            </AppText>
            <View className="mt-3 flex-row items-center justify-between">
              <AppText className="text-xs text-slate-500">🏁 Check Out</AppText>
              <AppText
                className={`${checkedOut ? 'text-emerald-600' : 'text-slate-400'} text-xs`}>
                {checkedOut ? 'done' : 'pending'}
              </AppText>
            </View>
            <AppText
              className={`mt-1 text-xl font-semibold ${checkedOut ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {record.checkOutTime ?? '--:--'}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
};

export const MonthCalendar = ({
  month,
  records,
  selectedDateKey,
  onSelectDate,
  onMonthChange,
}: MonthCalendarProps) => {
  const dayWidth = '14.28%';
  const weekdayLabels = useMemo(() => moment.weekdaysShort(), []);
  const minMonth = useMemo(
    () => moment().startOf('month').subtract(5, 'months'),
    [],
  );
  const maxMonth = useMemo(() => moment().startOf('month'), []);

  const recordMap = useMemo(() => {
    const map: Record<string, AttendanceToday> = {};
    records.forEach(rec => {
      const key = toDateKey(rec.attendanceDate);
      if (key) map[key] = {...rec, attendanceDate: key};
    });
    return map;
  }, [records]);

  const days = useMemo(() => {
    const startOfMonth = month.clone().startOf('month');
    const totalDays = month.daysInMonth();
    const startOffset = startOfMonth.day();

    const allDays: Array<
      | {key: string; placeholder: true}
      | {
          key: string;
          placeholder?: false;
          date: moment.Moment;
          status: AttendanceStatus | null;
          isFuture: boolean;
        }
    > = [];

    for (let i = 0; i < startOffset; i += 1) {
      allDays.push({key: `blank-start-${i}`, placeholder: true});
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = startOfMonth.clone().date(day);
      const key = date.format('YYYY-MM-DD');
      allDays.push({
        key,
        date,
        status: deriveStatus(recordMap[key]),
        isFuture: date.isAfter(moment(), 'day'),
      });
    }

    const trailing = (7 - (allDays.length % 7)) % 7;
    for (let i = 0; i < trailing; i += 1) {
      allDays.push({key: `blank-end-${i}`, placeholder: true});
    }

    return allDays;
  }, [month, recordMap]);

  const navToMonth = (direction: 'prev' | 'next') => {
    if (!onMonthChange) return;
    const delta = direction === 'prev' ? -1 : 1;
    const next = month.clone().add(delta, 'month');
    if (next.isBefore(minMonth, 'month') || next.isAfter(maxMonth, 'month'))
      return;
    onMonthChange(next);
  };

  const isPrevDisabled = month.isSame(minMonth, 'month');
  const isNextDisabled = month.isSame(maxMonth, 'month');

  return (
    <Card
      className="mb-4 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-800"
      noshadow>
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={() => navToMonth('prev')}
          disabled={isPrevDisabled}
          className={`h-10 w-10 items-center justify-center rounded-2xl border ${isPrevDisabled ? 'border-slate-100 dark:border-slate-800 opacity-40' : 'border-slate-200 dark:border-slate-700'}`}>
          <AppIcon
            name="chevron-left"
            type="feather"
            size={20}
            style={{color: '#374151'}}
          />
        </TouchableOpacity>
        <View className="items-center">
          <AppText
            weight="semibold"
            size="lg"
            className="text-slate-900 dark:text-slate-50">
            {month.format('MMMM')}
          </AppText>
          <AppText className="text-xs text-slate-500 dark:text-slate-400 tracking-widest">
            {month.format('YYYY')}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => navToMonth('next')}
          disabled={isNextDisabled}
          className={`h-10 w-10 items-center justify-center rounded-2xl border ${isNextDisabled ? 'border-slate-100 dark:border-slate-800 opacity-40' : 'border-slate-200 dark:border-slate-700'}`}>
          <AppIcon
            name="chevron-right"
            type="feather"
            size={20}
            style={{color: '#374151'}}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row mb-2">
        {weekdayLabels.map(label => (
          <View key={label} style={{width: dayWidth}} className="items-center">
            <AppText className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </AppText>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap -mx-1">
        {days.map(day => {
          if ('placeholder' in day && day.placeholder) {
            return (
              <View
                key={day.key}
                style={{width: dayWidth}}
                className="px-2 pb-2"
              />
            );
          }

          const accent = day.status ? statusStyles[day.status] : null;
          const isSelected = selectedDateKey === day.key;
          const selectedTone: Record<AttendanceStatus, string> = {
            Present: 'bg-emerald-500 border-emerald-500',
            Absent: 'bg-red-500 border-red-500',
            Partial: 'bg-amber-500 border-amber-500',
            Leave: 'bg-rose-500 border-rose-500',
            WeekOff: 'bg-warning-500 border-warning-500',
            None: 'bg-slate-500 border-slate-500',
          };

          const tone = isSelected
            ? accent
              ? selectedTone[day.status as AttendanceStatus]
              : 'bg-slate-800 border-slate-800'
            : accent
              ? `${accent.bg} ${accent.border}`
              : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-slate-700';
          const textColor = isSelected
            ? 'text-white'
            : day.isFuture
              ? 'text-slate-300 dark:text-slate-600'
              : 'text-slate-900 dark:text-slate-100';
          return (
            <TouchableOpacity
              key={day.key}
              style={{width: dayWidth}}
              className="px-2 pb-2"
              activeOpacity={0.9}
              disabled={day.isFuture}
              onPress={() => !day.isFuture && onSelectDate?.(day.key)}>
              <View
                className={`items-center justify-center rounded-full border ${tone} ${day.isFuture ? 'opacity-50' : ''}`}
                style={{height: 36, width: 36}}>
                <AppText className={`text-base font-semibold ${textColor}`}>
                  {day.date.date()}
                </AppText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
};

export const InformationModal = ({isOpen, onClose}: InformationModalProps) => {
  const infoItems = [
    'Mark check-in when your day starts and check-out when you finish.',
    'A partial status shows when only check-in is done; complete both for Present.',
    'Future dates are locked; you can only view or mark up to today.',
    'You can navigate up to the last 6 months to review past attendance.',
    'Use Apply Leave / Week Off for planned absences instead of marking attendance.',
  ];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      modalWidth="92%"
      cardClassName="p-5 bg-white dark:bg-neutral-900 rounded-3xl">
      <View className="mb-3 flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
          <AppIcon
            name="info"
            type="feather"
            size={18}
            style={{color: '#10b981'}}
          />
        </View>
        <AppText
          weight="semibold"
          size="lg"
          className="ml-3 text-slate-900 dark:text-slate-50">
          Attendance Rule
        </AppText>
      </View>

      <View className="gap-y-3">
        {infoItems.map(item => (
          <View key={item} className="flex-row items-start">
            <View className="mt-1 mr-3 h-2 w-2 rounded-full bg-emerald-500" />
            <AppText className="flex-1 text-[15px] leading-5 text-slate-700 dark:text-slate-200">
              {item}
            </AppText>
          </View>
        ))}
      </View>
    </AppModal>
  );
};

export const LeaveWeekOffModal = ({
  isOpen,
  onClose,
}: LeaveWeekOffModalProps) => {
  const [selection, setSelection] = useState<LeaveWeekOff>('Leave');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const {mutate: markAttendanceAPI} = useMarkAttendance();
  const setTheStatus = useASEAttendanceStore(state => state.setTheStatus);

  const resetState = useCallback(() => {
    setSelection('Leave');
    setReason('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleSubmit = useCallback(() => {
    if (selection === 'Leave' && !reason.trim()) {
      setError('Reason is required for leave');
      return;
    }
    // Submit logic placeholder: integrate API here.
    markAttendanceAPI(
      {
        status: selection === 'Leave' ? 'Leave' : 'WeekOff',
        Lat: 0,
        Lon: 0,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          setTheStatus(selection === 'Leave' ? 'Leave' : 'WeekOff');
          resetState();
          onClose();
        },
        onError: (err: any) => {
          setError(err?.message || 'Failed to apply');
        },
      },
    );
  }, [selection, reason, resetState, onClose]);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton
      modalWidth="92%"
      cardClassName="p-5 bg-white dark:bg-neutral-900 rounded-3xl">
      <View className="flex-row items-center mb-4">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
          <AppIcon
            name="calendar"
            type="feather"
            size={18}
            style={{color: '#2563eb'}}
          />
        </View>
        <AppText
          weight="semibold"
          size="lg"
          className="ml-3 text-slate-900 dark:text-slate-50">
          Apply Leave / Week Off
        </AppText>
      </View>

      <View className="flex-row gap-2 mb-4">
        {(['Leave', 'Week Off'] as LeaveWeekOff[]).map(option => {
          const active = selection === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => setSelection(option)}
              className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${active ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-900'}`}>
              <AppIcon
                name={option === 'Leave' ? 'briefcase' : 'coffee'}
                type="feather"
                size={16}
                style={{color: active ? '#059669' : '#6b7280'}}
              />
              <AppText
                className={`ml-2 font-semibold ${active ? 'text-emerald-700' : 'text-slate-700 dark:text-slate-200'}`}>
                {option}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {selection === 'Leave' ? (
        <AppInput
          label="Reason"
          placeholder="Add a short reason"
          value={reason}
          setValue={text => {
            setReason(text);
            if (error) setError(null);
          }}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          inputWapperStyle={{alignItems: 'flex-start'}}
          inputClassName="pt-2"
          error={error ?? undefined}
        />
      ) : (
        <AppText className="text-sm text-slate-600 dark:text-slate-300 mb-1">
          Week off selected. No reason needed.
        </AppText>
      )}

      <AppButton
        title="Submit"
        className="mt-5 rounded-xl"
        onPress={handleSubmit}
        noLoading
      />
    </AppModal>
  );
};

export const AttendanceSkeleton = () => {
  return (
    <AppLayout title="Attendance" needBack needPadding>
      <View className="mt-4" />
      <Skeleton width={screenWidth - 14} height={200} borderRadius={12} />
      <View className="flex-row justify-between items-center">
        <Skeleton width={screenWidth / 2 - 14} height={40} borderRadius={8} />
        <Skeleton width={screenWidth / 2 - 14} height={40} borderRadius={8} />
      </View>
      <Skeleton width={screenWidth / 2} height={20} borderRadius={8} />
      <View>
        <Skeleton width={screenWidth - 14} height={300} borderRadius={12} />
      </View>
    </AppLayout>
  );
};

export const AttendaceNotAvailable = ({navigation}: {navigation: any}) => {
  return (
    <AppLayout title="Attendance" needBack needPadding>
      <View className="flex-1 justify-center items-center px-4">
        <View className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <View className="h-14 w-14 rounded-2xl items-center justify-center bg-sky-100 dark:bg-sky-900/40">
            <AppIcon
              name="navigation"
              type="feather"
              size={26}
              style={{color: '#0ea5e9'}}
            />
          </View>
          <AppText
            weight="semibold"
            size="xl"
            className="text-slate-900 dark:text-slate-50 mt-4">
            Location access needed
          </AppText>
          <AppText
            size="sm"
            className="text-slate-600 dark:text-slate-300 mt-2 leading-6">
            You can’t mark attendance without location. Go to App Permissions
            and enable location access for Esales.
          </AppText>
          <View className="flex-row gap-x-3 mt-6">
            <AppButton
              title="Open App Permissions"
              iconName="settings"
              onPress={() => navigation.push('AppPermissions')}
              className="flex-1 rounded-xl"
              noLoading
            />
          </View>
        </View>
      </View>
    </AppLayout>
  );
};
