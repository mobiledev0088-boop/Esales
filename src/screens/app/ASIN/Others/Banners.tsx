import {Linking, Text, TouchableOpacity, View} from 'react-native';
import AppLayout from '../../../../components/layout/AppLayout';
import {useRoute} from '@react-navigation/native';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {APIResponse} from '../../../../types/navigation';
import {useQuery} from '@tanstack/react-query';
import AppImage from '../../../../components/customs/AppImage';
import {showToast} from '../../../../utils/commonFunctions';
import Skeleton from '../../../../components/skeleton/skeleton';
import { screenWidth } from '../../../../utils/constant';
import AppText from '../../../../components/customs/AppText';

interface BannerType {
  Banner_Link: string;
  BannerURL_Link: string;
  Product_Line: string;
  Sequence_No: string;
  Group_Sequence_No: string;
}

const useGetBannerInfo = (GroupSequencNo: string) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  return useQuery({
    queryKey: ['bannerInfo', employeeCode, RoleId, GroupSequencNo],
    enabled: !!GroupSequencNo,
    queryFn: async () => {
      const res = await handleASINApiCall<
        APIResponse<{BannerInfo: BannerType[]}>
      >('/Information/GetBannerInfo', {
        employeeCode,
        RoleId,
        GroupSequencNo,
      });

      const result = res?.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to load request numbers');
      }
      return result?.Datainfo?.BannerInfo ?? [];
    },
  });
};

export default function Banners() {
  const {params} = useRoute();
  const {Banner_Group_SeqNum} = params as {Banner_Group_SeqNum: string};
  const {
    data: bannerInfo,
    isLoading,
    isError,
  } = useGetBannerInfo(Banner_Group_SeqNum);

  const handlePress = (banner: BannerType) => {
    if (banner.BannerURL_Link) {
      Linking.openURL(banner.BannerURL_Link).catch(() => {
        showToast('Unable to open the link');
      });
    }
  };

  return (
    <AppLayout title="Banners" needBack needScroll>
      <View className="px-3 mt-4 flex-1">
        {isLoading && <View className='gap-3'>
            {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} width={screenWidth - 12} height={200} borderRadius={8} />
            ))}
            </View>}
        {isError && (
          <View className="flex-1 items-center justify-center">
            <AppText className="text-6xl mb-4">⚠️</AppText>
            <AppText className="text-lg font-semibold text-gray-800 mb-2">
              Oops! Something went wrong
            </AppText>
            <AppText className="text-sm text-gray-500 text-center px-4">
              Unable to load banners at the moment.
            </AppText>
          </View>
)} 
        {!isLoading &&
          !isError &&
          bannerInfo?.map((banner, index) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePress(banner)}
              key={index}
              className="mb-4">
              <AppImage
                source={{uri: banner.Banner_Link}}
                style={{width: '100%', height: 200, borderRadius: 8}}
                resizeMode="contain"
                showSkeleton
              />
            </TouchableOpacity>
          ))}
      </View>
    </AppLayout>
  );
}
