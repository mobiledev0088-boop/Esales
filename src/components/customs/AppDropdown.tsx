import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useThemeStore } from '../../stores/useThemeStore';
import { AppColors } from '../../config/theme';
import AppIcon from './AppIcon';

export interface AppDropdownItem {
  label: string;
  value: string;
  [key: string]: any;
}

export interface AppDropdownProps {
  data: AppDropdownItem[];
  onSelect: (item: AppDropdownItem | null) => void;
  selectedValue?: string | null;
  mode: 'dropdown' | 'autocomplete';
  placeholder?: string;
  searchPlaceholder?: string;
  style?: ViewStyle;
  dropDownContainerStyle?: ViewStyle;
  textStyle?: TextStyle;
  listHeight?: number;
  showChevron?: boolean;
  disabled?: boolean;
  zIndex?: number;
  zIndexInverse?: number;
  onOpenChange?: () => void;
  forceTheme?: 'light' | 'dark';
}

const AppDropdown: React.FC<AppDropdownProps> = ({
  data,
  onSelect,
  selectedValue = null,
  mode,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  style,
  dropDownContainerStyle,
  textStyle,
  listHeight = 200,
  showChevron = true,
  disabled = false,
  zIndex = 1000,
  zIndexInverse = 1000,
  onOpenChange,
  forceTheme,
}) => {
  const { AppTheme } = useThemeStore();
  const deviceColorScheme = useColorScheme();

  const theme = useMemo(() => {
    const activeTheme = forceTheme || AppTheme || deviceColorScheme || 'light';
    return AppColors[activeTheme];
  }, [AppTheme, deviceColorScheme, forceTheme]);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(selectedValue);
  const [items, setItems] = useState(data);

  useEffect(() => setValue(selectedValue), [selectedValue]);
  useEffect(() => setItems(data), [data]);

  const handleSelect = (val: string | null) => {
    setValue(val);
    onSelect(data.find(item => item.value === val) || null);
  };

  const handleOpenChange = (state: React.SetStateAction<boolean>) => {
    setOpen(state);
    onOpenChange?.();
  };


  // All styles in one memo
  const stylesMemo = useMemo(() => ({
    pickerStyle: {
      backgroundColor: theme.bgSurface,
      borderColor: theme.border,
      borderWidth: 1.5,
      borderRadius: 12,
      minHeight: 54,
    },
    pickerText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '500' as const,
    },
    pickerContainer: {
      backgroundColor: theme.bgSurface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 12,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      maxHeight: listHeight,
    },
    placeholderText: {
      color: theme.text + '60',
    },
    searchInput: {
      backgroundColor: theme.bgSurface,
      color: theme.text,
      borderColor: theme.border,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      fontSize: 16,
      fontWeight: '500' as const,
      marginBottom: 8,
    },
  }), [theme, listHeight]);

  return (
    <View style={[styles.container, style]}>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={handleOpenChange}
        setValue={setValue}
        setItems={setItems}
        onSelectItem={item => handleSelect(item.value || null)}
        placeholder={placeholder}
        disabled={disabled}
        searchable={mode === 'autocomplete'}
        searchPlaceholder={searchPlaceholder}
        searchTextInputStyle={[stylesMemo.searchInput, textStyle]}
        searchPlaceholderTextColor={theme.text + '60'}
        searchContainerStyle={{
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
          paddingBottom: 8,
          marginBottom: 8,
        }}
        style={stylesMemo.pickerStyle}
        textStyle={[stylesMemo.pickerText, textStyle]}
        placeholderStyle={stylesMemo.placeholderText}
        dropDownContainerStyle={[stylesMemo.pickerContainer, dropDownContainerStyle]}
        zIndex={zIndex}
        zIndexInverse={zIndexInverse}
        closeAfterSelecting
        listMode="SCROLLVIEW"
        scrollViewProps={{ nestedScrollEnabled: true }}
        ArrowDownIconComponent={showChevron ? () => (
          <AppIcon type="feather" name="chevron-down" size={20} color={theme.text} />
        ) : undefined}
        ArrowUpIconComponent={showChevron ? () => (
          <AppIcon type="feather" name="chevron-up" size={20} color={theme.text} />
        ) : undefined}
        listItemLabelStyle={{ color: theme.text, borderBottomWidth:0.2, borderBottomColor: theme.text + '40' }}
        selectedItemLabelStyle={{
          color: theme.primary,
          fontWeight: 'bold',
        }}
        disabledItemLabelStyle={{
          color: theme.text + '40',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
});

export default AppDropdown;
