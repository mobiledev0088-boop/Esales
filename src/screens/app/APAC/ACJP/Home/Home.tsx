import { useLoginStore } from '../../../../../stores/useLoginStore';
import { TabScreens } from '../../../../../types/navigation';
import AppLayout from '../../../../../components/layout/AppLayout';
import { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '../../../ASIN/Home/Home';
import { SheetManager } from 'react-native-actions-sheet';
import Dashboard from '../Dashboard/Dashboard';
import Account from '../../../ASIN/User/Account/Account';


const Tab = createBottomTabNavigator();

export default function Home() {
const userInfo = useLoginStore(state => state.userInfo);

  const getScreens = () => {
    const arr: TabScreens[] = [];
    arr.push({
      name: 'Dashboard',
      component: Dashboard,
      icon: 'bar-chart',
    });
    arr.push({
      name: 'Demo',
      component: Dashboard,
      icon: 'laptop',
      iconType: 'materialIcons',
    });
    arr.push({
      name: 'Claim',
      component: Dashboard,
      icon: 'dollar',
      iconType: 'fontAwesome',
    });
    arr.push({
      name: 'Account',
      component: Account,
      icon: 'person',
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
}