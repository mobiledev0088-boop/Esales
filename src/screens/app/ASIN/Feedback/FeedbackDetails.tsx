import { View, TouchableOpacity, ScrollView } from 'react-native'
import React, { useMemo } from 'react'
import AppLayout from '../../../../components/layout/AppLayout'
import { useNavigation, useRoute } from '@react-navigation/native'
import {  InfoRow, useCloseFeedbackMutation } from './component'
import AppText from '../../../../components/customs/AppText'
import AppIcon from '../../../../components/customs/AppIcon'
import Card from '../../../../components/Card'
import moment from 'moment'
import { STATUS_CONFIG, ICON_COLORS, FeedbackItem } from './constants'
import { showConfirmationSheet } from '../../../../components/ConfirmationSheet'
import {useUserStore} from '../../../../stores/useUserStore'
import { useLoginStore } from '../../../../stores/useLoginStore'
import { AppNavigationProp } from '../../../../types/navigation'
import { useThemeStore } from '../../../../stores/useThemeStore'

const FeedbackDetails = () => {
  const route = useRoute()
  const navigation = useNavigation<AppNavigationProp>();

  const empInfo = useUserStore(state => state.empInfo);
  const userInfo = useLoginStore(state => state.userInfo);
  const closeFeedbackMutation = useCloseFeedbackMutation();
  const AppTheme = useThemeStore(state => state.AppTheme);
  
  const empCode = empInfo?.EMP_Code ?? '';
  const userCode = userInfo?.EMP_Code ?? '';
  const { data } = route.params as { data: FeedbackItem }

  const statusConfig = useMemo(() => STATUS_CONFIG[data.Qry_Status] || STATUS_CONFIG.OPEN,[data.Qry_Status]);
  const formattedDate = useMemo(() => moment(data.Uploded_On).format('DD MMMM YYYY, hh:mm A'),[data.Uploded_On]);

  const handleOpenFeedback = (feedbackId: string) => {
    showConfirmationSheet({
      title: 'Close Feedback',
      confirmText: 'Close',
      message: 'Are you sure you want to close this feedback?',
      onConfirm: () => {
        closeFeedbackMutation.mutate(
          {feedbackId, empCode, userCode},
        {
          onSuccess: () => {
            navigation.goBack();
          },
          onError: (error) => {
            console.log('Failed to close feedback:', error);
          },
        },
        );
        navigation.goBack();
      },
    });
  };
  
  return (
    <AppLayout title="Feedback Details" needBack needPadding needScroll>
        <Card className="my-4">
          <View className="items-center py-2 pb-4">
            <AppText size="2xl" weight="bold" className="text-gray-900 dark:text-gray-100">
              ID : {data.Feedback_ID}
            </AppText>
            
            <AppText size="sm" weight="medium" className="text-gray-600 dark:text-gray-400 mt-1">
              {formattedDate}
            </AppText>

            <View className="mt-4">
              <View
                className={`px-4 py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border flex-row items-center gap-2`}
              >
                <AppIcon
                  type="ionicons"
                  name={statusConfig.iconName}
                  size={16}
                  color={statusConfig.iconColor}
                />
                <AppText
                  size="sm"
                  weight="bold"
                  className={`uppercase tracking-wide ${statusConfig.textColor}`}
                >
                  Status: {data.Qry_Status}
                </AppText>
              </View>
            </View>

            {data.Qry_Status === 'CLOSED' && (
              <View className="mt-3">
                <AppText size="xs" className="text-gray-500 dark:text-gray-400 text-center">
                  Close By: {data.Status_Updated_By || "KN2500069"}
                </AppText>
                <AppText size="xs" className="text-gray-500 dark:text-gray-400 text-center">
                  Close On: {data.Status_Updated_On ? moment(data.Status_Updated_On).format('DD MMMM YYYY, hh:mm A') : "14 August 2025, 02:41 PM"}
                </AppText>
              </View>
            )}
          </View>

          <View className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

          <View className="pb-4">
            <AppText size="lg" weight="bold" className="text-gray-900 dark:text-gray-100 mb-4">
              Customer Information
            </AppText>
            
            <InfoRow
              icon="mail"
              label="EMAIL ADDRESS"
              value={data.Employee_EmailID}
              iconColor={ICON_COLORS.email}
              AppTheme={AppTheme}
            />
            
            <InfoRow
              icon="person"
              label="CUSTOMER NAME"
              value={data.Employee_Name}
              iconColor={ICON_COLORS.customer}
              AppTheme={AppTheme}
            />
            
            <InfoRow
              icon="id-card"
              label="EMPLOYEE CODE"
              value={data.Employee_Code}
              iconColor={ICON_COLORS.employee}
              AppTheme={AppTheme}
            />
          </View>

          <View className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

          <View className="pb-2">
            <AppText size="lg" weight="bold" className="text-gray-900 dark:text-gray-100 mb-4">
              Query Details
            </AppText>
            
            <InfoRow
              icon="help-circle"
              iconType="feather"
              label="QUERY TYPE"
              value={data.QueryType}
              iconColor={ICON_COLORS.queryType}
              AppTheme={AppTheme}
            />
            
            <InfoRow
              icon="folder"
              iconType="feather"
              label="CATEGORY"
              value={data.Category}
              iconColor={ICON_COLORS.category}
              AppTheme={AppTheme}
            />
            
            <InfoRow
              icon="star"
              iconType="feather"
              label="APP EXPERIENCE"
              value={data.AFF_App_Experience}
              iconColor={ICON_COLORS.experience}
              AppTheme={AppTheme}
            />
            
            <View className="mt-2">
              <View className="flex-row items-start gap-3 py-3">
                <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mt-0.5">
                  <AppIcon
                    type="feather"
                    name="file-text"
                    size={16}
                    color={ICON_COLORS.description}
                  />
                </View>
                <View className="flex-1">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
                  >
                    QUERY DESCRIPTION
                  </AppText>
                  <View className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <AppText 
                      size="sm" 
                      className="text-gray-700 dark:text-gray-300"
                      style={{ lineHeight: 20 }}
                    >
                      {data.Feedback || "----"}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {data.Qry_Status === 'OPEN' && (
            <TouchableOpacity
              className="bg-error dark:bg-red-600 py-3 px-4 rounded flex-row items-center justify-center gap-2 mb-4"
              activeOpacity={0.8}
              onPress={() => handleOpenFeedback(data.UniqueId)}
            >
              <AppIcon
                type="ionicons"
                name="close-circle"
                size={20}
                color="white"
              />
              <AppText size="md" weight="semibold" color="white">
                Close Feedback
              </AppText>
            </TouchableOpacity>
        )}
    </AppLayout>
  )
}

export default FeedbackDetails