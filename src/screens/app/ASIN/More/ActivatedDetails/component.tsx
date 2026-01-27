import React, {useMemo, useState, useCallback} from 'react';
import AppModal from '../../../../../components/customs/AppModal';
import {FlatList, TouchableOpacity, View} from 'react-native';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import Card from '../../../../../components/Card';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppButton from '../../../../../components/customs/AppButton';
import Accordion from '../../../../../components/Accordion';
import {AppTable} from '../../../../../components/customs/AppTable';
import {screenWidth} from '../../../../../utils/constant';
import FilterSheet from '../../../../../components/FilterSheet';
import AppInput from '../../../../../components/customs/AppInput';

export interface ActivationDetail {
  serialNumber: string;
  modelNumber: string;
  activationDate: string;
  purchaseDate: string;
  agpName: string;
}

interface FilterActionSheetProps {
  data: {
    serial_list: {label: string; value: string}[];
    agp_list: {label: string; value: string}[];
  };
  selectedValues: {
    serialNumbers: string[];
    agpNames: string[];
  };
  onApplyFilter: (selectedValues: {serialNumbers: string[]; agpNames: string[]}) => void;
}

export const CautionModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <AppModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <View className="flex-row justify-center mb-4">
        <AppText
          size="xl"
          weight="bold"
          className="text-gray-800 dark:text-gray-100 mr-3">
          Caution
        </AppText>
        <AppIcon
          type="ionicons"
          name="warning-outline"
          size={26}
          color="#F59E0B"
        />
      </View>

      <View className="mb-5">
        <AppText className="text-center text-gray-600 dark:text-gray-300 leading-6 mb-3">
          The Activation Date is only to be used for checking rebate eligibility
          under ASUS eSalesIndia system.
        </AppText>
        <AppText className="text-center text-gray-600 dark:text-gray-300 leading-6">
          Any other use and sharing the Activation Date with other staff or with
          third parties is prohibited.
        </AppText>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsOpen(false)}
        className="items-center justify-center bg-primary rounded-lg py-3 px-6 min-w-[120px] shadow-sm">
        <AppText color="white" weight="medium">
          Continue
        </AppText>
      </TouchableOpacity>
    </AppModal>
  );
};

export const Disclaimer = () => (
  <View className="bg-red-100 rounded-xl p-4 mb-6 shadow-sm border border-red-600 mt-5">
    <View className="flex-row items-center mb-2">
      <AppIcon
        type="ionicons"
        name="information-circle-outline"
        size={18}
        color="#DC2626"
        style={{marginRight: 5}}
      />
      <AppText size="md" weight="semibold" className="text-error">
        Disclaimer
      </AppText>
    </View>
    <AppText className="text-error leading-5 text-sm ">
      Please Note that the activation of Serial Number may be delayed by up to 7
      days.
    </AppText>
  </View>
);

export const NoDataFound = () => {
  return (
    <Card className="mb-4 border border-dashed border-gray-300 dark:border-gray-600 -z-10">
      <View className="py-8 items-center">
        <AppIcon
          type="ionicons"
          name="search-outline"
          size={32}
          color="#9CA3AF"
          style={{marginBottom: 12}}
        />
        <AppText
          size="base"
          weight="medium"
          className="text-gray-500 dark:text-gray-400 text-center">
          No activation details found for the selected criteria.
        </AppText>
        <AppText
          size="xs"
          className="text-gray-400 dark:text-gray-500 text-center mt-1">
          Use the date range and store filters to search for activation details.
        </AppText>
      </View>
    </Card>
  );
};

