import moment from 'moment';
import {View, TouchableOpacity} from 'react-native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import AttendanceMarkModal from './AttendanceMarkModal';
import AppButton from '../../../../../components/customs/AppButton';
import {
  AttendanceToday,
  useASEAttendanceStore,
} from '../../../../../stores/useASEAttendanceStore';
import AppIcon from '../../../../../components/customs/AppIcon';
import {
  AttendaceNotAvailable,
  AttendanceSkeleton,
  HeroStatusCard,
  InformationModal,
  isInsideGeoFence,
  LeaveWeekOffModal,
  MonthCalendar,
  toDateKey,
} from './component';
import {useLocation} from '../../../../../hooks/useLocation';
import {isIOS} from '../../../../../utils/constant';
import {
  check,
  PERMISSIONS,
  RESULTS,
  PermissionStatus,
} from 'react-native-permissions';
import {AppNavigationProp} from '../../../../../types/navigation';
import {useGetAttendanceHistory} from '../../../../../hooks/queries/attendance';
import {useLoginStore} from '../../../../../stores/useLoginStore';

// const history: AttendanceToday[] = [
//   {
//     checkInDone: true,
//     checkInTime: '09:10 AM',
//     checkOutDone: true,
//     checkOutTime: '06:10 PM',
//     attendanceDate: '05-01-2026',
//     status: 'Present',
//   },
//   {
//     checkInDone: true,
//     checkInTime: '09:05 AM',
//     checkOutDone: true,
//     checkOutTime: '06:00 PM',
//     attendanceDate: '04-01-2026',
//     status: 'Present',
//   },
//   {
//     checkInDone: true,
//     checkInTime: '09:15 AM',
//     checkOutDone: true,
//     checkOutTime: '06:10 PM',
//     attendanceDate: '03-01-2026',
//     status: 'Present',
//   },
//   {
//     checkInDone: false,
//     checkInTime: null,
//     checkOutDone: false,
//     checkOutTime: null,
//     attendanceDate: '02-01-2026',
//     status: 'Absent',
//   },
//   {
//     checkInDone: false,
//     checkInTime: null,
//     checkOutDone: false,
//     checkOutTime: null,
//     attendanceDate: '01-01-2026',
//     status: 'Absent',
//   },
// ];

const LOCATION_PERMISSION = isIOS
  ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
  : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

export default function Attendance() {
  const navigation = useNavigation<AppNavigationProp>();
  const {Latitude, Longitude} = useLoginStore(state => state.userInfo);
  const {attendanceToday} = useASEAttendanceStore();
  const {data, isLoading, error} = useGetAttendanceHistory();

  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);
  const hasLocationPermission = permissionStatus === RESULTS.GRANTED;
  const {location, loading} = useLocation(hasLocationPermission);

  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const parsed = toDateKey(attendanceToday.attendanceDate);
    return parsed ? moment(parsed) : moment();
  });
  const todayKey = useMemo(() => moment().format('YYYY-MM-DD'), []);
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const parsed = toDateKey(attendanceToday.attendanceDate);
    return parsed ?? todayKey;
  });

  const isMarkEnabled = useMemo(() => {
    if (!location) return false;
    const {lat, lon} = location;
    if (
      !attendanceToday.checkInDone &&
      !isInsideGeoFence(lat, lon, Latitude!, Longitude!)
    )
      return false;
    return true;
  }, [attendanceToday, location, Latitude, Longitude]);
  const calendarRecords = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...(data || [])];
    if (attendanceToday.attendanceDate) {
      merged.push(attendanceToday);
    }
    return merged.filter(rec => {
      const key = toDateKey(rec.attendanceDate);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [attendanceToday, data]);

  const recordByDate = useMemo(() => {
    const map: Record<string, AttendanceToday> = {};
    calendarRecords.forEach(rec => {
      const key = toDateKey(rec.attendanceDate);
      if (key) map[key] = {...rec, attendanceDate: key};
    });
    return map;
  }, [calendarRecords]);

  const selectedRecord = useMemo<AttendanceToday>(() => {
    if (!selectedDateKey) {
      return {
        checkInDone: false,
        checkInTime: null,
        checkOutDone: false,
        checkOutTime: null,
        attendanceDate: null,
        status: 'None',
      };
    }

    const found = recordByDate[selectedDateKey];
    if (found) return found;

    return {
      checkInDone: false,
      checkInTime: null,
      checkOutDone: false,
      checkOutTime: null,
      attendanceDate: selectedDateKey,
      status: 'None',
    };
  }, [recordByDate, selectedDateKey]);

  const selectedLabel = useMemo(() => {
    const selDate = selectedDateKey ? moment(selectedDateKey) : null;
    if (selDate?.isValid()) {
      if (selDate.isSame(moment(), 'day')) return 'Today';
      if (selDate.isSame(moment().subtract(1, 'day'), 'day'))
        return 'Yesterday';
      return selDate.format('D MMM, YYYY');
    }
    return 'Today';
  }, [selectedDateKey]);

  const syncPermission = useCallback(async () => {
    const status = await check(LOCATION_PERMISSION);
    setPermissionStatus(status);
  }, []);

  useEffect(() => {
    syncPermission();
  }, [syncPermission]);

  if (permissionStatus !== RESULTS.GRANTED) {
    return <AttendaceNotAvailable navigation={navigation} />;
  }
  if (loading || isLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <AppLayout title="Attendance" needBack needPadding>
      <HeroStatusCard record={selectedRecord} label={selectedLabel} />
      <View className="flex-row items-center justify-between gap-x-2">
        <AppButton
          title={'Mark Attendance'}
          className="rounded-xl flex-1"
          onPress={() => setIsMarkOpen(true)}
          disabled={!isMarkEnabled}
          noLoading
        />
        <AppButton
          title={'Apply Leave / Week Off'}
          className="flex-1 rounded-xl bg-secondary dark:bg-secondary-dark"
          onPress={() => setIsLeaveOpen(true)}
          disabled={['Leave', 'WeekOff'].includes(attendanceToday.status)}
          noLoading
        />
      </View>
      {!isMarkEnabled && (
        <View className="flex-row items-center gap-x-2 mb-5 mt-2 px-1">
          <AppIcon
            name="info"
            type="feather"
            size={16}
            style={{color: '#f59e0b'}}
          />
          <AppText size="sm" className="text-slate-700">
            You need to be inside office area to mark attendance.
          </AppText>
        </View>
      )}
      <View className="flex-row items-center justify-between mb-3 px-1 mt-3">
        <View className="flex-row items-center gap-x-2">
          <View className="p-2 bg-[#E5E7EB] rounded-full">
            <AppIcon
              name="calendar"
              type="feather"
              size={20}
              style={{color: '#374151'}}
            />
          </View>
          <AppText
            weight="semibold"
            size="lg"
            className="text-slate-900 dark:text-slate-50">
            Attendance Calendar
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => setIsInfoOpen(true)}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-900">
          <AppIcon
            name="info"
            type="feather"
            size={18}
            style={{color: '#0ea5e9'}}
          />
        </TouchableOpacity>
      </View>

      <MonthCalendar
        month={currentMonth}
        records={calendarRecords}
        selectedDateKey={selectedDateKey}
        onSelectDate={key => setSelectedDateKey(key)}
        onMonthChange={setCurrentMonth}
      />

      <AttendanceMarkModal
        isOpen={isMarkOpen}
        onClose={() => setIsMarkOpen(false)}
      />
      <LeaveWeekOffModal
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
      />
      <InformationModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </AppLayout>
  );
}
