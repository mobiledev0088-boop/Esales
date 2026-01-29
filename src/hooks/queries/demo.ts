import {useQuery} from '@tanstack/react-query';
import {useUserStore} from '../../stores/useUserStore';
import {useLoginStore} from '../../stores/useLoginStore';
import {handleAPACApiCall, handleASINApiCall} from '../../utils/handleApiCall';
import {formatUnique} from '../../utils/commonFunctions';

interface SummaryOverviewData {
  Vertical: string;
  Total_Offline_Models: number;
  Store_count: number;
  Status: string;
}

export const useGetDemoDataReseller = (
  YearQtr: string,
  Category: string,
  KioskCnt: number | null,
  RogKioskCnt: number | null,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const empInfo = useUserStore(state => state.empInfo);
  const queryPayload = {
    YearQtr,
    RoleId,
    employeeCode,
    Category,
    KioskCnt: KioskCnt || null,
    RogKioskCnt: RogKioskCnt || null,
    sync_date: empInfo?.Sync_Date,
    demo_tab: 'Reseller',
  };

  return useQuery({
    queryKey: ['demoData', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetDemoFormDataReseller',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo || [];
    },
  });
};

export const useGetDemoDataRetailer = (
  YearQtr: string,
  Category: string,
  IsCompulsory: string,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const empInfo = useUserStore(state => state.empInfo);
  const queryPayload = {
    YearQtr,
    RoleId,
    employeeCode,
    Category,
    IsCompulsory: IsCompulsory,
    sync_date: empInfo?.Sync_Date,
  };

  return useQuery({
    queryKey: ['demoDataRetailer', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetDemoFormDataRetailer_CategoryWise',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.DemoDetailsList || [];
    },
  });
};

export const useGetDemoDataLFR = (YearQtr: string, Category: string) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const empInfo = useUserStore(state => state.empInfo);
  const queryPayload = {
    YearQtr,
    RoleId,
    employeeCode,
    Category,
    IsCompulsory: 'yes',
    sync_date: empInfo?.Sync_Date,
  };

  return useQuery({
    queryKey: ['demoDataRetailer', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetDemoFormDataLFR_CategoryWise_New',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.DemoDetailsList || [];
    },
  });
};

export const useGetDemoDataROI = (YearQtr: string, Category: string) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const queryPayload = {
    YearQtr,
    RoleId,
    employeeCode,
    Category,
  };
  return useQuery({
    queryKey: ['roiDemoData', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetROIDetails',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.ROI_Details|| [];
    },
  });
};

export const useGetBranchWiseDemoData = (
  YearQtr: string,
  Category: string,
  KioskCnt: number | null,
  RogKioskCnt: number | null,
  branchName: string,
  IsCompulsory: string,
  enabled: boolean,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(state => state.userInfo);
  const queryPayload = {
    YearQtr,
    RoleId,
    employeeCode,
    Category,
    KioskCnt: KioskCnt || null,
    RogKioskCnt: RogKioskCnt || null,
    IsCompulsory,
    branchName,
  };
  return useQuery({
    queryKey: ['branchWiseDemoDataRetailer', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetDemoFormDataRetailer_BranchWisedata',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch branch-wise data');
      }
      return result.Datainfo || [];
    },
    enabled: enabled && !!branchName,
  });
};

export const useGetBranchWiseDemoDataRet = (
  YearQtr: string,
  Category: string,
  branchName: string,
  IsCompulsory: string,
  enabled: boolean,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const queryPayload = {
    YearQtr,
    RoleId,
    employeeCode,
    Category,
    IsCompulsory,
    branchName,
  };

  return useQuery({
    queryKey: ['branchWiseDemoDataRetailer', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetDemoFormDataRetailer_BranchWisedata',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch branch-wise data');
      }
      return result.Datainfo?.DemoDetailsList || [];
    },
    enabled: enabled && !!branchName,
  });
};

export const useGetSummaryOverviewData = () => {
  const {EMP_Code: employeeCode = ''} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['summaryOverviewData', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetPartnerDemoCategoryList_Discontinued',
        {employeeCode},
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch summary overview data');
      }
      const data = result.Datainfo?.Table1 as SummaryOverviewData[];
      return data || [];
    },
  });
};

