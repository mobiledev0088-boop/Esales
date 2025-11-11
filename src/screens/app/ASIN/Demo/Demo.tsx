import {
  FlatList,
  ScrollView,
  View
} from 'react-native';
import  {useCallback, useMemo, useState} from 'react';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import AppText from '../../../../components/customs/AppText';
import {getPastQuarters} from '../../../../utils/commonFunctions';
import {AppDropdownItem} from '../../../../components/customs/AppDropdown';
import {useLoginStore} from '../../../../stores/useLoginStore';
import useEmpStore from '../../../../stores/useEmpStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import { DemoItem, filterDemoItemsByPartnerType, transformDemoData, TransformedBranch } from './utils';
import { BranchCard, SummaryCard } from './components';

const useGetDemoData = (
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

const useGeROItDemoData = (YearQtr: string, Category: string) => {
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
  enabled: boolean,
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
    branchName,
  };

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
};

const Reseller = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);

  // Local filter state
  const [filters, setFilters] = useState<{
    category: string | null;
    premiumKiosk: string | null;
    rogKiosk: string | null;
    partnerType: string | null;
    agpName: string | null;
  }>({
    category: null,
    premiumKiosk: null,
    rogKiosk: null,
    partnerType: null,
    agpName: null,
  });

  // Fetch data with API filters (category, kiosk counts)
  const {data, isLoading} = useGetDemoData(
    selectedQuarter?.value || '',
    filters.category || 'All',
    filters.premiumKiosk || '',
    filters.rogKiosk || '',
  );

  // Extract unique partner types from API data
  const partnerTypes = useMemo(() => {
    if (!data?.DemoDetailsList) return [];

    const uniqueTypes = new Set<string>();
    data.DemoDetailsList.forEach((item: DemoItem) => {
      if (item.AGP_Or_T3 && item.AGP_Or_T3.trim()) {
        uniqueTypes.add(item.AGP_Or_T3.trim());
      }
    });

    return Array.from(uniqueTypes)
      .sort()
      .map(type => ({
        label: type,
        value: type,
      }));
  }, [data]);

  // Apply frontend filtering for partner type
  const filteredData = useMemo(() => {
    if (!data) return null;

    // If no partner type filter, return original data
    if (!filters.partnerType) return data;

    // Filter DemoDetailsList by partner type
    const filteredList = filterDemoItemsByPartnerType(
      data.DemoDetailsList,
      filters.partnerType,
    );

    return {
      ...data,
      DemoDetailsList: filteredList,
    };
  }, [data, filters.partnerType]);

  // Transform filtered data
  const transformedData = useMemo(() => {
    if (filteredData) {
      return transformDemoData(filteredData);
    }
  }, [filteredData]);

  // Calculate total summary across all branches
  const summaryData = useMemo(() => {
    if (!transformedData || transformedData.length === 0) {
      return {
        at_least_single_demo: 0,
        demo_100: 0,
        total_partners: 0,
        awp_partners: 0,
      };
    }

    return transformedData.reduce(
      (acc, branch) => ({
        at_least_single_demo:
          acc.at_least_single_demo + branch.at_least_single_demo,
        demo_100: acc.demo_100 + branch.demo_100,
        total_partners: acc.total_partners + branch.partner_count,
        awp_partners: acc.awp_partners + branch.awp_Count,
      }),
      {
        at_least_single_demo: 0,
        demo_100: 0,
        total_partners: 0,
        awp_partners: 0,
      },
    );
  }, [transformedData]);

  const keyExtractor = useCallback((it: TransformedBranch) => it.id, []);
  const renderBranch = useCallback(
    ({item}: {item: TransformedBranch}) => (
      <BranchCard
        item={item}
        summaryData={summaryData}
        yearQtr={selectedQuarter?.value || ''}
        category={filters.category || 'All'}
        premiumKiosk={filters.premiumKiosk || ''}
        rogKiosk={filters.rogKiosk || ''}
        partnerType={filters.partnerType}
      />
    ),
    [summaryData, selectedQuarter, filters],
  );

  if (isLoading) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 pt-5  px-3 bg-lightBg-base">
        <Skeleton width={screenWidth - 24} height={200} borderRadius={12} />
        <View className="mt-5 pb-20">
          <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
          <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
          <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
          <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
          <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={transformedData}
        keyExtractor={keyExtractor}
        renderItem={renderBranch}
        contentContainerClassName="pt-5 pb-10 px-3"
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={16}
        ListHeaderComponent={() => (
          <SummaryCard
            at_least_single_demo={summaryData.at_least_single_demo}
            demo_100={summaryData.demo_100}
            total_partners={summaryData.total_partners}
            awp_partners={summaryData.awp_partners}
            quarters={quarters}
            selectedQuarter={selectedQuarter}
            setSelectedQuarter={setSelectedQuarter}
            filters={filters}
            setFilters={setFilters}
            partnerTypes={partnerTypes}
          />
        )}
      />
    </View>
  );
};

