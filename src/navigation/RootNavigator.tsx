import { useLoginStore } from "../stores/useLoginStore";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from "./AuthNavigator";
import { ASINNavigator } from "./ASINNavigator";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const isAutoLogin = useLoginStore((state) => state.isAutoLogin);
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAutoLogin ? (
                <Stack.Screen name="Auth" component={AuthNavigator} />
            ) : (
                <Stack.Screen name="IndiaApp" component={ASINNavigator} />
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;

{/* <Stack.Navigator screenOptions={{ headerShown: false }}>
    {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
    ) : !region ? (
        <Stack.Screen name="RegionSelector" component={RegionSelector} />
    ) : region === 'india' ? (
        <Stack.Screen name="IndiaApp" component={IndiaNavigator} />
    ) : (
        <Stack.Screen name="JapanApp" component={JapanNavigator} />
    )} */}
// </Stack.Navigator>