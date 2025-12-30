import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {createMMKVStorage} from '../utils/mmkvStorage';

interface AttendanceStore {
  lastInside: boolean | null;
  setLastInside: (inside: boolean) => void;
  attendanceToday: {
    checkInDone: boolean;
    checkOutDone: boolean;
    isCompleted: boolean;
  };
  setAttendanceToday: (attendance: {
    checkInDone: boolean;
    checkOutDone: boolean;
    isCompleted: boolean;
  }) => void;
  reset: () => void;
}

export const useASEAttendanceStore = create<AttendanceStore>()(
  persist(
    (set, get) => ({
      lastInside: null,
      setLastInside: (inside: boolean) => set({lastInside: inside}),
      attendanceToday: {
        checkInDone: false,
        checkOutDone: false,
        isCompleted: false,
      },
      setAttendanceToday: attendance => set({attendanceToday: attendance}),
      reset: () =>
        set({
          lastInside: null,
          attendanceToday: {
            checkInDone: false,
            checkOutDone: false,
            isCompleted: false,
          },
        }),
    }),
    {
      name: 'ase-attendance-store',
      storage: createMMKVStorage<AttendanceStore>(),
    },
  ),
);
