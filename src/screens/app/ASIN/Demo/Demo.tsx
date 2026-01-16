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
  transformDemoDataLFR,
  transformDemoDataRetailer,
  transformDemoDataROI,
  TransformedBranchRes,
  TransformedBranchRet,
  TransformedBranchROI,
} from './utils';
import {
  BranchCard,
  BranchCardLFR,
  BranchCardRet,
  BranchCardROI,
  DemoSkeleton,
  StatsHeader,
} from './components';
import {
  useGetDemoCategories,
  useGetDemoCategoriesRet,
  useGetDemoDataLFR,
  useGetDemoDataROI,
  useGetDemoDataReseller,
  useGetDemoDataRetailer,
  useGetSummaryOverviewData,
} from '../../../../hooks/queries/demo';
import FilterButton from '../../../../components/FilterButton';
import {showDemoFilterSheet} from './DemoFilterSheet';
import {DataStateView} from '../../../../components/DataStateView';

const Reseller = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters?.[0] ?? null);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);

  const [filters, setFilters] = useState<ResellerFilterType>({
    category: 'All',
    pKiosk: 0,
    rogKiosk: 0,
    partnerType: '',
  });

  const {data, isLoading, error, refetch} = useGetDemoDataReseller(
    selectedQuarter?.value ?? '',
    filters.category,
    filters.pKiosk ?? 0,
    filters.rogKiosk ?? 0,
  );
  const {data: categoriesData} = useGetDemoCategories(
    selectedQuarter?.value || '',
  );

  const transformedData = useMemo(() => {
    if (!data) return [];
    return transformDemoData(data);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!transformedData.length) return [];
    let temp = transformedData;
    if (selectedPartnerName?.value) {
      temp = temp.filter(branch =>
        branch.partners.some(
          partner => partner.AGP_Name?.trim() === selectedPartnerName.value,
        ),
      );
    }
    if (filters.partnerType && filters.partnerType !== 'All') {
      temp = temp.filter(branch =>
        branch.partners.some(
          partner => partner.AGP_Or_T3?.trim() === filters.partnerType,
        ),
      );
    }
    return temp;
  }, [transformedData, selectedPartnerName?.value, filters.partnerType]);

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
        pending: 0,
        awp_partners: 0,
      };
    }

    return transformedData.reduce(
      (acc, branch) => ({
        at_least_single_demo:
          acc.at_least_single_demo + branch.at_least_single_demo,
        demo_100: acc.demo_100 + branch.demo_100,
        pending: acc.pending + branch.pending,
        total_partners: acc.total_partners + branch.partner_count,
        awp_partners: acc.awp_partners + branch.awp_Count,
      }),
      {
        at_least_single_demo: 0,
        demo_100: 0,
        total_partners: 0,
        pending: 0,
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
          premiumKiosk={filters.pKiosk ?? null}
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
          icon: 'laptop-outline',
          iconType: 'ionicons',
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
          value: summaryData.pending,
          icon: 'pause-circle',
          iconType: 'feather',
          name: 'pause_icon',
        },
      ] as any,
    [summaryData],
  );
  const handleFilter = useCallback(() => {
    const arr = Array.from({length: 6}, (_, i) => ({
      label: String(i),
      value: i,
    }));
    showDemoFilterSheet({
      filters: {
        ...filters,
      },
      data: {
        category: categoriesData,
        pKiosk: arr,
        rogKiosk: arr,
        partnerType: PartnerTypeList,
      },
      loading: false,
      onApply: appliedFilters => {
        setFilters({
          category: String(appliedFilters.category) || 'All',
          pKiosk: Number(appliedFilters.pKiosk) || 0,
          rogKiosk: Number(appliedFilters.rogKiosk) || 0,
          partnerType: String(appliedFilters.partnerType) || '',
        });
      },
      onReset: () => {
        setFilters({
          category: 'All',
          pKiosk: 0,
          rogKiosk: 0,
          partnerType: '',
        });
      },
    });
  }, [filters, categoriesData, PartnerNameList, PartnerTypeList]);

  const keyExtractor = useCallback((item: TransformedBranchRes) => item.id, []);
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);
  return (
    <DataStateView
      isLoading={isLoading}
      isError={!!error}
      isEmpty={!isLoading && !error && transformedData.length === 0}
      onRetry={handleRetry}
      LoadingComponent={<DemoSkeleton />}>
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
              onClear={() => setSelectedPartnerName(null)}
            />
          </View>
          <FilterButton
            onPress={handleFilter}
            containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg"
            noShadow
          />
        </View>
        <FlatList
          data={filteredData}
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
    </DataStateView>
  );
};

