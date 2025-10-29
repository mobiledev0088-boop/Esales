import {useQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../stores/useLoginStore';
import {
  AGPDetailsResponse,
  AGPListResponse,
  ALPDetailsResponse,
  ALPListResponse,
  DropdownOption,
  LFRDetailsResponse,
  LFRListResponse,
} from '../../screens/app/ASIN/More/ChannelMap/ChannelMapTypes';
import {handleASINApiCall} from '../../utils/handleApiCall';
import { APIResponse } from '../../types/navigation';

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

export const useGetALPDetails = (
  partnerCode: string | null,
  refetch = false,
) => {
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

export const useGetPinCodeList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery<DropdownOption[], Error>({
    queryKey: ['pinCodeList', employeeCode],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/AGP/GetChannelMap_Pincode_DropDownList',
        {
          UserName: employeeCode,
        },
      )) as APIResponse<{Pincode: {Locp_PinCode: string; ID: string}[]}>;

      const result = response.DashboardData;
      if (!result?.Status) return [];

      const rawList = result?.Datainfo?.Pincode || [];

      // Use Map for efficient deduplication by ID
      const uniqueItems = new Map<string, DropdownOption>();
      rawList.forEach(item => {
        if (item.ID && !uniqueItems.has(item.ID)) {
          uniqueItems.set(item.ID, {
            label: item.Locp_PinCode,
            value: item.Locp_PinCode,
          });
        }
      });

      return Array.from(uniqueItems.values());
    },
  });
};

export const useGetChannelTypeList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery<{customisedBranding: DropdownOption[]; businessType: DropdownOption[]}, Error>({
    queryKey: ['channelTypeList', employeeCode],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/AGP/GetChannelMap_ChannelType_DropDownList',
        {},
      )) as APIResponse<{Customised_Branding: {Type: string; ID: string}[]; Business_Type: {Type: string; ID: string}[]}>;

      const result = response.DashboardData;
      if (!result?.Status) return {customisedBranding: [], businessType: []};

      const rawBranding = result?.Datainfo?.Customised_Branding || [];
      const rawBusinessType = result?.Datainfo?.Business_Type || [];

      // Use separate Maps for efficient deduplication by ID
      const uniqueBranding = new Map<string, DropdownOption>();
      rawBranding.forEach(item => {
        if (item.ID && !uniqueBranding.has(item.ID)) {
          uniqueBranding.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });

      const uniqueBusinessType = new Map<string, DropdownOption>();
      rawBusinessType.forEach(item => {
        if (item.ID && !uniqueBusinessType.has(item.ID)) {
          uniqueBusinessType.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });

      return {
        customisedBranding: Array.from(uniqueBranding.values()),
        businessType: Array.from(uniqueBusinessType.values()),
      };
    },
  });
};

export const useGetCSEName = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery<DropdownOption[], Error>({
    queryKey: ['taskOwnerCSEName', employeeCode],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/AGP/GetChannelMap_AlpCode_DropDownList',
        {
          UserName: employeeCode,
        },
      )) as APIResponse<{CSENameDropdown: {CSE_Name: string; CSE_Code: string}[]}>;

      const result = response.DashboardData;
      if (!result?.Status) return [];

      const rawList = result?.Datainfo?.CSENameDropdown || [];

      // Use Map for efficient deduplication by CSE_Code
      const uniqueItems = new Map<string, DropdownOption>();
      rawList.forEach(item => {
        if (item.CSE_Code && !uniqueItems.has(item.CSE_Code)) {
          uniqueItems.set(item.CSE_Code, {
            label: item.CSE_Name,
            value: item.CSE_Code,
          });
        }
      });

      return Array.from(uniqueItems.values());
    },
  });
}
 
export const useGetBrandType = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery<{asus: DropdownOption[]; hp: DropdownOption[]}, Error>({
    queryKey: ['brandTypeList', employeeCode],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/AGP/GetChannelMap_BrandType_DropDownList',
        {},
      )) as APIResponse<{ASUS: {Type: string; ID: string}[]; HP: {Type: string; ID: string}[]; DELL: {Type: string; ID: string}[];LENOVA: {Type: string; ID: string}[];ACER: {Type: string; ID: string}[];MSI: {Type: string; ID: string}[];Samsung: {Type: string; ID: string}[];}>;

      const result = response.DashboardData;
      if (!result?.Status) return { asus: [], hp: [], dell: [], lenovo: [], acer: [], msi: [], samsung: [] };

      const rawList = result?.Datainfo?.ASUS || [];
      const rawListHP = result?.Datainfo?.HP || [];
      const rawListDELL = result?.Datainfo?.DELL || [];
      const rawListLENOVA = result?.Datainfo?.LENOVA || [];
      const rawListACER = result?.Datainfo?.ACER || [];
      const rawListMSI = result?.Datainfo?.MSI || [];
      const rawListSAMSUNG = result?.Datainfo?.Samsung || [];

      // Use Map for efficient deduplication by ID
      const uniqueItems = new Map<string, DropdownOption>();
      const uniqueItemsHP = new Map<string, DropdownOption>();
      const uniqueItemsDELL = new Map<string, DropdownOption>();
      const uniqueItemsLENOVA = new Map<string, DropdownOption>();
      const uniqueItemsACER = new Map<string, DropdownOption>();
      const uniqueItemsMSI = new Map<string, DropdownOption>();
      const uniqueItemsSAMSUNG = new Map<string, DropdownOption>();


      rawList.forEach(item => {
        if (item.ID && !uniqueItems.has(item.ID)) {
          uniqueItems.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });
      rawListHP.forEach(item => {
        if (item.ID && !uniqueItemsHP.has(item.ID)) {
          uniqueItemsHP.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });

      rawListDELL.forEach(item => {
        if (item.ID && !uniqueItemsDELL.has(item.ID)) {
          uniqueItemsDELL.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });
      rawListLENOVA.forEach(item => {
        if (item.ID && !uniqueItemsLENOVA.has(item.ID)) {
          uniqueItemsLENOVA.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });
      rawListACER.forEach(item => {
        if (item.ID && !uniqueItemsACER.has(item.ID)) {
          uniqueItemsACER.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });
      rawListMSI.forEach(item => {
        if (item.ID && !uniqueItemsMSI.has(item.ID)) {
          uniqueItemsMSI.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      }); 
      rawListSAMSUNG.forEach(item => {
        if (item.ID && !uniqueItemsSAMSUNG.has(item.ID)) {
          uniqueItemsSAMSUNG.set(item.ID, {
            label: item.Type,
            value: item.ID,
          });
        }
      });

      return {
          asus: Array.from(uniqueItems.values()),
          hp: Array.from(uniqueItemsHP.values()),
          dell: Array.from(uniqueItemsDELL.values()),
          lenovo: Array.from(uniqueItemsLENOVA.values()),
          acer: Array.from(uniqueItemsACER.values()),
          msi: Array.from(uniqueItemsMSI.values()),
          samsung: Array.from(uniqueItemsSAMSUNG.values()),
      }
    },
  });
}
