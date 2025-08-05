import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Index from "../screens/app/India";
import ChangePassword from "../screens/app/India/User/ChangePassword/ChangePassword";

const Stack = createNativeStackNavigator();

const screens = [
    { name: "Index", component: Index },
    { name: "ChangePassword", component:  ChangePassword},
]

export const ASINNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screens.map((screen) => (
            <Stack.Screen key={screen.name} name={screen.name} component={screen.component} />
        ))}
    </Stack.Navigator>
);
