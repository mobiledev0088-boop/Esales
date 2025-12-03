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
  IsEditable_Id: number;
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

export interface FormData {
  // Page 1
  ownerDivision: string;
  accountName: string;
  indirectAccount: string;
  newIndirectPartnerName: string;
  newIndirectPartnerGST: string;
  endCustomer: string;
  newEndCustomerName: string;
  endCustomerTam: string;
  category: string;
  mainIndustry: string;
  standardIndustry: string;
  stage: string;
  winRate: string;
  // Page 2
  productLine: string;
  quotedProduct: string;
  product: string;
  newProduct: string;
  qty: string;
  description: string;
  CRADDate: Date | undefined;
}
export interface ValidationErrors {
  [key: string]: string;
}
