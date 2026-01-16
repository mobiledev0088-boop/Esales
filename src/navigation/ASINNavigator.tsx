import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Index from '../screens/app/ASIN';
import ChangePassword from '../screens/app/ASIN/User/ChangePassword/ChangePassword';
import ProductInfo from '../screens/app/ASIN/More/ProductInfo/ProductInfo';
import ProductComparison from '../screens/app/ASIN/More/ProductInfo/ProductComparison';
import EDMInfo from '../screens/app/ASIN/More/EDMInfo/EDMInfo';
import Feedback from '../screens/app/ASIN/Feedback/Feedback';
import AddFeedback from '../screens/app/ASIN/Feedback/AddFeedback';
import FeedbackDetails from '../screens/app/ASIN/Feedback/FeedbackDetails';
import ActivatedDetails from '../screens/app/ASIN/More/ActivatedDetails/ActivatedDetails';
import ScanSN from '../screens/app/ASIN/ScanSN/ScanSN';
import SpotLightVideos from '../screens/app/ASIN/More/SpotLightVideos/SpotLightVideos';
import ProductDescription from '../screens/app/ASIN/More/ProductInfo/ProductDescription';
import CreditLimit from '../screens/app/ASIN/More/CreditLimit/CreditLimit';
import PartnersCreditLimit from '../screens/app/ASIN/More/CreditLimit/PartnersCreditLimit';
import PartnerCreditLimitDetails from '../screens/app/ASIN/More/CreditLimit/PartnerCreditLimitDetails';
import ASEIncentive from '../screens/app/ASIN/More/Incentive/ASEIncentive';
import ClaimInfo from '../screens/app/ASIN/Claim/ClaimInfo';
import LMSList_HO from '../screens/app/ASIN/More/LMS/LMSList_HO';
import ClaimApplicationDetails from '../screens/app/ASIN/Claim/ClaimApplicationDetails';
import ClaimInfoPartner from '../screens/app/ASIN/Claim/ClaimInfoPartner';
import ChannelMap from '../screens/app/ASIN/More/ChannelMap/ChannelMap';
import ChannelMapALPFinance from '../screens/app/ASIN/More/ChannelMap/ChannelMapALPFinance';
import ChannelMapAddAGP from '../screens/app/ASIN/More/ChannelMap/ChanelMapAGP/ChannelMapAddAGP';
import ChannelFriendlyClaimListHO from '../screens/app/ASIN/More/ChannelFriendly/ChannelFriendlyClaimListHO';
import ChannelFriendlyPartnerClaimInfo from '../screens/app/ASIN/More/ChannelFriendly/ChannelFriendlyPartnerClaimInfo';
import ChannelFriendlyClaimView from '../screens/app/ASIN/More/ChannelFriendly/ChannelFriendlyClaimView';
import ChannelFriendlyClaimListALP from '../screens/app/ASIN/More/ChannelFriendly/ChannelFriendlyClaimListALP';
import ChannelFriendlyClaimViewALP from '../screens/app/ASIN/More/ChannelFriendly/ChannelFriendlyClaimViewALP';
import Notification from '../screens/app/ASIN/Notification/Notification';
import ChannelFriendlyClaimListPartner from '../screens/app/ASIN/More/ChannelFriendly/ChannelFriendlyClaimListPartner';
import StandPOSM from '../screens/app/ASIN/More/StandPOSM/StandPOSM';
import Banners from '../screens/app/ASIN/Others/Banners';
import AddNewStandPOSM from '../screens/app/ASIN/More/StandPOSM/AddNewStandPOSM';
import ActPerformanceBranchWise from '../screens/app/ASIN/Reports/ActPerformanceBranchWise';
import TargetSummary from '../screens/app/ASIN/Reports/TargetSummary';
import DemoPartners from '../screens/app/ASIN/Demo/DemoPartners';
import ShopExpansion from '../screens/app/ASIN/More/ShopExpansion/ShopExpansion';
import StoreDetails from '../screens/app/ASIN/More/ShopExpansion/StoreDetails';
import VerticalASE_HO from '../screens/app/ASIN/Reports/VerticalASE_HO';
import TargetSummaryAMBranch from '../screens/app/ASIN/Reports/TargetSummaryAMBranch';
import TargetPartnerDashboard from '../screens/app/ASIN/Dashboard/TargetPartnerDashboard';
import UploadDemoData from '../screens/app/ASIN/Demo/UploadDemoData';
import AddRollingFunnel from '../screens/app/ASIN/Commercial/RollingFunnel/AddRollingFunnel';
import Attendance from '../screens/app/ASIN/User/Attendance/Attendance';
import AppPermissions from '../screens/app/ASIN/User/AppPermissions/AppPermissions';
import ChannelMapEditAGP from '../screens/app/ASIN/More/ChannelMap/ChanelMapAGP/ChannelMapEditAGP';
import ChannelFriendlyClaimsUpload from '../screens/app/ASIN/More/ChannelFriendly/ChannelFriendlyClaimsUpload';
import Attendance_HO from '../screens/app/ASIN/User/Attendance/Attendance_HO';
import UploadGalleryReview from '../screens/app/ASIN/More/ShopExpansion/GalleryReview/UploadGalleryReview';

