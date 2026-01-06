import {useQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../stores/useLoginStore';
import {handleASINApiCall} from '../../utils/handleApiCall';

export const useMarkAttendance = (
  status: 'Present' | 'Absent',
  Lat: number,
  Lon: number,
) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery({
    queryKey: ['postAttendance', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/ASE/PostASIN_ISP_Attendance_Info_Insert',
        {
          IChannelID: employeeCode,
          IStatus: status === 'Present' ? 'in' : 'out',
          Latitude: Lat,
          Longitude: Lon,
        },
      );

      const result = response.DashboardData;
      if (!result?.Status) return [];
      return result;
    },
  });
};

export const useGetAttendanceHistory = (
  yearQTR: string,
  month: string,
) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery({
    queryKey: ['getAttendance', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/ASE/GetASIN_ISP_Attendance_Info',
        {
          IChannelID: employeeCode,
          year: yearQTR,
          month: month,
        },
      );

      const result = response.DashboardData;
      if (!result?.Status) return [];
      return result;
    },
  });
};


