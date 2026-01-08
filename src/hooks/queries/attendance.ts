import {useMutation, useQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../stores/useLoginStore';
import {handleASINApiCall} from '../../utils/handleApiCall';
import { getCurrentQuarter, to12HourFormat } from '../../utils/commonFunctions';
import { AttendanceToday } from '../../stores/useASEAttendanceStore';

interface MarkAttendancePayload {
  status: 'Present' | 'Absent' | 'Leave' | 'WeekOff';
  Lat: number;
  Lon: number;
  reason?: string;
}
const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const StatusMap: Record<string, string> = {
  Present: 'in',
  Absent: 'out',
  Leave: 'leave',
  WeekOff: 'week_off',
};
const ReverseStatusMap: Record<string, string> = {
  Present: 'Present',
  Partial: 'Partial',
  Absent: 'Absent',
  leave: 'Leave',
  week_off: 'WeekOff',
};

export const useMarkAttendance = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useMutation({
    mutationFn: async ({status, Lat, Lon, reason}: MarkAttendancePayload) => {
      const response = await handleASINApiCall(
        '/ASE/PostASIN_ISP_Attendance_Info_Insert',
        {
          IChannelID: employeeCode,
          Status: StatusMap[status],
          Latitude: Lat,
          Longitude: Lon,
          reason: reason || null,
        },
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Attendance marking failed');
      }
      return result;
    },
  });
};

export const useGetAttendanceHistory = () => {
  const {EMP_Code:employeeCode} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['getAttendance', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/ASE/PostASIN_ISP_Attendance_Info',
        {
          IChannelID: employeeCode,
          Year: getCurrentQuarter(),
        },
      );
      const result = response.DashboardData;
      if (!result?.Status) return [];
      const data  = result?.Datainfo?.Table || [];
      return data;
    },
    select: (data) => {
      const newData = data.map((item: any) => ({
        checkInDone: item?.AIA_Check_In_Time !== null,
        checkInTime: item?.AIA_Check_In_Time !== null ? to12HourFormat(item?.AIA_Check_In_Time) : null,
        checkOutDone: item?.AIA_Check_Out_Time !== null,
        checkOutTime: item?.AIA_Check_Out_Time !== null ? to12HourFormat(item?.AIA_Check_Out_Time) : null,
        attendanceDate: formatDate(item.AIA_Date),
        status: ReverseStatusMap[item.Status],
      }))
      return newData as AttendanceToday[];
    },
  });
};



    