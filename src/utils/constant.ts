import { Dimensions, Platform } from "react-native";

export const isIOS = Platform.OS === 'ios';
export const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
export const utilColorKeys = [
    'utilColor1', 'utilColor2', 'utilColor3', 'utilColor4', 'utilColor5',
    'utilColor6', 'utilColor7', 'utilColor8', 'utilColor9', 'utilColor10',
] as const;


export const DASHBOARD = {
    TABS: {
        TOTAL: 'Total',
        CHANNEL: 'CHANNEL',
        ESHOP: 'ESHOP',
        LFR: 'LFR',
        ONLINE: 'ONLINE',
    }
}



export const ASUS = {
    BUSINESS_TYPES:{
        COMMERCIAL: 4,
    },
    APP_NAME: "Esales",
    PARTNER_TYPE: {
        AWP: 'AWP', // ASUS Wholesale Partner
        ASP: 'ASP', // ASUS Silver Partner
        ALP: 'ALP', // ASUS Loyal Partner
        AGP: 'AGP', // ASUS Gold Partner
        T3: 'T3Partner',
        END_CUSTOMER: 'End Customer',
    },
    Country:{
        ASIN: 'ASIN', // India
        ACJP: 'ACJP', // Japan
        TW: 'TW',   // Taiwan
    },
    ROLE_ID:{
        DIR_HOD_MAN: 1,
        HO_EMPLOYEES: 2,
        BSM: 3, // branch sales manager
        TN: 4,  // territory  manager
        SALES_EXE: 5,
        PARTNERS: 6,
        DISTRIBUTORS: 7,
        COUNTRY_HEAD: 9,
        SALES_REPS: 10,
        LFR_HO: 13,
        ONLINE_HO: 14,
        ESHOP_HO: 16,
        AM: 17, // Area Manager
        MIS: 18, // Management Information System
        ASE: 24, // Asus Solution Expert
        BPM: 25, // Branch Product Manager
        RSM: 26, // Regional Sales Manager
        COUNTRY_MANAGER: 27,
        DISTI_HO: 28,
        CHANNEL_MARKETING: 29,
    },
}