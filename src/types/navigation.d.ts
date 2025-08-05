import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp as DNP } from '@react-navigation/drawer';

type AuthStackParamList = {
    Login: undefined;
    ForgotPassword: undefined;
};

type AppNavigationParamList = {
    Index: undefined;
    Home: undefined;
    More: undefined;
    ProductInfo: undefined;
    ChangePassword: undefined;
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