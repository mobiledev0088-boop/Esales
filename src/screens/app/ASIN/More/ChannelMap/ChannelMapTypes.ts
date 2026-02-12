import { IconType } from "../../../../../components/customs/AppIcon";
import { FormField } from "./ChanelMapAGP/FormSection";

export interface BrandConfig {
  name: string;
  color: string;
}

export interface ALPListItem {
  PM_Name: string;
  PM_Code: string;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface ALPDetails {
  //Shop Info
  PM_Name: string;
  PM_Code: string;
  PM_eID: string;
  PM_VATCode: string;
  PQT_PartnerType: string;
  PQT_L2: string;
  PM_Address: string;
  PM_Person: string;
  PM_Email: string;
  PM_Contact: string;
  // ASUS Info
  Loc_Branch: string;
  Loc_State: string;
  Loc_Territory: string;
  Loc_City: string;
  BH_Name: string;
  TM_Name: string;
  // Competition Info
  Competition_Type_ASUS: string;
  Competition_Num_ASUS: string;
  Competition_Type_HP: string;
  Competition_Num_HP: string;
  Competition_Type_DELL: string;
  Competition_Num_DELL: string;
  Competition_Type_LENOVO: string;
  Competition_Num_LENOVO: string;
  Competition_Type_ACER: string;
  Competition_Num_ACER: string;
  //Competition Info Monthly
  Monthly_TAM: string;
  Monthly_NB_Sales: string;
  Monthly_DTAIO_Sales: string;
  NB_Display_Units: string;
}

export interface ALPDetailsResponse {
  ALP_Info: ALPDetails[];
    Table1: any;
}

export interface ALPListResponse {
  ALP_List: ALPListItem[];
}
export interface AGPListResponse {
  AGP_List: AGPListItem[];
}
export interface LFRListResponse {
  LFR_List: AGPListItem[]; // same as AGPListItem
}
export interface AGPDetailsResponse {
  AGP_Info: AGPDetails[];
  Table1: any[];
}
export interface LFRDetailsResponse {
  LFR_Info: LFRDetails[];
}

export interface AGPDetails {
  // Shop Info
  ACM_ID: string;
  Company_Name: string;
  Shop_Name: string;
  ShopAddress: string;
  ShopLandLine: string;
  Pin_Code: number;
  Owner_Name: string;
  Owner_Number: number;
  Owner_Email: string;
  GST_No: string;
  KeyPersonName: string;
  KeyPersonDesignation: string;
  KeyPersonNumber: number;
  KeyPersonMailID: string;
  // ASUS Info
  ASIN_Code: string;
  Business_Type: string;
  Branch_Name: string;
  Territory: string;
  Territory_Manager: string;
  CSE_Code: string;
  Customize_Branding: string;
  ChannelMapCode: string;
  ECommerceId: string | null;
  Pkiosk: string | null;
  Pkiosk_Cnt: string | null;
  ROG_Kiosk: string | null;
  ROG_Kiosk_Cnt: string | null;
  Pkiosk_ROG_Kiosk: string | null;
  IsActive: string;
  chainStore: string;
  IsLoginCreated: string;
  // Competition Info Brand
  Competition_Type_ASUS: string;
  Competition_Num_ASUS: number;
  Competition_Type_HP: string;
  Competition_Num_HP: number;
  Competition_Type_DELL: string;
  Competition_Num_DELL: number;
  Competition_Type_LENOVA: string;
  Competition_Num_LENOVA: number;
  Competition_Type_ACER: string;
  Competition_Num_ACER: number;
  Competition_Type_MSI: string;
  Competition_Num_MSI: number;
  Competition_Type_Samsung: string;
  Competition_Num_Samsung: number;

