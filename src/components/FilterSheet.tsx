import {View, TouchableOpacity, ViewStyle} from 'react-native';
import AppText from './customs/AppText';
import AppButton from './customs/AppButton';
import {screenHeight} from '../utils/constant';

export interface FilterSheetProps {
  title?: string;
  activeCount?: number; 
  leftContent: React.ReactNode; 
  rightContent: React.ReactNode; 
  onApply?: () => void;
  onClearAll?: () => void;
  onClose?: () => void;
  onRightPanelClear?: () => void;
  heightRatio?: number;
  footer?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  title = 'Filters',
  activeCount = 0,
  leftContent,
  rightContent,
  onApply,
  onClearAll,
  onClose,
  onRightPanelClear,
  heightRatio = 0.7,
  footer,
}) => {
  const handleClose = () => onClose?.();

  return (

      <View className="px-3 pb-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <AppText size="lg" weight="bold">
            {title} {activeCount > 0 && `(${activeCount})`}
          </AppText>
          {onClearAll && (
            <TouchableOpacity
              onPress={onClearAll}
              hitSlop={8}
              disabled={activeCount === 0}
              className={activeCount === 0 ? 'opacity-50' : ''}>
              <AppText
                size="sm"
                weight="medium"
                className="text-blue-600 dark:text-blue-400">
                Clear All
              </AppText>
            </TouchableOpacity>
          )}
        </View>
        {/* Body */}
        <View className="flex-row" style={{height: screenHeight * heightRatio}}>
          {/* Left */}
          <View style={{flexBasis: '30%', maxWidth: '30%', paddingRight: 4}}>
            {leftContent}
          </View>
          <View className="w-px bg-slate-200 dark:bg-slate-600 mx-2" />
          {/* Right */}
          <View className="flex-1" style={{flexBasis: '70%', maxWidth: '70%'}}>
            {/* Optional in-panel clear button */}
              {rightContent}
            {onRightPanelClear && (
              <View className="items-end mb-2">
                <TouchableOpacity
                  onPress={onRightPanelClear}
                  hitSlop={8}
                  className="px-3 py-1">
                  <AppText size="base" weight="medium" color='primary' className='underline'>
                    Clear
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          
          </View>
        </View>
        {/* Footer */}
        {footer ? (
          footer
        ) : (
          <View className="flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-600 mt-4 items-center">
            <View className="flex-1 flex-row gap-3">
              <AppButton
                title="Close"
                onPress={handleClose}
                color="black"
                className="bg-slate-200 dark:bg-slate-700 flex-1"
              />
              <AppButton
                title="Apply"
                onPress={() => onApply?.()}
                className="flex-1"
              />
            </View>
          </View>
        )}
      </View>
  );
};

export default FilterSheet;
