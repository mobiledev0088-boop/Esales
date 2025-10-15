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
import CreditLimit from "../screens/app/ASIN/More/CreditLimit/CreditLimit";
import PartnersCreditLimit from "../screens/app/ASIN/More/CreditLimit/PartnersCreditLimit";
import PartnerCreditLimitDetails from "../screens/app/ASIN/More/CreditLimit/PartnerCreditLimitDetails";
import ASEIncentive from "../screens/app/ASIN/More/Incentive/ASEIncentive";
import ClaimInfo from "../screens/app/ASIN/Claim/ClaimInfo";
import LMSList_HO from "../screens/app/ASIN/More/LMS/LMSList_HO";
import ClaimApplicationDetails from "../screens/app/ASIN/Claim/ClaimApplicationDetails";
import ClaimInfoPartner from "../screens/app/ASIN/Claim/ClaimInfoPartner";

type Screen = {
    name: string;
    component: React.ComponentType<any>;
}

const Stack = createNativeStackNavigator();

const screens: Screen[] = [
    // Drawer Screen
    { name: "Index", component: Index },
    { name: "ChangePassword", component:  ChangePassword},
    // Dashboard Screens
    { name: "ScanSN", component: ScanSN },
    // Claim Screens
    { name: "ClaimInfo", component: ClaimInfo },
    { name: "ClaimApplicationDetails", component: ClaimApplicationDetails },
    { name: "ClaimInfoPartner", component: ClaimInfoPartner },
    // More Screens
    { name: "ActivatedDetails", component: ActivatedDetails },
    { name: "EDMInfo", component: EDMInfo },
    { name: "ProductInfo", component: ProductInfo },
    { name: "ProductDescription", component: ProductDescription },
    { name: "SpotLightVideos", component: SpotLightVideos },
    { name: "CreditLimit", component: CreditLimit },
    { name: "PartnersCreditLimit", component: PartnersCreditLimit },
    { name: "PartnerCreditLimitDetails", component: PartnerCreditLimitDetails },
    { name: "ASEIncentive", component: ASEIncentive },
    { name: "LMSList_HO", component: LMSList_HO },
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
