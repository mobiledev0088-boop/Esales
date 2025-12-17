import {useQuery} from '@tanstack/react-query';
import useEmpStore from '../../stores/useEmpStore';
import {useLoginStore} from '../../stores/useLoginStore';
import {handleAPACApiCall, handleASINApiCall} from '../../utils/handleApiCall';
import {formatUnique} from '../../utils/commonFunctions';

export const useGetDemoDataReseller = (
  YearQtr: string,
  Category: string,
  KioskCnt: string,
  RogKioskCnt: string,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const empInfo = useEmpStore(state => state.empInfo);
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

export const useGeROItDemoData = (YearQtr: string, Category: string) => {
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
      return result.Datainfo || [];
    },
  });
};

export const useGetBranchWiseDemoData = (
  YearQtr: string,
  Category: string,
  KioskCnt: string,
  RogKioskCnt: string,
  branchName: string,
  IsCompulsory: string,
  enabled: boolean,
  tab: 'LFR' | 'retailer' | 'reseller',
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
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
  if (tab === 'retailer') {
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
  } else if (tab === 'LFR') {
    return useQuery({
      queryKey: ['branchWiseDemoDataLFR', ...Object.values(queryPayload)],
      queryFn: async () => {
        const response = await handleASINApiCall(
          '/DemoForm/GetDemoFormData_LFR_BranchWisedata',
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
  } else {
    return useQuery({
      queryKey: ['branchWiseDemoData', ...Object.values(queryPayload)],
      queryFn: async () => {
        const response = await handleASINApiCall(
          '/DemoForm/GetDemoFormDataReseller_BranchWisedata',
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
  }
};

export const useGetDemoDataRetailer = (
  YearQtr: string,
  Category: string,
  IsCompulsory: string,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const empInfo = useEmpStore(state => state.empInfo);
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

export const useGetDemoDataROI = (YearQtr: string, Category: string) => {
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
      const AGP_Filter = formatUnique(data?.AGP_Filter,'PM_Code','PM_Name');
      const Store_filter = formatUnique(data?.Store_filter,'Store_id','Store_name');
      const ProgramName_Filter = formatUnique(data?.ProgramName_Filter,'CM_CPORID','CM_SchemeCategory');
      return {
        Category,
        AGP_Filter,
        Store_filter,
        ProgramName_Filter,
      };
    },
  });
};
