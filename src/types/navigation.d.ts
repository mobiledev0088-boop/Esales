import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DrawerNavigationProp as DNP} from '@react-navigation/drawer';
import {FeedbackItem} from '../screens/app/ASIN/Feedback/component';
import { AppDropdownItem } from '../components/customs/AppDropdown';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationHelpers, ParamListBase, TabNavigationState } from '@react-navigation/native';
import { IconType } from '../components/customs/AppIcon';

type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type AppNavigationParamList = {
  Index: undefined;
  // Dashboard Screen
  Home: undefined;
  ScanSN: undefined;
  TargetPartnerDashboard: {partner: any};
  TargetASEDashboard: {partner: any};

  // Demo Screen
  DemoPartners: {partners: Array<any>; yearQtr: string,isROI?: boolean,tab?:string,stats?: any};
  UploadDemoData: undefined;
  // Claim Screen
  ClaimInfo: {
    SchemeCategory: string;
    ProductLine: string;
    Product_Line_Name: string;
    YearMonth: string;
    PartnerType: string;
    type: 'processed' | 'underProcess';
  };
  ClaimApplicationDetails: {
    Product_Line: string;
    Status_data: string;
    Scheme_Month: string;
    SchemeCategory: string;
    PartnerType: string;
    MonthAPI: string;
    Distributor: string;
    ApplicationNo: string;
    Claim_Code: string;
    caseId: string;
    Amount_Props: string;
    ClaimStatus: string;
  };
  ClaimInfoPartner: {
    Product_Line: string;
    SchemeCategory: string;
    PartnerType: string;
    MonthAPI: string;
    partnerCode: string;
    roleId: number;
    type: 'processed' | 'underProcess';
  };
  // WOD Screens
  WOD_Partners: {
    branchName: string;
    territoryName: string;
    tm_name: string;
    CSEName: string;
    data: any[];
    activeTab: number;
  };

  // More Option Screen
  More: undefined;
  ActivatedDetails: undefined;
  EDMInfo: undefined;
  ProductInfo: undefined;
  ProductDescription: {product: any};
  ProductComparison: {product1: any; product2: any};
  SpotLightVideos: undefined;
  CreditLimit: undefined;
  PartnersCreditLimit: {distributorId: string};
  PartnerCreditLimitDetails: {partner: any};
  ASEIncentive: {
    employeeCode?: string;
    employeeName?: string;
  };
  LMSList_HO: undefined;
  LMSListAWP: undefined;
  ChannelMap: {
    activeTab?: number;
    PartnerName?: string;
    PartnerCode?: string;
  };
  ChannelMapALPFinance: {
    financerDataALP?: any;
    ALPpartnerCode: string;
  };
  ChannelMapAddAGP: undefined;
  ChannelMapEditAGP: {
    // AGPpartnerCode: string;
    initialData: any;
  };
  ChannelFriendlyClaimListHO: undefined;
  ChannelFriendlyClaimListPartner: undefined;
  ChannelFriendlyClaimsUpload: undefined;
  ChannelFriendlyClaimListALP: undefined;
  ChannelFriendlyClaimViewALP: {
    data: any;
    yearQTR: string;
  };
  ChannelFriendlyPartnerClaimInfo: {
    partnerCode: string;
    yearQTR: string;
  };
  ChannelFriendlyClaimView: {data: any};
  StandPOSM: undefined;
  AddNewStandPOSM: undefined;
  ShopExpansion: undefined;
  StoreDetails: {PartnerCode: string; StoreType: string};
  UploadGalleryReview: {
    data: any;
    storeCode: string;
    referenceImages: any[];
  };
  MarketingDispatchTracker: undefined;
  // Account Screen
  ChangePassword: undefined;
  // Attendance Screen
  Attendance: {
    iChannelCode?: string;
    aseName?: string;
    branchName?: string;
  } | undefined;
  Attendance_HO: undefined;
  AppPermissions: undefined;
  // Notifications Screens
  Notification: undefined;
  // Feedback Screens
  Feedback: undefined;
  AddFeedback: undefined;
  FeedbackDetails: {data: FeedbackItem};
  // Reports Screens
  ActPerformanceBranchWise: {
    masterTab: string;
    StartDate: string;
    EndDate: string;
    Product_Category: string;
    Territory?: string;
  };
  ActPerformance: {
    [key: string]: any;
  };
  TargetSummary: {masterTab: string; Quarter: string, button: 'seemore' | 'disti',wise: 'POD' | 'SELL'};
  TargetSummaryPartner: {Year_Qtr:string; AlpType: string, Branch: string};
  TargetDemoPartner: {differentEmployeeCode: string};
  VerticalASE : {
    aseData: any;
  }
  VerticalASE_HO: {Year: string; Month: string; AlpType: string, Branch?: string, Territory?: string};
  TargetASE: {Year: string; Month: string; masterTab: string};
  TargetASETerritory: {Year: string; Month: string; masterTab: string, branchName: string};
  // Other Screens
  Banners: {Banner_Group_SeqNum: string};
  
  // Commercial Screens
  AddRollingFunnel: undefined;
  
  //APAC Screens
  TargetSummaryAPAC : {
    navigationFrom: 'seemore' | 'disti';
    buttonType: 'POD_Qty' | 'AGP_SellIn' | 'AGP_SellOut';
    YearQtr: string;
    masterTab: string;
  }
  ActPerformanceATID:  {
    [key: string]: any;
  };
  DealerHitRate : {BranchName : string};
  ChannelMapDealerInfo: {Dealer_Data: any};
  Promoter: undefined;
  PromoterUpload: {type: string};
  SelloutInfo: {
    type: string;
    PartnerCode: string;
    Year_Qtr: string;
    StartDate: string;
    EndDate: string;
  };
  TargetSummarySalesPerformance:{
    Year_Qtr: string;
    ALP: string;
    masterTabType: string;
  }
  Dashboard_Partner:{
    ALP: string;
    Year_Qtr: string;
    Partner_Code: string;
    Partner_Name: string;
  }
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavigationProp =
  NativeStackNavigationProp<AppNavigationParamList>;

type DrawerStackParamList = {
  Home: undefined;
  Account: undefined;
  AuditReport: undefined;
  SchemePPACT: undefined;
  PriceList: undefined;
  DemoProgramLetter: undefined;
  EndCustomerRelated: undefined;
  MarketingMaterial: undefined;
  SyncedDataInfo: undefined;
  ChangePassword: undefined;
  LogOut: undefined;
};

export type DrawerNavigationProp = DNP<DrawerStackParamList>;

export interface TabScreens {
  name: string;
  component: ComponentType<any>;
  icon: string;
  // Optional icon type (library). If omitted, defaults to 'ionicons'
  iconType?: IconType
  options?: BottomTabNavigationOptions;
  action?: () => void;
  params?: Record<string, any>;
}

export type MyTabBarProps = BottomTabBarProps & {
  state: TabNavigationState<ParamListBase>;
  navigation: NavigationHelpers<ParamListBase>;
  TabScreens: TabScreens[]
};

export interface APIResponse<T> {
  DashboardData: {
    Status: boolean;
    Datainfo: T;
    Message?: string;
  };
}
