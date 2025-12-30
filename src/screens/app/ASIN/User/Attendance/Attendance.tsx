import {View, FlatList, TouchableOpacity} from 'react-native';
import {useMemo, useState} from 'react';
import moment from 'moment';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import AttendanceMarkModal from '../../../../../components/AttendanceMarkModal';
import AppButton from '../../../../../components/customs/AppButton';

type AttendanceStatus = 'Present' | 'Absent' | 'Holiday';

type AttendanceRecord = {
  date: string; // ISO date string, e.g. '2025-12-22'
  status: AttendanceStatus;
  checkIn?: string; // '09:05'
  checkOut?: string; // '18:02'
};

// Lightweight mock data provider. Replace with store/API as needed.
function useAttendanceData() {
  const todayIso = moment().format('YYYY-MM-DD');

  const history: AttendanceRecord[] = useMemo(() => {
    // Generate the last 20 days of mock records with varied statuses
    const out: AttendanceRecord[] = [];
    for (let i = 0; i < 20; i++) {
      const d = moment().subtract(i, 'days');
      const iso = d.format('YYYY-MM-DD');
      let status: AttendanceStatus = 'Present';
      if (i % 9 === 0 && i !== 0) status = 'Holiday';
      else if (i % 7 === 0 && i !== 0) status = 'Absent';

      out.push({
        date: iso,
        status,
        checkIn: status === 'Present' ? '09:10' : undefined,
        checkOut: status === 'Present' ? '18:05' : undefined,
      });
    }
    return out;
  }, []);

  const today = history.find(h => h.date === todayIso) ?? {
    date: todayIso,
    status: 'Absent' as AttendanceStatus,
  };

  return {today, history};
}

const statusStyles: Record<
  AttendanceStatus,
  {bg: string; text: string; border: string}
