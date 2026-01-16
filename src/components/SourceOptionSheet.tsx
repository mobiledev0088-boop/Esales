import {TouchableOpacity, View} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';

import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import AppButton from './customs/AppButton';
import {useThemeStore} from '../stores/useThemeStore';

type ImageSourceType = 'camera' | 'gallery';

interface SourceOptionSheetPayload {
  title?: string;
  onSelect?: (source: ImageSourceType) => void;
}

export default function SourceOptionSheet() {
  const payload = useSheetPayload() as SourceOptionSheetPayload | undefined;

  const title = payload?.title ?? 'Select Image Source';
  const onSelect = payload?.onSelect;

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDarkMode = AppTheme === 'dark';

  const handleSelect = (source: ImageSourceType) => {
    onSelect?.(source);
    SheetManager.hide('SourceOptionSheet');
  };

  const handleCancel = () => {
    SheetManager.hide('SourceOptionSheet');
  };

  return (
    <View>
      <ActionSheet
        id="SourceOptionSheet"
        gestureEnabled
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        }}
        indicatorStyle={{
          backgroundColor: isDarkMode ? '#6b7280' : '#d1d5db',
          width: 40,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View className="px-6 pt-3 pb-6">
          <AppText
            size="lg"
            weight="semibold"
            className="text-center mb-5">
            {title}
          </AppText>

          <View className="flex-row gap-4 mb-5">
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800 py-4 items-center justify-center"
              onPress={() => handleSelect('camera')}>
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-2">
                <AppIcon
                  type="feather"
                  name="camera"
                  size={22}
                  color={isDarkMode ? '#e5e7eb' : '#1f2937'}
                />
              </View>
              <AppText size="sm" weight="medium">
                Camera
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800 py-4 items-center justify-center"
              onPress={() => handleSelect('gallery')}>
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-2">
                <AppIcon
                  type="feather"
                  name="image"
                  size={22}
                  color={isDarkMode ? '#e5e7eb' : '#1f2937'}
                />
              </View>
              <AppText size="sm" weight="medium">
                Gallery
              </AppText>
            </TouchableOpacity>
          </View>

          <AppButton
            title="Cancel"
            onPress={handleCancel}
            className="rounded-full" 
          />
        </View>
      </ActionSheet>
    </View>
  );
};

export const showSourceOptionSheet = (payload: SourceOptionSheetPayload) => {
  SheetManager.show('SourceOptionSheet', {payload});
};