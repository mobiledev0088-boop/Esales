import AppText from '../../../../components/customs/AppText';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {View, Pressable} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {
  NavigationHelpers,
  ParamListBase,
  TabNavigationState,
} from '@react-navigation/native';
import {TabScreens} from './Home';
import {AppColors} from '../../../../config/theme';
import { SheetManager } from 'react-native-actions-sheet';

type MyTabBarProps = BottomTabBarProps & {
  state: TabNavigationState<ParamListBase>;
  navigation: NavigationHelpers<ParamListBase>;
};

const CustomTabBar: React.FC<MyTabBarProps> = ({state, navigation}) => {
  return (
    <View className="flex-row justify-around items-center bg-white dark:bg-[#2c334d] border-t border-gray-200 py-3">
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const screen = TabScreens.find(s => s.name === route.name);
        const icon = screen?.icon || 'circle';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const IconComponent = route.name === 'P.Status' ? MIcon : Icon;
        const iconName = isFocused ? icon : `${icon}-outline`;
        const iconColor = isFocused ? AppColors.primary : '#95a5a6';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center">
            <IconComponent name={iconName} size={22} color={iconColor} />
            <AppText
              size="sm"
              className={` ${isFocused ? 'text-primary font-bold' : 'text-gray-400'}`}>
              {route.name}
            </AppText>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() =>  SheetManager.show('MoreSheet')}
        className="flex-1 items-center justify-center">
        <Icon name={'ellipsis-horizontal'} size={22} color={'#95a5a6'} />
        <AppText size="sm" className={`${'text-gray-400'}`}>
          More
        </AppText>
      </Pressable>
    </View>
  );
};

export default CustomTabBar;
