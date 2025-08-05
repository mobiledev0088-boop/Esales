import ForgotPassword from "../screens/auth/ForgotPassword";
import Login from "../screens/auth/Login";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const AuthScreens = [
    { name: "Login", component: Login },
    { name: "ForgotPassword", component: ForgotPassword },
]

export const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {AuthScreens.map(({ name, component }) => (
            <Stack.Screen key={name} name={name} component={component} />
        ))}
    </Stack.Navigator>
);