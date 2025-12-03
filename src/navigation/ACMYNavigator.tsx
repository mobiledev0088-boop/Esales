
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Index from "../screens/app/APAC/ATID";

const Stack = createNativeStackNavigator();

const screens = [
    { name: "Index", component: Index },
]

export const ACMYNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screens.map(({ name, component }) => (
            <Stack.Screen key={name} name={name} component={component} />
        ))}
    </Stack.Navigator>
);
