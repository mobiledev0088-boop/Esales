import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DrawerNavigationProp as DNP} from '@react-navigation/drawer';
import {FeedbackItem} from '../screens/app/ASIN/Feedback/component';

type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type AppNavigationParamList = {
  Index: undefined;
  // Dashboard Screen
  Home: undefined;
  ScanSN: undefined;
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
    Scheme_Month:string,
    SchemeCategory:string,
    PartnerType:string,
    MonthAPI:string,
    Distributor:string,
    ApplicationNo:string,
    Claim_Code:string,
    caseId:string,
    Amount_Props:string,
    ClaimStatus:string
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
  SpotLightVideos: undefined;
  CreditLimit: undefined;
  PartnersCreditLimit: {distributorId: string};
  PartnerCreditLimitDetails: {partner: any};
  ASEIncentive: undefined;
  LMSList_HO: undefined;
  // Account Screen
  ChangePassword: undefined;
  // Feedback Screens
  Feedback: undefined;
  AddFeedback: undefined;
  FeedbackDetails: {data: FeedbackItem};
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
