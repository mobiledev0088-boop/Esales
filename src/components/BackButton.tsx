import {TouchableOpacity, View} from 'react-native';
import Card from './Card';
import AppIcon from './customs/AppIcon';
import AppText from './customs/AppText';
import { twMerge } from 'tailwind-merge';

interface BackButtonProps {
  onPress: () => void;
  Title: string;
  SubTitle: string;
  className?: string;
}

export default function BackButton({onPress, Title, SubTitle,className}: BackButtonProps) {
  return (
    <View className={twMerge("absolute bottom-0 w-[95%] mx-3 bg-white", className)}>
      <Card
        className="mb-4 py-2 border border-slate-200 dark:border-slate-700 bg-error/10 dark:bg-primary-dark/20"
        noshadow>
        <TouchableOpacity
          onPress={onPress}
          className="flex-row items-center py-2"
          activeOpacity={0.7}>
          <View className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center mr-3">
            <AppIcon
              type="material-community"
              name="arrow-left"
              size={18}
              color="#3b82f6"
            />
          </View>
          <View className="flex-1">
            <AppText
              size="md"
              weight="bold"
              className="text-primary dark:text-primary-dark">
              {Title}
            </AppText>
            <AppText
              size="sm"
              weight="medium"
              className="text-primary dark:text-primary-dark">
              {SubTitle}
            </AppText>
          </View>
        </TouchableOpacity>
      </Card>
    </View>
  );
}