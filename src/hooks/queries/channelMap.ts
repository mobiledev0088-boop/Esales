import {useMutation, useQuery} from '@tanstack/react-query';
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
import {APIResponse} from '../../types/navigation';
import {formatUnique} from '../../utils/commonFunctions';
import { queryClient } from '../../stores/providers/QueryProvider';

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

// Add/Edit hooks for AGP Channel Map Dropdowns
export const useGetPinCodeList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery({
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
      return rawList;
    },
    select: data => formatUnique(data, 'Locp_PinCode'),
  });
};

export const useGetCSENameList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery({
    queryKey: ['taskOwnerCSEName', employeeCode],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/AGP/GetChannelMap_AlpCode_DropDownList',
        {
          UserName: employeeCode,
        },
      )) as APIResponse<{
        CSENameDropdown: {CSE_Name: string; CSE_Code: string}[];
      }>;

      const result = response.DashboardData;
      if (!result?.Status) return [];

      const rawList = result?.Datainfo?.CSENameDropdown || [];
      return rawList;
    },
    select: data => formatUnique(data, 'CSE_Code', 'CSE_Name'),
  });
};

export const useGetAddChannelMapDropdown = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery({
    queryKey: ['channelTypeList', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/AGP/GetChannelMap_ChannelType_DropDownList',
        {},
      );

      const result = response.DashboardData;
      if (!result?.Status){
        return {
          customisedBranding: [],
          businessType: [],

          monthlyNBSales: [],
          monthlyDTAIOSales: [],
          displayNB: [],

          asus: [],
          hp: [],
          dell: [],
          lenovo: [],
          acer: [],
          msi: [],
          samsung: [],
          cdt_DesktopBusinessType: [],
          cdt_ModeOfBusiness: [],
          cdt_asus: [],
          cdt_hp: [],
          cdt_dell: [],
          cdt_lenovo: [],
          cdt_acer: [],
          gdt_asus: [],
          gdt_hp: [],
          gdt_dell: [],
          gdt_lenovo: [],
          gdt_acer: [],
          aio_ModeOfBusiness: [],
          aio_asus: [],
          aio_hp: [],
          aio_dell: [],
          aio_lenovo: [],
          aio_acer: [],
        };
      }

      // Branding and Business Type
      const rawBranding = result?.Datainfo?.Customised_Branding || [];
      const rawBusinessType = result?.Datainfo?.Business_Type || [];
      // Monthly Data
      const rawMonthlyNBSales = result?.Datainfo?.MonthlyNBSales || [];
      const rawMonthlyDTAIOSales = result?.Datainfo?.MonthDTAIOSales || [];
      const rawMonthlyDisplayNB = result?.Datainfo?.DisplayNB || [];
      // brand type lists
      const rawList = result?.Datainfo?.ASUS || [];
      const rawListHP = result?.Datainfo?.HP || [];
      const rawListDELL = result?.Datainfo?.DELL || [];
      const rawListLENOVA = result?.Datainfo?.LENOVA || [];
      const rawListACER = result?.Datainfo?.ACER || [];
      const rawListMSI = result?.Datainfo?.MSI || [];
      const rawListSAMSUNG = result?.Datainfo?.Samsung || [];
      // CDT Competition Data
      const rawCDT_DesktopBusinessType =
        result?.Datainfo?.CDT_DesktopBusinessType || [];
      const rawCDT_ModeOfBusiness = result?.Datainfo?.CDT_ModeOfBusiness || [];
      const rawCDT_ASUS = result?.Datainfo?.CDT_ASUS || [];
      const rawCDT_HP = result?.Datainfo?.CDT_HP || [];
      const rawCDT_DELL = result?.Datainfo?.CDT_Dell || [];
      const rawCDT_LENOVO = result?.Datainfo?.CDT_Lenovo || [];
      const rawCDT_ACER = result?.Datainfo?.CDT_Acer || [];
      // GDT Competition Data
      const rawGDT_ASUS = result?.Datainfo?.GDT_ASUS || [];
      const rawGDT_HP = result?.Datainfo?.GDT_HP || [];
      const rawGDT_DELL = result?.Datainfo?.GDT_Dell || [];
      const rawGDT_LENOVO = result?.Datainfo?.GDT_Lenovo || [];
      const rawGDT_ACER = result?.Datainfo?.GDT_Acer || [];
      // AIO Competition Data
      const rawAIO_ModeOfBusiness = result?.Datainfo?.AIO_ModeOfBusiness || [];
      const rawAIO_ASUS = result?.Datainfo?.AIO_ASUS || [];
      const rawAIO_HP = result?.Datainfo?.AIO_HP || [];
      const rawAIO_DELL = result?.Datainfo?.AIO_Dell || [];
      const rawAIO_LENOVO = result?.Datainfo?.AIO_Lenovo || [];
      const rawAIO_ACER = result?.Datainfo?.AIO_Acer || [];

      return {
        customisedBranding: formatUnique(rawBranding, 'ID', 'Type'),
        businessType: formatUnique(rawBusinessType, 'ID', 'Type'),

        monthlyNBSales: formatUnique(rawMonthlyNBSales, 'ID', 'Type'),
        monthlyDTAIOSales: formatUnique(rawMonthlyDTAIOSales, 'ID', 'Type'),
        displayNB: formatUnique(rawMonthlyDisplayNB, 'ID', 'Type'),

        asus: formatUnique(rawList, 'ID', 'Type'),
        hp: formatUnique(rawListHP, 'ID', 'Type'),
        dell: formatUnique(rawListDELL, 'ID', 'Type'),
        lenovo: formatUnique(rawListLENOVA, 'ID', 'Type'),
        acer: formatUnique(rawListACER, 'ID', 'Type'),
        msi: formatUnique(rawListMSI, 'ID', 'Type'),
        samsung: formatUnique(rawListSAMSUNG, 'ID', 'Type'),
        cdt_DesktopBusinessType: formatUnique(
          rawCDT_DesktopBusinessType,
          'ID',
          'Type',
        ),
        cdt_ModeOfBusiness: formatUnique(rawCDT_ModeOfBusiness, 'ID', 'Type'),
        cdt_asus: formatUnique(rawCDT_ASUS, 'ID', 'Type'),
        cdt_hp: formatUnique(rawCDT_HP, 'ID', 'Type'),
        cdt_dell: formatUnique(rawCDT_DELL, 'ID', 'Type'),
        cdt_lenovo: formatUnique(rawCDT_LENOVO, 'ID', 'Type'),
        cdt_acer: formatUnique(rawCDT_ACER, 'ID', 'Type'),
        gdt_asus: formatUnique(rawGDT_ASUS, 'ID', 'Type'),
        gdt_hp: formatUnique(rawGDT_HP, 'ID', 'Type'),
        gdt_dell: formatUnique(rawGDT_DELL, 'ID', 'Type'),
        gdt_lenovo: formatUnique(rawGDT_LENOVO, 'ID', 'Type'),
        gdt_acer: formatUnique(rawGDT_ACER, 'ID', 'Type'),
        aio_ModeOfBusiness: formatUnique(rawAIO_ModeOfBusiness, 'ID', 'Type'),
        aio_asus: formatUnique(rawAIO_ASUS, 'ID', 'Type'),
        aio_hp: formatUnique(rawAIO_HP, 'ID', 'Type'),
        aio_dell: formatUnique(rawAIO_DELL, 'ID', 'Type'),
        aio_lenovo: formatUnique(rawAIO_LENOVO, 'ID', 'Type'),
        aio_acer: formatUnique(rawAIO_ACER, 'ID', 'Type'),
      };
    },
  });
};

export const useAddAgpMutation = () => {
  return useMutation({
    mutationKey: ['addAGPChannelMap'],
    mutationFn: async (payload: any) => {
      const response = await handleASINApiCall(
        '/AGP/GetPC_ChannelMap_Insert',
        payload,
      );
      console.log('Add AGP Channel Map Response:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['AGPList']});
    }
  });
}

export const useEditAgpMutation = () => {
  return useMutation({
    mutationKey: ['editAGPChannelMap'],
    mutationFn: async (payload: any) => {
      const response = await handleASINApiCall(
        '/AGP/GetPC_ChannelMap_Update',
        payload,
      );
      console.log('Edit AGP Channel Map Response:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['AGPDetails']});
    },
  });
}


export const useEditAgpFinanceMutation = () => {
  return useMutation({
    mutationKey: ['editAGPFinanceInfo'],
    mutationFn: async (payload: any) => {
      const response = await handleASINApiCall(
        '/AGP/GetFinanceMapping_Insert',
        payload,
      );
      console.log('Edit AGP Finance Response:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['AGPDetails']});
    },
  });
} 
