import {FlatList, View} from 'react-native';
import {useCallback, useMemo, useState} from 'react';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import {getPastQuarters} from '../../../../utils/commonFunctions';
import {
  DemoItemReseller,
  DemoItemRetailer,
  ResellerFilterType,
  transformDemoData,
  transformDemoDataRetailer,
  TransformedBranchRes,
  TransformedBranchRet,
} from './utils';
import {
  BranchCard,
  BranchCardRet,
  DemoSkeleton,
  StatsHeader,
} from './components';
import {
  useGetDemoCategories,
  useGetDemoDataLFR,
  useGetDemoDataROI,
  useGetDemoDataReseller,
  useGetDemoDataRetailer,
  useGetSummaryOverviewData,
} from '../../../../hooks/queries/demo';
import FilterButton from '../../../../components/FilterButton';
import {showDemoFilterSheet} from './DemoFilterSheet';

const Reseller = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters?.[0] ?? null);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);

  const [filters, setFilters] = useState<ResellerFilterType>({
    category: 'All',
    premiumKiosk: 0,
    rogKiosk: 0,
    partnerType: null,
  });

  const {data, isLoading} = useGetDemoDataReseller(
    selectedQuarter?.value ?? '',
    filters.category,
    filters.premiumKiosk ?? 0,
    filters.rogKiosk ?? 0,
  );
  const {data: categoriesData} = useGetDemoCategories(
    selectedQuarter?.value || '',
  );

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!filters.partnerType || filters.partnerType === 'All') return data;

    const newObject = {
      PartnerCount: [...data.PartnerCount],
      DemoDetailsList: data?.DemoDetailsList?.filter(
        (item: DemoItemReseller) => item.AGP_Or_T3 === filters.partnerType,
      ),
    };
    return newObject;
  }, [data, filters.partnerType]);

  const transformedData = useMemo(() => {
    if (filteredData) {
      const Temp = transformDemoData(filteredData);
      console.log('Transformed Data before Partner Name filter:', selectedPartnerName, Temp);
      if (selectedPartnerName && selectedPartnerName?.value) {
          return Temp.filter(branch =>
            branch.partners.some(
              partner =>
                partner.AGP_Name &&
                partner.AGP_Name.trim() === selectedPartnerName.value,
            ),
          );
      } else {
        return Temp;
      }
    } else {
      return [];
    }
  }, [filteredData,selectedPartnerName?.value]);

  console.log('Reseller Transformed Data:', transformedData);

  const PartnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.AGP_Name && partner.AGP_Name.trim()) {
          namesSet.add(partner.AGP_Name.trim());
        }
      });
    });
    return Array.from(namesSet)
      .sort()
      .map(name => ({
        label: name,
        value: name,
      }));
  }, [transformedData]);

  const PartnerTypeList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.AGP_Or_T3 && partner.AGP_Or_T3.trim()) {
          namesSet.add(partner.AGP_Or_T3.trim());
        }
      });
    });
    return Array.from(namesSet)
      .sort()
      .map(name => ({
        label: name,
        value: name,
      }));
  }, [transformedData]);

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

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchRes}) => {
      return (
        <BranchCard
          item={item}
          summaryData={summaryData}
          yearQtr={selectedQuarter?.value || ''}
          category={filters.category || 'All'}
          premiumKiosk={filters.premiumKiosk ?? null}
          rogKiosk={filters.rogKiosk ?? null}
          partnerType={filters.partnerType ?? null}
          tab="reseller"
        />
      );
    },
    [summaryData, selectedQuarter, filters],
  );

  const stats = useMemo(
    () =>
      [
        {
          label: 'Single Demo',
          value: summaryData.at_least_single_demo,
          icon: 'x-circle',
          iconType: 'feather',
          name: 'lap_icon',
        },
        {
          label: '100% Demo',
          value: summaryData.demo_100,
          icon: 'percent',
          iconType: 'feather',
          name: 'perc_icon',
        },
        {
          label: 'Pending',
          value: 1,
          icon: 'pause-circle',
          iconType: 'feather',
          name: 'pause_icon',
        },
      ] as any,
    [summaryData],
  );

  const keyExtractor = useCallback((item: TransformedBranchRes) => item.id, []);
  if (isLoading) return <DemoSkeleton />;
  return (
    <View className="flex-1 bg-lightBg-base">
      <View className="flex-row items-center gap-x-1 px-3 pt-2 mb-3">
        <View className="w-[30%]">
          <AppDropdown
            mode="dropdown"
            data={quarters}
            selectedValue={selectedQuarter?.value}
            onSelect={setSelectedQuarter}
            placeholder="Select Quarter"
          />
        </View>
        <View className="flex-1">
          <AppDropdown
            mode="autocomplete"
            data={PartnerNameList}
            selectedValue={selectedPartnerName?.value}
            onSelect={setSelectedPartnerName}
            placeholder="Select Partner Name"
            allowClear
            onClear={()=>setSelectedPartnerName(null)}
          />
        </View>
        <FilterButton
          onPress={() => {
            showDemoFilterSheet({
              filters: {
                ...filters,
                yearQtr: selectedQuarter?.value,
              },
              data: {
                categories: categoriesData,
                partnerTypes: PartnerTypeList,
              },
              onApply: appliedFilters => {
                setFilters({
                  category: appliedFilters.category
                    ? appliedFilters.category
                    : 'All',
                  premiumKiosk: appliedFilters.premiumKiosk
                    ? appliedFilters.premiumKiosk
                    : 0,
                  rogKiosk: appliedFilters.rogKiosk
                    ? appliedFilters.rogKiosk
                    : 0,
                  partnerType: appliedFilters.partnerType
                    ? appliedFilters.partnerType
                    : null,
                });
              },
              onReset: () => {
                setFilters({
                  category: 'All',
                  premiumKiosk: 0,
                  rogKiosk: 0,
                  partnerType: null,
                });
              },
            });
          }}
          containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg"
          noShadow
        />
      </View>
      <FlatList
        data={transformedData}
        renderItem={renderBranch}
        keyExtractor={keyExtractor}
        contentContainerClassName="pb-10 px-3"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <StatsHeader
            stats={stats}
            counts={{
              awp_count: summaryData.awp_partners,
              total_partners: summaryData.total_partners,
            }}
          />
        }
      />
    </View>
  );
};

