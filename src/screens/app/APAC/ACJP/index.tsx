import {createDrawerNavigator} from '@react-navigation/drawer';
import CustomDrawerContent from '../../../../components/drawer/CustomDrawerContent';
import Account from '../../ASIN/User/Account/Account';
import Reports from '../ATID/Reports/Reports';
import Home from './Home/Home';

const Drawer = createDrawerNavigator();

const Index = () => {
  const drawerScreens = [
    {name: 'Home', component: Home},
    {name: 'Account', component: Account},
    // {name: 'AuditReport', component: AuditReport},
    {name: 'SchemePPACT', component: Reports},
    {name: 'PriceList', component: Reports},
    {name: 'DemoProgramLetter', component: Reports},
    {name: 'EndCustomerRelated', component: Reports},
    {name: 'MarketingMaterial', component: Reports},
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
