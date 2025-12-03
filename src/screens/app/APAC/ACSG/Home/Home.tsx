
import { ComponentType, useMemo } from 'react'
import AppLayout from '../../../../../components/layout/AppLayout'
import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconType } from '../../../../../components/customs/AppIcon';
import { useLoginStore } from '../../../../../stores/useLoginStore';
import { ASUS } from '../../../../../utils/constant';
import Dashboard from '../Dashboard/Dashboard';

interface TabScreens {
  name: string;
  component: ComponentType<any>;
  icon: string;
  iconType?: IconType
  options?: BottomTabNavigationOptions;
  action?: () => void;
  params?: Record<string, any>;
}

const Tab = createBottomTabNavigator();

export default function Home() {
      const userInfo = useLoginStore(state => state.userInfo);

  const getScreens = () => {
    const arr: TabScreens[] = [];
    arr.push({
      name: 'Dashboard',
      component: Dashboard,
      icon: 'home',
    });
    return arr;
  };

     const TabScreens: TabScreens[] = useMemo(() => getScreens(), [userInfo]);
  return (
       <AppLayout isDashboard>
         <Tab.Navigator
           screenOptions={{headerShown: false, tabBarHideOnKeyboard: true, }}
        //    tabBar={props => <CustomTabBar {...props} TabScreens={TabScreens} />}
           >
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
  )
}