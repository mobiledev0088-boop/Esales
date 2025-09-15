import {useMemo, useState} from 'react';
import AppModal from '../../../../../components/customs/AppModal';
import {FlatList, Pressable, ScrollView, TouchableOpacity, View} from 'react-native';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import Card from '../../../../../components/Card';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {
  DatePickerInput,
  DatePickerState,
} from '../../../../../components/customs/AppDatePicker';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import AppButton from '../../../../../components/customs/AppButton';
import Accordion from '../../../../../components/Accordion';
import {AppTable} from '../../../../../components/customs/AppTable';
import {screenWidth} from '../../../../../utils/constant';

export interface ActivationDetail {
  serialNumber: string;
  modelNumber: string;
  activationDate: string;
  purchaseDate: string;
  agpName: string;
}

interface FilterActionSheetProps {
  data: {label: string; value: string}[];
  selectedValues: string[];
  onApplyFilter: (selectedValues: string[]) => void;
}

export const CautionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
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

export const SearchCard = ({
  dateRange,
  maximumDate,
  minimumDate,
  partnerList,
  handleStoreSelect,
  selectedStore,
  setDateRange,
  handleChange,
  handleReset,
}: {
  dateRange: DatePickerState;
  maximumDate: Date;
  minimumDate: Date;
  partnerList: AppDropdownItem[];
  handleStoreSelect: (store: AppDropdownItem | null) => void;
  selectedStore: AppDropdownItem | null;
  setDateRange: (dateRange: DatePickerState) => void;
  handleChange: (
    dateRange: DatePickerState,
    partner: AppDropdownItem | null,
  ) => void;
  handleReset: () => void;
}) => {
  // in andorid drop down picker not work inside Card until you remove shadow
  return (
    <Card className="mb-4 ">
      <View className="flex-row items-center mb-4">
        <AppIcon
          type="ionicons"
          name="search-outline"
          size={20}
          color="#3B82F6"
          style={{marginRight: 8}}
        />
        <AppText
          size="lg"
          weight="semibold"
          className="text-gray-800 dark:text-gray-100">
          Search Activation Details
        </AppText>
      </View>

      <DatePickerInput
        mode="dateRange"
        initialStartDate={dateRange.start}
        initialEndDate={dateRange.end}
        initialDate={maximumDate}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onDateRangeSelect={(startDate, endDate) =>
          setDateRange({start: startDate, end: endDate})
        }
        label="Date Range"
        required
      />
      <AppDropdown
        data={partnerList || []}
        onSelect={handleStoreSelect}
        selectedValue={selectedStore?.value}
        mode="autocomplete"
        placeholder="Select store"
        label="Store Location"
        required
        listHeight={300}
        zIndex={30000}
        needIndicator
      />
      <View className="flex-row gap-3 mt-5">
        <AppButton
          title="Reset"
          iconName="refresh-ccw"
          className="flex-1 bg-gray-500"
          onPress={handleReset}
        />
        <AppButton
          title="Search"
          iconName="search"
          className="flex-1"
          onPress={() => handleChange(dateRange, selectedStore)}
        />
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

  // Filter data based on selected serial numbers
  const filteredSerialNumbersData = useMemo(() => {
    if (selectedSerialNumbers.length === 0) {
      return serialNumbersData; // Show all data if no filter applied
    }

    const filtered: Record<string, any[]> = {};

    Object.keys(serialNumbersData).forEach(date => {
      const filteredItems = serialNumbersData[date].filter(item =>
        selectedSerialNumbers.includes(item.Serial_No),
      );

      if (filteredItems.length > 0) {
        filtered[date] = filteredItems;
      }
    });

    return filtered;
  }, [serialNumbersData, selectedSerialNumbers]);

  const allSerialNumber = useMemo(() => {
    const filterData = Object.keys(serialNumbersData).flatMap(date => {
      return serialNumbersData[date].map(item => item.Serial_No);
    });
    const response = filterData.map(f => ({label: f, value: f}));
    return response;
  }, [serialNumbersData]);

  const handleFilterPress = () => {
    showFilterActionSheet({
      data: allSerialNumber,
      selectedValues: selectedSerialNumbers,
      onApplyFilter: setSelectedSerialNumbers,
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
    <Card className="mb-10 ">
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
              {selectedSerialNumbers.length > 0
                ? `(${selectedSerialNumbers.length})`
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

export const FilterActionSheet: React.FC = () => {
  const payload = useSheetPayload() as FilterActionSheetProps;
  const {data = [], selectedValues = [], onApplyFilter} = payload || {};

  const [tempSelectedValues, setTempSelectedValues] =
    useState<string[]>(selectedValues);
  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDarkMode = AppTheme === 'dark';

  const toggleSelection = (value: string) => {
    setTempSelectedValues(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value],
    );
  };

  const handleSelectAll = () => {
    if (tempSelectedValues.length === data.length) {
      setTempSelectedValues([]);
    } else {
      setTempSelectedValues(
        data.map((item: {label: string; value: string}) => item.value),
      );
    }
  };

  const handleApply = () => {
    onApplyFilter?.(tempSelectedValues);
    SheetManager.hide('FilterActionSheet');
  };

  const handleCancel = () => {
    setTempSelectedValues(selectedValues);
    SheetManager.hide('FilterActionSheet');
  };

  const renderItem = ({item}: {item: {label: string; value: string}}) => {
    const isSelected = tempSelectedValues.includes(item.value);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleSelection(item.value)}
        className="flex-row items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-700">
        <AppText
          size="base"
          className={`flex-1 mr-3 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {item.label}
        </AppText>
        <View
          className={`w-6 h-6 rounded border-2 items-center justify-center ${
            isSelected
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
          {isSelected && (
            <AppIcon type="ionicons" name="checkmark" size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <ActionSheet
        id="FilterActionSheet"
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          maxHeight: '80%',
        }}
        indicatorStyle={{
          backgroundColor: isDarkMode ? '#6b7280' : '#d1d5db',
          width: 50,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View style={{paddingHorizontal: 24, paddingVertical: 16}}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <AppText size="lg" weight="bold">
              Filter Serial Numbers
            </AppText>
            <TouchableOpacity onPress={handleSelectAll}>
              <AppText
                size="sm"
                weight="medium"
                className="text-blue-600 dark:text-blue-400">
                {tempSelectedValues.length === data.length
                  ? 'Deselect All'
                  : 'Select All'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Selected Count */}
          <View className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg mb-4">
            <AppText size="sm" className="text-blue-700 dark:text-blue-300">
              {tempSelectedValues.length} of {data.length} selected
            </AppText>
          </View>
          {/* List */}
          <View style={{maxHeight: 300}}>
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={item => item.value}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButton
              title="Cancel"
              onPress={handleCancel}
              color="black"
              className="bg-gray-200 dark:bg-gray-700 flex-1"
            />
            <AppButton
              title={`Apply (${tempSelectedValues.length})`}
              onPress={handleApply}
              className="flex-1"
            />
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

export const showFilterActionSheet = (props: FilterActionSheetProps) => {
  SheetManager.show('FilterActionSheet', {payload: props});
};
