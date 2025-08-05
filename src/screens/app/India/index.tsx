import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../../../components/drawer/CustomDrawerContent';

import Home from './Home/Home';
import Account from './User/Account/Account';
const Drawer = createDrawerNavigator();

const Index = () => {
  const drawerScreens = [
    { name: 'Home', component: Home },
    { name: 'Account', component: Account },
    { name: 'AuditReport', component: Home },
    { name: 'SchemePPACT', component: Home },
    { name: 'PriceList', component: Home },
    { name: 'DemoProgramLetter', component: Home },
    { name: 'EndCustomerRelated', component: Home },
    { name: 'MarketingMaterial', component: Home },
    { name: 'LogOut', component: Home },
  ];

  return (
    <Drawer.Navigator
      // initialRouteName="Home"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 300 },
      }}>
      {drawerScreens.map(screen => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
        />
      ))}
    </Drawer.Navigator>
  );
};

export default Index;
