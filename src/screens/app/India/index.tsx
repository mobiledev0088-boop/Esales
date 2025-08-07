import CustomDrawerContent from '../../../components/drawer/CustomDrawerContent';
import Home from './Home/Home';
import Account from './User/Account/Account';

import {createDrawerNavigator} from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

const Index = () => {
  const drawerScreens = [
    {name: 'Home', component: Home},
    {name: 'Account', component: Account},
    {name: 'AuditReport', component: Home},
    {name: 'SchemePPACT', component: Home},
    {name: 'PriceList', component: Home},
    {name: 'DemoProgramLetter', component: Home},
    {name: 'EndCustomerRelated', component: Home},
    {name: 'MarketingMaterial', component: Home},
  ];

  return (
    <>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {width: 300},
        }}>
        {drawerScreens.map(screen => (
          <Drawer.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
          />
        ))}
      </Drawer.Navigator>
    </>
  );
};

export default Index;
