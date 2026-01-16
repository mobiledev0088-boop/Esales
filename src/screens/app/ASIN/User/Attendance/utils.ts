import moment from 'moment';
import {to12HourFormat} from '../../../../../utils/commonFunctions';

export interface AttendanceToday {
  checkInDone: boolean;
  checkInTime: string | null;
  checkOutDone: boolean;
  checkOutTime: string | null;
  attendanceDate: string | null;
  status: 'Present' | 'Absent' | 'Partial' | 'Leave' | 'WeekOff' | 'None';
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

export interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LeaveWeekOffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MonthCalendarProps {
  month: moment.Moment;
  records: AttendanceToday[];
  selectedDateKey?: string | null;
  onSelectDate?: (dateKey: string) => void;
  onMonthChange?: (next: moment.Moment) => void;
}

export interface MarkAttendancePayload {
  status: 'Present' | 'Absent' | 'Leave' | 'WeekOff';
  Lat: number;
  Lon: number;
  reason?: string;
}

export interface ASEData {
  AIM_Branch: string;
  AIM_Territory: string;
  AIM_ALPCode: string;
  AIM_DealerName: string;
  AIM_IChannelID: string;
  AIM_ISPName: string;
  AIM_DOJ: string;
}

export type LeaveWeekOff = 'Leave' | 'Week Off';
export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Partial'
  | 'Leave'
  | 'WeekOff'
  | 'None';

// Utility Functions
export const isDifferentDay = (d1: Date, d2: Date) =>
  d1.getFullYear() !== d2.getFullYear() &&
  d1.getMonth() !== d2.getMonth() &&
  d1.getDate() !== d2.getDate();

export const toDateKey = (value: string | null) => {
  if (!value) return null;
  const parsed = moment(value, ['DD-MM-YYYY', 'YYYY-MM-DD', moment.ISO_8601]);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
};

export const isInsideGeoFence = (
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
) => {
  console.log('centerLat, centerLon', centerLat, centerLon);
  if (centerLat === null || centerLon === null) return false;
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
export const deriveStatus = (
  record?: AttendanceToday | null,
): AttendanceStatus | null => {
  if (!record) return null;
  if (record.checkInDone && record.checkOutDone) return 'Present';
  if (record.checkInDone || record.checkOutDone) return 'Partial';
  if (record.status === 'Leave') return 'Leave';
  if (record.status === 'WeekOff') return 'WeekOff';
  return 'Absent';
};

export const statusStyles: Record<
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
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export const StatusMap: Record<string, string> = {
  Present: 'in',
  Absent: 'out',
  Leave: 'leave',
  WeekOff: 'week_off',
};
export const ReverseStatusMap: Record<string, string> = {
  Present: 'Present',
  Partial: 'Partial',
  Absent: 'Absent',
  leave: 'Leave',
  week_off: 'WeekOff',
};

export const transformAttendanceData = (data: any[]): AttendanceToday[] => {
  return data.map(item => ({
    checkInDone: item?.AIA_Check_In_Time !== null,
    checkInTime:
      item?.AIA_Check_In_Time !== null
        ? to12HourFormat(item?.AIA_Check_In_Time)
        : null,
    checkOutDone: item?.AIA_Check_Out_Time !== null,
    checkOutTime:
      item?.AIA_Check_Out_Time !== null
        ? to12HourFormat(item?.AIA_Check_Out_Time)
        : null,
    attendanceDate: formatDate(item.AIA_Date),
    status: ReverseStatusMap[item.Status] as any,
  }));
};

export const transformASEData = (data: any[]) => {
  const map: Record<string, ASEData[]> = {};
  for (const item of data) {
    const branch = item.AIM_Branch;
    (map[branch] ??= []).push(item);
  }
  return Object.entries(map).map(([Branch_Name, ASE]) => ({
    Branch_Name,
    ASE,
  }));
};