const Retailer = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);

  const [filters, setFilters] = useState<{
    category: string;
    compulsory: string;
    partnerType: string;
  }>({
    category: 'All',
    compulsory: 'bonus', // nopenalty
    partnerType: '',
  });

  const {data, isLoading, error, refetch} = useGetDemoDataRetailer(
    selectedQuarter?.value || '',
    filters.category,
    filters.compulsory,
  );
  const {data: categoriesData, isLoading: isCategoriesLoading} =
    useGetDemoCategoriesRet(selectedQuarter?.value || '');

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
      />
    ),
    [summaryData, selectedQuarter, filters],
  );

  const partnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerName && partner.PartnerName.trim()) {
          namesSet.add(partner.PartnerName.trim());
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

  const partnerTypeList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerType && partner.PartnerType.trim()) {
          namesSet.add(partner.PartnerType.trim());
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

  const handleFilter = useCallback(() => {
    showDemoFilterSheet({
      filters: {...filters},
      data: {
        category: categoriesData,
        compulsory: [
          {label: 'Bonus', value: 'bonus'},
          {label: 'No Penalty', value: 'nopenalty'},
        ],
        partnerType: partnerTypeList,
      },
      loading: isCategoriesLoading,
      onApply: appliedFilters => {
        setFilters(prev => ({
          ...prev,
          category: String(appliedFilters?.category) || 'All',
          compulsory: String(appliedFilters?.compulsory) || 'bonus', // nopenalty
          partnerType: String(appliedFilters?.partnerType),
        }));
      },
      onReset: () => {
        setFilters(prev => ({
          ...prev,
          category: 'All',
          compulsory: 'bonus',
          partnerType: '',
        }));
      },
    });
  }, [filters, partnerTypeList]);
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);
  return (
    <DataStateView
      isLoading={isLoading}
      isError={!!error}
      isEmpty={!isLoading && !error && transformedData.length === 0}
      onRetry={handleRetry}
      LoadingComponent={<DemoSkeleton />}>
      <View className="flex-1 bg-slate-50">
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
              data={partnerNameList}
              selectedValue={selectedPartnerName?.value}
              onSelect={setSelectedPartnerName}
              placeholder="Select Partner Name"
              allowClear
              onClear={() => setSelectedPartnerName(null)}
            />
          </View>
          <FilterButton
            onPress={handleFilter}
            containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg"
            noShadow
          />
        </View>
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
    </DataStateView>
  );
};

const LFR = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);

  const [filters, setFilters] = useState<{
    lfrType: string;
    partnerName: string;
  }>({
    lfrType: '',
    partnerName: '',
  });

  const {data, isLoading, error, refetch} = useGetDemoDataLFR(
    selectedQuarter?.value || '',
    'All',
  );

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!filters.lfrType || filters.lfrType === 'All') return data;
    return data.filter(
      (item: DemoItemRetailer) => item.PartnerType === filters.lfrType,
    );
  }, [data, filters.lfrType]);

  const transformedData = useMemo(() => {
    if (filteredData) {
      return transformDemoDataLFR(filteredData);
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
        pending: 0,
        total_partners: 0,
      };
    }
    return transformedData.reduce(
      (acc, branch) => ({
        at_least_single_demo:
          acc.at_least_single_demo + branch.at_least_single_demo,
        at_80_demo: acc.at_80_demo + (branch.at_80_demo || 0),
        demo_100: acc.demo_100 + branch.demo_100,
        pending: acc.pending + branch.pending,
        total_partners: acc.total_partners + branch.partner_count,
      }),
      {
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        pending: 0,
        total_partners: 0,
      },
    );
  }, [transformedData]);

  const partnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerName && partner.PartnerName.trim()) {
          namesSet.add(partner.PartnerName.trim());
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

  const partnerTypeList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerType && partner.PartnerType.trim()) {
          namesSet.add(partner.PartnerType.trim());
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

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchRet}) => (
      <BranchCardLFR
        item={item}
        summaryData={summaryData}
        yearQtr={selectedQuarter?.value || ''}
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
        value: summaryData.pending,
        icon: 'pause-circle',
        iconType: 'feather',
        name: 'pause_icon',
      },
    ] as any;
  }, [summaryData]);

  const handleFilter = useCallback(() => {
    showDemoFilterSheet({
      filters: {
        lfrType: filters.lfrType,
      },
      data: {
        lfrType: partnerTypeList,
      },
      loading: false,
      onApply: appliedFilters => {
        setFilters(prev => ({
          ...prev,
          lfrType: String(appliedFilters?.lfrType) || '',
        }));
      },
      onReset: () => {
        setFilters(prev => ({
          ...prev,
          lfrType: '',
        }));
      },
    });
  }, [filters, partnerTypeList]);
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);
  return (
    <DataStateView
      isLoading={isLoading}
      isError={!!error}
      isEmpty={!isLoading && !error && transformedData.length === 0}
      onRetry={handleRetry}
      LoadingComponent={<DemoSkeleton />}>
      <View className="flex-1 bg-slate-50">
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
              data={partnerNameList}
              selectedValue={selectedPartnerName?.value}
              onSelect={setSelectedPartnerName}
              placeholder="Select Partner Name"
              allowClear
              onClear={() => setSelectedPartnerName(null)}
            />
          </View>
          <FilterButton
            onPress={handleFilter}
            containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg"
            noShadow
          />
        </View>
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
    </DataStateView>
  );
};