export const ActivationDetailCard = ({
  serialNumbersData,
}: {
  serialNumbersData: Record<string, any[]>;
}) => {
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<string[]>(
    [],
  );
  const [selectedAgpNames, setSelectedAgpNames] = useState<string[]>([]);

  // Filter data based on selected serial numbers and AGP names
  const filteredSerialNumbersData = useMemo(() => {
    if (selectedSerialNumbers.length === 0 && selectedAgpNames.length === 0) {
      return serialNumbersData; // Show all data if no filter applied
    }

    const filtered: Record<string, any[]> = {};

    Object.keys(serialNumbersData).forEach(date => {
      const filteredItems = serialNumbersData[date].filter(item => {
        const serialMatch =
          selectedSerialNumbers.length === 0 ||
          selectedSerialNumbers.includes(item.Serial_No);
        const agpMatch =
          selectedAgpNames.length === 0 ||
          selectedAgpNames.includes(item.AGP_Name);
        return serialMatch && agpMatch;
      });

      if (filteredItems.length > 0) {
        filtered[date] = filteredItems;
      }
    });

    return filtered;
  }, [serialNumbersData, selectedSerialNumbers, selectedAgpNames]);

  const allSerialNumbers = useMemo(() => {
    const uniqueSerials = new Set<string>();
    Object.keys(serialNumbersData).forEach(date => {
      serialNumbersData[date].forEach(item => {
        if (item.Serial_No) {
          uniqueSerials.add(item.Serial_No);
        }
      });
    });
    return Array.from(uniqueSerials)
      .sort()
      .map(serial => ({label: serial, value: serial}));
  }, [serialNumbersData]);

  const allAgpNames = useMemo(() => {
    const uniqueAgps = new Set<string>();
    Object.keys(serialNumbersData).forEach(date => {
      serialNumbersData[date].forEach(item => {
        if (item.AGP_Name) {
          uniqueAgps.add(item.AGP_Name);
        }
      });
    });
    return Array.from(uniqueAgps)
      .sort()
      .map(agp => ({label: agp, value: agp}));
  }, [serialNumbersData]);

  const handleFilterPress = () => {
    showFilterActionSheet({
      data: {
        serial_list: allSerialNumbers,
        agp_list: allAgpNames,
      },
      selectedValues: {
        serialNumbers: selectedSerialNumbers,
        agpNames: selectedAgpNames,
      },
      onApplyFilter: ({serialNumbers, agpNames}) => {
        setSelectedSerialNumbers(serialNumbers);
        setSelectedAgpNames(agpNames);
      },
    });
  };
  const renderItem = ({item}: {item: string}) => (
    <Accordion
      containerClassName="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden my-3"
      headerClassName="p-3 bg-gray-50 dark:bg-gray-800"
      header={
        <View className="flex-row items-center flex-1">
          <AppIcon
            type="ionicons"
            name="calendar"
            size={20}
            color="#3B82F6"
            style={{marginRight: 8}}
          />
          <View className="flex-1">
            <AppText
              size="base"
              weight="bold"
              className="text-gray-900 dark:text-gray-100">
              Activation Date : {item}
            </AppText>
          </View>
        </View>
      }>
      <View className="items-center" key={item}>
        <AppTable
          columns={[
            {key: 'Serial_No', title: 'Serial No', width: screenWidth / 3 - 16},
            {key: 'Model_Name', title: 'Model No', width: screenWidth / 3 - 16},
            {key: 'AGP_Name', title: 'AGP Name', width: screenWidth / 3 - 16},
          ]}
          data={filteredSerialNumbersData[item] || []}
          scrollEnabled={false}
        />
      </View>
    </Accordion>
  );

  return (
    <Card className="mb-10 border border-slate-200 dark:border-slate-700" noshadow>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <AppIcon
            type="ionicons"
            name="list-outline" 
            size={24}
            color="#3B82F6"
          />
          <AppText size="lg" weight="bold">
            Activation Details
          </AppText>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleFilterPress}
            className="ml-2 flex-row items-center px-3 py-1 rounded-full bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-700 shadow-sm">
            <AppIcon
              type="material-community"
              name="tune-variant"
              size={15}
              color="#3B82F6"
              style={{marginRight: 6}}
            />
            <AppText
              size="xs"
              weight="medium"
              className="text-blue-700 dark:text-blue-300">
              Filter{' '}
              {selectedSerialNumbers.length + selectedAgpNames.length > 0
                ? `(${selectedSerialNumbers.length + selectedAgpNames.length})`
                : ''}
            </AppText>
          </TouchableOpacity>
          <View className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
            <AppText
              size="xs"
              weight="semibold"
              className="text-blue-700 dark:text-blue-300">
              {Object.keys(filteredSerialNumbersData).length} FOUND
            </AppText>
          </View>
        </View>
      </View>

      {/* FlatList instead of .map */}
      <FlatList
        data={Object.keys(filteredSerialNumbersData)}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        scrollEnabled={false}
      />
    </Card>
  );
};

type FilterGroup = 'serialNumber' | 'agpName';

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

