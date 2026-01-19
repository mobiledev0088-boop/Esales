import React, {useCallback, useMemo, useState, useDeferredValue} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import {useThemeStore} from '../../../../stores/useThemeStore';
import FilterSheet from '../../../../components/FilterSheet';
import AppInput from '../../../../components/customs/AppInput';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import SheetIndicator from '../../../../components/SheetIndicator';

export interface ActivationFilterPayload {
  branches?: string[];
  model?: string[];
  type?: string[];
  alp?: string[];
  cpu?: string[];
  gpu?: string[];
  masterTab?: string;
  territory?: string; // If territory is passed, hide branch filter

  // Dynamic sources for dropdown data
  allBranches?: string[];
  allModels?: string[];
  allTypes?: string[];
  allALPs?: string[];
  allCPUs?: string[];
  allGPUs?: string[];

  // Callbacks
  onApply?: (res: ActivationFilterResult) => void;
  onReset?: () => void;
}

export interface ActivationFilterResult {
  branches: string[];
  model: string[];
  type: string[];
  alp: string[];
  cpu: string[];
  gpu: string[];
}

type Group = 'branches' | 'model' | 'type' | 'alp' | 'cpu' | 'gpu';

// Checkbox row component for individual filter items
const CheckboxRow = React.memo(
  ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-3 px-3 border-b border-slate-100 dark:border-slate-600">
      <View
        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
          selected
            ? 'border-blue-600 bg-blue-600'
            : 'border-slate-400 dark:border-slate-500'
        }`}>
        {selected && (
          <AppIcon name="check" type="feather" size={14} color="#ffffff" />
        )}
      </View>
      <AppText
        size="sm"
        className={`flex-1 ${
          selected
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-700 dark:text-slate-200'
        }`}>
        {label}
      </AppText>
    </TouchableOpacity>
  ),
);

// Group item component for left panel navigation
const GroupItem = React.memo(
  ({
    label,
    active,
    hasValue,
    onPress,
  }: {
    label: string;
    active: boolean;
    hasValue: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className={`px-3 py-3 rounded-md mb-1 flex-row items-center ${
        active ? 'bg-blue-50 dark:bg-blue-900/40' : 'bg-transparent'
      }`}>
      <View className="flex-1">
        <AppText
          size="sm"
          weight={active ? 'semibold' : 'regular'}
          className={`${
            active
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-slate-600 dark:text-slate-300'
          }`}>
          {label}
        </AppText>
      </View>
      {hasValue && <View className="w-2 h-2 rounded-full bg-blue-500" />}
    </TouchableOpacity>
  ),
);

const useGetFilterData = (masterTab: string) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const queryPayload = {
    employeeCode,
    RoleId,
    masterTab,
  };

  return useQuery({
    queryKey: ['ActivationFilterData', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/Dashboard/GetDashboardActivationViewMoreFilterOptions',
        queryPayload,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      const filterData = {
        Filter_TargetType: result.Datainfo.Filter_TargetType.map((item: any) =>
          String(item.Target_Type),
        ),
        Filter_Branch: result.Datainfo.Filter_Branch.map((item: any) =>
          String(item.BranchName),
        ),
        Filter_ALPType: result.Datainfo.Filter_ALPType.map((item: any) =>
          String(item.ALP_Type),
        ),
        Filter_ModelName: result.Datainfo.Filter_ModelName.map((item: any) =>
          String(item.Model_Name),
        ),
        Filter_CpuType: result.Datainfo.Filter_CpuType.map((item: any) =>
          String(item.CPU_Type),
        ),
        Filter_GpuType: result.Datainfo.Filter_GpuType.map((item: any) =>
          String(item.GPU_Type),
        ),
      };
      return filterData;
    },
  });
};

export default function ActivationFilterSheet() {
  const payload = (useSheetPayload?.() || {}) as ActivationFilterPayload;
  const {data: filterData, isLoading: isLoadingFilterData} = useGetFilterData(
    payload.masterTab || '',
  );
  const {
    Filter_Branch,
    Filter_TargetType,
    Filter_ModelName,
    Filter_ALPType,
    Filter_CpuType,
    Filter_GpuType,
  } = filterData || {};

  // Filter state for each group
  const [branches, setBranches] = useState<string[]>(payload.branches ?? []);
  const [model, setModel] = useState<string[]>(payload.model ?? []);
  const [type, setType] = useState<string[]>(payload.type ?? []);
  const [alp, setAlp] = useState<string[]>(payload.alp ?? []);
  const [cpu, setCpu] = useState<string[]>(payload.cpu ?? []);
  const [gpu, setGpu] = useState<string[]>(payload.gpu ?? []);

  // Active group state - default to 'model' if territory is provided (since branches will be hidden)
  const [group, setGroup] = useState<Group>(
    payload.territory ? 'model' : 'branches',
  );

  // Search state for each group
  const [branchesSearch, setBranchesSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [alpSearch, setAlpSearch] = useState('');
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');

  // Deferred search values for performance
  const dBranchesSearch = useDeferredValue(branchesSearch);
  const dModelSearch = useDeferredValue(modelSearch);
  const dTypeSearch = useDeferredValue(typeSearch);
  const dAlpSearch = useDeferredValue(alpSearch);
  const dCpuSearch = useDeferredValue(cpuSearch);
  const dGpuSearch = useDeferredValue(gpuSearch);

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  // Get data from API response
  const allBranches = useMemo(() => Filter_Branch || [], [Filter_Branch]);
  const allModels = useMemo(() => Filter_ModelName || [], [Filter_ModelName]);
  const allTypes = useMemo(() => Filter_TargetType || [], [Filter_TargetType]);
  const allALPs = useMemo(() => Filter_ALPType || [], [Filter_ALPType]);
  const allCPUs = useMemo(() => Filter_CpuType || [], [Filter_CpuType]);
  const allGPUs = useMemo(() => Filter_GpuType || [], [Filter_GpuType]);

  // Filtered data based on search
  const filteredBranches = useMemo(() => {
    const q = dBranchesSearch.trim().toLowerCase();
    if (!q) return allBranches;
    return allBranches.filter((b: any) => String(b).toLowerCase().includes(q));
  }, [dBranchesSearch, allBranches]);

  const filteredModels = useMemo(() => {
    const q = dModelSearch.trim().toLowerCase();
    if (!q) return allModels;
    return allModels.filter((m: any) => String(m).toLowerCase().includes(q));
  }, [dModelSearch, allModels]);

  const filteredTypes = useMemo(() => {
    const q = dTypeSearch.trim().toLowerCase();
    if (!q) return allTypes;
    return allTypes.filter((t: any) => String(t).toLowerCase().includes(q));
  }, [dTypeSearch, allTypes]);

  const filteredALPs = useMemo(() => {
    const q = dAlpSearch.trim().toLowerCase();
    if (!q) return allALPs;
    return allALPs.filter((a: any) => String(a).toLowerCase().includes(q));
  }, [dAlpSearch, allALPs]);

  const filteredCPUs = useMemo(() => {
    const q = dCpuSearch.trim().toLowerCase();
    if (!q) return allCPUs;
    return allCPUs.filter((c: any) => String(c).toLowerCase().includes(q));
  }, [dCpuSearch, allCPUs]);

  const filteredGPUs = useMemo(() => {
    const q = dGpuSearch.trim().toLowerCase();
    if (!q) return allGPUs;
    return allGPUs.filter((g: any) => String(g).toLowerCase().includes(q));
  }, [dGpuSearch, allGPUs]);

  // Calculate active filter count (exclude branches if territory is provided)
  const hasItems = (arr?: any[]) => (arr?.length ? 1 : 0);
  const activeCount = useMemo(() => {
    const branchCount = payload.territory ? 0 : hasItems(branches);
    return (
      branchCount +
      hasItems(model) +
      hasItems(type) +
      hasItems(alp) +
      hasItems(cpu) +
      hasItems(gpu)
    );
  }, [branches, model, type, alp, cpu, gpu, payload.territory]);

  // Define groups for left panel
  const groups = useMemo(() => {
    const allGroups = [
      {
        key: 'branches' as const,
        label: 'Branches',
        hasValue: branches.length > 0,
      },
      {
        key: 'model' as const,
        label: 'Model',
        hasValue: model.length > 0,
      },
      {
        key: 'type' as const,
        label: 'Type',
        hasValue: type.length > 0,
      },
      {
        key: 'alp' as const,
        label: 'ALP',
        hasValue: alp.length > 0,
      },
      {
        key: 'cpu' as const,
        label: 'CPU',
        hasValue: cpu.length > 0,
      },
      {
        key: 'gpu' as const,
        label: 'GPU',
        hasValue: gpu.length > 0,
      },
    ];

    // If territory is provided, exclude branches filter
    if (payload.territory) {
      return allGroups.filter(g => g.key !== 'branches');
    }

    return allGroups;
  }, [branches, model, type, alp, cpu, gpu, payload.territory]);

  // Toggle selection for checkbox items
  const toggleSelection = useCallback(
    (item: string) => {
      switch (group) {
        case 'branches':
          setBranches(prev =>
            prev.includes(item)
              ? prev.filter(b => b !== item)
              : [...prev, item],
          );
          break;
        case 'model':
          setModel(prev =>
            prev.includes(item)
              ? prev.filter(m => m !== item)
              : [...prev, item],
          );
          break;
        case 'type':
          setType(prev =>
            prev.includes(item)
              ? prev.filter(t => t !== item)
              : [...prev, item],
          );
          break;
        case 'alp':
          setAlp(prev =>
            prev.includes(item)
              ? prev.filter(a => a !== item)
              : [...prev, item],
          );
          break;
        case 'cpu':
          setCpu(prev =>
            prev.includes(item)
              ? prev.filter(c => c !== item)
              : [...prev, item],
          );
          break;
        case 'gpu':
          setGpu(prev =>
            prev.includes(item)
              ? prev.filter(g => g !== item)
              : [...prev, item],
          );
          break;
      }
    },
    [group],
  );

  // Get selected items for current group
  const getSelectedItems = useCallback((): string[] => {
    switch (group) {
      case 'branches':
        return branches;
      case 'model':
        return model;
      case 'type':
        return type;
      case 'alp':
        return alp;
      case 'cpu':
        return cpu;
      case 'gpu':
        return gpu;
      default:
        return [];
    }
  }, [group, branches, model, type, alp, cpu, gpu]);

  // Render checkbox item
  const renderCheckbox = useCallback(
    ({item}: {item: any}) => {
      const itemStr = String(item);
      return (
        <CheckboxRow
          label={itemStr || '—'}
          selected={getSelectedItems().includes(itemStr)}
          onPress={() => toggleSelection(itemStr)}
        />
      );
    },
    [getSelectedItems, toggleSelection],
  );

  // Get current filtered data and search props
  const getRightPaneData = useCallback(() => {
    switch (group) {
      case 'branches':
        return {
          data: filteredBranches,
          search: branchesSearch,
          setSearch: setBranchesSearch,
          placeholder: 'Search Branches',
        };
      case 'model':
        return {
          data: filteredModels,
          search: modelSearch,
          setSearch: setModelSearch,
          placeholder: 'Search Model',
        };
      case 'type':
        return {
          data: filteredTypes,
          search: typeSearch,
          setSearch: setTypeSearch,
          placeholder: 'Search Type',
        };
      case 'alp':
        return {
          data: filteredALPs,
          search: alpSearch,
          setSearch: setAlpSearch,
          placeholder: 'Search ALP',
        };
      case 'cpu':
        return {
          data: filteredCPUs,
          search: cpuSearch,
          setSearch: setCpuSearch,
          placeholder: 'Search CPU',
        };
      case 'gpu':
        return {
          data: filteredGPUs,
          search: gpuSearch,
          setSearch: setGpuSearch,
          placeholder: 'Search GPU',
        };
      default:
        return {
          data: [],
          search: '',
          setSearch: () => {},
          placeholder: 'Search',
        };
    }
  }, [
    group,
    filteredBranches,
    filteredModels,
    filteredTypes,
    filteredALPs,
    filteredCPUs,
    filteredGPUs,
    branchesSearch,
    modelSearch,
    typeSearch,
    alpSearch,
    cpuSearch,
    gpuSearch,
  ]);

  // Right panel content
  const rightPane = useMemo(() => {
    const {data, search, setSearch, placeholder} = getRightPaneData();

    return (
      <View className="flex-1">
        <AppInput
          value={search}
          setValue={setSearch}
          placeholder={placeholder}
          leftIcon="search"
        />
        <FlatList
          data={data}
          keyExtractor={(i: any) => String(i)}
          renderItem={renderCheckbox}
          keyboardShouldPersistTaps="handled"
          style={{flex: 1}}
          initialNumToRender={20}
          maxToRenderPerBatch={25}
          windowSize={10}
          removeClippedSubviews
          contentContainerStyle={{paddingBottom: 40}}
          ListEmptyComponent={
            <View className="py-8 items-center">
              <AppText size="sm" className="text-slate-500 dark:text-slate-400">
                {isLoadingFilterData ? 'Loading data...' : 'No data available'}
              </AppText>
            </View>
          }
        />
      </View>
    );
  }, [getRightPaneData, renderCheckbox, isLoadingFilterData]);

  // Clear all filters (preserve branches if territory is provided)
  const handleReset = () => {
    // Don't reset branches if territory is provided
    if (!payload.territory) {
      setBranches([]);
    }
    setModel([]);
    setType([]);
    setAlp([]);
    setCpu([]);
    setGpu([]);
    payload.onReset?.();
    SheetManager.hide('ActivationFilterSheet');
  };

  // Clear current group filter
  const handleClearCurrentGroup = () => {
    switch (group) {
      case 'branches':
        setBranches([]);
        break;
      case 'model':
        setModel([]);
        break;
      case 'type':
        setType([]);
        break;
      case 'alp':
        setAlp([]);
        break;
      case 'cpu':
        setCpu([]);
        break;
      case 'gpu':
        setGpu([]);
        break;
    }
  };

  // Apply filters
  const handleApply = () => {
    payload.onApply?.({
      branches,
      model,
      type,
      alp,
      cpu,
      gpu,
    });
    SheetManager.hide('ActivationFilterSheet');
  };

  return (
    <View>
      <ActionSheet
        id={'ActivationFilterSheet'}
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}>
        {/* Indicator */}
        <SheetIndicator />
        <FilterSheet
          title="Activation Filters"
          activeCount={activeCount}
          onApply={handleApply}
          onClearAll={activeCount > 0 ? handleReset : undefined}
          onClose={hideActivationFilterSheet}
          onRightPanelClear={handleClearCurrentGroup}
          leftContent={
            <View>
              {groups.map(g => (
                <GroupItem
                  key={g.key}
                  label={g.label}
                  active={group === g.key}
                  hasValue={g.hasValue}
                  onPress={() => setGroup(g.key)}
                />
              ))}
            </View>
          }
          rightContent={rightPane}
        />
      </ActionSheet>
    </View>
  );
}

export const showActivationFilterSheet = (
  props: ActivationFilterPayload = {},
) =>
  SheetManager.show('ActivationFilterSheet', {
    payload: props,
  });

export const hideActivationFilterSheet = () =>
  SheetManager.hide('ActivationFilterSheet');
