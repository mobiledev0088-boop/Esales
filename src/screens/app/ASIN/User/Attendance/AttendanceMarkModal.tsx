import {useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import AppModal from '../../../../../components/customs/AppModal';
import AppText from '../../../../../components/customs/AppText';
import AppButton from '../../../../../components/customs/AppButton';
import Card from '../../../../../components/Card';
import {useLocation} from '../../../../../hooks/useLocation';
import {useASEAttendanceStore} from '../../../../../stores/useASEAttendanceStore';
import {isInsideGeoFence} from './component';

interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const statusStyles = {
  Present: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  Absent: {bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200'},
  None: {bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200'},
} as const;

export default function AttendanceMarkModal({
  isOpen = false,
  onClose,
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const {
    attendanceToday,
    checkAndResetIfNewDay,
    markCheckInDone,
    markCheckOutDone,
  } = useASEAttendanceStore();
  const {location} = useLocation();
  const userInsideGeoFence = useMemo(() => {
    if (!location) return false;
    const {lat, lon} = location;
    return isInsideGeoFence(lat, lon);
  }, [location]);

  const handleCheckIn = () => {
    if (attendanceToday.checkInDone) return;
    markCheckInDone();
    !isOpen && setIsVisible(false);
  };

  const handleCheckOut = () => {
    if (attendanceToday.checkOutDone && !userInsideGeoFence) return;
    markCheckOutDone();
    !isOpen && setIsVisible(false);
  };

  const handleClose = () => setIsVisible(false);

  // Style logic
  const s = useMemo(
    () =>
      statusStyles[attendanceToday.checkInDone ? 'Present' : 'None'] ??
      statusStyles.Absent,
    [attendanceToday.checkInDone],
  );

  // Reset state if a new day is detected
  useEffect(() => {
    checkAndResetIfNewDay();
  }, [checkAndResetIfNewDay]);

  useEffect(() => {
    if (isOpen) return;
    if (!location) return;
    const {lat, lon} = location;
    const insideGeoFence = isInsideGeoFence(lat, lon);

    const needToShowModal = !attendanceToday.checkInDone
      ? insideGeoFence
      : !attendanceToday.checkOutDone
        ? !insideGeoFence
        : false;
    // Only react to transitions across the geofence boundary
    if (needToShowModal) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [location]);
  return (
    <AppModal
      isOpen={isOpen || isVisible}
      onClose={onClose || handleClose}
      modalWidth={'92%'}
      animationType="bounce"
      showCloseButton>
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <AppText className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Mark Attendance
          </AppText>
          <View className={`px-3 py-1 rounded-full border ${s.bg} ${s.border}`}>
            <AppText className={`text-xs font-medium ${s.text}`}>
              {attendanceToday.checkInDone === false
                ? '—-'
                : 'Attendance Marked'}
            </AppText>
          </View>
        </View>

        <Card className={`rounded-2xl border ${s.bg} ${s.border} mb-4`}>
          <View className="p-3">
            <View className="flex-row items-baseline justify-between">
              <AppText className="text-xs text-slate-500">Check In</AppText>
              <AppText
                className={`${attendanceToday.checkInDone ? 'text-emerald-600' : 'text-slate-400'} text-xs`}>
                {attendanceToday.checkInDone ? 'Done' : 'Pending'}
              </AppText>
            </View>
            <AppText
              className={`mt-1 text-xl font-semibold ${attendanceToday.checkInDone ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {attendanceToday.checkInTime ?? '--:--'}
            </AppText>

            <View className="mt-3 flex-row items-baseline justify-between">
              <AppText className="text-xs text-slate-500">Check Out</AppText>
              <AppText
                className={`${attendanceToday.checkOutDone ? 'text-emerald-600' : 'text-slate-400'} text-xs`}>
                {attendanceToday.checkOutDone ? 'Done' : 'Pending'}
              </AppText>
            </View>
            <AppText
              className={`mt-1 text-xl font-semibold ${attendanceToday.checkOutDone ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              {attendanceToday.checkOutTime ?? '--:--'}
            </AppText>
          </View>
        </Card>

        <View className="flex-row gap-3">
          <AppButton
            title={attendanceToday.checkInDone ? 'Checked In' : 'Check In Now'}
            onPress={handleCheckIn}
            disabled={attendanceToday.checkInDone}
            className="flex-1 rounded-xl bg-emerald-600"
            noLoading
          />
          <AppButton
            title={
              attendanceToday.checkOutDone
                ? 'Check Out Override'
                : 'Check Out Now'
            }
            onPress={handleCheckOut}
            disabled={
              !attendanceToday.checkInDone ||
              (attendanceToday.checkOutDone && !userInsideGeoFence)
            }
            className="flex-1 rounded-xl bg-indigo-600"
            noLoading
          />
        </View>
      </View>
    </AppModal>
  );
}
