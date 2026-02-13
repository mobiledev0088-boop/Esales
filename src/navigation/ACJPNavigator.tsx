
import Index from "../screens/app/APAC/ACJP";
import Dashboard_Partner from "../screens/app/APAC/ACJP/Dashboard/Dashboard_Partner";
import TargetSummarySalesPerformance from "../screens/app/APAC/ACJP/Dashboard/TargetSummarySalesPerformance";
import AppPermissions from "../screens/app/ASIN/User/AppPermissions/AppPermissions";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const screens = [
  {name: 'Index', component: Index},
  {name: 'AppPermissions', component: AppPermissions},
  {name: 'TargetSummarySalesPerformance', component: TargetSummarySalesPerformance},
  {name: 'Dashboard_Partner', component: Dashboard_Partner},
  // dashbaord Screens
//   {name: 'TargetSummaryAPAC', component: TargetSummaryAPAC},
//   {name: 'DealerHitRate', component: DealerHitRate},
//   {name: 'TargetPartnerDashboard', component: TargetPartnerDashboard},
//   {name: 'ActPerformanceATID', component: ActPerformanceATID},
//   // Channel Map
//   {name: 'ChannelMapDealerInfo', component: ChannelMapDealerInfo},

//   //More Screens
//   {name: 'EDMInfo', component: EDMInfo},
//   {name: 'Promoter', component: Promoter},
//   {name: 'PromoterUpload', component: PromoterUpload},
//   {name: 'SelloutInfo', component: SelloutInfo},
//   {name: 'ProductInfo', component: ProductInfo},
//   {name: 'ProductDescription', component: ProductDescription},
//   // Notification Screen
//   {name: 'Notification', component: Notification},
//   {name: 'ScanSN', component: ScanSN},
];
export const ACJPNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screens.map(({ name, component }) => (
            <Stack.Screen key={name} name={name} component={component} />
        ))}
    </Stack.Navigator>
);