  // Competition Info Consumer Desktop
  CDT_Type_Asus: string;
  ACM_CDTNumASUS: number;
  CDT_Type_HP: string;
  ACM_CDTNumHP: number;
  CDT_Type_Dell: string;
  ACM_CDTNumDELL: number;
  CDT_Type_Lenovo: string;
  ACM_CDTNumLENOVO: number;
  CDT_Type_Acer: string;
  ACM_CDTNumACER: number;
  // Competition Info Consumer Desktop Monthly
  CDT_Desktop_Business_Type: string;
  CDT_Mode_Of_Business: string;
  CDTMonthlyNumber: number;
  CDTCommercialMonthlyNumber: number;
  CDT_White_Brand_Monthly_No: number;
  CDT_Num_Deal_Ratio: number;
  // Competition Info Gaming Desktop
  GDT_Type_Asus: string;
  ACM_GDTNumASUS: number;
  GDT_Type_HP: string;
  ACM_GDTNumHP: number;
  GDT_Type_Dell: string;
  ACM_GDTNumDELL: number;
  GDT_Type_Lenovo: string;
  ACM_GDTNumLENOVO: number;
  GDT_Type_Acer: string;
  ACM_GDTNumACER: number;
  // Competition Info Gaming Desktop Monthly
  GDT_Monthly_Number: number;
  GDT_Monthly_DIY: number;
  // Competition Info All-in-One Desktop
  AIO_Type_Asus: string;
  ACM_AIONumASUS: number;
  AIO_Type_HP: string;
  ACM_AIONumHP: number;
  AIO_Type_Dell: string;
  ACM_AIONumDELL: number;
  AIO_Type_Lenovo: string;
  ACM_AIONumLENOVO: number;
  AIO_Type_Acer: string;
  ACM_AIONumACER: number;
  // Competition Info All-in-One Desktop Monthly
  AIO_Desktop_Business_Type: string;
  AIO_Mode_Of_Business: string;
  AIOMonthlyNumber: number;
  AIOCommercialMonthlyNumber: number;
  AIO_Num_Deal_Ratio: number;
  // Monthly Sales Info
  Monthly_NB_Sales: string;
  Monthly_DTAIO_Sales: string;
  NB_Display_Units: string;
}

export interface AGPListItem {
  ACM_GST_No: string;
  ACM_ShopName: string;
  ACM_BranchName: string;
}

export interface LFRDetails {
  // Shop Info
  Shop_Name: string;
  Company_Name: string;
  ShopAddress: string;
  Pin_Code: number;
  Owner_Number: number;
  Owner_Email: string;
  KeyPersonName: string;
  KeyPersonDesignation: string;
  KeyPersonNumber: number;
  KeyPersonMailID: string;
  // ASUS Info
  Store_Code: string;
  Business_Type: string;
  Branch_Name: string;
  Territory: string;
  Territory_Manager: string;
  Partner_Type: string;
  AM_Name: string;
  CSE_Name: string | null;
  Task_Owner_Name: string;
  ChannelMapCode: string;
  ECommerceId: string;
  PSIS: string;
  Pkiosk: string | null;
  ROG_Kiosk: string | null;
  Pkiosk_ROG_Kiosk: string | null;
  Pkiosk_Cnt: number | null;
  ROG_Kiosk_Cnt: number | null;
  IsActive: string;
  IsLoginCreated: string;
  // Competition Info Brand
  Competition_Type_ASUS: string | null;
  Competition_Num_ASUS: number | null;
  Competition_Type_HP: string | null;
  Competition_Num_HP: number | null;
  Competition_Type_DELL: string | null;
  Competition_Num_DELL: number | null;
  Competition_Type_LENOVA: string | null;
  Competition_Num_LENOVA: number | null;
  Competition_Type_ACER: string | null;
  Competition_Num_ACER: number | null;
  Competition_Type_MSI: string | null;
  Competition_Num_MSI: number | null;
  // Monthly Sales Info
  Monthly_NB_Sales: number | string | null;
  Monthly_DTAIO_Sales: string | null;
  NB_Display_Units: number | null;
}

export interface AGPListItem {
  ACM_GST_No: string;
  ACM_ShopName: string;
  ACM_BranchName: string;
}

export interface ChannelMapInfoProps {
  shopFields: FormField[];
  shopInfo: any;
  updateShopInfo: (key: string, value: string) => void;
  validationErrors: any;
  openAccordion: string;
  handleAccordionToggle: (key: string) => void;
  asusFields: FormField[];
  asusInfo: any;
  updateAsusInfo: (key: string, value: string) => void;
  brandCompFields: FormField[];
  brandCompetition: any;
  updateBrandCompetition: (key: string, value: string) => void;
  consumerDTFields: FormField[];
  consumerDTCompetition: any;
  updateConsumerDTCompetition: (key: string, value: string) => void;
  gamingDTFields: FormField[];
  gamingDTCompetition: any;
  updateGamingDTCompetition: (key: string, value: string) => void;
  aioFields: FormField[];
  AIOCompetition: any;
  updateAIOCompetition: (key: string, value: string) => void;
  monthlyFields: FormField[];
  monthlyData: any;
  updateMonthlyData: (key: string, value: string) => void;
  handleSubmit: () => void; 
}

export interface FinanceMapProps {
  financeFields: FormField[];
  financeInfo: Record<string, any>;
  updateFinanceInfo: (key: string, value: any) => void;
  reFinanceInfo: Record<string, any>;
  updateReFinanceInfo: (key: string, value: any) => void;
  validationErrors: Record<string, any>;
  apiData: any;
  handleSubmit: () => void;
  // openAccordion: string;
  // handleAccordionToggle: (sectionId: string) => void;
}

export interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
  iconType?: IconType;
  isPhoneNumber?: boolean;
}

