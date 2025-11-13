import { useQuery } from "@tanstack/react-query";
import useEmpStore from "../../stores/useEmpStore";
import { useLoginStore } from "../../stores/useLoginStore";
import { handleASINApiCall } from "../../utils/handleApiCall";

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
  if(tab === 'retailer') {
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
  }else if(tab === 'LFR' ) {
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
  }else{
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