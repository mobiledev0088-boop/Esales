// src/navigation/RootNavigator.tsx
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useLoginStore} from '../stores/useLoginStore';

import {ASUS} from '../utils/constant';
import { ASINNavigator } from './ASINNavigator';
import { ATIDNavigator } from './ATIDNavigator';
import { ACMYNavigator } from './ACMYNavigator';
import { ACSGNavigator } from './ACSGNavigator';
import { ACJPNavigator } from './ACJPNavigator';
import { TWNavigator } from './TWNavigator';
import { AuthNavigator } from './AuthNavigator';

const Stack = createNativeStackNavigator();

const countryRoutes: Record<string, {name: string; component: any}> = {
  [ASUS.COUNTRIES.ASIN]: {name: 'IndiaApp', component: ASINNavigator},
  [ASUS.COUNTRIES.ATID]: {name: 'IndonesiaApp', component: ATIDNavigator},
  [ASUS.COUNTRIES.ACMY]: {name: 'MalaysiaApp', component: ACMYNavigator},
  [ASUS.COUNTRIES.ACSG]: {name: 'SingaporeApp', component: ACSGNavigator},
  [ASUS.COUNTRIES.ACJP]: {name: 'JapanApp', component: ACJPNavigator},
  [ASUS.COUNTRIES.TW]:   {name: 'TaiwanApp', component: TWNavigator},
};

export default function RootNavigator() {
  const {isAutoLogin, userInfo} = useLoginStore();
  const country = userInfo?.EMP_CountryID;
  const selectedRoute = countryRoutes[country];
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!isAutoLogin ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : selectedRoute ? (
        <Stack.Screen
          name={selectedRoute.name}
          component={selectedRoute.component}
        />
      ) : null}
    </Stack.Navigator>
  );
}