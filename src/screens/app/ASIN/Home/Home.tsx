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

import {ComponentType, useEffect, useMemo} from 'react';
import {
  NavigationHelpers,
  ParamListBase,
  TabNavigationState,
} from '@react-navigation/native';
import {Pressable, View} from 'react-native';
import {AppColors} from '../../../../config/theme';
import AppText from '../../../../components/customs/AppText';
import {SheetManager} from 'react-native-actions-sheet';
import AppIcon, {IconType} from '../../../../components/customs/AppIcon';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {ASUS} from '../../../../utils/constant';
import Dashboard_AM from '../Dashboard/Dashboard_AM';
import Dashboard_Partner from '../Dashboard/Dashboard_Partner';
import WOD from '../WOD/WOD';
import Demo_Partner from '../Demo/Demo_Partner';
import RollingFunnel from '../Commercial/RollingFunnel/RollingFunnel';
import PowerCalculator from '../Commercial/PowerCalculator/PowerCalculator';
import Account from '../User/Account/Account';
import BackgroundFetch from 'react-native-background-fetch';
import Dashboard_ASE from '../Dashboard/Dashboard_ASE';
interface TabScreens {
  name: string;
  component: ComponentType<any>;
  icon: string;
  // Optional icon type (library). If omitted, defaults to 'ionicons'
  iconType?: IconType;
  options?: BottomTabNavigationOptions;
  action?: () => void;
  params?: Record<string, any>;
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

    // Dashboard
    if (userInfo?.EMP_Btype === ASUS.BUSINESS_TYPES.COMMERCIAL) {
      // dashboard for  Rooling Funnel
      arr.push({
        name: 'Dashboard',
        component: RollingFunnel,
        icon: 'bar-chart',
      });
    } else {
      if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.AM) {
        arr.push({
          name: 'Dashboard',
          component: Dashboard_AM,
          icon: 'bar-chart',
        });
      } else if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.PARTNERS) {
        arr.push({
          name: 'Dashboard',
          component: Dashboard_Partner,
          icon: 'bar-chart',
        });
      } else if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.ASE) {
        arr.push({
          name: 'Dashboard',
          component: Dashboard_ASE,
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
        arr.push({name: 'Demo', component: Demo_Partner, icon: 'laptop'});
      } else if (
        userInfo?.EMP_RoleId !== ASUS.ROLE_ID.DISTRIBUTORS &&
        userInfo?.EMP_RoleId !== ASUS.ROLE_ID.DISTI_HO &&
        userInfo?.EMP_RoleId !== ASUS.ROLE_ID.ESHOP_HO
      ) {
        // Demo for DISTRIBUTORS and Disti HO and ESHOP HO
        arr.push({
          name: 'Demo',
          component: Demo,
          icon: 'laptop',
          iconType: 'materialIcons',
        });
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
      arr.push({
        name: 'Account',
        component: Account,
        icon: 'person-circle',
        params: {noHeader: true},
      });
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

    // power Calculator
    if (userInfo?.EMP_Btype === ASUS.BUSINESS_TYPES.COMMERCIAL) {
      arr.push({
        name: 'Power Calculator',
        component: PowerCalculator,
        icon: 'calculator',
      });
    }

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
    <View className="flex-row justify-around items-center bg-lightBg-surface dark:bg-darkBg-surface py-3">
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
