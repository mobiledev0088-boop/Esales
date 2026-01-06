import moment from 'moment';
import {View, TouchableOpacity} from 'react-native';
import {useMemo, useState} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import AttendanceMarkModal from './AttendanceMarkModal';
import AppButton from '../../../../../components/customs/AppButton';
import {useASEAttendanceStore} from '../../../../../stores/useASEAttendanceStore';
import AppIcon from '../../../../../components/customs/AppIcon';
import {
  AttendanceRecord,
  HeroStatusCard,
  InformationModal,
  isInsideGeoFence,
  LeaveWeekOffModal,
  MonthCalendar,
  toDateKey,
} from './component';
import {useLocation} from '../../../../../hooks/useLocation';

const history: AttendanceRecord[] = [
  {
    checkInDone: true,
    checkInTime: '09:10 AM',
    checkOutDone: true,
    checkOutTime: '06:10 PM',
    attendanceDate: '05-01-2026',
  },
  {
    checkInDone: true,
    checkInTime: '09:05 AM',
    checkOutDone: true,
    checkOutTime: '06:00 PM',
    attendanceDate: '04-01-2026',
  },
  {
    checkInDone: true,
    checkInTime: '09:15 AM',
    checkOutDone: true,
    checkOutTime: '06:10 PM',
    attendanceDate: '03-01-2026',
  },
  {
    checkInDone: false,
    checkInTime: null,
    checkOutDone: false,
    checkOutTime: null,
    attendanceDate: '02-01-2026',
  },
  {
    checkInDone: false,
    checkInTime: null,
    checkOutDone: false,
    checkOutTime: null,
    attendanceDate: '01-01-2026',
  },
];

export default function Attendance() {
  const {attendanceToday} = useASEAttendanceStore();
  const todayKey = useMemo(() => moment().format('YYYY-MM-DD'), []);
  const {location} = useLocation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const parsed = toDateKey(attendanceToday.attendanceDate);
    return parsed ? moment(parsed) : moment();
  });

  const isMarkEnabled = useMemo(() => {
    if (!location) return false;
    const {lat, lon} = location;
    if (!attendanceToday.checkInDone && !isInsideGeoFence(lat, lon))
      return false;
    return true;
  }, [attendanceToday, location]);

  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const parsed = toDateKey(attendanceToday.attendanceDate);
    return parsed ?? todayKey;
  });

  const calendarRecords = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...history];
    if (attendanceToday.attendanceDate) {
      merged.push(attendanceToday);
    }

    return merged.filter(rec => {
      const key = toDateKey(rec.attendanceDate);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [attendanceToday]);

  const recordByDate = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};
    calendarRecords.forEach(rec => {
      const key = toDateKey(rec.attendanceDate);
      if (key) map[key] = {...rec, attendanceDate: key};
    });
    return map;
  }, [calendarRecords]);

  const selectedRecord = useMemo<AttendanceRecord>(() => {
    if (!selectedDateKey) {
      return {
        checkInDone: false,
        checkInTime: null,
        checkOutDone: false,
        checkOutTime: null,
        attendanceDate: null,
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

  // Attendance Mark Modal state and handlers
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  return (
    <AppLayout title="Attendance" needBack needPadding>
      <HeroStatusCard record={selectedRecord} label={selectedLabel} />
      <View className="flex-row items-center justify-between gap-x-2">
        <AppButton
          title={'Mark Attendance'}
          className="rounded-xl flex-[2]"
          onPress={() => setIsMarkOpen(true)}
          disabled={!isMarkEnabled}
          noLoading
        />
        {/* helper text showing why marking is disabled */}
        <AppButton
          title={'Apply Leave / Week Off'}
          className="flex-[2] rounded-xl bg-slate-500 dark:bg-slate-700"
          onPress={() => setIsLeaveOpen(true)}
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
            <AppText size='sm' className="text-slate-700">
              You need to be inside office area to mark attendance.
            </AppText>
          </View>
        )}
      <View className="flex-row items-center justify-between mb-3 px-1">
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
