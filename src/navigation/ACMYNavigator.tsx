import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Index from '../screens/app/APAC/ATID';
import EDMInfo from '../screens/app/ASIN/More/EDMInfo/EDMInfo';
import Promoter from '../screens/app/APAC/ATID/More/Promoter/Promoter';
import PromoterUpload from '../screens/app/APAC/ATID/More/Promoter/PromoterUpload';
import SelloutInfo from '../screens/app/APAC/ATID/More/Promoter/SelloutInfo';
import ProductInfo from '../screens/app/APAC/ATID/More/ProductInfo/ProductInfo';
import ProductDescription from '../screens/app/APAC/ATID/More/ProductInfo/ProductDescription';
import ChannelMapDealerInfo from '../screens/app/APAC/ATID/ChannelMap/ChannelMapDealerInfo';
import TargetSummaryAPAC from '../screens/app/ASIN/Reports/APAC/TargetSummaryAPAC';
import DealerHitRate from '../screens/app/ASIN/Reports/APAC/DealerHitRate';
import TargetPartnerDashboard from '../screens/app/ASIN/Reports/APAC/TargetPartnerDashboard';
import Notification from '../screens/app/ASIN/Notification/Notification';
import ScanSN from '../screens/app/ASIN/ScanSN/ScanSN';

const Stack = createNativeStackNavigator();

const screens = [
  {name: 'Index', component: Index},
  // dashbaord Screens
  {name: 'TargetSummaryAPAC', component: TargetSummaryAPAC},
  {name: 'DealerHitRate', component: DealerHitRate},
  {name: 'TargetPartnerDashboard', component: TargetPartnerDashboard},
  // Channel Map
  {name: 'ChannelMapDealerInfo', component: ChannelMapDealerInfo},

  //More Screens
  {name: 'EDMInfo', component: EDMInfo},
  {name: 'Promoter', component: Promoter},
  {name: 'PromoterUpload', component: PromoterUpload},
  {name: 'SelloutInfo', component: SelloutInfo},
  {name: 'ProductInfo', component: ProductInfo},
  {name: 'ProductDescription', component: ProductDescription},
  // Notification Screen
  {name: 'Notification', component: Notification},
  {name: 'ScanSN', component: ScanSN},
];

export const ACMYNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    {screens.map(({name, component}) => (
      <Stack.Screen key={name} name={name} component={component} />
    ))}
  </Stack.Navigator>
);