export interface SectionHeaderProps {
  title: string;
  icon: string;
  iconType?: IconType;
}

export interface BasicInfoProps {
  alpDetails: ALPDetails;
}

export interface CompetitionInfoProps {
  alpDetails: ALPDetails;
}

export interface BrandData {
  name: string;
  type: string;
  number: string;
  color: string;
}

export interface AGPBasicInfoProps {
  agpDetails: AGPDetails;
  showEditButton?: boolean;
  handlePress?: () => void;
}

export interface AGPCompetitionInfoProps {
  agpDetails: AGPDetails;
}


// LFR Info Components
export interface LFRBasicInfoProps {
  lfrDetails: LFRDetails;
}

export interface LFRCompetitionInfoProps {
  lfrDetails: LFRDetails;
}

export interface FinancerData {
  BajajActivationStatus: Boolean;
  BajajActivation_Remarks: string;
  BajajDealerCode: string;
  BajajHOAccpetenceRemark: string;
  BajajHOAccpetenceStatus: Boolean;

  HDBActivationStatus: Boolean;
  HDBActivation_Remarks: string;
  HDBDealerCode: string;
  HDBHOAccpetenceRemark: string;
  HDBHOAccpetenceStatus: Boolean;

  HDFCActivationStatus: Boolean;
  HDFCActivation_Remarks: string;
  HDFCDealerCode: string;
  HDFCHOAccpetenceRemark: string;
  HDFCHOAccpetenceStatus: Boolean;

  KotakActivationStatus: Boolean;
  KotakActivation_Remarks: string;
  KotakDealerCode: string;
  KotakHOAccpetenceRemark: string;
  KotakHOAccpetenceStatus: Boolean;

  PaytmActivationStatus: Boolean;
  PaytmActivation_Remarks: string;
  PaytmDealerCode: string;
  PaytmHOAccpetenceRemark: string;
  PaytmHOAccpetenceStatus: Boolean;

  PinelabsActivationStatus: Boolean;
  PinelabsActivation_Remarks: string;
  PinelabsDealerCode: string;
  PinelabsHOAccpetenceRemark: string;
  PinelabsHOAccpetenceStatus: Boolean;

  SHopseActivationStatus: Boolean;
  ShopseDealerCode: string;
  SHopseActivation_Remarks: string;
  SHopseHOAccpetenceRemark: string;
  SHopseHOAccpetenceStatus: Boolean;
}