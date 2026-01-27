import { AppDropdownItem } from "../components/customs/AppDropdown";
import { AppTextColorType } from "./customs";

// Dashboard related types
export interface SalesHeaderData {
  Qty_Achieved: string;
  Qty_Target: string;
}

export interface ProductCategoryData {
  Product_Category: string;
  Percent: number;
  Target_Qty:  number;
  Achieved_Qty:  number;
}

export interface TargetVsAchievementData {
  PODwise: ProductCategoryData[];
  SellThru: ProductCategoryData[];
}

export interface ActivationData {
  name: string;
  POD_Cnt?: string | number;
  ST_Cnt?: string | number;
  SO_Cnt?: string | number;
  Act_Cnt: string | number;
  NonAct_Cnt: string | number;
  Hit_Rate?: number;
  CSE_Name?: string;
  Partner_Type?: string;
}

export interface ActivationPerformanceData {
  Top5AGP?: ActivationData[];
  Top5ALP?: ActivationData[];
  Top5ASP?: ActivationData[];
  Top5Branch?: ActivationData[];
  Top5Disti?: ActivationData[];
  Top5Model?: ActivationData[];
}

export interface ASEData {
  Head_Cnt: string | number;
  Target: string | number;
  SellThru: string | number;
  SellOut: string | number;
}

export interface ASERelatedData {
  total: ASEData;
  channel: ASEData;
  lfr: ASEData;
}

export interface PartnerData {
  ALP: string;
  AGP: string;
  NON_ALP: string;
  T3: string;
}

export interface TableColumn {
  key: string;
  label: string;
  width: string;
  dataKey: keyof ActivationData;
  colorType: AppTextColorType;
}

export interface TabConfig {
  id: string;
  label: string;
  columns: TableColumn[];
}

export interface HeaderProps {
  selectedQuarter: AppDropdownItem | null;
  setSelectedQuarter: (item: AppDropdownItem | null) => void;
  quarters: AppDropdownItem[];
  salesData?: SalesHeaderData;
  tabName?: string;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}


export interface TargetVsAchievementProps {
  data: TargetVsAchievementData;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  tabName: string;
  quarter: string;
}

export interface ActivationPerformanceProps {
  tabs: string[];
  name: string;
  data: ActivationPerformanceData;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  quarter: string;
  handleSeeMore?: (data: any) => void;
}

export interface ASEDataProps {
  totalData: ASEData;
  channelData: ASEData;
  lfrData: ASEData;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  quarter: string;
  masterTab: string;
}

export interface PartnerAnalyticsProps {
  data: PartnerData;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export interface ErrorDisplayProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}
