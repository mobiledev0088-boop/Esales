import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Index from "../screens/app/India";
import ChangePassword from "../screens/app/India/User/ChangePassword/ChangePassword";
import ProductInfo from "../screens/app/India/More/ProductInfo/ProductInfo";

const Stack = createNativeStackNavigator();

const screens = [
    { name: "Index", component: Index },
    { name: "ChangePassword", component:  ChangePassword},
    { name: "ProductInfo", component: ProductInfo },
]

export const ASINNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screens.map((screen) => (
            <Stack.Screen key={screen.name} name={screen.name} component={screen.component} />
        ))}
    </Stack.Navigator>
);
