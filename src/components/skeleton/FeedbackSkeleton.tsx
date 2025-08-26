
import {View} from 'react-native';
import Card from '../Card';
import Skeleton from './skeleton';

export default function FeedbackSkeleton(){
  const rowClass = 'flex-row justify-between items-center mb-2';
  return (
    <View className="px-3 pt-5 gap-4">
      {[1, 2, 3, 4].map(item => (
        <Card key={item}>
          <View className={rowClass}>
            <Skeleton width={150} height={20} borderRadius={6} />
            <Skeleton width={100} height={18} borderRadius={6} />
          </View>
          <Skeleton width={120} height={16} borderRadius={6} />
          <View className={rowClass}>
            <View>
              <Skeleton width={80} height={14} borderRadius={6} />
              <Skeleton width={140} height={18} borderRadius={6} /> 
            </View>
            <Skeleton width={90} height={22} borderRadius={12} />
          </View>
          <View className={rowClass}>
            <Skeleton width={80} height={30} borderRadius={20} />
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </Card>
      ))}
    </View>
  );
};
