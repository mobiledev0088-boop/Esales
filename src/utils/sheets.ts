import {registerSheet, SheetDefinition} from 'react-native-actions-sheet';
import MoreSheet from '../screens/app/ASIN/More/MoreSheet';
import ConfirmationSheet from '../components/ConfirmationSheet';
import DatePickerSheet from '../components/DatePickerSheet';
import {FilterActionSheet} from '../screens/app/ASIN/More/ActivatedDetails/component';
import DemoFilterSheet from '../screens/app/ASIN/Demo/DemoFilterSheet';
import ClaimFilterSheet from '../screens/app/ASIN/Claim/ClaimFilterSheet';
import WODFilterSheet from '../screens/app/ASIN/WOD/WODFilterSheet';
import SchemeInfoSheet from '../screens/app/ASIN/More/ProductInfo/SchemeInfoSheet';
import ActivationFilterSheet from '../screens/app/ASIN/Reports/ActivationFilterSheet';
import {
  DemoDetailsSheet,
  DemoROISheet,
  PartnerDetailsSheet,
} from '../screens/app/ASIN/Demo/DemoPartners';
import {LMSBranchDetailsSheet} from '../screens/app/ASIN/More/LMS/LMSList_HO';
import {PartnerDemoDetailsSheet} from '../screens/app/ASIN/Demo/DemoAWPPartners';
import ClosingDetailsSheet from '../screens/app/ASIN/Commercial/RollingFunnel/ClosingDetailsSheet';
import {RollingFunnelData} from '../screens/app/ASIN/Commercial/RollingFunnel/types';
import RollingFilterSheet from '../screens/app/ASIN/Commercial/RollingFunnel/RollingFilterSheet';
import PromoterFilterSheet from '../screens/app/APAC/ATID/More/Promoter/PromoterFilterSheet';
import ChannelMapFilterSheet from '../screens/app/APAC/ATID/ChannelMap/ChannelMapFilterSheet';
import ClaimFilterSheetAPAC from '../screens/app/APAC/ATID/Claim/ClaimFilterSheet';
import ClaimViewMoreSheet from '../screens/app/APAC/ATID/Claim/ClaimViewMoreSheet';
import DemoFilterSheetAPAC from '../screens/app/APAC/ATID/Demo/DemoFilterSheetAPAC';
import DropdownActionSheet from '../screens/app/ASIN/More/ChannelMap/ChanelMapAGP/DropdownActionSheet';
import SourceOptionSheet from '../components/SourceOptionSheet';
import DiscontinuedProductsSheet from '../screens/app/ASIN/Demo/DiscontinuedProductsSheet';

registerSheet('MoreSheet', MoreSheet);
registerSheet('ConfirmationSheet', ConfirmationSheet);
registerSheet('DatePickerSheet', DatePickerSheet);
registerSheet('FilterActionSheet', FilterActionSheet);
registerSheet('DemoFilterSheet', DemoFilterSheet);
registerSheet('ClaimFilterSheet', ClaimFilterSheet);
registerSheet('WODFilterSheet', WODFilterSheet);
registerSheet('SchemeInfoSheet', SchemeInfoSheet);
registerSheet('SourceOptionSheet', SourceOptionSheet);
registerSheet('ActivationFilterSheet', ActivationFilterSheet);
registerSheet('PartnerDetailsSheet', PartnerDetailsSheet);
registerSheet('DemoROISheet', DemoROISheet);
registerSheet('DemoDetailsSheet', DemoDetailsSheet);
registerSheet('LMSBranchDetailsSheet', LMSBranchDetailsSheet);
registerSheet('PartnerDemoDetailsSheet', PartnerDemoDetailsSheet);
registerSheet('ClosingDetailsSheet', ClosingDetailsSheet);
registerSheet('RollingFilterSheet', RollingFilterSheet);
registerSheet('PromoterFilterSheet', PromoterFilterSheet);
registerSheet('ChannelMapFilterSheet', ChannelMapFilterSheet);
registerSheet('ClaimFilterSheetAPAC', ClaimFilterSheetAPAC);
registerSheet('ClaimViewMoreSheet', ClaimViewMoreSheet);
registerSheet('DemoFilterSheetAPAC', DemoFilterSheetAPAC);
registerSheet('DropdownActionSheet', DropdownActionSheet);
registerSheet('DiscontinuedProductsSheet', DiscontinuedProductsSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    MoreSheet: SheetDefinition;
    ConfirmationSheet: SheetDefinition;
    DatePickerSheet: SheetDefinition;
    FilterActionSheet: SheetDefinition;
    DemoFilterSheet: SheetDefinition;
    ClaimFilterSheet: SheetDefinition;
    WODFilterSheet: SheetDefinition;
    SchemeInfoSheet: SheetDefinition;
    ActivationFilterSheet: SheetDefinition;
    PartnerDetailsSheet: SheetDefinition<{
      payload: {partner: any; yearQtr: string};
    }>;
    DemoROISheet: SheetDefinition<{
      payload: {partner: any};
    }>;
    LMSBranchDetailsSheet: SheetDefinition<{
      payload: {
        awp: {
          AWPCode: string;
          AWPName: string;
          BranchName: string;
          AGPRequestCnt?: number;
          QtyRequestCnt?: number;
        } | null;
        yearQtr: string;
      };
    }>;
    ClosingDetailsSheet: SheetDefinition<{
      payload: {
        item: RollingFunnelData;
        onSubmit: () => void;
      };
    }>;
    RollingFilterSheet: SheetDefinition<{
      payload: {
        // Define any payload properties if needed
      };
    }>;
    PromoterFilterSheet: SheetDefinition;
    ChannelMapFilterSheet: SheetDefinition;
    ClaimFilterSheetAPAC: SheetDefinition;
    DemoFilterSheetAPAC: SheetDefinition;
  }
}

export {};
