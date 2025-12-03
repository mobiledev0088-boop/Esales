import {useQuery, useMutation, UseQueryResult} from '@tanstack/react-query';
import {handleAPACApiCall, handleASINApiCall} from '../../utils/handleApiCall';
import {useLoginStore} from '../../stores/useLoginStore';
import useEmpStore from '../../stores/useEmpStore';
import {ActivationPerformanceData} from '../../types/dashboard';
import { AppDropdownItem } from '../../components/customs/AppDropdown';

// Reusable selectors for better performance
const getUserCredentials = () => {
  const {userInfo} = useLoginStore.getState();
  const {empInfo} = useEmpStore.getState();

  return {
    employeeCode: userInfo?.EMP_Code || '',
    employeeRole: userInfo?.EMP_RoleId || '',
    yearQtr: empInfo?.Year_Qtr || '',
    IsParentCode: empInfo?.IsParentCode
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
      return (
        result.Datainfo?.BannerInfo?.map((item: any) => ({
          BannerURL_Link: item.BannerURL_Link,
          image: item.Banner_Link,
          Group_Sequence_No: item.Group_Sequence_No,
        })) || []
      );
    },
    enabled: !!employeeCode, // Only run if we have employee code
    ...DASHBOARD_CACHE_CONFIG,
  });
};

export const useDashboardData = (
  YearQtr: string | null,
  masterTab: string | null,
  subCode?: string | null,
  DifferentEmployeeCode?: string | null,
) => {
  let {employeeCode, yearQtr} = getUserCredentials();
  const effectiveYearQtr = YearQtr || yearQtr;
  const effectiveMasterTab = masterTab || 'Total';
  if(subCode) employeeCode = subCode; // Override employee code if subCode is provided (for partner view)
  return useQuery({
    queryKey: [
      'dashboardData',
      employeeCode,
      effectiveMasterTab,
      effectiveYearQtr,
      DifferentEmployeeCode
    ],
    queryFn: async () => {
      const res = await handleASINApiCall('/Dashboard/GetDashboardData_New', {
        employeeCode:DifferentEmployeeCode || employeeCode,
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
  const effectiveYearQtr = YearQtr || yearQtr;
  const effectiveMasterTab = masterTab || 'Total';
  const employeeCode = 'KN1100081'; // For testing purpose only
  return useQuery({
    queryKey: [
      'dashboardDataAM',
      employeeCode,
      effectiveMasterTab,
      effectiveYearQtr,
    ],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/Dashboard/GetDashboardDataASE_MonthWise',
        {
          employeeCode,
          masterTab: effectiveMasterTab,
          YearQtr: effectiveYearQtr,
        },
      );

      const result = res.DashboardData;
      return result?.Status ? result.Datainfo : null;
    },
    enabled: !!(employeeCode && masterTab),
    ...DASHBOARD_CACHE_CONFIG,
  });
};

export const useDashboardActivationData = () => {
  const {employeeCode, employeeRole} = getUserCredentials();

  return useMutation<
    ActivationPerformanceData,
    Error,
    {startDate: string; endDate: string; masterTab: string, isAPAC?: boolean}
  >({
    mutationFn: async (variables: {
      startDate: string;
      endDate: string;
      masterTab: string;
      isAPAC?: boolean;
    }): Promise<ActivationPerformanceData> => {
      const {startDate, endDate, masterTab, isAPAC} = variables;

      const handleApi = isAPAC ? handleAPACApiCall : handleASINApiCall;
      const endPoint = isAPAC ? '/Dashboard/GetDashboardActivationData' : '/Dashboard/GetDashboardActivationData_New';
      const res = await handleApi(
        endPoint,
        {
          employeeCode,
          masterTab: masterTab || 'Total',
          RoleID: employeeRole,
          StartDate: startDate,
          EndDate: endDate,
        },
      );

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

// need to give return type label and value in object of arrays
export const useGetSubCodeData = (): UseQueryResult<
  AppDropdownItem[],
  Error
> => {
  const {employeeCode, IsParentCode} = getUserCredentials();

  return useQuery<{label: string; value: string}[], Error>({
    queryKey: ['getSubCodeData', employeeCode],
    queryFn: async (): Promise<{label: string; value: string}[]> => {
      const res = await handleASINApiCall('/DemoForm/GetSubcode_List', {
        employeeCode,
      });
      const result = res.demoFormData;
      if (!result?.Status) return [];
      const subcodelist = result.Datainfo?.Subcode_List ?? [];
      const uniqueList = Array.from(
        new Map(
          subcodelist.map((item: {PartnerCode: string; PartnerName: string}) => [
            item.PartnerCode,
            {
              label: item.PartnerName,
              value: item.PartnerCode,
            },
          ]),
        ).values(),
      );
      return uniqueList as {label: string; value: string}[];
    },
    enabled: !!IsParentCode,
  });
};

export const useDashboardDataAPAC = (
  YearQtr: string | null,
  masterTab: string | null,
  subCode?: string | null,
  DifferentEmployeeCode?: string | null,
) => {
  let {employeeCode, yearQtr} = getUserCredentials();
  const effectiveYearQtr = YearQtr || yearQtr;
  const effectiveMasterTab = masterTab || 'Total';
  if(subCode) employeeCode = subCode; // Override employee code if subCode is provided (for partner view)
  return useQuery({
    queryKey: [
      'dashboardData',
      employeeCode,
      effectiveMasterTab,
      effectiveYearQtr,
      DifferentEmployeeCode
    ],
    queryFn: async () => {
      const res = await handleAPACApiCall('/Dashboard/GetDashboardData', {
        employeeCode:DifferentEmployeeCode || employeeCode,
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

export const useDashboardBannerAPAC = () => {
  const {employeeCode, employeeRole} = getUserCredentials();

  return useQuery({
    queryKey: ['getBannerInfo', employeeCode, employeeRole],
    queryFn: async () => {
      const res = await handleAPACApiCall('/Information/GetBannerInfo', {
        employeeCode,
        RoleId: employeeRole,
      });

      const result = res.DashboardData;
      if (!result?.Status) return [];

      // Use optional chaining and provide fallback
      return (
        result.Datainfo?.BannerInfo?.map((item: any) => ({
          BannerURL_Link: item.BannerURL_Link,
          image: item.Banner_Link,
          Group_Sequence_No: item.Group_Sequence_No,
        })) || []
      );
    },
    enabled: !!employeeCode, // Only run if we have employee code
    ...DASHBOARD_CACHE_CONFIG,
  });
};
