import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Index from "../screens/app/ASIN";
import ChangePassword from "../screens/app/ASIN/User/ChangePassword/ChangePassword";
import ProductInfo from "../screens/app/ASIN/More/ProductInfo/ProductInfo";
import EDMInfo from "../screens/app/ASIN/More/EDMInfo/EDMInfo";
import Feedback from "../screens/app/ASIN/Feedback/Feedback";
import AddFeedback from "../screens/app/ASIN/Feedback/AddFeedback";
import FeedbackDetails from "../screens/app/ASIN/Feedback/FeedbackDetails";
import ActivatedDetails from "../screens/app/ASIN/More/ActivatedDetails/ActivatedDetails";
import ScanSN from "../screens/app/ASIN/ScanSN/ScanSN";
import SpotLightVideos from "../screens/app/ASIN/More/SpotLightVideos/SpotLightVideos";
import ProductDescription from "../screens/app/ASIN/More/ProductInfo/ProductDescription";

const Stack = createNativeStackNavigator();

const screens = [
    { name: "Index", component: Index },
    { name: "ChangePassword", component:  ChangePassword},
    // Dashboard Screens
    { name: "ScanSN", component: ScanSN },
    // More Screens
    { name: "ActivatedDetails", component: ActivatedDetails },
    { name: "EDMInfo", component: EDMInfo },
    { name: "ProductInfo", component: ProductInfo },
    { name: "ProductDescription", component: ProductDescription },
    { name: "SpotLightVideos", component: SpotLightVideos },
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
