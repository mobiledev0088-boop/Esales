import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {createMMKVStorage} from '../utils/mmkvStorage';

export interface AttendanceToday {
  checkInDone: boolean;
  checkInTime: string | null;
  checkOutDone: boolean;
  checkOutTime: string | null;
  attendanceDate: string | null;
}

export interface AttendanceStore {
  attendanceToday: AttendanceToday;
  currentStatus: 'CheckIn' | 'CheckOut' | 'None';
  markCheckInDone: () => void;
  markCheckInDoneOverride: () => void;
  markCheckOutDone: () => void;
  checkAndResetIfNewDay: () => boolean;
  reset: () => void;
}

const defaultAttendanceToday = {
  checkInDone: false,
  checkInTime: null,
  checkOutDone: false,
  checkOutTime: null,
  attendanceDate: null,
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
          },
          currentStatus: 'CheckIn',
        }));
      },
      markCheckInDoneOverride: () => {
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
            checkOutDone: false,
            checkOutTime: null,
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
          },
          currentStatus: 'CheckOut',
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
