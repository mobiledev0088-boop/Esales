import React, {useCallback, useMemo, useState} from 'react';
import {View, TouchableOpacity, FlatList, TextInput} from 'react-native';
import ActionSheet, {SheetManager, useSheetPayload} from 'react-native-actions-sheet';
import AppText from '../../../../../components/customs/AppText';
import AppButton from '../../../../../components/customs/AppButton';
import AppIcon from '../../../../../components/customs/AppIcon';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {screenHeight, screenWidth} from '../../../../../utils/constant';

// Payload contract for the sheet
export interface ChannelMapFilterPayload {
  // pre-selected values
  branchName?: string | null;
  partnerType?: string | null;
  partnerName?: string | null;
  // data sources from API
  branches?: {label: string; value: string}[];
  partnerTypes?: {label: string; value: string}[];
  partnerNames?: {label: string; value: string}[];
  onApply?: (filters: ChannelMapFilterResult) => void;
  onReset?: () => void;
}

export interface ChannelMapFilterResult {
  branchName: string | null;
  partnerType: string | null;
  partnerName: string | null;
}

// Radio row component (indicator on left)
const RadioRow = React.memo(
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
        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
          selected
            ? 'border-blue-600'
            : 'border-slate-400 dark:border-slate-500'
        }`}>
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
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

// Left group item
const GroupItem = ({
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
    activeOpacity={0.7}
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
);

const ChannelMapFilterSheet: React.FC = () => {
  const payload = (useSheetPayload?.() || {}) as ChannelMapFilterPayload;

  const branches = payload.branches || [];
  const partnerTypes = payload.partnerTypes || [];
  const partnerNames = payload.partnerNames || [];

  const [branchName, setBranchName] = useState<string | null>(
    payload.branchName ?? null,
  );
  const [partnerType, setPartnerType] = useState<string | null>(
    payload.partnerType ?? null,
  );
  const [partnerName, setPartnerName] = useState<string | null>(
    payload.partnerName ?? null,
  );
  const [group, setGroup] = useState<string>('branch');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  const activeCount = useMemo(
    () =>
      [branchName, partnerType, partnerName].filter(v => v && v !== '').length,
    [branchName, partnerType, partnerName],
  );

  const groups = useMemo(
    () => [
      {key: 'branch', label: 'Branch Name', hasValue: !!branchName},
      {key: 'partnerType', label: 'Partner Type', hasValue: !!partnerType},
      {key: 'partnerName', label: 'Partner Name', hasValue: !!partnerName},
    ],
    [branchName, partnerType, partnerName],
  );

  // Filter data based on search query
  const filteredData = useMemo(() => {
    let data: {label: string; value: string}[] = [];
    if (group === 'branch') data = branches;
    else if (group === 'partnerType') data = partnerTypes;
    else if (group === 'partnerName') data = partnerNames;

    if (!searchQuery) return data;

    return data.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [group, branches, partnerTypes, partnerNames, searchQuery]);

  const renderRadio = useCallback(
    ({item}: {item: {label: string; value: string}}) => {
      const isSelected =
        (group === 'branch'
          ? branchName ?? ''
          : group === 'partnerType'
            ? partnerType ?? ''
            : partnerName ?? '') === item.value;

      return (
        <RadioRow
          label={item.label}
          selected={isSelected}
          onPress={() => {
            if (group === 'branch') setBranchName(item.value);
            else if (group === 'partnerType') setPartnerType(item.value);
            else if (group === 'partnerName') setPartnerName(item.value);
          }}
        />
      );
    },
    [group, branchName, partnerType, partnerName],
  );

  const rightPane = () => {
    const hasSelection =
      group === 'branch'
        ? !!branchName
        : group === 'partnerType'
          ? !!partnerType
          : !!partnerName;

    return (
      <View className="flex-1">
        {/* Search Input */}
        <View className="px-3 pb-3">
          <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
            <AppIcon
              name="search"
              type="feather"
              size={18}
              color="#94A3B8"
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${group === 'branch' ? 'branches' : group === 'partnerType' ? 'partner types' : 'partners'}...`}
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2 text-slate-800 dark:text-slate-200"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <AppIcon
                  name="x"
                  type="feather"
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filteredData}
          keyExtractor={i => i.value || i.label}
          renderItem={renderRadio}
          style={{flex: 1}}
          contentContainerStyle={{paddingBottom: 40}}
          ListEmptyComponent={
            <View className="py-8 items-center">
              <AppIcon
                name="inbox"
                type="feather"
                size={40}
                color="#94A3B8"
              />
              <AppText
                size="sm"
                className="text-slate-500 dark:text-slate-400 mt-2">
                No results found
              </AppText>
            </View>
          }
        />

        {/* Clear Selection Button */}
        {hasSelection && (
          <TouchableOpacity
            onPress={() => {
              if (group === 'branch') setBranchName(null);
              else if (group === 'partnerType') setPartnerType(null);
              else if (group === 'partnerName') setPartnerName(null);
            }}
            className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
            <AppText
              size="sm"
              className="text-blue-600 dark:text-blue-400 underline">
              Clear Selection
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleReset = () => {
    setBranchName(null);
    setPartnerType(null);
    setPartnerName(null);
    setSearchQuery('');
    payload.onReset?.();
  };

  const handleApply = () => {
    const result: ChannelMapFilterResult = {
      branchName: branchName || null,
      partnerType: partnerType || null,
      partnerName: partnerName || null,
    };
    payload.onApply?.(result);
    SheetManager.hide('ChannelMapFilterSheet');
  };

  return (
    <View>
      <ActionSheet
        id="ChannelMapFilterSheet"
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          maxHeight: screenHeight * 0.7,
        }}
        indicatorStyle={{
          backgroundColor: isDark ? '#6b7280' : '#d1d5db',
          width: 50,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View className="px-3 pb-4 pt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <AppText size="lg" weight="bold">
              Filters {activeCount > 0 && `(${activeCount})`}
            </AppText>
            <TouchableOpacity
              onPress={handleReset}
              hitSlop={8}
              disabled={activeCount === 0}
              className={activeCount === 0 ? `opacity-50` : ``}>
              <AppText
                size="xs"
                weight="medium"
                className="text-blue-600 dark:text-blue-400">
                Clear All
              </AppText>
            </TouchableOpacity>
          </View>
          <View className="flex-row" style={{height: screenHeight * 0.55}}>
            {/* Left Group List (30%) */}
            <View style={{flexBasis: '30%', maxWidth: '30%', paddingRight: 4}}>
              {groups.map(g => (
                <GroupItem
                  key={g.key}
                  label={g.label}
                  active={group === g.key}
                  hasValue={g.hasValue}
                  onPress={() => {
                    setGroup(g.key);
                    setSearchQuery(''); // Clear search when switching groups
                  }}
                />
              ))}
            </View>
            {/* Divider */}
            <View className="w-px bg-slate-200 dark:bg-slate-600 mx-2" />
            {/* Right Content (70%) */}
            <View className="flex-1" style={{flexBasis: '70%', maxWidth: '70%'}}>
              {rightPane()}
            </View>
          </View>
          {/* Actions */}
          <View className="flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-600 mt-4 items-center">
            <View className="flex-1 flex-row gap-3">
              <AppButton
                title="Close"
                onPress={() => SheetManager.hide('ChannelMapFilterSheet')}
                color="black"
                className="bg-slate-200 dark:bg-slate-700 flex-1"
                noLoading
              />
              <AppButton title="Apply" onPress={handleApply} className="flex-1" noLoading />
            </View>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

export default ChannelMapFilterSheet;

// Helper functions
export const showChannelMapFilterSheet = (
  props: ChannelMapFilterPayload = {},
) => SheetManager.show('ChannelMapFilterSheet', {payload: props});
export const hideChannelMapFilterSheet = () =>
  SheetManager.hide('ChannelMapFilterSheet');
