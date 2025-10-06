import {View} from 'react-native';
import {screenWidth} from '../../utils/constant';
import Skeleton from './skeleton';

export const DashboardSalesData = () => {
  return (
    <View className="px-3 gap-3">
      <Skeleton width={80} height={25} borderRadius={8} />
      <Skeleton width={120} height={25} borderRadius={8}  />
    </View>
  )
}

export const DashboardBannerSkeleton = () => {
  return <Skeleton width={screenWidth - 20} height={200} borderRadius={12} />;
};

export const TargetVsAchievementSkeleton = () => {
  return (
    <View className="px-3">
      <Skeleton width={80} height={25} borderRadius={8} />
      <View className=" mt-2">
        <View  className="flex-row items-center mb-4 gap-3">
        {Array.from({length: 6}).map((_, index) => (
            <Skeleton key={index} width={100} height={130} borderRadius={8} />
          ))}
          </View>
      </View>
            <Skeleton width={80} height={25} borderRadius={8} />
      <View className=" mt-2">
        <View  className="flex-row items-center mb-4 gap-3">
        {Array.from({length: 6}).map((_, index) => (
            <Skeleton key={index} width={100} height={130} borderRadius={8} />
          ))}
          </View>
      </View>
    </View>
  );
};

export const ActivationPerformanceSkeleton = () => {
  return (
    <View className="px-3 py-3">
      <View className="mb-3">
        <Skeleton width={180} height={25} borderRadius={8} />
      </View>
      <View className="mb-3">
        <Skeleton width={screenWidth - 40} height={80} borderRadius={12} />
      </View>
      <View className="bg-white rounded-xl overflow-hidden">
        <Skeleton width={screenWidth - 40} height={50} borderRadius={0} />
        <Skeleton width={screenWidth - 40} height={40} borderRadius={0} />
        {Array.from({length: 5}).map((_, index) => (
          <Skeleton key={index} width={screenWidth - 40} height={50} borderRadius={0} />
        ))}
      </View>
    </View>
  );
};

export const ASEDataSkeleton = () => {
  return (
    <View className="px-3">
      <View className="mb-2">
        <Skeleton width={120} height={25} borderRadius={8} />
      </View>
      <View className="bg-white rounded-xl p-4">
        <View className="mb-3">
          <Skeleton width={screenWidth - 80} height={40} borderRadius={8} />
        </View>
        <View className="flex-row flex-wrap justify-between">
          {Array.from({length: 4}).map((_, index) => (
            <View key={index} className="items-center p-4">
              <View className="mb-2">
                <Skeleton width={24} height={24} borderRadius={12} />
              </View>
              <View className="mb-1">
                <Skeleton width={40} height={20} borderRadius={4} />
              </View>
              <Skeleton width={60} height={16} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const PartnerAnalyticsSkeleton = () => {
  return (
    <View className="px-3">
      <View className="mb-2">
        <Skeleton width={150} height={25} borderRadius={8} />
      </View>
      <View className="bg-white rounded-xl p-4">
        <View className="mb-3">
          <Skeleton width={screenWidth - 80} height={40} borderRadius={8} />
        </View>
        {Array.from({length: 4}).map((_, index) => (
          <View key={index} className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="mr-3">
                <Skeleton width={40} height={40} borderRadius={8} />
              </View>
              <View>
                <View className="mb-1">
                  <Skeleton width={100} height={16} borderRadius={4} />
                </View>
                <Skeleton width={80} height={12} borderRadius={4} />
              </View>
            </View>
            <View className="items-end">
              <View className="mb-1">
                <Skeleton width={60} height={20} borderRadius={4} />
              </View>
              <Skeleton width={80} height={12} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const TargetAchievementSkeleton =  ()=>{
  return(
      <View className="px-3 mb-2">
        <Skeleton width={screenWidth - 40} height={100} borderRadius={8} />
      </View>
  );
};
export const MonthlyTargetAchievementSkeleton =  ()=>{
  return(
      <View className="mb-2">
        <Skeleton width={screenWidth - 40} height={150} borderRadius={8} />
      </View>
  );
};


export const DashboardSkeleton = () => {
  return(
    <View className="pt-3">
      <View className='px-3'>
      <Skeleton width={screenWidth - 20} height={40} borderRadius={8}  />
      </View>
      <DashboardSalesData />
      <View className="my-3 px-3">
        <DashboardBannerSkeleton />
      </View>
      <TargetVsAchievementSkeleton />
      <ActivationPerformanceSkeleton />
      <ASEDataSkeleton />
      <PartnerAnalyticsSkeleton />
    </View>
  )
}
