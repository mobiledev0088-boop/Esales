
import AppLayout from '../../../../components/layout/AppLayout';
import {
    BottomTabNavigationOptions,
    createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import Dashboard from '../Dashboard/Dashboard';
import Demo from '../Demo/Demo';
import Claim from '../Claim/Claim';
import Schemes from '../Schemes/Schemes';
import PStatus from '../PStatus/PStatus';
import CustomTabBar from './CustomTabBar';

import { View } from 'react-native';
import { ComponentType } from 'react';
import { SheetManager } from 'react-native-actions-sheet';


export interface TabScreens {
    name: string;
    component: ComponentType<any>;
    icon: string;
    options?: BottomTabNavigationOptions;
    action?: () => void;
}


export const TabScreens: TabScreens[] = [
    { name: 'Dashboard', component: Dashboard, icon: 'bar-chart' },
    { name: 'Demo', component: Demo, icon: 'laptop' },
    { name: 'Claim', component: Claim, icon: 'pricetag' },
    { name: 'Schemes', component: Schemes, icon: 'calendar' },
    { name: 'P.Status', component: PStatus, icon: 'timeline-clock' },

];

const Tab = createBottomTabNavigator();

const Home: React.FC = () => {
    return (
        <AppLayout isDashboard>
            <Tab.Navigator
                screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
                tabBar={(props) => <CustomTabBar {...props} />}
            >
                {TabScreens.map((screen) => (
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

export default Home;
