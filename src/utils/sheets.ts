import {registerSheet, SheetDefinition} from 'react-native-actions-sheet';
import MoreSheet from '../screens/app/ASIN/More/MoreSheet';
import ConfirmationSheet from '../components/ConfirmationSheet';
import DatePickerSheet from '../components/DatePickerSheet';
import {FilterActionSheet} from '../screens/app/ASIN/More/ActivatedDetails/component';
import DemoFilterSheet from '../screens/app/ASIN/Demo/DemoFilterSheet';
import ClaimFilterSheet from '../screens/app/ASIN/Claim/ClaimFilterSheet';
import WODFilterSheet from '../screens/app/ASIN/WOD/WODFilterSheet';
import SchemeInfoSheet from '../components/SchemeInfoSheet';
import ActivationFilterSheet from '../screens/app/ASIN/Reports/ActivationFilterSheet';
import {
  DemoDetailsSheet,
  PartnerDetailsSheet,
} from '../screens/app/ASIN/Demo/DemoPartners';
import { LMSBranchDetailsSheet } from '../screens/app/ASIN/More/LMS/LMSList_HO';
import { PartnerDemoDetailsSheet } from '../screens/app/ASIN/Demo/Demo_Partner';
import ClosingDetailsSheet from '../screens/app/ASIN/Commercial/RollingFunnel/ClosingDetailsSheet';
import { RollingFunnelData } from '../screens/app/ASIN/Commercial/RollingFunnel/types';
import RollingFilterSheet from '../screens/app/ASIN/Commercial/RollingFunnel/RollingFilterSheet';
import PromoterFilterSheet from '../screens/app/APAC/ATID/More/Promoter/PromoterFilterSheet';
import ChannelMapFilterSheet from '../screens/app/APAC/ATID/ChannelMap/ChannelMapFilterSheet';
import ClaimFilterSheetAPAC from '../screens/app/APAC/ATID/Claim/ClaimFilterSheet';

registerSheet('MoreSheet', MoreSheet);
registerSheet('ConfirmationSheet', ConfirmationSheet);
registerSheet('DatePickerSheet', DatePickerSheet);
registerSheet('FilterActionSheet', FilterActionSheet);
registerSheet('DemoFilterSheet', DemoFilterSheet);
registerSheet('ClaimFilterSheet', ClaimFilterSheet);
registerSheet('WODFilterSheet', WODFilterSheet);
registerSheet('SchemeInfoSheet', SchemeInfoSheet);
registerSheet('ActivationFilterSheet', ActivationFilterSheet);
registerSheet('PartnerDetailsSheet', PartnerDetailsSheet);
registerSheet('DemoDetailsSheet', DemoDetailsSheet);
registerSheet('LMSBranchDetailsSheet', LMSBranchDetailsSheet);
registerSheet('PartnerDemoDetailsSheet', PartnerDemoDetailsSheet);
registerSheet('ClosingDetailsSheet', ClosingDetailsSheet);
registerSheet('RollingFilterSheet', RollingFilterSheet);
registerSheet('PromoterFilterSheet', PromoterFilterSheet);
registerSheet('ChannelMapFilterSheet', ChannelMapFilterSheet);
registerSheet('ClaimFilterSheetAPAC', ClaimFilterSheetAPAC);

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
  }
}

export {};
