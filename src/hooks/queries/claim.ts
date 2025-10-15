import {useState, useMemo, useCallback} from 'react';
import moment from 'moment';
import {useQuery} from '@tanstack/react-query';
// NOTE: Adjusted relative paths (file is at src/hooks/queries/claim.ts)
import {handleASINApiCall} from '../../utils/handleApiCall';
import {useLoginStore} from '../../stores/useLoginStore';
import {ASUS} from '../../utils/constant';

// ------------------ Types ------------------
export interface BaseFilterData {
  schemeCategory: string;
  productLine: string;
  startMonth: string; // YYYYMM
  endMonth: string;   // YYYYMM
}

export interface CodeWiseFilterData extends BaseFilterData {
  partnerType: string; // Only for ClaimCode wise tab
}

// ------------------ Month Range Hook ------------------
export const useMonthRange = (startMonth: string, endMonth: string) => {
  const [visible, setVisible] = useState(false);
  const [range, setRange] = useState(() => {
    const start = moment(startMonth, 'YYYYMM').startOf('month').toDate();
    const end = moment(endMonth, 'YYYYMM').endOf('month').toDate();
    return {start, end};
  });
  const open = () => setVisible(true);
  const close = () => setVisible(false);
  const selectRange = useCallback((start: Date, end: Date, onChange: (s: string, e: string) => void) => {
    const normStart = moment(start).startOf('month').toDate();
    const normEnd = moment(end).endOf('month').toDate();
    setRange({start: normStart, end: normEnd});
    close();
    const sMonth = moment(normStart).format('YYYYMM');
    const eMonth = moment(normEnd).format('YYYYMM');
    onChange(sMonth, eMonth);
  }, []);
  return {range, visible, open, close, selectRange};
};

// ------------------ Grouping + Filtering ------------------
export const useGroupedClaimData = (
  claimData: any[],
  schemeCategory: string,
  productLine: string,
  buildGroups: (data: any[]) => any,
) => {
  const {groupedData, allSchemeCategories, allProductLinesName} = useMemo(() => {
    if (!claimData?.length) {
      return {groupedData: [], allSchemeCategories: [], allProductLinesName: []};
    }
    return buildGroups(claimData as any);
  }, [claimData, buildGroups]);

  const schemeMap = useMemo(() => {
    const m = new Map<string, (typeof groupedData)[number]>();
    groupedData.forEach((g: any) => m.set(g.Scheme_Category, g));
    return m;
  }, [groupedData]);

  const filtered = useMemo(() => {
    if (!schemeCategory && !productLine) return groupedData;

    let targetGroups: typeof groupedData = groupedData;
    if (schemeCategory) {
      const g = schemeMap.get(schemeCategory);
      targetGroups = g ? [g] : [];
    }
    if (!productLine) return targetGroups;

    return targetGroups
      .map((g: any) => {
        const months = g.Months.filter((m: any) => m.Product_Line_Name === productLine);
        if (months.length === 0) return null;
        let total = 0, processed = 0, under_Processed = 0;
        for (let i = 0; i < months.length; i++) {
          const m = months[i];
          total += m.total; processed += m.processed; under_Processed += m.under_Processed;
        }
        return {...g, Months: months, Totals: {total, processed, under_Processed}};
      })
      .filter(Boolean) as typeof groupedData;
  }, [groupedData, schemeCategory, productLine, schemeMap]);

  return {groupedData: filtered, allSchemeCategories, allProductLinesName};
};

// ------------------ Unified Dashboard Data Hook ------------------
interface UseClaimDashboardParams {
  mode: 'code' | 'partner';
  partnerType?: string; // used when mode === 'code'
  selectedPartner?: string | null; // used when mode === 'partner'
  startMonth: string;
  endMonth: string;
  roleIdOverride?: string | number; // optional override for partner modes
}

