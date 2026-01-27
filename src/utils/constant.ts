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
} as const;


export const ASUS = {
    APP_NAME: "Esales",
    BUSINESS_TYPES:{
        COMMERCIAL: 4,
    },
    COUNTRIES: {
        ASIN: 'ASIN',
        ATID: 'ATID',
        ACMY: 'ACMY',
        ACSG: 'ACSG',
        ACJP: 'ACJP',
        TW: 'TW',
    },
    PARTNER_TYPE: {
        T2:{
            AWP: 'AWP', // ASUS Wholesale Partner
            AES: 'AES', // ASUS Enterprise Solution
        },
        T3:{
            AGP: 'AGP', // ASUS Gold Partner,
            ASP: 'ASP', // ASUS Silver Partner
            T3: 'T3Partner',
        },
        END_CUSTOMER: 'EndCustomer',
    },
    ROLE_ID:{
        DIR_HOD_MAN: 1,
        HO_EMPLOYEES: 2,
        BSM: 3, // branch sales manager
        TM: 4,  // territory  manager
        // SALES_EXE: 5, // by Defalut New Account gets this Role
        PARTNERS: 6 ,
        DISTRIBUTORS: 7,
        COUNTRY_HEAD: 9,
        SALES_REPS: 10, // CSE
        LFR_HO: 13,
        ONLINE_HO: 14,
        ESHOP_HO: 16,
        AM: 17, // Area Manager
        SA:19, // Sales Admin Team
        ASE: 24, // Asus Solution Expert
        BPM: 25, // Branch Product Manager
        RSM: 26, // Regional Sales Manager
        DISTI_HO: 28,
        CHANNEL_MARKETING: 29,
    },
} as const;


// Login Credentials for Testing

// ASIN

// Arnold_Su           AS1300044        DIR_HOD_MAN       qbaoandadia520!   
// Ashish_Devasi       KN2500069        HO_EMPLOYEES      @ITSMbpm07072025
// Vishwanath_Niranjan KN1400081        BSM               Asus@#20241234567
// Varun_Sharma        KN2300037        TM                Varunasus@123456
// Darshini_k          KN1300028        SALES_EXE         izb_g2vXL2Z6wro
// vrp                 KN2400032        DISTRIBUTORS      Vrptlasusindia@1234
// Test                ASIN000001       PARTNERS          Testing@1234567890   AGP Partner
// Supreme Computers   ASIN001139       PARTNERS          SupremeAsus@1234!    AWP Partner
// Univell Computers   ASIN005195       PARTNERS          X9g(dtH#0_6!4q2      AES Partner
// S. R. Infotech.     ASIN001198       PARTNERS          )PFSSx6AoPGkM%%      AES Parent Partner
// Computech           27CEVPS2243Q1ZG  PARTNERS          Yz1Gqrk5nBI(!RN      T3 Partner
// Silver Systems      ASIN001016       PARTNERS          Silversystem*1234    MFR Partner
// NewGlobalComputers  ASIN001083       PARTNERS          Global.new@77777     SFR Partner
// AmoghaComputerNeeds ASIN005283       PARTNERS          AmoghaComputer@12345 ROG Partner
// DATAMATION          ASIN001472       PARTNERS          Datamation@12345     RLFR Partner
// Eric_Ou             AA2100079        COUNTRY_HEAD      LQ6CqZViTnk3ntu
// Shanka_n            KN1900027        SALES_REPS        shan#9804519915
// paresh_kapadia      KN2000003        LFR_HO            odZv77o9YtBDzeK
// tejaswini_bhomkar   KN2100010        ONLINE_HO         Nq(rVrhe$NW7@09    
// sagar_bandekar      KN2100034        ESHOP_HO          S@toshiasus161992
// vishwa_bhagwat      KN2300008        AM                VB2025#8000032as
// Tulumani_Ahmed      IN1705A0159      ASE               Tulumani@9864585391
// vishwanath_niranjan KN1400081        BPM               Asus@#20241234567
// Vishal_Srivastava   KN1800039        RSM               Vishal@123456789
// rahul_sangani       KN2100022        DISTI_HO          Asus@7977399605
// pawan_sisodia       KN1500116        CHANNEL_MARKETING #gqUB(impYKN6ni
// Mayur_S             KN2500031        COMMERCIAL(BSM)   Mr8@089949190088


// APAC (Singapore)

// Marco_Tim          SG2500001   HO_EMPLOYEES      Asus@12345678


// Demo LFR => Demo but Only LFR
// Demo AM => Demo but Only Retailers & LFR
// Demo AWP => Demo_Partner but Group Data 
// Demo partner => Demo_Partner with All Partners
// Demo ASE => Demo_Partner with All Partners