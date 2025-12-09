import { AppDropdownItem } from "../../../../../components/customs/AppDropdown";

export interface MasterTab {
  Header_Type: string;
  Total_Claim: string;
  Closed_Claim: string;
}

export interface ClaimInfoBranchWise {
  BranchName: string;
  Claim_Code: string;
  scheme_category_dropdown: string;
  Scheme_Category: string;
  ClaimAmount: number;
  India_Status: string;
  Claim_Status: string;
  Product_ID: string;
  Currency: string | null;
}

export interface SchemeCategory {
  Scheme_Category: string;
}

export interface ClaimDashboardData {
  MasterTab: MasterTab[];
  ClaimInfoBranchWise: ClaimInfoBranchWise[];
  SchemeCategory: SchemeCategory[];
}

export interface ClaimHeaderProps {
  data: MasterTab | null;
  isLoading: boolean;
  tabName: string;
  isDarkTheme: boolean;
  quarters: AppDropdownItem[];
  selectedQuarter: AppDropdownItem | null;
  setSelectedQuarter: (item: AppDropdownItem | null) => void;
}

export interface ClaimInfoListProps {
  tabName: string;
}

export interface SummaryMetricsProps {
  branchData: Array<{branchName: string; claims: ClaimInfoBranchWise[]}>;
  isDarkTheme: boolean;
}
export interface ClaimItemCardProps {
  item: ClaimInfoBranchWise;
  isDarkTheme: boolean;
  handleOpenViewMoreSheet: (item: ClaimInfoBranchWise) => void;
}
export interface BranchClaimSectionProps {
  branchName: string;
  claims: ClaimInfoBranchWise[];
  isDarkTheme: boolean;
  handleOpenViewMoreSheet: (item: ClaimInfoBranchWise) => void;
}

export interface BranchItemProps {
  item: {branchName: string; claims: ClaimInfoBranchWise[]};
  isDarkTheme: boolean;
}