const Retailer = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);

  const [filters, setFilters] = useState<{
    category: string | null;
    compulsory: string | null;
    partnerType: string | null;
  }>({
    category: null,
    compulsory: 'bonus', // nopenalty
    partnerType: null,
  });

  const {data, isLoading} = useGetDemoDataRetailer(
    selectedQuarter?.value || '',
    filters.category || 'All',
    filters.compulsory || '',
  );

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!filters.partnerType || filters.partnerType === 'All') return data;
    return data.filter(
      (item: DemoItemRetailer) => item.PartnerType === filters.partnerType,
    );
  }, [data, filters.partnerType]);

  const transformedData = useMemo(() => {
    if (filteredData) {
      return transformDemoDataRetailer(filteredData, {
        groupType: 'branch',
        labelKey: 'state',
      });
    } else {
      return [];
    }
  }, [filteredData]);

  const summaryData = useMemo(() => {
    if (!transformedData || transformedData.length === 0) {
      return {
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        total_partners: 0,
      };
    }
    return transformedData.reduce(
      (acc, branch) => ({
        at_least_single_demo:
          acc.at_least_single_demo + branch.at_least_single_demo,
        at_80_demo: acc.at_80_demo + (branch.at_80_demo || 0),
        demo_100: acc.demo_100 + branch.demo_100,
        total_partners: acc.total_partners + branch.partner_count,
      }),
      {
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        total_partners: 0,
      },
    );
  }, [transformedData]);

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchRet}) => (
      <BranchCardRet
        item={item}
        summaryData={summaryData}
        yearQtr={selectedQuarter?.value || ''}
        partnerType={filters.partnerType}
        category={filters.category || 'All'}
        IsCompulsory={filters.compulsory || ''}
        tab="retailer"
      />
    ),
    [summaryData, selectedQuarter, filters],
  );

  const keyExtractor = useCallback((it: TransformedBranchRet) => it.id, []);

  const stats = useMemo(() => {
    return [
      {
        label: 'Single Demo',
        value: summaryData.at_least_single_demo,
        icon: 'laptop-outline',
        iconType: 'ionicons',
        name: 'lap_icon',
      },
      {
        label: '80% Demo',
        value: summaryData.at_80_demo,
        icon: 'trending-up',
        iconType: 'feather',
        name: 'grow_icon',
      },
      {
        label: '100% Demo',
        value: summaryData.demo_100,
        icon: 'percent',
        iconType: 'feather',
        name: 'perc_icon',
      },
      {
        label: 'Pending',
        value: 1,
        icon: 'pause-circle',
        iconType: 'feather',
        name: 'pause_icon',
      },
    ] as any;
  }, [summaryData]);

  if (isLoading) return <DemoSkeleton />;
  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={transformedData}
        keyExtractor={keyExtractor}
        renderItem={renderBranch}
        contentContainerClassName="pt-5 pb-10 px-3"
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={16}
        ListHeaderComponent={
          <StatsHeader
            stats={stats}
            counts={{
              awp_count: null,
              total_partners: summaryData.total_partners,
            }}
          />
        }
      />
    </View>
  );
};

// const partnerTypes = useMemo(() => {
//   if (!data) return [];

//   const uniqueTypes = new Set<string>();
//   data.forEach((item: DemoItem) => {
//     if (item.PartnerType && item.PartnerType.trim()) {
//       uniqueTypes.add(item.PartnerType.trim());
//     }
//   });

//   return Array.from(uniqueTypes)
//     .sort()
//     .map(type => ({
//       label: type,
//       value: type,
//     }));
// }, [data]);

// const LFR = () => {
//     const quarters = useMemo(() => getPastQuarters(), []);
//   const [selectedQuarter, setSelectedQuarter] =useState<AppDropdownItem | null>(quarters[0]);