export const useClaimDashboardData = (params: UseClaimDashboardParams) => {
  const userInfo = useLoginStore((state: any) => state.userInfo);
  const baseEmployee = userInfo?.EMP_Code || '';
  const roleIdBase = userInfo?.EMP_RoleId || '';
  const {
    mode,
    partnerType = 'Channel',
    selectedPartner,
    startMonth,
    endMonth,
    roleIdOverride,
  } = params;

  const employeeCode = mode === 'partner' ? (selectedPartner || '') : baseEmployee;
  const roleId = mode === 'partner' ? (roleIdOverride ?? roleIdBase) : roleIdBase;

  return useQuery<any[]>({
    queryKey: [
      'claimDashboardUnified',
      mode,
      employeeCode,
      roleId,
      startMonth,
      endMonth,
      mode === 'code' ? partnerType : 'Channel',
    ],
    enabled: mode === 'code' ? !!employeeCode : !!selectedPartner,
    queryFn: async () => {
      if (mode === 'partner' && !selectedPartner) return [];
      const payload = {
        employeeCode,
        RoleId: roleId,
        PartnerType: mode === 'code'
          ? (roleId === ASUS.ROLE_ID.PARTNERS ? null : partnerType)
          : 'Channel',
        SchemeCategory: 'ALL',
        ProductLine: 'ALL',
        StartYearMonth: startMonth,
        EndYearMonth: endMonth,
      };
      // eslint-disable-next-line no-console
      console.log('[ClaimDashboard][Unified] Request Payload:', payload);
      const res = await handleASINApiCall('/ClaimMaster/GetClaimDashboardDetails', payload);
      const result = res.DashboardData;
      if (!result?.Status) return [];
      return result?.Datainfo?.ClaimDashboardDetails || [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

// ------------------ Partner Lists ------------------
export const useT2PartnerList = () => {
  const userInfo = useLoginStore((state: any) => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<{label:string; value:string}[]>({
    queryKey: ['partnerListT2', employeeCode, roleId],
    queryFn: async () => {
      const res = await handleASINApiCall('/Information/GetALPList', {employeeCode, RoleId: roleId});
      const result = res.DashboardData;
      if (!result?.Status) return [];
      const raw: {PM_Name:string; PM_Code:string}[] = result?.Datainfo?.ALP_List || [];
      const map = new Map<string, {label:string; value:string}>();
      raw.forEach(item => { if (!map.has(item.PM_Code)) map.set(item.PM_Code, {label: item.PM_Name, value: item.PM_Code}); });
      return Array.from(map.values());
    },
  });
};

export const useT3PartnerList = () => {
  const userInfo = useLoginStore((state: any) => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<{label:string; value:string}[]>({
    queryKey: ['partnerListT3', employeeCode, roleId],
    queryFn: async () => {
      const res = await handleASINApiCall('/Information/GetAGPList', {employeeCode, RoleId: roleId});
      const result = res.DashboardData;
      if (!result?.Status) return [];
      const raw: {ACM_BranchName:string; ACM_ShopName:string; ACM_GST_No:string}[] = result?.Datainfo?.AGP_List || [];
      const map = new Map<string, {label:string; value:string}>();
      raw.forEach(item => { if (!map.has(item.ACM_GST_No)) map.set(item.ACM_GST_No, {label: `${item.ACM_ShopName.trim()} - ${item.ACM_BranchName.trim()}`, value: item.ACM_GST_No}); });
      return Array.from(map.values());
    },
  });
};

// Partner type list for ClaimCode wise tab
export const usePartnerTypeList = () => {
  const userInfo = useLoginStore((state: any) => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<string[]>({
    queryKey: ['partnerTypeList', employeeCode, roleId],
    queryFn: async () => {
      const res = await handleASINApiCall('/ClaimMaster/GetClaimDashboardDropdownLists', {employeeCode, RoleId: roleId});
      const result = res.DashboardData;
      if (!result?.Status) return [];
      const raw: {PartnerType: string}[] = result?.Datainfo?.PartnerType || [{PartnerType: 'Channel'}];
      return Array.from(new Set(raw.map(r => r.PartnerType)));
    },
  });
};

// ------------------ Filter Pills Helper ------------------
interface PillConfig {
  includePartnerType?: boolean;
  includeSelectedPartner?: boolean;
}

export const buildPills = (
  filterData: {partnerType?: string; schemeCategory: string; productLine: string},
  selectedPartner: string | null,
  config: PillConfig,
) => {
  const arr: {key:string; label:string}[] = [];
  if (config.includePartnerType && filterData.partnerType && filterData.partnerType !== 'Channel') {
    arr.push({key: 'partnerType', label: filterData.partnerType});
  }
  if (config.includeSelectedPartner && selectedPartner) {
    arr.push({key: 'selectedPartner', label: selectedPartner});
  }
  if (filterData.schemeCategory) arr.push({key: 'schemeCategory', label: filterData.schemeCategory});
  if (filterData.productLine) arr.push({key: 'productLine', label: filterData.productLine});
  return arr;
};

export const removePillHelper = (
  key: string,
  setters: {
    setFilterData: React.Dispatch<React.SetStateAction<any>>;
    setSelectedPartner?: React.Dispatch<React.SetStateAction<string | null>>;
  },
) => {
  if (key === 'selectedPartner' && setters.setSelectedPartner) {
    setters.setSelectedPartner(null);
    return;
  }
  setters.setFilterData((prev: any) => {
    switch (key) {
      case 'partnerType':
        return prev.partnerType === 'Channel' ? prev : {...prev, partnerType: 'Channel'};
      case 'schemeCategory':
        return !prev.schemeCategory ? prev : {...prev, schemeCategory: ''};
      case 'productLine':
        return !prev.productLine ? prev : {...prev, productLine: ''};
      default:
        return prev;
    }
  });
};
