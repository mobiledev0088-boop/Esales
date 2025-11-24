export interface RollingFunnelData {
  Funnel_Type: string;
  End_Customer: string;
  End_Customer_CompanyID: string | null;
  Quantity: number;
  Direct_Account: string;
  Indirect_Account: string;
  Product_Line: string;
  Model_Name: string;
  CRAD_Date: string;
  Stage: string;
  Opportunity_Number: string;
  Last_Update_Opportunity_Date: string;
}

export interface RollingFunnelFilter {
  selectedFunneltype?: string;
  searchedItem?: string;
  qtySortValue?: string;
  selectedStage?: number | null;
  selectedProductLine?: number | null;
  selectedBSMname?: string;
  selectedAMname?: string;
  selectedCradStartDate?: string;
  selectedCradEndDate?: string;
}
