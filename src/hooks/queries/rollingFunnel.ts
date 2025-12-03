import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginStore } from "../../stores/useLoginStore";
import { handleASINApiCall } from "../../utils/handleApiCall";
import { formatUnique } from "../../utils/commonFunctions";
import { getDeviceId } from "react-native-device-info";
import { FormData } from "../../screens/app/ASIN/Commercial/RollingFunnel/types";

export const useGetDropdownData = () => {
  const {EMP_Code: EmpCode = ''} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['rollingFunnelDropdownData', EmpCode],
    enabled: !!EmpCode,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_DropdownList_New',
        {EmpCode},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result?.Datainfo;
    },
    select: (data: any) => {
      const {
        OwnerDivisionList,
        CategoryList,
        StageList,
        WinRateList,
        ProductLine,
        MainIndustryList,
        ProductSeriesNameList,
        EndCustomerList,
        BSMList,
        AMList,
      } = data;
      return {
        OwnerDivisionList: formatUnique(
          OwnerDivisionList,
          'Id',
          'Opportunity_Owner_Division',
        ),
        CategoryList: formatUnique(CategoryList, 'Id', 'Sector'),
        StageList: formatUnique(StageList, 'Id', 'Stage'),
        WinRateList: formatUnique(WinRateList, 'Id', 'WinRate_Display'),
        ProductLine: formatUnique(ProductLine, 'PD_HQName'),
        MainIndustryList: formatUnique(MainIndustryList, 'Main_Industry'),
        ProductSeriesNameList: formatUnique(
          ProductSeriesNameList,
          'Series_Name',
        ),
        EndCustomerList: formatUnique(
          EndCustomerList,
          'End_Customer_CompanyID',
          'EndCustomer_Name',
        ),
        BSMList: formatUnique(BSMList, 'BSM_Code', 'BSMName'),
        AMList: formatUnique(AMList, 'AM_Code', 'AMname'),
      };
    },
  });
};

export const useGetDependentDropdownList = (MainIndustry: string,ProductSeriesName: string) => {
  return useQuery({
    queryKey: ['standardIndustryList', MainIndustry,ProductSeriesName],
    enabled: !!MainIndustry || !!ProductSeriesName,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_DependentDropdownList',
        {MainIndustry,ProductSeriesName},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch standard industry data');
      }
      return result?.Datainfo;
    },
    select: (data: any) => {
      return {
        StandardIndustryList: formatUnique(
          data.IndustryList,
          'Id',
          'Standard_Industry',
        ),
        ProductSeriesNameList: formatUnique(
          data.ProductSeriesList,
          'Model_Name',
        ),
      };
    },
  });
};

export const useGetAccountDropdownList = (BranchName: string) => {
  return useQuery({
    queryKey: ['rollingFunnelDropdownData', BranchName],
    enabled: !!BranchName,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_DirectAccount_List',
        {BranchName},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      const data = formatUnique(
        result?.Datainfo?.DirectAccountList,
        'Id',
        'Partner_Name',
      );
      return data;
    },
  });
};

export const useGetIndirectAccountList = (BranchName: string) => {
  return useQuery({
    queryKey: ['rollingFunnelDropdownData', BranchName],
    enabled: !!BranchName,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_IndirectAccount_List',
        {BranchName},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      const data = formatUnique(
        result?.Datainfo?.IndirectAccount_List,
        'IndirectAccountCode',
        'IndirectAccountName',
      );
      return data;
    },
  });
};

export const useAddNewRoolingFunnel = (formData: FormData) => {
  const {EMP_Code} = useLoginStore(state => state.userInfo);
  const payload = {
      FunnelType: 'Rolling_Funnel',
      OpportunityOwnerDivision: formData.ownerDivision ||  0,
      OpportunityOwner: EMP_Code || '',
      DirectAccount: formData.accountName || 0,
      IndirectAccount: formData.indirectAccount || '',
      EndCustomer:  formData.endCustomer || formData.newEndCustomerName || '',
      EndCustomerTAM: formData.endCustomerTam ? parseInt(formData.endCustomerTam) : 0,
      Category: formData.category ||  0,
      MainIndustry: formData.mainIndustry ||  0, //sending standardindustry value coz it is binded from backend for Main industry
      StandardIndustry: formData.standardIndustry ||  0,
      Stage: formData.stage ||  0,
      WinRate: formData.winRate ||  0,
      ProductLine: formData.productLine ||  0,
      Quantity: formData.qty || 0 ,
      QuotedProductSeriesName: formData.quotedProduct || 0,
      ProductSalesModelName: formData.product || 0,
      OverallDescription: formData.description || '',
      CRADDate: formData.CRADDate || null,
      NewModelName: formData.newProduct || '',
      NewIndirectAccountID: formData.newIndirectPartnerGST || '',
      NewINdirectAccountName: formData.newIndirectPartnerName || '',
      Username: EMP_Code ||'',
      Machinename: getDeviceId(),
  };
  return useMutation({
    mutationFn: async () => {
      const res = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_Insert_New',
        payload,
        {},
        true
      );
      const result = res.DashboardData;
      if (result.Status) {
        return result.Datainfo;
      } else {
        throw new Error(result?.Message || 'Failed to close opportunity');
      }
    },
  });
};

export const useEditRoolingFunnel = (formData: FormData,OpportunityID:string) => {
  const {EMP_Code} = useLoginStore(state => state.userInfo);
  const payload = {
      OpportunityID: OpportunityID,
      FunnelType: 'Rolling_Funnel',
      OpportunityOwnerDivision: formData.ownerDivision ||  0,
      OpportunityOwner: EMP_Code || '',
      DirectAccount: formData.accountName || 0,
      IndirectAccount: formData.indirectAccount || '',
      EndCustomer:  formData.endCustomer || formData.newEndCustomerName || '',
      EndCustomerTAM: formData.endCustomerTam ? parseInt(formData.endCustomerTam) : 0,
      Category: formData.category ||  0,
      MainIndustry: formData.mainIndustry ||  0, //sending standardindustry value coz it is binded from backend for Main industry
      StandardIndustry: formData.standardIndustry ||  0,
      Stage: formData.stage ||  0,
      WinRate: formData.winRate ||      0,
      ProductLine: formData.productLine ||  0,
      Quantity: formData.qty || 0 ,
      QuotedProductSeriesName: formData.quotedProduct || 0,
      ProductSalesModelName: formData.product || 0,
      OverallDescription: formData.description || '',
      CRADDate: formData.CRADDate || null,
      NewModelName: formData.newProduct || '',
      NewIndirectAccountID: formData.newIndirectPartnerGST || '',
      NewINdirectAccountName: formData.newIndirectPartnerName || '',
      Username: EMP_Code ||'',
      Machinename: getDeviceId(),
  };
  return useMutation({
    mutationFn: async () => {
      const res = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_Update',
        payload,
        {},
        true
      );
      const result = res.DashboardData;
      if (result.Status) {
        return result.Datainfo;
      } else {
        throw new Error(result?.Message || 'Failed to close opportunity');
      }
    },
  });
}