const ROI = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);
  const [filters, setFilters] = useState<{
    category: string | null;
    premiumKiosk: string | null;
    rogKiosk: string | null;
    partnerType: string | null;
    agpName: string | null;
  }>({
    category: null,
    premiumKiosk: null,
    rogKiosk: null,
    partnerType: null,
    agpName: null,
  });
  const {data, isLoading} = useGeROItDemoData(
    selectedQuarter?.value || '',
    filters.category || 'All',
  );
  console.log('ROI API Data:', data ? data?.ROI_Details?.slice(0,10): undefined, isLoading);
  // const filteredData = useMemo(() => {
  //   if (!data) return null;
  //   console.log('ROI Data:', data);
  //   // If no partner type filter, return original data
  //   if (!filters.partnerType) return data;

  //   // Filter DemoDetailsList by partner type
  //   const filteredList = [];
  //   // const filteredList = filterDemoItemsByPartnerType( --- IGNORE ---
  //   //   data.DemoDetailsList, --- IGNORE ---
  //   //   filters.partnerType, --- IGNORE ---
  //   // ); --- IGNORE ---

  //   return {
  //     ...data,
  //     DemoDetailsList: [],
  //   };
  // }, [data, filters.partnerType]);

  // const transformedData = useMemo(() => {
  //   if (filteredData) {
  //     return transformDemoData(filteredData);
  //   }
  // }, [filteredData]);

  // Calculate total summary across all branches
  // const summaryData = useMemo(() => {
  //   if (!transformedData || transformedData.length === 0) {
  //     return {
  //       at_least_single_demo: 0,
  //       demo_100: 0,
  //       total_partners: 0,
  //       awp_partners: 0,
  //     };
  //   }

  //   return transformedData.reduce(
  //     (acc, branch) => ({
  //       at_least_single_demo:
  //         acc.at_least_single_demo + branch.at_least_single_demo,
  //       demo_100: acc.demo_100 + branch.demo_100,
  //       total_partners: acc.total_partners + branch.partner_count,
  //       awp_partners: acc.awp_partners + branch.awp_Count,
  //     }),
  //     {
  //       at_least_single_demo: 0,
  //       demo_100: 0,
  //       total_partners: 0,
  //       awp_partners: 0,
  //     },
  //   );
  // }, [transformedData]);
  const keyExtractor = useCallback((it: TransformedBranch) => it.id, []);
  const renderBranch = useCallback(
    ({item}: {item: TransformedBranch}) => <View></View>,
    [selectedQuarter, filters],
  );
  return (
    <View className="flex-1 bg-lightBg-base">
      {/* <FlatList
        data={transformedData}
        keyExtractor={keyExtractor}
        renderItem={renderBranch}
        contentContainerClassName="pt-5 pb-10 px-3"
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={16}
        ListHeaderComponent={() => (
          <SummaryCard
            at_least_single_demo={summaryData.at_least_single_demo}
            demo_100={summaryData.demo_100}
            total_partners={summaryData.total_partners}
            awp_partners={summaryData.awp_partners}
            quarters={quarters}
            selectedQuarter={selectedQuarter}
            setSelectedQuarter={setSelectedQuarter}
            filters={filters}
            setFilters={setFilters}
            partnerTypes={[]}
          />
        )}
      /> */}
    </View>
  );
};

export default function Demo() {
  const PlachHolder = () => (
    <View className="flex-1 items-center justify-center">
      <AppText size="base" className="text-slate-500">
        Select a tab to view data
      </AppText>
    </View>
  );
  return (
    <View className="flex-1 bg-lightBg-base">
      <MaterialTabBar
        tabs={[
          {
            label: 'Reseller',
            name: 'reseller',
            component: Reseller,
          },
          {
            label: 'Retailer',
            name: 'retailer',
            component: <PlachHolder />,
          },
          {
            label: 'LFR',
            name: 'lfr',
            component: <PlachHolder />,
          },
          {
            label: 'ROI',
            name: 'roi',
            component: <ROI />,
          },
        ]}
        initialRouteName="reseller"
      />
    </View>
  );
}