export const FilterActionSheet: React.FC = () => {
  const payload = useSheetPayload() as FilterActionSheetProps;
  const {data, selectedValues, onApplyFilter} = payload || {};

  const [serialNumbers, setSerialNumbers] = useState<string[]>(
    selectedValues?.serialNumbers || [],
  );
  const [agpNames, setAgpNames] = useState<string[]>(
    selectedValues?.agpNames || [],
  );
  const [group, setGroup] = useState<FilterGroup>('serialNumber');
  const [searchQuery, setSearchQuery] = useState('');

  const {AppTheme} = useThemeStore();
  const isDark = AppTheme === 'dark';

  const serialList = useMemo(() => data?.serial_list || [], [data]);
  const agpList = useMemo(() => data?.agp_list || [], [data]);

  const filteredSerialList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return serialList;
    return serialList.filter(item =>
      item.label.toLowerCase().includes(query),
    );
  }, [searchQuery, serialList]);

  const filteredAgpList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return agpList;
    return agpList.filter(item => item.label.toLowerCase().includes(query));
  }, [searchQuery, agpList]);

  const activeCount = useMemo(() => {
    return serialNumbers.length + agpNames.length;
  }, [serialNumbers, agpNames]);

  const groups = useMemo(
    () => [
      {
        key: 'serialNumber' as const,
        label: 'Serial Number',
        hasValue: serialNumbers.length > 0,
      },
      {
        key: 'agpName' as const,
        label: 'AGP Name',
        hasValue: agpNames.length > 0,
      },
    ],
    [serialNumbers, agpNames],
  );

  const toggleSelection = useCallback(
    (item: string) => {
      if (group === 'serialNumber') {
        setSerialNumbers(prev =>
          prev.includes(item)
            ? prev.filter(s => s !== item)
            : [...prev, item],
        );
      } else {
        setAgpNames(prev =>
          prev.includes(item)
            ? prev.filter(a => a !== item)
            : [...prev, item],
        );
      }
    },
    [group],
  );

  const renderCheckbox = useCallback(
    ({item}: {item: {label: string; value: string}}) => (
      <CheckboxRow
        label={item.label || '—'}
        selected={
          group === 'serialNumber'
            ? serialNumbers.includes(item.value)
            : agpNames.includes(item.value)
        }
        onPress={() => toggleSelection(item.value)}
      />
    ),
    [group, serialNumbers, agpNames, toggleSelection],
  );

  const rightPane = useMemo(() => {
    const currentList =
      group === 'serialNumber' ? filteredSerialList : filteredAgpList;

    if (currentList.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-4">
          <AppIcon
            type="ionicons"
            name="search-outline"
            size={32}
            color="#9CA3AF"
            style={{marginBottom: 12}}
          />
          <AppText
            size="sm"
            className="text-slate-500 dark:text-slate-400 text-center">
            {searchQuery
              ? 'No results found for your search.'
              : `No ${group === 'serialNumber' ? 'serial numbers' : 'AGP names'} available.`}
          </AppText>
        </View>
      );
    }

    return (
      <View className="flex-1">
        <View className="mb-2">
          <AppInput
            value={searchQuery}
            setValue={setSearchQuery}
            placeholder={`Search ${group === 'serialNumber' ? 'Serial Number' : 'AGP Name'}`}
            leftIcon="search"
          />
        </View>
        <FlatList
          data={currentList}
          keyExtractor={item => item.value}
          renderItem={renderCheckbox}
          keyboardShouldPersistTaps="handled"
          style={{flex: 1}}
          initialNumToRender={20}
          maxToRenderPerBatch={25}
          windowSize={10}
          removeClippedSubviews
          contentContainerStyle={{paddingBottom: 40}}
        />
      </View>
    );
  }, [
    group,
    filteredSerialList,
    filteredAgpList,
    searchQuery,
    renderCheckbox,
  ]);

  const handleReset = () => {
    setSerialNumbers([]);
    setAgpNames([]);
    setSearchQuery('');
  };

  const handleApply = () => {
    onApplyFilter?.({
      serialNumbers,
      agpNames,
    });
    SheetManager.hide('FilterActionSheet');
  };

  const handleGroupChange = (newGroup: FilterGroup) => {
    setGroup(newGroup);
    setSearchQuery('');
  };

  return (
    <View>
      <ActionSheet
        id="FilterActionSheet"
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}>
        {/* Indicator */}
        <View className="flex-row justify-center">
          <View className="w-[50px] h-[4px] rounded-full bg-gray-300 dark:bg-slate-600 my-3" />
        </View>

        <FilterSheet
          title="Filters"
          activeCount={activeCount}
          onApply={handleApply}
          onClearAll={activeCount > 0 ? handleReset : undefined}
          onClose={() => SheetManager.hide('FilterActionSheet')}
          onRightPanelClear={() => {
            if (group === 'serialNumber') {
              setSerialNumbers([]);
            } else {
              setAgpNames([]);
            }
            setSearchQuery('');
          }}
          leftContent={
            <View>
              {groups.map(g => (
                <GroupItem
                  key={g.key}
                  label={g.label}
                  active={group === g.key}
                  hasValue={g.hasValue}
                  onPress={() => handleGroupChange(g.key)}
                />
              ))}
            </View>
          }
          rightContent={rightPane}
        />
      </ActionSheet>
    </View>
  );
};

export const showFilterActionSheet = (props: FilterActionSheetProps) => {
  SheetManager.show('FilterActionSheet', {payload: props});
};