export const useGetDemoCategories = (yearQtr: string) => {
  const queryPayload = {
    YearQtr: yearQtr,
  };

  return useQuery({
    queryKey: ['demoCategories', yearQtr],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetPartnerDemoCategoryList_Reseller',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch categories');
      }
      const categories = result.Datainfo?.Table || [];
      return categories.map((item: {Demo_Category: string}) => ({
        label: item.Demo_Category,
        value: item.Demo_Category,
      }));
    },
  });
};

export const useGetDemoCategoriesRet = (yearQtr: string) => {
  const queryPayload = {
    YearQtr: yearQtr,
  };

  return useQuery({
    queryKey: ['demoCategories', yearQtr],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetPartnerDemoCategoryList_Retailer',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch categories');
      }
      const categories = result.Datainfo?.Table || [];
      return categories.map((item: {Demo_Category: string}) => ({
        label: item.Demo_Category,
        value: item.Demo_Category,
      }));
    },
    enabled: !!yearQtr,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// APAC
export const useGetDemoFilterOptionsAPAC = (
  Month: string,
  PartnerCode: string,
) => {
  const {EMP_Code: employeeCode = ''} = useLoginStore(state => state.userInfo);
  const queryPayload = {employeeCode, Month, PartnerCode};
  return useQuery({
    queryKey: ['demoFilterOptionsAPAC', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleAPACApiCall(
        '/DemoForm/GetDemoByProgramFilters',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch filter options');
      }
      return result.Datainfo || {};
    },
    select: data => {
      const Category = formatUnique(data?.CategoryFilter, 'Demo_Category');
      const AGP_Filter = formatUnique(data?.AGP_Filter, 'PM_Code', 'PM_Name');
      const Store_filter = formatUnique(
        data?.Store_filter,
        'Store_id',
        'Store_name',
      );
      const ProgramName_Filter = formatUnique(
        data?.ProgramName_Filter,
        'CM_CPORID',
        'CM_SchemeCategory',
      );
      return {
        Category,
        AGP_Filter,
        Store_filter,
        ProgramName_Filter,
      };
    },
  });
};

export const useGetDemoDataProgram = ({
  Month,
  Program_Name,
  Category,
  PartnerCode,
  StoreCode,
}: {
  Month: string;
  Program_Name: string;
  Category: string;
  PartnerCode: string;
  StoreCode: string;
}) => {
  const {EMP_Code: employeeCode = ''} = useLoginStore(state => state.userInfo);

  const queryPayload = {
    employeeCode,
    Category: Category || 'All',
    Month,
    Program_Name,
    PartnerCode,
    StoreCode,
  };

  return useQuery({
    queryKey: ['demoDataProgram', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleAPACApiCall(
        '/DemoForm/GetDemoByProgram',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch demo data');
      }
      return result.Datainfo?.DemoDetailsList || [];
    },
  });
};

export const useGetDemoDataPartner = ({
  YearQtr,
  IsCompulsory,
  Category,
}: {
  YearQtr: string;
  IsCompulsory: string;
  Category: string;
}) => {
  const {
    EMP_Code: employeeCode = '',
    EMP_RoleId: RoleId = '',
    EMP_CountryID: Country = '',
  } = useLoginStore(state => state.userInfo);

  const queryPayload = {
    employeeCode,
    Category,
    RoleId,
    Country,
    YearQtr,
    IsCompulsory,
  };

  return useQuery({
    queryKey: ['demoDataProgram', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleAPACApiCall(
        '/DemoForm/GetDemoFormDataRetailer_CategoryWise',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch demo data');
      }
      return result.Datainfo?.DemoDetailsList || [];
    },
  });
};

export const useGetDemoDataROIAPAC = (YearQtr: string, Category: string) => {
  const {
    EMP_Code: employeeCode = '',
    EMP_RoleId: RoleId = '',
    EMP_CountryID: Country = '',
  } = useLoginStore(state => state.userInfo);
  const queryPayload = {
    YearQtr,
    RoleId,
    employeeCode,
    Category,
    Country,
  };
  return useQuery({
    queryKey: ['roiDemoData', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleAPACApiCall(
        '/DemoForm/GetROIDetails',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.ROI_Details || [];
    },
  });
};
