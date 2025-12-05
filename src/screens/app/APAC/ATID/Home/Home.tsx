import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {MyTabBarProps, TabScreens} from '../../../../../types/navigation';
import {useMemo} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import {Pressable, View} from 'react-native';
import {AppColors} from '../../../../../config/theme';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import Dashboard from '../Dashboard/Dashboard';
import {SheetManager} from 'react-native-actions-sheet';
import ChannelMap from '../ChannelMap/ChannelMap';

const Tab = createBottomTabNavigator();

const Home: React.FC = () => {
  const userInfo = useLoginStore(state => state.userInfo);

  const getScreens = () => {
    const arr: TabScreens[] = [];
    arr.push({
      name: 'Dashboard',
      component: Dashboard,
      icon: 'bar-chart',
    });
    arr.push({
      name: 'Channel Map',
      component: ChannelMap, 
      icon: 'map',
    });
    arr.push({
      name: 'More',
      component: Dashboard, // Placeholder component
      icon: 'ellipsis-horizontal',
      action: () => SheetManager.show('MoreSheet'),
    });
    return arr;
  };
  const TabScreens: TabScreens[] = useMemo(() => getScreens(), [userInfo]);

  return (
    <AppLayout isDashboard>
      <Tab.Navigator
        screenOptions={{headerShown: false, tabBarHideOnKeyboard: true}}
        tabBar={props => <CustomTabBar {...props} TabScreens={TabScreens} />}>
        {TabScreens.map(screen => (
          <Tab.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
            initialParams={screen.params}
          />
        ))}
      </Tab.Navigator>
    </AppLayout>
  );
};

const CustomTabBar: React.FC<MyTabBarProps> = ({
  state,
  navigation,
  TabScreens,
}) => {
  return (
    <View className="flex-row justify-around items-center bg-lightBg-base dark:bg-darkBg-base border-t border-gray-200 py-3">
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const screen = TabScreens.find(s => s.name === route.name);
        const icon = screen?.icon || 'circle';
        const iconType: TabScreens['iconType'] = screen?.iconType ?? 'ionicons';

        const onPress = () => {
          // Handle custom actions (like More button)
          if (screen?.action) {
            screen.action();
            return;
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Only append -outline for ionicons set; otherwise keep the same icon name
        const iconName = isFocused
          ? icon
          : iconType === 'ionicons' || iconType === 'material-community'
            ? `${icon}-outline`
            : icon;
        const iconColor = isFocused ? AppColors.tabSelected : '#95a5a6';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center">
            <AppIcon
              type={iconType}
              name={iconName}
              size={22}
              color={iconColor}
            />
            <AppText
              size="sm"
              className={`${isFocused ? 'text-primary font-bold' : 'text-gray-400'}`}>
              {route.name}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

export default Home;
