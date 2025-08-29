import useEmpStore from '../../../../stores/useEmpStore';
import AppText from '../../../../components/customs/AppText';
import AppLayout from '../../../../components/layout/AppLayout';
import AppButton from '../../../../components/customs/AppButton';
import FeedbackSkeleton from '../../../../components/skeleton/FeedbackSkeleton';

import {FlatList, StyleSheet, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {FeedbackApiResponse, FeedbackItem} from './constants';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {AppNavigationProp} from '../../../../types/navigation';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {EachFeedback, FAB, useCloseFeedbackMutation} from './component';
import {showConfirmationSheet} from '../../../../components/ConfirmationSheet';
import {useThemeStore} from '../../../../stores/useThemeStore';

const fetchEDMModels = async (empCode: string): Promise<FeedbackItem[]> => {
  const res: FeedbackApiResponse = await handleASINApiCall(
    '/FeedBack/GetFeedback_Form_GetList',
    {
      userName: empCode,
    },
  );

  if (!res?.DashboardData?.Status) {
    throw new Error('Failed to fetch feedback list');
  }

  return res.DashboardData.Datainfo?.FeedbackForm_Data ?? [];
};

export default function Feedback(){
  const empInfo = useEmpStore(state => state.empInfo);
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const closeFeedbackMutation = useCloseFeedbackMutation();
  const AppTheme = useThemeStore(state => state.AppTheme);

  const empCode = empInfo?.EMP_Code ?? '';
  const userCode = userInfo?.EMP_Code ?? '';

  const {
    data: feeds = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FeedbackItem[]>({
    queryKey: ['feedback', empCode],
    queryFn: () => fetchEDMModels(empCode),
    enabled: !!empCode,
  });

  const handleOpenFeedback = (feedbackId: string) => {
    showConfirmationSheet({
      title: 'Close Feedback',
      confirmText: 'Close',
      message: 'Are you sure you want to close this feedback?',
      onConfirm: () =>
        closeFeedbackMutation.mutate({feedbackId, empCode, userCode}),
    });
  };

  return (
    <AppLayout title="Feedback" needBack>
      {isLoading ? (
        <FeedbackSkeleton />
      ) : isError ? (
        <View className="flex-1 justify-center items-center mt-20">
          <AppText className="text-red-500 dark:text-red-400 mb-2">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </AppText>
          <AppButton title="Retry" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={feeds}
          keyExtractor={item => String(item.UniqueId)}
          renderItem={({item}) => (
            <EachFeedback
              item={item}
              onClose={handleOpenFeedback}
              navigation={navigation}
              AppTheme={AppTheme}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <AppText className="text-gray-500 dark:text-gray-400">No feedback available</AppText>
            </View>
          )}
        />
      )}
      <FAB />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 8,
    paddingBottom: 80,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
});
