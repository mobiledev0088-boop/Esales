import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {createMMKVStorage} from '../utils/mmkvStorage';

export interface AttendanceToday {
  checkInDone: boolean;
  checkInTime: string | null;
  checkOutDone: boolean;
  checkOutTime: string | null;
  attendanceDate: string | null;
  status: 'Present' | 'Absent' | 'Partial' | 'Leave' | 'WeekOff' |  'None';
}

export interface AttendanceStore {
  attendanceToday: AttendanceToday;
  currentStatus: 'CheckIn' | 'CheckOut' | 'None';
  markCheckInDone: () => void;
  markCheckOutDone: () => void;
  setTheStatus: (status: AttendanceToday['status']) => void;
  checkAndResetIfNewDay: () => boolean;
  reset: () => void;
}

const defaultAttendanceToday: AttendanceToday = {
  checkInDone: false,
  checkInTime: null,
  checkOutDone: false,
  checkOutTime: null,
  attendanceDate: null,
  status: 'None',
};

const isDifferentDay = (d1: Date, d2: Date) =>
  d1.getFullYear() !== d2.getFullYear() &&
  d1.getMonth() !== d2.getMonth() &&
  d1.getDate() !== d2.getDate();

export const useASEAttendanceStore = create<AttendanceStore>()(
  persist(
    (set, get) => ({
      attendanceToday: defaultAttendanceToday,
      currentStatus: 'None',
      markCheckInDone: () => {
        set(state => ({
          attendanceToday: {
            ...state.attendanceToday,
            checkInDone: true,
            checkInTime: new Date().toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            attendanceDate: new Date().toISOString(),
            status: 'Partial',
          },
          currentStatus: 'CheckIn',
        }));
      },
      markCheckOutDone: () => {
        set(state => ({
          attendanceToday: {
            ...state.attendanceToday,
            checkOutDone: true,
            checkOutTime: new Date().toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            status: 'Present',
          },
          currentStatus: 'CheckOut',
        }));
      },
      setTheStatus: (status: AttendanceToday['status']) => {
        set(state => ({
          attendanceToday: {
            ...state.attendanceToday,
            status: status,
          },
        }));
      },
      checkAndResetIfNewDay: () => {
        const lastCheckInTime = get().attendanceToday.attendanceDate;
        if (!lastCheckInTime) return false;
        if (isDifferentDay(new Date(), new Date(lastCheckInTime))) {
          set({
            attendanceToday: defaultAttendanceToday,
            currentStatus: 'None',
          });
          return true;
        }
        return false;
      },
      reset: () =>
        set({
          attendanceToday: defaultAttendanceToday,
          currentStatus: 'None',
        }),
    }),
    {
      name: 'ase-attendance-store',
      storage: createMMKVStorage<AttendanceStore>(),
    },
  ),
);