> = {
  Present: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  Absent: {bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200'},
  Holiday: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
};

function StatusBadge({status}: {status: AttendanceStatus}) {
  const s = statusStyles[status];
  return (
    <View className={`px-2.5 py-1 rounded-full border ${s.bg} ${s.border}`}>
      <AppText className={`text-xs font-medium ${s.text}`}>{status}</AppText>
    </View>
  );
}

function HeroStatusCard({
  record,
  label,
}: {
  record: AttendanceRecord;
  label: string;
}) {
  const checkedIn = !!record.checkIn;
  const checkedOut = !!record.checkOut;
  const accent = statusStyles[record.status];

  return (
    <Card
      className="mb-4 rounded-3xl bg-white dark:bg-neutral-900 mt-5 border border-slate-300 dark:border-slate-800"
      noshadow>
      <View className="flex-row items-center">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center justify-between">
            <AppText size='sm' className="text-slate-500">{label}</AppText>
            <StatusBadge status={record.status} />
          </View>
          <AppText className="mt-2 w-[90%]" weight='medium' size='3xl'>
            {record.status === 'Present' ? 'You are checked in' : record.status}
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
              {record.checkIn ?? '--:--'}
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
              {record.checkOut ?? '--:--'}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}

function HistoryItem({item}: {item: AttendanceRecord}) {
  const s = statusStyles[item.status];
  return (
    <Card
      className="mb-3 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-800"
      noshadow>
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 mr-3 rounded-2xl border items-center justify-center ${s.bg} ${s.border}`}>
          <AppText className={`text-base font-semibold ${s.text}`}>
            {moment(item.date).date()}
          </AppText>
        </View>
        <View className="flex-1 pr-3">
          <AppText className="text-[13px] text-slate-500">
            {moment(item.date).format('ddd, D MMM')}
          </AppText>
          <View className="mt-1 flex-row items-center space-x-2">
            <StatusBadge status={item.status} />
            {item.status === 'Present' ? (
              <AppText className="text-sm text-slate-600">
                {item.checkIn} - {item.checkOut}
              </AppText>
            ) : null}
          </View>
        </View>
        <View className={`px-3 py-2 rounded-xl border ${s.bg} ${s.border}`}>
          <AppText className={`text-xs font-medium ${s.text}`}>
            {item.status}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function WeeklyBar({
  selected,
  onSelect,
  statusMap,
}: {
  selected: string;
  onSelect: (iso: string) => void;
  statusMap: Record<string, AttendanceStatus>;
}) {
  const endDate = moment();
  const start = endDate.clone().subtract(6, 'days');
  const days = Array.from({length: 7}, (_, i) => start.clone().add(i, 'days'));
  const monthLabel =
    start.month() === endDate.month()
      ? start.format('MMMM YYYY')
      : `${start.format('MMM')} - ${endDate.format('MMM YYYY')}`;
  return (
    <Card
      className="rounded-2xl mb-4 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-800"
      noshadow>
      <View className="flex-row items-center justify-center mb-3">
        <AppText className="text-sm text-slate-600">{monthLabel}</AppText>
      </View>
      <View className="flex-row justify-between">
        {days.map((d, idx) => {
          const key = d.format('YYYY-MM-DD');
          const isSelected = key === selected;
          const st = statusMap[key] ?? 'Absent';
          const s = statusStyles[st];
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelect(key)}
              className={`items-center px-2 py-2 rounded-2xl ${isSelected ? 'bg-slate-100 dark:bg-neutral-800' : ''}`}
              activeOpacity={0.8}>
              <AppText
                className={`text-[10px] ${isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
                {d.format('ddd')}
              </AppText>
              <View
                className={`mt-1 w-9 h-9 rounded-2xl items-center justify-center border ${isSelected ? 'border-slate-300 dark:border-neutral-700' : 'border-slate-200 dark:border-neutral-800'}`}>
                <AppText
                  className={`text-sm font-semibold ${isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>
                  {d.date()}
                </AppText>
              </View>
              <View
                className={`mt-1 w-2 h-2 rounded-full ${s.bg.replace('50', '400')}`}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

export default function Attendance() {
  const {today, history} = useAttendanceData();
  const [selected, setSelected] = useState(moment().format('YYYY-MM-DD'));
  // removed anchor-based weekly navigation

  // Local mutable records so modal actions update UI immediately
  const [records, setRecords] = useState<AttendanceRecord[]>(history);
  const selectedRecord = records.find(h => h.date === selected) ?? today;
  const statusByDate = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    records.forEach(h => {
      map[h.date] = h.status;
    });
    return map;
  }, [records]);

  const selectedLabel =
    selected === moment().format('YYYY-MM-DD')
      ? "Today's Status"
      : moment(selected).format('ddd, D MMM');

  // Attendance Mark Modal state and handlers
  const [isMarkOpen, setIsMarkOpen] = useState(false);

  const handleCheckIn = () => {
    const now = new Date();
    const hh = `${now.getHours()}`.padStart(2, '0');
    const mm = `${now.getMinutes()}`.padStart(2, '0');
    const time = `${hh}:${mm}`;
    setRecords(prev => {
      const exists = prev.some(p => p.date === selected);
      const next: AttendanceRecord[] = exists
        ? prev.map(p =>
            p.date === selected
              ? {
                  ...p,
                  status: 'Present' as AttendanceStatus,
                  checkIn: p.checkIn ?? time,
                }
              : p,
          )
        : [
            {
              date: selected,
              status: 'Present' as AttendanceStatus,
              checkIn: time,
            },
            ...prev,
          ];
      return next;
    });
    setIsMarkOpen(false);
  };

  const handleCheckOut = () => {
    const now = new Date();
    const hh = `${now.getHours()}`.padStart(2, '0');
    const mm = `${now.getMinutes()}`.padStart(2, '0');
    const time = `${hh}:${mm}`;
    setRecords(prev =>
      prev.map(p =>
        p.date === selected
          ? {...p, status: 'Present' as AttendanceStatus, checkOut: time}
          : p,
      ),
    );
    setIsMarkOpen(false);
  };

  return (
    <AppLayout title="Attendance" needBack needPadding>
      <HeroStatusCard record={selectedRecord} label={selectedLabel} />
      <AppButton
        title="Mark Attendance"
        className="rounded-xl mb-3"
        onPress={() => setIsMarkOpen(true)}
        noLoading
      />
      <WeeklyBar
        selected={selected}
        onSelect={d => setSelected(d)}
        statusMap={statusByDate}
      />
      <AppText className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Recent History
      </AppText>
      <FlatList
        data={records}
        keyExtractor={it => it.date}
        renderItem={({item}) => <HistoryItem item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 24}}
      />
      <AttendanceMarkModal
        isVisible={isMarkOpen}
        onClose={() => setIsMarkOpen(false)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        status={(selectedRecord?.status ?? 'None') as any}
        checkIn={selectedRecord?.checkIn ?? null}
        checkOut={selectedRecord?.checkOut ?? null}
      />
    </AppLayout>
  );
}