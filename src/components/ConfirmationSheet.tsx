import {View} from 'react-native';
import React from 'react';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';

import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import {useThemeStore} from '../stores/useThemeStore';
import AppButton from './customs/AppButton';

interface ConfirmationSheetProps {
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
}

const ConfirmationSheet: React.FC<ConfirmationSheetProps> = () => {
  const payload = useSheetPayload();

  const {
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    onConfirm = () => {}, // Default to a no-op function
  } = payload;

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDarkMode = AppTheme === 'dark';

  const handleConfirm = () => {
    onConfirm?.();
    SheetManager.hide('ConfirmationSheet');
  };

  const handleCancel = () => SheetManager.hide('ConfirmationSheet');

  return (
    <View>
      <ActionSheet
        id="ConfirmationSheet"
        useBottomSafeAreaPadding
        gestureEnabled
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        }}
        indicatorStyle={{
          backgroundColor: isDarkMode ? '#6b7280' : '#d1d5db',
          width: 50,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View className="px-6 py-2">
          <View className="items-center ">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-6 bg-blue-200">
              <AppIcon
                type={'feather'}
                name={'help-circle'}
                size={36}
                color={'#3b82f6'}
              />
            </View>
            <AppText size="lg" weight="bold" className="">
              {title}
            </AppText>
          </View>
          <AppText
            size="base"
            weight="medium"
            className="text-center leading-6 px-2 mb-4">
            {message}
          </AppText>
          <View className="flex-row gap-4 items-center">
            <AppButton
              title={cancelText}
              onPress={handleCancel}
              color="black"
              className="bg-gray-200 flex-1"
            />
            <AppButton
              title={confirmText}
              onPress={handleConfirm}
              color="white"
              className="flex-1"
            />
          </View>
        </View>
        {/* Content Container */}
      </ActionSheet>
    </View>
  );
};

export default ConfirmationSheet;

export const showConfirmationSheet = (props: ConfirmationSheetProps) => {
  SheetManager.show('ConfirmationSheet', {payload: props});
};

// Helper function to hide the confirmation sheet
export const hideConfirmationSheet = () => {
  SheetManager.hide('ConfirmationSheet');
};