//   const [filters, setFilters] = useState<{
//     category: string | null;
//     compulsory: string | null;
//     partnerType: string | null;
//   }>({
//     category: null,
//     compulsory: 'bonus', // nopenalty
//     partnerType: null,
//   });

//   const {data, isLoading} = useGetDemoDataLFR(
//     selectedQuarter?.value || '',
//     filters.category || 'All',
//     filters.compulsory || '',
//   );

//     const filteredData = useMemo(() => {
//     if (!data) return null;
//     if (!filters.partnerType || filters.partnerType === 'All') return data;
//     return data.filter(
//       (item: DemoItemRetailer) => item.PartnerType === filters.partnerType,
//     );
//   }, [data, filters.partnerType]);

//   const transformedData = useMemo(() => {
//     if (filteredData) {
//       return transformDemoDataRetailerAndLFR(filteredData);
//     } else {
//       return [];
//     }
//   }, [filteredData]);

//   const summaryData = useMemo(() => {
//     if (!transformedData || transformedData.length === 0) {
//       return {
//         at_least_single_demo: 0,
//         at_80_demo: 0,
//         demo_100: 0,
//         total_partners: 0,
//       };
//     }

//     return transformedData.reduce(
//       (acc, branch) => ({
//         at_least_single_demo:
//           acc.at_least_single_demo + branch.at_least_single_demo,
//         at_80_demo: acc.at_80_demo + (branch.at_80_demo || 0),
//         demo_100: acc.demo_100 + branch.demo_100,
//         total_partners: acc.total_partners + branch.partner_count,
//       }),
//       {
//         at_least_single_demo: 0,
//         at_80_demo: 0,
//         demo_100: 0,
//         total_partners: 0,
//       },
//     );
//   }, [transformedData]);

//   return <View className="flex-1 bg-lightBg-base">

//   </View>;
// }

// const ROI = () => {
//   const quarters = useMemo(() => getPastQuarters(), []);
//   const [selectedQuarter, setSelectedQuarter] =useState<AppDropdownItem | null>(quarters[0]);
//   const [filters, setFilters] = useState<{
//     category: string | null;
//     premiumKiosk: string | null;
//     rogKiosk: string | null;
//     partnerType: string | null;
//     agpName: string | null;
//   }>({
//     category: null,
//     premiumKiosk: null,
//     rogKiosk: null,
//     partnerType: null,
//     agpName: null,
//   });
//   const {data, isLoading} = useGetDemoDataROI(
//     selectedQuarter?.value || '',
//     filters.category || 'All',
//   );
//   console.log(
//     'ROI API Data:',
//     data ? data?.ROI_Details?.slice(0, 10) : undefined,
//     isLoading,
//   );
//   const filteredData = useMemo(() => {
//     if (!data) return null;
//     console.log('ROI Data:', data);
//     // If no partner type filter, return original data
//     if (!filters.partnerType) return data;

//     // Filter DemoDetailsList by partner type
//     const filteredList = [];
//     // const filteredList = filterDemoItemsByPartnerType( --- IGNORE ---
//     //   data.DemoDetailsList, --- IGNORE ---
//     //   filters.partnerType, --- IGNORE ---
//     // ); --- IGNORE ---

//     return {
//       ...data,
//       DemoDetailsList: [],
//     };
//   }, [data, filters.partnerType]);

//   const transformedData = useMemo(() => {
//     if (filteredData) {
//       return transformDemoData(filteredData);
//     }
//   }, [filteredData]);

//   // Calculate total summary across all branches
//   const summaryData = useMemo(() => {
//     if (!transformedData || transformedData.length === 0) {
//       return {
//         at_least_single_demo: 0,
//         demo_100: 0,
//         total_partners: 0,
//         awp_partners: 0,
//       };
//     }

//     return transformedData.reduce(
//       (acc, branch) => ({
//         at_least_single_demo:
//           acc.at_least_single_demo + branch.at_least_single_demo,
//         demo_100: acc.demo_100 + branch.demo_100,
//         total_partners: acc.total_partners + branch.partner_count,
//         awp_partners: acc.awp_partners + branch.awp_Count,
//       }),
//       {
//         at_least_single_demo: 0,
//         demo_100: 0,
//         total_partners: 0,
//         awp_partners: 0,
//       },
//     );
//   }, [transformedData]);
//   const keyExtractor = useCallback((it: TransformedBranch) => it.id, []);
//   const renderBranch = useCallback(
//     ({item}: {item: TransformedBranch}) => <View></View>,
//     [selectedQuarter, filters],
//   );
//   return <View className="flex-1 bg-lightBg-base">

//   </View>;
// }

export default function Demo() {
  useGetSummaryOverviewData(); // Preload summary data
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
            component: Retailer,
          },
          // {
          //   label: 'LFR',
          //   name: 'lfr',
          //   component: LFR,
          // },
          // {
          //   label: 'ROI',
          //   name: 'roi',
          //   component: ROI,
          // },
        ]}
        // initialRouteName="reseller"
      />
    </View>
  );
}
