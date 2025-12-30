import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import AppModal from './customs/AppModal';
import AppText from './customs/AppText';
import AppButton from './customs/AppButton';
import Card from './Card';
import moment from 'moment';
import { useLocation } from '../hooks/useLocation';

export type AttendanceModalStatus = 'Present' | 'Absent' | 'None';

const statusStyles = {
  Present: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Absent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  None: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
} as const;

const STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  NONE: 'None',
} as const;

export default function AttendanceMarkModal() {
  // 1. Internal State Management
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<AttendanceModalStatus>(STATUS.NONE);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);

  const isInsideGeoFence = () => {
    const {location} = useLocation();
    if (!location) return false;
    const {lat, lon} = location;
    
    // const {Latitude, Longitude} = useLoginStore(state => state.userInfo);
    // Testing purpose hardcoded values Lotus Office location
    const centerLat = 19.137887555544914;
    const centerLon = 72.83872748527693;
    const radius = 100; // meters
    const R = 6371000; // Earth radius
  
    console.log('current location', lat, lon);
    console.log('geo-fence center', centerLat, centerLon);
  
    const toRad = (v: number) => (v * Math.PI) / 180;
    const x = toRad(lon - centerLon) * Math.cos(toRad((lat + centerLat) / 2));
    const y = toRad(lat - centerLat);
    const distance = Math.sqrt(x * x + y * y) * R;
    console.log('distance from geo-fence center', distance);
  
    return distance <= radius;
  };

  // Derived logic
  const hasIn = !!checkIn;
  const hasOut = !!checkOut;

  // 2. Internal Handlers
  const getCurrentTime = useMemo(() => moment().format('hh:mm A'), []);

  const handleCheckIn = () => {
    setCheckIn(getCurrentTime);
    setStatus(STATUS.PRESENT);
  };

  const handleCheckOut = () => {
    setCheckOut(getCurrentTime);
    // Keep status as Present or change to 'Completed' based on your needs
  };

  const handleClose = () => setIsVisible(false);

  // Style logic
  const s = useMemo(() => statusStyles[status] ?? statusStyles.Absent, [status]);

  // useEffect(() => {
  //   const insideGeoFence = isInsideGeoFence();
  //   setIsVisible(true);
  // }, []);

  return (
    <AppModal
      isOpen={isVisible}
      onClose={handleClose}
      modalWidth={'92%'}
      animationType="bounce"
      showCloseButton
    >
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Mark Attendance
          </AppText>
          <View className={`px-3 py-1 rounded-full border ${s.bg} ${s.border}`}>
            <AppText className={`text-xs font-medium ${s.text}`}>
              {status === 'None' ? '—' : status}
            </AppText>
          </View>
        </View>

        <Card className={`rounded-2xl border ${s.bg} ${s.border} mb-4`}>
          <View className="p-3">
            <View className="flex-row items-baseline justify-between">
              <AppText className="text-xs text-slate-500">Check In</AppText>
              <AppText className={`${hasIn ? 'text-emerald-600' : 'text-slate-400'} text-xs`}>
                {hasIn ? 'done' : 'pending'}
              </AppText>
            </View>
            <AppText className={`mt-1 text-xl font-semibold ${hasIn ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {checkIn ?? '--:--'}
            </AppText>

            <View className="mt-3 flex-row items-baseline justify-between">
              <AppText className="text-xs text-slate-500">Check Out</AppText>
              <AppText className={`${hasOut ? 'text-emerald-600' : 'text-slate-400'} text-xs`}>
                {hasOut ? 'done' : 'pending'}
              </AppText>
            </View>
            <AppText className={`mt-1 text-xl font-semibold ${hasOut ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {checkOut ?? '--:--'}
            </AppText>
          </View>
        </Card>

        <View className="flex-row gap-3">
          <AppButton
            title={hasIn ? 'Checked In' : 'Check In Now'}
            onPress={handleCheckIn}
            disabled={hasIn}
            className="flex-1 rounded-xl bg-emerald-600"
            noLoading
          />
          <AppButton
            title={hasOut ? 'Checked Out' : 'Check Out'}
            onPress={handleCheckOut}
            disabled={!hasIn || hasOut}
            className="flex-1 rounded-xl bg-indigo-600"
            noLoading
          />
        </View>
      </View>
    </AppModal>
  );
}