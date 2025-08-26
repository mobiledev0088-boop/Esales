import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp as DNP } from '@react-navigation/drawer';
import { FeedbackItem } from '../screens/app/ASIN/Feedback/component';

type AuthStackParamList = {
    Login: undefined;
    ForgotPassword: undefined;
};

type AppNavigationParamList = {
    Index: undefined;
    // Dashboard Screen
    Home: undefined;
    ScanSN: undefined;
    More: undefined;
    // More Option Screen
    ProductInfo: undefined;
    EDMInfo: undefined;
    // Account Screen
    ChangePassword: undefined;
    // Feedback Screens
    Feedback: undefined;
    AddFeedback: undefined;
    FeedbackDetails: { data: FeedbackItem };
}

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavigationProp = NativeStackNavigationProp<AppNavigationParamList>;


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