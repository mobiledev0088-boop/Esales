import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Index from "../screens/app/India";
import ChangePassword from "../screens/app/India/User/ChangePassword/ChangePassword";
import ProductInfo from "../screens/app/India/More/ProductInfo/ProductInfo";
import EDMInfo from "../screens/app/India/More/EDMInfo/EDMInfo";
import ScanSN from "../screens/app/India/Dashboard/ScanSN/ScanSN";
import Feedback from "../screens/app/India/Feedback/Feedback";
import AddFeedback from "../screens/app/India/Feedback/AddFeedback";
import FeedbackDetails from "../screens/app/India/Feedback/FeedbackDetails";

const Stack = createNativeStackNavigator();

const screens = [
    { name: "Index", component: Index },
    { name: "ChangePassword", component:  ChangePassword},
    { name: "ProductInfo", component: ProductInfo },
    { name: "EDMInfo", component: EDMInfo },
    { name: "ScanSN", component: ScanSN },
    
    // Feedback Screens
    { name: "Feedback", component: Feedback },
    { name: "AddFeedback", component: AddFeedback },
    { name: "FeedbackDetails", component: FeedbackDetails }
]

export const ASINNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screens.map((screen) => (
            <Stack.Screen key={screen.name} name={screen.name} component={screen.component} />
        ))}
    </Stack.Navigator>
);
