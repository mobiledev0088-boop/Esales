import {View, Pressable} from 'react-native';
import AppLayout from '../../../../../../components/layout/AppLayout';
import Card from '../../../../../../components/Card';
import AppText from '../../../../../../components/customs/AppText';
import AppIcon from '../../../../../../components/customs/AppIcon';
import { useThemeStore } from '../../../../../../stores/useThemeStore';
import { AppNavigationProp } from '../../../../../../types/navigation';
import { useNavigation } from '@react-navigation/native';

type OptionType = 'RETAIL' | 'DEALER_WITH_DISCOUNT' | 'DEALER_WITHOUT_DISCOUNT';

type OptionItem = {
  type: 'e' | 'w' | 'o';
  key: OptionType;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
};

const options: OptionItem[] = [
  {
    type: 'e',
    key: 'RETAIL',
    title: 'Sellout to End User \n(Retail)',
    description: 'Record retail sellout to end customers',
    icon: 'shopping-bag',
    iconColor: '#4F46E5',
    bgColor: 'bg-secondary/15 dark:bg-secondary-dark/20',
  },
  {
    type: 'w',
    key: 'DEALER_WITH_DISCOUNT',
    title: 'Sellout to Dealer \n(With Discount)',
    description: 'Apply eligible discount for dealer sellout',
    icon: 'percent',
    iconColor: '#10B981',
    bgColor: 'bg-success/15 dark:bg-success/20',
  },
  {
        type: 'o',
    key: 'DEALER_WITHOUT_DISCOUNT',
    title: 'Sellout to Dealer \n(Without Discount)',
    description: 'Record dealer sellout without discount',
    icon: 'briefcase',
    iconColor: '#F59E0B',
    bgColor: 'bg-warning/15 dark:bg-warning/20',
  },
];

function MenuOption({
  item,
  isDarkMode,
  onPress,
}: {
  item: OptionItem;
  isDarkMode: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80" >
      <Card className="flex-row items-center gap-4 p-5 rounded-3xl">
        <View
          className={`h-12 w-12 rounded-2xl items-center justify-center ${item.bgColor}`}>
          <AppIcon
            name={item.icon}
            type="feather"
            size={22}
            color={item.iconColor}
          />
        </View>
        {/* Text Block */}
        <View className="flex-1">
          <AppText size="lg" weight="semibold" className="text-primary dark:text-white">
            {item.title}
          </AppText>
          <AppText 
            size="sm"
            weight="regular"
            className="text-gray-600 dark:text-gray-400 mt-1"
          >
            {item.description}
          </AppText>
        </View>
        {/* Chevron */}
        <AppIcon
          name="chevron-right"
          type="feather"
          size={22}
          color={isDarkMode ? '#9CA3AF' : '#6B7280'}
        />
      </Card>
    </Pressable>
  );
}

export default function Promoter() {
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');
  const navigation = useNavigation<AppNavigationProp>();
  const handleSelect = (type:'e' | 'w' | 'o')=> navigation.navigate('PromoterUpload',{type});

  return (
    <AppLayout needBack needPadding title="Sellout Upload">
      <View className="mt-5 gap-4">
        {options.map(item => (
          <MenuOption
            key={item.key}
            item={item}
            isDarkMode={isDarkMode}
            onPress={() => handleSelect(item.type)}
          />
        ))}
      </View>
    </AppLayout>
  );
}