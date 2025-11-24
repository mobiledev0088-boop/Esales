import React, {memo} from 'react';
import {View, TouchableOpacity} from 'react-native';
import moment from 'moment';
import Accordion from '../../../../../components/Accordion';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import Swipeable from '../../../../../components/Swipeable';
import { RollingFunnelData } from './types';

interface RowType {
  icon: string;
  iconType: 'material-community' | 'feather';
  label: string;
  value: string;
  color?: string;
  copy?: boolean;
}

interface RollingFunnelItemProps {
  item: RollingFunnelData;
  index: number;
  onEdit?: (item: RollingFunnelData) => void;
  onDelete?: (item: RollingFunnelData) => void;
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
        <AppIcon
          type={iconType}
          name={icon}
          size={18}
          color="#6B7280"
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <AppText size="sm" className="text-gray-600 dark:text-gray-400">
            {label}
          </AppText>
          {copy && (
            <View
              onTouchEnd={handleCopy}
              className="ml-2">
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

const RollingFunnelItemContent = ({
  item,
  onEdit,
}: {
  item: RollingFunnelData;
  onEdit?: (item: RollingFunnelData) => void;
}) => {
  const isRollingFunnel = item.Funnel_Type === 'Rolling_Funnel';

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
    }
  };

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
            {isRollingFunnel && (
              <TouchableOpacity
                onPress={handleEdit}
                activeOpacity={0.7}
                className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                <AppIcon
                  type="material-community"
                  name="pencil"
                  size={18}
                  color={AppColors.primary}
                />
              </TouchableOpacity>
            )}
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
      containerClassName="mb-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-darkBg-surface shadow-sm"
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
              color: '#059669',
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

const RollingFunnelItem = memo<RollingFunnelItemProps>(
  ({item, index, onEdit, onDelete}) => {
    const isRollingFunnel = item.Funnel_Type === 'Rolling_Funnel';

    const handleDismiss = () => {
      if (onDelete) {
        onDelete(item);
      }
    };

    // If it's a Rolling_Funnel, wrap with Swipeable
    if (isRollingFunnel) {
      return (
        <Swipeable
          id={item.Opportunity_Number || `item-${index}`}
          onDismiss={handleDismiss}
          borderRadius={12}
          threshold={0.3}
          backgroundColor="#ef4444"
          icon="close-outline"
          iconColor="white">
          <RollingFunnelItemContent item={item} onEdit={onEdit} />
        </Swipeable>
      );
    }

    // Otherwise, render without swipe actions
    return <RollingFunnelItemContent item={item} onEdit={onEdit} />;
  },
);

export default RollingFunnelItem;
