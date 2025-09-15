import {useQuery, useMutation} from '@tanstack/react-query';
import {handleASINApiCall} from '../../utils/handleApiCall';
import {useLoginStore} from '../../stores/useLoginStore';
import useEmpStore from '../../stores/useEmpStore';
import { ActivationPerformanceData } from '../../types/dashboard';

// Reusable selectors for better performance
const getUserCredentials = () => {
  const {userInfo} = useLoginStore.getState();
  const {empInfo} = useEmpStore.getState();
  
  return {
    employeeCode: userInfo?.EMP_Code || '',
    employeeRole: userInfo?.EMP_RoleId || '',
    yearQtr: empInfo?.Year_Qtr || '',
  };
};

// Constants for cache configuration
const DASHBOARD_CACHE_CONFIG = {
  staleTime: 24 * 60 * 60 * 1000, // 24 hours
  gcTime: 24 * 60 * 60 * 1000,
  networkMode: 'offlineFirst' as const,
  refetchOnWindowFocus: false,
};

export const useDashboardBanner = () => {
  const {employeeCode, employeeRole} = getUserCredentials();
  
  return useQuery({
    queryKey: ['getBannerInfo', employeeCode, employeeRole],
    queryFn: async () => {
      const res = await handleASINApiCall('/Information/GetBannerInfo', {
        employeeCode,
        RoleId: employeeRole,
      });
      
      const result = res.DashboardData;
      if (!result?.Status) return [];
      
      // Use optional chaining and provide fallback
      return result.Datainfo?.BannerInfo?.map((item: any) => ({
        image: item.Banner_Link,
        Group_Sequence_No: item.Group_Sequence_No,
      })) || [];
    },
    enabled: !!employeeCode, // Only run if we have employee code
    ...DASHBOARD_CACHE_CONFIG,
  });
};

export const useDashboardData = (
  YearQtr: string | null,
  masterTab: string | null,
) => {
  const {employeeCode, yearQtr} = getUserCredentials();
  const effectiveYearQtr = YearQtr || yearQtr;
  const effectiveMasterTab = masterTab || 'Total';
  
  return useQuery({
    queryKey: ['dashboardData', employeeCode, effectiveMasterTab, effectiveYearQtr],
    queryFn: async () => {
      const res = await handleASINApiCall('/Dashboard/GetDashboardData_New', {
        employeeCode,
        masterTab: effectiveMasterTab,
        YearQtr: effectiveYearQtr,
      });
      
      const result = res.DashboardData;
      return result?.Status ? result.Datainfo : null;
    },
    enabled: !!(employeeCode && masterTab),
    ...DASHBOARD_CACHE_CONFIG,
  });
};

export const useDashboardDataAM = (
  YearQtr: string | null,
  masterTab: string | null,
) => {
  // const {employeeCode, yearQtr} = getUserCredentials();
  const {yearQtr} = getUserCredentials();
  // const effectiveYearQtr = YearQtr || yearQtr;
  const effectiveYearQtr = '20259';
  const effectiveMasterTab = masterTab || 'Total';
  const employeeCode = 'KN1100081' // For testing purpose only 
  return useQuery({
    queryKey: ['dashboardDataAM', employeeCode, effectiveMasterTab, effectiveYearQtr],
    queryFn: async () => {
      const res = await handleASINApiCall('/Dashboard/GetDashboardDataASE_MonthWise', {
        employeeCode,
        masterTab: effectiveMasterTab,
        YearQtr: effectiveYearQtr,
      });
      
      const result = res.DashboardData;
      return result?.Status ? result.Datainfo : null;
    },
    enabled: !!(employeeCode && masterTab),
    ...DASHBOARD_CACHE_CONFIG,
  });
};

export const useDashboardActivationData = () => {
  const {employeeCode, employeeRole} = getUserCredentials();

  return useMutation<ActivationPerformanceData, Error, {startDate: string; endDate: string; masterTab: string}>({
    mutationFn: async (variables: {startDate: string; endDate: string; masterTab: string}): Promise<ActivationPerformanceData> => {
      const {startDate, endDate, masterTab} = variables;
      
      const res = await handleASINApiCall('/Dashboard/GetDashboardActivationData_New', {
        employeeCode,
        masterTab: masterTab || 'Total',
        RoleID: employeeRole,
        StartDate: startDate,
        EndDate: endDate,
      });

      const result = res.DashboardData;
      
      if (!result?.Status || !result.Datainfo) {
        throw new Error('Failed to fetch dashboard activation data');
      }
      
      const dashboardData = result.Datainfo;
      
      return {
            Top5AGP:
              dashboardData?.Top5AGP?.map((item: any) => ({
                ...item,
                name: item.Top_5_AGP,
                SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
              })) || [],
            Top5ALP:
              dashboardData?.Top5ALP?.map((item: any) => ({
                ...item,
                name: item.Top_5_ALP,
                SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
              })) || [],
            Top5ASP:
              dashboardData?.Top5ASP?.map((item: any) => ({
                ...item,
                name: item.Top_5_ASP,
                SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
              })) || [],
            Top5Branch:
              dashboardData?.Top5Branch?.map((item: any) => ({
                ...item,
                name: item.Top_5_Branch,
              })) || [],
            Top5Disti:
              dashboardData?.Top5Disti?.map((item: any) => ({
                ...item,
                name: item.Top_5_Disti,
              })) || [],
            Top5Model:
              dashboardData?.Top5Model?.map((item: any) => ({
                ...item,
                name: item.Top_5_Model,
                SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
              })) || [],
          };
    },
    onError: error => {
      console.error('Error fetching dashboard activation data:', error);
    },
  });
};
