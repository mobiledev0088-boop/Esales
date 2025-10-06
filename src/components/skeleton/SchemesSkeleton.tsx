import {View} from 'react-native';
import Skeleton from './skeleton';
import {screenWidth} from '../../utils/constant';

export default function SchemeSkeleton() {
  return (
    <View className="flex-1 px-4 py-4 gap-7">
      <Skeleton width={screenWidth - 32} height={45} borderRadius={8} />
      <Skeleton width={screenWidth - 32} height={100} borderRadius={8} />
      <Skeleton width={screenWidth - 32} height={35} borderRadius={8} />
      <View className="mt-4 gap-3">
        <Skeleton width={screenWidth - 32} height={200} borderRadius={8} />
        <Skeleton width={screenWidth - 32} height={200} borderRadius={8} />
        <Skeleton width={screenWidth - 32} height={200} borderRadius={8} />
        <Skeleton width={screenWidth - 32} height={200} borderRadius={8} />
      </View>
    </View>
  );
}
