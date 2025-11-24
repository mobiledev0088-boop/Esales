import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DrawerNavigationProp as DNP} from '@react-navigation/drawer';
import {FeedbackItem} from '../screens/app/ASIN/Feedback/component';
import { AppDropdownItem } from '../components/customs/AppDropdown';

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
  // Demo Screen
  DemoPartners: {partners: Array<any>; yearQtr: string};
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
  ASEIncentive: undefined;
  LMSList_HO: undefined;
  ChannelMap: undefined;
  ChannelMapALPFinance: {
    financerDataALP?: any;
    ALPpartnerCode: string;
  };
  ChannelMapAddAGP: undefined;
  ChannelFriendlyClaimListHO: undefined;
  ChannelFriendlyClaimListPartner: undefined;
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
  // Account Screen
  ChangePassword: undefined;
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
  TargetSummary: {masterTab: string; Quarter: string, button: 'seemore' | 'disti',wise: 'POD' | 'SELL'};
  VerticalASE_HO: {Year: string; Month: string; AlpType: string};
  TargetSummaryAMBranch: {Year: string; Month: string; masterTab: string};
  // Commercial Screens
  AddRollingFunnel: undefined;
  // Other Screens
  Banners: {Banner_Group_SeqNum: string};
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

export interface APIResponse<T> {
  DashboardData: {
    Status: boolean;
    Datainfo: T;
    Message?: string;
  };
}
