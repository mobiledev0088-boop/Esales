import Index from "../screens/app/APAC/ACSG";
import ForgotPassword from "../screens/auth/ForgotPassword";
import Login from "../screens/auth/Login";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const screens = [
    { name: "Index", component: Index },
]

export const ACSGNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screens.map((screen) => (
            <Stack.Screen key={screen.name} name={screen.name} component={screen.component} />
        ))}
    </Stack.Navigator>
);
