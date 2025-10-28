import { useQuery } from "@tanstack/react-query";
import { useLoginStore } from "../../stores/useLoginStore";
import { AGPDetailsResponse, AGPListResponse, ALPDetailsResponse, ALPListResponse, APIResponse, DropdownOption, LFRDetailsResponse, LFRListResponse } from "../../screens/app/ASIN/More/ChannelMap/ChannelMapTypes";
import { handleASINApiCall } from "../../utils/handleApiCall";

//  Constants
const API_ENDPOINTS = {
  ALP_LIST: '/Information/GetALPList',
  ALP_INFO: '/Information/GetALPInfo',
  AGP_LIST: '/Information/GetAGPList',
  AGP_INFO: '/Information/GetAGPInfo',
  LFR_LIST: '/Information/GetLFRList',
  LFR_INFO: '/Information/GetLFRInfo',
} as const;

// API Hooks
export const useGetALPList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';

  return useQuery<DropdownOption[], Error>({
    queryKey: ['ALPList', employeeCode, roleId],
    queryFn: async () => {
      const response = (await handleASINApiCall(API_ENDPOINTS.ALP_LIST, {
        employeeCode,
        RoleId: roleId,
      })) as APIResponse<ALPListResponse>;

      const result = response.DashboardData;
      if (!result?.Status) return [];

      const rawList = result?.Datainfo?.ALP_List || [];

      // Use Map for efficient deduplication by PM_Code
      const uniqueItems = new Map<string, DropdownOption>();
      rawList.forEach(item => {
        if (item.PM_Code && !uniqueItems.has(item.PM_Code)) {
          uniqueItems.set(item.PM_Code, {
            label: item.PM_Name,
            value: item.PM_Code,
          });
        }
      });

      return Array.from(uniqueItems.values());
    },
  });
};

export const useGetALPDetails = (partnerCode: string | null, refetch = false) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';

  return useQuery<ALPDetailsResponse | null, Error>({
    queryKey: ['ALPDetails', employeeCode, roleId, partnerCode],
    queryFn: async () => {
      const response = (await handleASINApiCall(API_ENDPOINTS.ALP_INFO, {
        employeeCode,
        RoleId: roleId,
        PartnerCode: partnerCode || '',
      })) as APIResponse<ALPDetailsResponse>;

      const result = response.DashboardData;
      if (!result?.Status) return null;

      return result?.Datainfo;
    },
    enabled: !!partnerCode,
    refetchOnWindowFocus: refetch,
  });
};

export const useGetAGPList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';

  return useQuery<DropdownOption[], Error>({
    queryKey: ['AGPList', employeeCode, roleId],
    queryFn: async () => {
      const response = (await handleASINApiCall(API_ENDPOINTS.AGP_LIST, {
        employeeCode,
        RoleId: roleId,
      })) as APIResponse<AGPListResponse>;

      const result = response.DashboardData;
      if (!result?.Status) return [];

      const rawList = result?.Datainfo?.AGP_List || [];

      // Use Map for efficient deduplication by PM_Code
      const uniqueItems = new Map<string, DropdownOption>();
      rawList.forEach(item => {
        if (item.ACM_GST_No && !uniqueItems.has(item.ACM_GST_No)) {
          uniqueItems.set(item.ACM_GST_No, {
            label: `${item.ACM_ShopName} - ${item.ACM_BranchName}`,
            value: item.ACM_GST_No,
          });
        }
      });

      return Array.from(uniqueItems.values());
    },
  });
};

export const useGetAGPDetails = (gst_no: string | null) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const RoleId = userInfo?.EMP_RoleId || '';
  return useQuery<AGPDetailsResponse | null, Error>({
    queryKey: ['AGPDetails', employeeCode, RoleId, gst_no],
    queryFn: async () => {
      const response = (await handleASINApiCall(API_ENDPOINTS.AGP_INFO, {
        employeeCode,
        RoleId,
        Shop_Name: gst_no || '',
      })) as APIResponse<AGPDetailsResponse>;
      const result = response.DashboardData;
      if (!result?.Status) return null;
      return result?.Datainfo;
    },
    enabled: !!gst_no,
  });
};

export const useGetLFRList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';

  return useQuery<DropdownOption[], Error>({
    queryKey: ['LFRList', employeeCode, roleId],
    queryFn: async () => {
      const response = (await handleASINApiCall(API_ENDPOINTS.LFR_LIST, {
        employeeCode,
        RoleId: roleId,
      })) as APIResponse<LFRListResponse>;

      const result = response.DashboardData;
      if (!result?.Status) return [];

      const rawList = result?.Datainfo?.LFR_List || [];

      // Use Map for efficient deduplication by PM_Code
      const uniqueItems = new Map<string, DropdownOption>();
      rawList.forEach(item => {
        if (item.ACM_GST_No && !uniqueItems.has(item.ACM_GST_No)) {
          uniqueItems.set(item.ACM_GST_No, {
            label: `${item.ACM_ShopName} - ${item.ACM_BranchName}`,
            value: item.ACM_GST_No,
          });
        }
      });
      return Array.from(uniqueItems.values());
    },
  });
};

export const useGetLFRDetails = (gst_no: string | null) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const RoleId = userInfo?.EMP_RoleId || '';
  return useQuery<LFRDetailsResponse | null, Error>({
    queryKey: ['LFRDetails', employeeCode, RoleId, gst_no],
    queryFn: async () => {
      const response = (await handleASINApiCall(API_ENDPOINTS.LFR_INFO, {
        employeeCode,
        RoleId,
        Shop_Name: gst_no || '',
      })) as APIResponse<LFRDetailsResponse>;
      const result = response.DashboardData;
      if (!result?.Status) return null;
      return result?.Datainfo;
    },
    enabled: !!gst_no,
  });
};