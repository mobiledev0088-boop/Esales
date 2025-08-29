import {TouchableOpacity, View} from 'react-native';
import AppIcon, {IconType} from '../../../../components/customs/AppIcon';
import {getShadowStyle} from '../../../../utils/appStyles';
import AppText from '../../../../components/customs/AppText';
import Swipeable from '../../../../components/Swipeable';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import Card from '../../../../components/Card';
import { memo } from 'react';
import { CloseFeedbackResponse, FeedbackItem } from './constants';
import { handleASINApiCall } from '../../../../utils/handleApiCall';
import { getDeviceId } from 'react-native-device-info';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../../../../stores/providers/QueryProvider';
import { useThemeStore } from '../../../../stores/useThemeStore';

export const EachFeedback = ({
  item,
  onClose,
  navigation,
  AppTheme
}: {
  item: FeedbackItem;
  onClose?: (id: string) => void;
  navigation: AppNavigationProp;
  AppTheme?: 'light' | 'dark';
}) => {
  const getStatusConfig = (status: string) => {
    if (status === 'CLOSED') {
      return {
        textColor: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
      };
    }
    return {
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    };
  };

  const statusConfig = getStatusConfig(item.Qry_Status);

  const handleSwipeDelete = (id: string) => {
    if (onClose) {
      onClose(id);
    }
  };
  const handlePress = () => navigation.push('FeedbackDetails', {data: item}); 

  return (
    <Swipeable
      id={item.UniqueId}
      onDismiss={handleSwipeDelete}
      borderRadius={25}
      icon="close-outline"
      disabled={item.Qry_Status === 'CLOSED'}>
      <TouchableOpacity
        className="bg-white dark:bg-darkBg-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        activeOpacity={1} 
        onPress={handlePress}
        >
        {/* Header Section */}
        <View className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <AppText size="lg" weight="bold" className="text-gray-900 dark:text-gray-100">
                #{item.Feedback_ID}
              </AppText>
              <AppText size="xs" className="text-gray-500 dark:text-gray-400 mt-0.5">
                {item.QueryType}
              </AppText>
            </View>
            <View className="items-end">
              <AppText size="sm" weight="medium" className="text-gray-700 dark:text-gray-300">
                {moment(item.Uploded_On).format('DD/MM/YYYY')}
              </AppText>
              <AppText size="xs" className="text-gray-500 dark:text-gray-400">
                {moment(item.Uploded_On).format('hh:mm A')}
              </AppText>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="p-4">
          {/* Customer Info Row */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Customer
              </AppText>
              <AppText size="sm" weight="semibold" className="text-gray-900 dark:text-gray-100">
                {item.Employee_Name}
              </AppText>
              <AppText size="xs" className="text-gray-600 dark:text-gray-400">
                {item.Employee_EmailID}
              </AppText>
            </View>
            <View className="items-end">
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Employee
              </AppText>
              <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-gray-700 dark:text-gray-300 font-mono">
                  {item.Employee_Code}
                </AppText>
              </View>
            </View>
          </View>

          {/* Status and Action Row */}
          <View className="flex-row justify-between items-center">
            <View
              className={`px-3 py-1.5 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
              <AppText
                size="xs"
                weight="bold"
                className={`uppercase tracking-wide ${statusConfig.textColor}`}>
                {item.Qry_Status}
              </AppText>
            </View>
            <View className="w-9 h-9 bg-gray-50 dark:bg-gray-700 rounded-full justify-center items-center">
              <AppIcon
                type="feather"
                name="chevron-right"
                size={18}
                color={AppTheme === 'dark' ? "#9CA3AF" : "#A0AEC0"}
                style={{marginLeft: 2}}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export const FAB = () => {
  const navigation = useNavigation<AppNavigationProp>();
  return (
    <TouchableOpacity
      className="absolute bottom-8 right-6 w-16 h-16 bg-primary rounded-full shadow-lg items-center justify-center"
      style={getShadowStyle(5)}
      activeOpacity={0.8}
      onPress={() => navigation.push('AddFeedback')}>
      <AppIcon type="ionicons" name="add" size={28} color="white" />
    </TouchableOpacity>
  );
};

export const AppExperience = ({
  appExperience,
  onPress,
  experienceOptions,
  AppTheme
}: {
  appExperience: string | null;
  onPress: (value: string) => void;
  experienceOptions: ReadonlyArray<{readonly label: string; readonly value: string; readonly color: string}>;
  AppTheme?: 'light' | 'dark';
}) => {
  const StarRating = ({count}: {count: number}) => (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map(star => (
        <AppText
          key={star}
          className="mx-0.4"
          size={'xs'}
          style={{color: star <= count ? '#fbbf24' : '#d1d5db'}}>
          ★
        </AppText>
      ))}
    </View>
  );

  // Icon mapping for options
  const experienceIcons: Array<{type: IconType; name: string; color: string}> =
    [
      {type: 'ionicons', name: 'sad-outline', color: '#ef4444'},
      {type: 'materialIcons', name: 'sentiment-dissatisfied', color: '#f97316'},
      {type: 'materialIcons', name: 'sentiment-neutral', color: '#eab308'},
      {type: 'materialIcons', name: 'sentiment-satisfied', color: '#22c55e'},
      {
        type: 'materialIcons',
        name: 'sentiment-very-satisfied',
        color: '#10b981',
      },
    ];

  return (
    <View>
      {/* Heading */}
      <AppText className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        App Experience<AppText className="text-red-500 dark:text-red-400"> *</AppText>
      </AppText>
      <AppText className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Choose your rating with stars
      </AppText>
      <Card className="rounded-md">
        {/* Options */}
        <View className="flex-row justify-between items-start px-2">
          {experienceOptions.map((option, index) => {
            const starCount = parseInt(option.value);
            const isSelected = appExperience === option.value;
            const icon = experienceIcons[index];

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onPress(option.value)}
                className="items-center flex-1"
                activeOpacity={0.8}>
                {/* Emoji Icon */}
                <View
                  className={`w-14 h-14 rounded-full items-center justify-center mb-2 border-2 ${
                    isSelected ? 'border-yellow-400 dark:border-yellow-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: isSelected
                      ? option.color + '20'
                      : AppTheme === 'dark' ? '#374151' : '#f9fafb',
                    shadowColor: isSelected ? option.color : 'transparent',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: isSelected ? 4 : 0,
                  }}>
                  <AppIcon
                    type={icon.type}
                    name={icon.name}
                    size={32}
                    color={icon.color}
                  />
                </View>

                {/* Stars */}
                <StarRating count={starCount} />

                {/* Label */}
                <AppText
                  numberOfLines={1}
                  className={`text-xs text-center ${isSelected ? 'font-semibold' : 'font-medium'}`}
                  style={{color: isSelected ? option.color : (AppTheme === 'dark' ? '#9CA3AF' : '#6b7280')}}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Rating */}
        {appExperience && (
          <View className="mt-4 items-center">
            <View className="flex-row items-center bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700">
              <AppText className="text-sm text-yellow-700 dark:text-yellow-400 mr-2">
                Your Rating:
              </AppText>
              <StarRating count={parseInt(appExperience)} />
              <AppText className="text-sm text-yellow-700 dark:text-yellow-400 ml-2">
                (
                {
                  experienceOptions.find(opt => opt.value === appExperience)
                    ?.label
                }
                )
              </AppText>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
};

export const InfoRow = memo(({
    icon,
    iconType,
    label,
    value,
    iconColor = '#6B7280',
    renderCustomValue,
    AppTheme
  }: {
    icon: string;
    iconType?: 'ionicons' | 'feather' | 'materialIcons' | 'material-community';
    label: string;
    value?: string;
    iconColor?: string;
    renderCustomValue?: () => React.ReactNode;
    AppTheme?: 'light' | 'dark';
  }) => (
    <View className="flex-row items-start gap-3 py-3">
      <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mt-0.5">
        <AppIcon
          type={iconType || 'ionicons'}
          name={icon}
          size={16}
          color={iconColor}
        />
      </View>
      <View className="flex-1">
        <AppText
          size="xs"
          weight="medium"
          className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1"
        >
          {label}
        </AppText>
        {renderCustomValue ? renderCustomValue() : (
          <AppText size="sm" weight="semibold" className="text-gray-900 dark:text-gray-100">
            {value || "----"}
          </AppText>
        )}
      </View>
    </View>
));

// common Function for Changing Status
const apiCloseFeedback = async (
  feedbackId: string,
  userName: string,
): Promise<void> => {
  const res: CloseFeedbackResponse = await handleASINApiCall(
    '/FeedBack/GetFeedback_Form_Status_Insert',
    {
      Feedback_ID: feedbackId,
      Status: 'CLOSED',
      remark: '',
      userName,
      Machinename: getDeviceId(),
    },
  );

  if (!res?.DashboardData?.Status) {
    throw new Error('Failed to close feedback');
  }
};

// 🟦 Mutation: Close feedback
export const useCloseFeedbackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { feedbackId: string; empCode: string; userCode: string }, // mutation variables
    { previousData?: FeedbackItem[] } // context for rollback
  >({
    mutationFn: ({ feedbackId, userCode }) => {
      return apiCloseFeedback(feedbackId, userCode);
    },

    onMutate: async ({ feedbackId, empCode }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['edminfo', empCode] });

      // Snapshot current cache
      const previousData = queryClient.getQueryData<FeedbackItem[]>([
        'edminfo',
        empCode,
      ]);

      // Optimistically update
      queryClient.setQueryData<FeedbackItem[]>(
        ['edminfo', empCode],
        oldFeeds =>
          oldFeeds?.map(feed =>
            feed.UniqueId === feedbackId
              ? { ...feed, Qry_Status: 'CLOSED' }
              : feed,
          ) ?? [],
      );

      return { previousData };
    },

    onError: (_error, variables, context) => {
      // Rollback if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(
          ['edminfo', variables.empCode],
          context.previousData,
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['edminfo', variables.empCode] });
    },
  });
};


