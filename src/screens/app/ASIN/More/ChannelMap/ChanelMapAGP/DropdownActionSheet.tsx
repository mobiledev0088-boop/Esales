import {useCallback} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import AppText from '../../../../../../components/customs/AppText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useThemeStore} from '../../../../../../stores/useThemeStore';
import {screenHeight} from '../../../../../../utils/constant';
import {useChannelMapStore} from '../../../../../../stores/useChannelMapStore';
import SheetIndicator from '../../../../../../components/SheetIndicator';
import {AppDropdownItem} from '../../../../../../components/customs/AppDropdown';

export type DropdownActionSheetPayload = {
  selected: string | number | null;
  onSelect?: (item: AppDropdownItem) => void;
};

export default function DropdownActionSheet() {
  const payload = (useSheetPayload?.() || {}) as DropdownActionSheetPayload;
  const {dropdownList} = useChannelMapStore(state => state);

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';
  const list = dropdownList || [];
  const currentSelected = payload?.selected;
  const handleSelect = useCallback(
    (item: AppDropdownItem) => {
        const dataToSend = { label: item.label, value: String(item.value) };
      if (payload?.onSelect) {
        payload.onSelect(dataToSend);
      }
    },
    [payload],
  );

  const renderItem = useCallback(
    ({item}: {item: AppDropdownItem}) => {
      const selected = item.value === currentSelected;
      return (
        <TouchableOpacity
        //   activeOpacity={0.8}
          onPress={() => {
            handleSelect?.(item);
            hideDropdownActionSheet();
          }}
          className={`flex-row items-center justify-between py-3 px-3 rounded-lg 
            border-b border-slate-300 dark:border-slate-600
            ${selected ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}>
          <AppText
            size="sm"
            weight={selected ? 'semibold' : 'regular'}
            className={`${
              selected
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-slate-700 dark:text-slate-200'
            }`}>
            {item.label}
          </AppText>
          {selected && (
            <MaterialIcons
              name="check"
              size={22}
              color={isDark ? '#93c5fd' : '#1A73E8'}
            />
          )}
        </TouchableOpacity>
      );
    },
    [currentSelected, handleSelect, isDark],
  );

  return (
    <View>
      <ActionSheet
        id="DropdownActionSheet"
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#0E161A' : '#f8fafc',
          maxHeight: screenHeight * 0.6
        }}>
        <SheetIndicator />
        <View className="px-3 pb-4 pt-2" style={{maxHeight: screenHeight * 0.6}}>
          <FlatList
            data={list}
            keyExtractor={item => String(item.value)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View className="h-2" />}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            windowSize={5}
            removeClippedSubviews
            contentContainerStyle={{paddingBottom: 16}}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ActionSheet>
    </View>
  );
}
export const showDropdownActionSheet = (props: DropdownActionSheetPayload) =>
  SheetManager.show('DropdownActionSheet', {payload: props});
export const hideDropdownActionSheet = () =>
  SheetManager.hide('DropdownActionSheet');
