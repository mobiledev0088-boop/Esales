import AppLayout from '../../../../components/layout/AppLayout';
import {
  BottomTabBarProps,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import Dashboard from '../Dashboard/Dashboard';
import Demo from '../Demo/Demo';
import Claim from '../Claim/Claim';
import Schemes from '../Schemes/Schemes';

import {ComponentType, useMemo} from 'react';
import {NavigationHelpers,ParamListBase,TabNavigationState} from '@react-navigation/native';
import {Pressable, View} from 'react-native';
import {AppColors} from '../../../../config/theme';
import AppText from '../../../../components/customs/AppText';
import {SheetManager} from 'react-native-actions-sheet';
import AppIcon from '../../../../components/customs/AppIcon';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {ASUS} from '../../../../utils/constant';
import Dashboard_AM from '../Dashboard/Dashboard_AM';
import Dashboard_Partner from '../Dashboard/Dashboard_Partner';
import WOD from '../WOD/WOD';

interface TabScreens {
  name: string;
  component: ComponentType<any>;
  icon: string;
  // Optional icon type (library). If omitted, defaults to 'ionicons'
  iconType?:
    | 'feather'
    | 'entypo'
    | 'material-community'
    | 'antdesign'
    | 'ionicons'
    | 'fontAwesome'
    | 'materialIcons'
    | 'SimpleLineIcons';
  options?: BottomTabNavigationOptions;
  action?: () => void;
}

type MyTabBarProps = BottomTabBarProps & {
  state: TabNavigationState<ParamListBase>;
  navigation: NavigationHelpers<ParamListBase>;
  TabScreens: TabScreens[];
};

const Tab = createBottomTabNavigator();

const Home: React.FC = () => {
  const userInfo = useLoginStore(state => state.userInfo);

  const getScreens = () => {
    const arr: TabScreens[] = [];
    if (userInfo?.EMP_Btype === ASUS.BUSINESS_TYPES.COMMERCIAL) {
      // dashboard for  Rooling Funnel
    } else {
      if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.AM) {
        arr.push({
          name: 'Dashboard',
          component: Dashboard_AM,
          icon: 'bar-chart',
        });
      } else if (
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.PARTNERS ||
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.ASE
      ) {
        arr.push({
          name: 'Dashboard',
          component: Dashboard_Partner,
          icon: 'bar-chart',
        });
      } else {
        arr.push({name: 'Dashboard', component: Dashboard, icon: 'bar-chart'});
      }
    }
    // Demo
    if (userInfo?.EMP_Btype !== ASUS.BUSINESS_TYPES.COMMERCIAL) {
      if (
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.LFR_HO ||
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.ONLINE_HO
      ) {
        // Demo for LFR HO and ONLINE HO
      } else if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.ASE) {
        // Demo for Asus Solution Expert
      } else if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.AM) {
        // Demo for Area Manager
      } else if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.PARTNERS) {
        // Demo for PARTNERS
      } else if (
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.PARTNERS &&
        userInfo?.EMP_Type === ASUS.PARTNER_TYPE.T2.AWP
      ) {
        // Demo for PARTNERS
      } else if (
        userInfo?.EMP_RoleId !== ASUS.ROLE_ID.DISTRIBUTORS &&
        userInfo?.EMP_RoleId !== ASUS.ROLE_ID.DISTI_HO &&
        userInfo?.EMP_RoleId !== ASUS.ROLE_ID.ESHOP_HO
      ) {
        // Demo for DISTRIBUTORS and Disti HO and ESHOP HO
        arr.push({name: 'Demo', component: Demo, icon: 'laptop'});
      }
    }
    // Claim
    if (userInfo?.EMP_Btype !== ASUS.BUSINESS_TYPES.COMMERCIAL) {
      if (
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.ESHOP_HO ||
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.AM ||
        userInfo?.EMP_RoleId === ASUS.ROLE_ID.ASE
      ) {
        // No Claim for this Roles
      } else {
        // For all other roles
        arr.push({
          name: 'Claim',
          component: Claim,
          icon: 'currency-rupee',
          iconType: 'materialIcons',
        });
      }
    }
    // schemes
    if (
      userInfo?.EMP_Btype == ASUS.BUSINESS_TYPES.COMMERCIAL ||
      userInfo?.EMP_RoleId === ASUS.ROLE_ID.DISTI_HO ||
      userInfo?.EMP_RoleId === ASUS.ROLE_ID.DISTRIBUTORS
    ) {
      // Account
    } else {
      // schemes
      arr.push({name: 'Schemes', component: Schemes, icon: 'calendar'});
    }
    // P.Status
    if (
      (userInfo?.EMP_Btype !== ASUS.BUSINESS_TYPES.COMMERCIAL &&
        userInfo?.EMP_RoleId !== ASUS.ROLE_ID.PARTNERS) ||
      userInfo?.EMP_Type === ASUS.PARTNER_TYPE.T2.AWP
    ) {
      arr.push({
        name: 'W.O.D',
        component: WOD,
        icon: 'account-clock',
        iconType: 'material-community',
      });
    }
    // more
    if (userInfo?.EMP_Btype !== ASUS.BUSINESS_TYPES.COMMERCIAL) {
      // more
      arr.push({
        name: 'More',
        component: Demo,
        icon: 'ellipsis-horizontal',
        // More uses default ionicons
        action: () => SheetManager.show('MoreSheet'),
      });
    }
    if (userInfo?.EMP_Btype === ASUS.BUSINESS_TYPES.COMMERCIAL) {
      // power Calculator
    }

    return arr;
  };
  const TabScreens: TabScreens[] = useMemo(() => getScreens(), [userInfo]);

  return (
    <AppLayout isDashboard>
      <Tab.Navigator
        screenOptions={{headerShown: false, tabBarHideOnKeyboard: true, }}
        tabBar={props => <CustomTabBar {...props} TabScreens={TabScreens} />}>
        {TabScreens.map(screen => (
          <Tab.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
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
    <View className="flex-row justify-around items-center bg-white dark:bg-[#2c334d] border-t border-gray-200 py-3">
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
          : (iconType === 'ionicons' || iconType === 'material-community')
            ? `${icon}-outline`
            : icon;
        const iconColor = isFocused ? AppColors.primary : '#95a5a6';

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
