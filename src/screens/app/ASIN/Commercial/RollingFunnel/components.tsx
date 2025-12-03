import {memo} from 'react';
import {View, TouchableOpacity} from 'react-native';
import moment from 'moment';
import Accordion from '../../../../../components/Accordion';
import AppText from '../../../../../components/customs/AppText';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {RollingFunnelData} from './types';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';

const ACTIONS_WIDTH = 160; // Total width for both action buttons
const SWIPE_THRESHOLD = 50; // Minimum swipe distance to show actions

interface RowType {
  icon: string;
  iconType: IconType;
  label: string;
  value: string;
  color?: string;
  copy?: boolean;
}

interface RollingFunnelItemProps {
  item: RollingFunnelData;
  index: number;
  onEdit?: (item: RollingFunnelData) => void;
  onClose?: (item: RollingFunnelData) => void;
}

const InfoGrid = ({data}: {data: RowType[]}) => {
  return (
    <View className="flex-1 p-4 bg-white dark:bg-darkBg-surface">
      <View className="flex-row flex-wrap justify-between">
        {data.map((item, index) => (
          <View key={index} className="w-[48%] mb-4">
            <InfoRow
              icon={item.icon}
              iconType={item.iconType}
              label={item.label}
              value={item.value || 'N/A'}
              color={item.color}
              copy={item.copy}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const InfoRow = ({icon, iconType, label, value, color, copy}: RowType) => {
  const handleCopy = () => {
    if (value) {
      const Clipboard = require('react-native').Clipboard;
      const {showToast} = require('../../../../../utils/commonFunctions');
      Clipboard.setString(value);
      showToast(`${label} copied to clipboard`);
    }
  };

  return (
    <View className="flex-row items-center py-2">
      <View className="w-8 items-center mr-3">
        <AppIcon type={iconType} name={icon} size={18} color="#6B7280" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <AppText size="sm" className="text-gray-600 dark:text-gray-400">
            {label}
          </AppText>
          {copy && (
            <View onTouchEnd={handleCopy} className="ml-2">
              <AppIcon
                type="material-community"
                name="content-copy"
                size={14}
                color="#6B7280"
              />
            </View>
          )}
        </View>
        <AppText
          size="base"
          weight="medium"
          style={color ? {color} : undefined}
          className={!color ? 'text-gray-900 dark:text-gray-100' : ''}>
          {value}
        </AppText>
      </View>
    </View>
  );
};

const RollingFunnelItemContent = ({item}: {item: RollingFunnelData}) => {
  return (
    <Accordion
      header={
        <View className="flex-1">
          {/* Customer Name with Icon */}
          <View className="flex-row items-start mb-4">
            <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mt-1 mr-3">
              <AppIcon
                type="material-community"
                name="account"
                size={20}
                color={AppColors.primary}
              />
            </View>
            <View className="flex-1">
              <AppText
                weight="bold"
                size="lg"
                className="text-gray-900 dark:text-gray-100">
                {item.End_Customer}
              </AppText>
            </View>
          </View>

          {/* Info Grid */}
          <View className="flex-row items-center justify-between ">
            {/* Quantity */}
            <View className="">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  type="material-community"
                  name="cube-outline"
                  size={14}
                  color="#6B7280"
                />
                <AppText
                  size="xs"
                  className="text-gray-500 dark:text-gray-400 ml-1">
                  Quantity
                </AppText>
              </View>
              <AppText
                weight="semibold"
                size="base"
                className="text-gray-900 dark:text-white">
                {item.Quantity}
              </AppText>
            </View>

            {/* Funnel Type */}
            <View className="">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  type="material-community"
                  name="filter-variant"
                  size={14}
                  color="#6B7280"
                />
                <AppText
                  size="xs"
                  className="text-gray-500 dark:text-gray-400 ml-1">
                  Funnel
                </AppText>
              </View>
              <AppText
                weight="semibold"
                size="sm"
                numberOfLines={1}
                className="text-gray-900 dark:text-white">
                {item.Funnel_Type || 'N/A'}
              </AppText>
            </View>

            {/* Last Update Date */}
            <View className="">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  type="material-community"
                  name="clock-outline"
                  size={14}
                  color="#6B7280"
                />
                <AppText
                  size="xs"
                  className="text-gray-500 dark:text-gray-400 ml-1">
                  Updated
                </AppText>
              </View>
              <AppText
                weight="semibold"
                size="sm"
                numberOfLines={1}
                className="text-gray-900 dark:text-white">
                {item.Last_Update_Opportunity_Date &&
                moment(item.Last_Update_Opportunity_Date).isValid()
                  ? moment(item.Last_Update_Opportunity_Date).format(
                      'DD-MMM-YY',
                    )
                  : 'N/A'}
              </AppText>
            </View>
          </View>
        </View>
      }
      containerClassName="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-darkBg-surface shadow-sm"
      headerClassName="py-3 "
      needBottomBorder={false}>
      <View className="border-t border-gray-200 mt-3">
        <InfoGrid
          data={[
            {
              iconType: 'material-community',
              icon: 'account-circle',
              label: 'Customer',
              value: item.End_Customer,
            },
            {
              icon: 'briefcase',
              iconType: 'feather',
              label: 'Customer Company ID',
              value: item.End_Customer_CompanyID || '',
            },
            {
              icon: 'account-tie',
              iconType: 'material-community',
              label: 'Direct Account',
              value: item.Direct_Account,
            },
            {
              icon: 'account-group',
              iconType: 'material-community',
              label: 'Indirect Account',
              value: item.Indirect_Account,
            },
            {
              icon: 'package-variant',
              iconType: 'material-community',
              label: 'Product Line',
              value: item.Product_Line,
              color: AppColors.primary,
            },
            {
              icon: 'tag',
              iconType: 'feather',
              label: 'Model Name',
              value: item.Model_Name,
            },
            {
              icon: 'clipboard-text',
              iconType: 'material-community',
              label: 'Opportunity Number',
              value: item.Opportunity_Number,
              copy: true,
              color: '#2563EB',
            },
            {
              icon: 'progress-check',
              iconType: 'material-community',
              label: 'Stage',
              value: item.Stage,
              color: item.Stage === 'REJECTED' ? '#B45309' : '#059669',
              copy: true,
            },
            {
              icon: 'calendar-clock',
              iconType: 'material-community',
              label: 'CRAD Date',
              value:
                item.CRAD_Date && moment(item.CRAD_Date).isValid()
                  ? moment(item.CRAD_Date).format('DD-MMM-YYYY')
                  : '',
            },
          ]}
        />
      </View>
    </Accordion>
  );
};

const SwipeableWrapper = ({
  children,
  onEdit,
  onClose,
}: {
  children: React.ReactNode;
  onEdit?: () => void;
  onClose?: () => void;
}) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onStart(() => {
      // Store the starting position
      startX.value = translateX.value;
    })
    .onUpdate(event => {
      // Add translation to starting position, allowing swipe back
      const newValue = startX.value + event.translationX;
      translateX.value = Math.max(Math.min(newValue, 0), -ACTIONS_WIDTH);
    })
    .onEnd(() => {
      // Snap to actions or back to center based on threshold
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-ACTIONS_WIDTH, {
          damping: 20,
          stiffness: 150,
        });
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
        });
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const handleEdit = () => {
    translateX.value = withSpring(0, {damping: 15, stiffness: 150});
    if (onEdit) {
      scheduleOnRN(onEdit);
    }
  };

  const handleDelete = () => {
    translateX.value = withSpring(0, {damping: 15, stiffness: 150});
    if (onClose) {
      scheduleOnRN(onClose);
    }
  };

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      // Close the swipe if buttons are visible
      if (translateX.value < 0) {
        translateX.value = withSpring(0, {damping: 15, stiffness: 150});
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  return (
    <View className="relative mb-3 overflow-hidden rounded-lg">
      {/* Action Buttons Background */}
      <View className="absolute right-0 top-0 bottom-0 flex-row">
        {/* Edit Button */}
        <TouchableOpacity
          onPress={handleEdit}
          activeOpacity={0.7}
          className="w-20 bg-blue-500 items-center justify-center">
          <View className="items-center">
            <AppIcon
              type="material-community"
              name="pencil-outline"
              size={24}
              color="#fff"
            />
            <AppText weight="semibold" size="xs" className="text-white mt-1">
              Edit
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Delete Button (Close/X style) */}
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          className="w-20 bg-red-500 items-center justify-center">
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
            <AppIcon
              type="material-community"
              name="close"
              size={28}
              color="#fff"
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Swipeable Content */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={contentStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};

export const RollingFunnelItem = memo(
  ({item, index, onEdit, onClose}: RollingFunnelItemProps) => {
    const isRollingFunnel = item.IsEditable_Id === 1

    const handleClose = () => {
      if (onClose) {
        onClose(item);
      }
    };

    const handleEdit = () => {
      if (onEdit) {
        onEdit(item);
      }
    };

    const content = <RollingFunnelItemContent item={item} />;

    if (isRollingFunnel) {
      return (
        <SwipeableWrapper onEdit={handleEdit} onClose={handleClose}>
          {content}
        </SwipeableWrapper>
      );
    }
    return <View className="mb-3">{content}</View>;
  },
);