const ROI = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);
  const [filters, setFilters] = useState<{
    category: string;
    series: string;
    partnerType: string;
  }>({
    category: 'All',
    series: '',
    partnerType: 'All',
  });

  const {data, isLoading, error, refetch} = useGetDemoDataROI(
    selectedQuarter?.value || '',
    filters.category,
  );

  const {data: categoriesData, isLoading: isCategoriesLoading} =
    useGetDemoCategoriesRet(selectedQuarter?.value || '');

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!filters.partnerType || filters.partnerType === 'All') return data;
    return data.filter(
      (item: DemoItemRetailer) => item.PartnerType === filters.partnerType,
    );
  }, [data, filters.partnerType]);

  const transformedData = useMemo(() => {
    if (filteredData) {
      return transformDemoDataROI(filteredData);
    } else {
      return [];
    }
  }, [filteredData]);

  const summaryData = useMemo(() => {
    if (!transformedData || transformedData.length === 0) {
      return {
        total_demo: 0,
        total_act: 0,
        total_stock: 0,
        total_partners: 0,
      };
    }
    return transformedData.reduce(
      (acc, branch) => ({
        total_demo: acc.total_demo + branch.total_demo,
        total_act: acc.total_act + branch.total_act,
        total_stock: acc.total_stock + branch.total_stock,
        total_partners: acc.total_partners + branch.partner_count,
      }),
      {
        total_demo: 0,
        total_act: 0,
        total_stock: 0,
        total_partners: 0,
      },
    );
  }, [transformedData]);

  const partnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerName && partner.PartnerName.trim()) {
          namesSet.add(partner.PartnerName.trim());
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

  const partnerTypeList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerType && partner.PartnerType.trim()) {
          namesSet.add(partner.PartnerType.trim());
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

  const seriesList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.Model_Series && partner.Model_Series.trim()) {
          namesSet.add(partner.Model_Series.trim());
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

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchROI}) => (
      <BranchCardROI
        item={item}
        summaryData={summaryData}
        yearQtr={selectedQuarter?.value || ''}
      />
    ),
    [summaryData, selectedQuarter, filters],
  );
  const keyExtractor = useCallback((item: TransformedBranchROI) => item.id, []);

  const stats = useMemo(() => {
    return [
      {
        label: 'Total Demo',
        value: summaryData.total_demo,
        icon: 'laptop-outline',
        iconType: 'ionicons',
        name: 'lap_icon',
      },
      {
        label: 'Total Active',
        value: summaryData.total_act,
        icon: 'trending-up',
        iconType: 'feather',
        name: 'grow_icon',
      },
      {
        label: 'Stock',
        value: summaryData.total_stock,
        icon: 'percent',
        iconType: 'feather',
        name: 'perc_icon',
      },
    ] as any;
  }, [summaryData]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFilter = useCallback(() => {
    showDemoFilterSheet({
      filters: {...filters},
      data: {
        category: categoriesData,
        series: seriesList,
        partnerType: partnerTypeList,
      },
      loading: isCategoriesLoading,
      onApply: appliedFilters => {
        setFilters(prev => ({
          ...prev,
          category: String(appliedFilters?.category),
          series: String(appliedFilters?.series),
          partnerType: String(appliedFilters?.partnerType),
        }));
      },
      onReset: () => {
        setFilters(prev => ({
          ...prev,
          category: 'All',
          series: '',
          partnerType: 'All',
        }));
      },
    });
  }, [
    filters,
    partnerTypeList,
    isCategoriesLoading,
    seriesList,
    categoriesData,
  ]);
  return (
    <View className="flex-1 bg-slate-50">
      <DataStateView
        isLoading={isLoading}
        isError={!!error}
        isEmpty={!isLoading && !error && transformedData.length === 0}
        onRetry={handleRetry}
        LoadingComponent={<DemoSkeleton />}>
        <View className="flex-1">
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
                data={partnerNameList}
                selectedValue={selectedPartnerName?.value}
                onSelect={setSelectedPartnerName}
                placeholder="Select Partner Name"
                allowClear
                onClear={() => setSelectedPartnerName(null)}
              />
            </View>
            <FilterButton
              onPress={handleFilter}
              containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg"
              noShadow
            />
          </View>
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
      </DataStateView>
    </View>
  );
};

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
          {
            label: 'LFR',
            name: 'lfr',
            component: LFR,
          },
          {
            label: 'ROI',
            name: 'roi',
            component: ROI,
          },
        ]}
        initialRouteName="reseller"
      />
    </View>
  );
}