type Screen = {
  name: string;
  component: React.ComponentType<any>;
};

const Stack = createNativeStackNavigator();

const screens: Screen[] = [
  // Drawer Screen
  {name: 'Index', component: Index},
  {name: 'ChangePassword', component: ChangePassword},
  {name: 'Attendance', component: Attendance},
  {name: 'Attendance_HO', component: Attendance_HO},
  {name: 'AppPermissions', component: AppPermissions},
  // Dashboard Screens
  {name: 'ScanSN', component: ScanSN},
  {name: 'TargetPartnerDashboard', component: TargetPartnerDashboard},
  // Demo Screens
  {name: 'DemoPartners', component: DemoPartners},
  {name: 'UploadDemoData', component: UploadDemoData},
  // Claim Screens
  {name: 'ClaimInfo', component: ClaimInfo},
  {name: 'ClaimApplicationDetails', component: ClaimApplicationDetails},
  {name: 'ClaimInfoPartner', component: ClaimInfoPartner},
  // More Screens
  {name: 'ActivatedDetails', component: ActivatedDetails},
  {name: 'EDMInfo', component: EDMInfo},
  {name: 'ProductInfo', component: ProductInfo},
  {name: 'ProductDescription', component: ProductDescription},
  {name: 'ProductComparison', component: ProductComparison},
  {name: 'SpotLightVideos', component: SpotLightVideos},
  {name: 'CreditLimit', component: CreditLimit},
  {name: 'PartnersCreditLimit', component: PartnersCreditLimit},
  {name: 'PartnerCreditLimitDetails', component: PartnerCreditLimitDetails},
  {name: 'ASEIncentive', component: ASEIncentive},
  {name: 'LMSList_HO', component: LMSList_HO},
  {name: 'ChannelMap', component: ChannelMap},
  {name: 'ChannelMapALPFinance', component: ChannelMapALPFinance},
  {name: 'ChannelMapAddAGP', component: ChannelMapAddAGP},
  {name: 'ChannelMapEditAGP', component: ChannelMapEditAGP},
  {name: 'ChannelFriendlyClaimListHO', component: ChannelFriendlyClaimListHO},
  {
    name: 'ChannelFriendlyClaimListPartner',
    component: ChannelFriendlyClaimListPartner,
  },
  {name: 'ChannelFriendlyClaimsUpload', component: ChannelFriendlyClaimsUpload},
  {name: 'ChannelFriendlyClaimListALP', component: ChannelFriendlyClaimListALP},
  {name: 'ChannelFriendlyClaimViewALP', component: ChannelFriendlyClaimViewALP},
  {
    name: 'ChannelFriendlyPartnerClaimInfo',
    component: ChannelFriendlyPartnerClaimInfo,
  },
  {name: 'ChannelFriendlyClaimView', component: ChannelFriendlyClaimView},
  {name: 'StandPOSM', component: StandPOSM},
  {name: 'AddNewStandPOSM', component: AddNewStandPOSM},
  {name: 'ShopExpansion', component: ShopExpansion},
  {name: 'StoreDetails', component: StoreDetails},
  {name: 'UploadGalleryReview', component: UploadGalleryReview},

  // Notification Screen
  {name: 'Notification', component: Notification},
  // Feedback Screens
  {name: 'Feedback', component: Feedback},
  {name: 'AddFeedback', component: AddFeedback},
  {name: 'FeedbackDetails', component: FeedbackDetails},
  //Reposts Screens
  {name: 'ActPerformanceBranchWise', component: ActPerformanceBranchWise},
  {name: 'TargetSummary', component: TargetSummary},
  {name: 'VerticalASE_HO', component: VerticalASE_HO},
  {name: 'TargetSummaryAMBranch', component: TargetSummaryAMBranch},
  // Commercial Screens
  {name: 'AddRollingFunnel', component: AddRollingFunnel},
  //Other screens
  {name: 'Banners', component: Banners},
];

export const ASINNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    {screens.map(screen => (
      <Stack.Screen
        key={screen.name}
        name={screen.name}
        component={screen.component}
      />
    ))}
  </Stack.Navigator>
);
