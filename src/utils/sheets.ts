import {registerSheet, SheetDefinition} from 'react-native-actions-sheet';
import MoreSheet from '../screens/app/ASIN/More/MoreSheet';
import ConfirmationSheet from '../components/ConfirmationSheet';
import DatePickerSheet from '../components/DatePickerSheet';
import { FilterActionSheet } from '../screens/app/ASIN/More/ActivatedDetails/component';
import DemoFilterSheet from '../screens/app/ASIN/Demo/DemoFilterSheet';
import ClaimFilterSheet from '../screens/app/ASIN/Claim/ClaimFilterSheet';
import WODFilterSheet from '../screens/app/ASIN/WOD/WODFilterSheet';
 
registerSheet('MoreSheet', MoreSheet);
registerSheet('ConfirmationSheet', ConfirmationSheet);
registerSheet('DatePickerSheet', DatePickerSheet);
registerSheet('FilterActionSheet', FilterActionSheet);
registerSheet('DemoFilterSheet', DemoFilterSheet);
registerSheet('ClaimFilterSheet', ClaimFilterSheet);
registerSheet('WODFilterSheet', WODFilterSheet);
 
// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'MoreSheet': SheetDefinition;
    'ConfirmationSheet': SheetDefinition;
    'DatePickerSheet': SheetDefinition;
    'FilterActionSheet': SheetDefinition;
    'DemoFilterSheet': SheetDefinition;
    'ClaimFilterSheet': SheetDefinition;
    'WODFilterSheet': SheetDefinition;
  }
}
 
export {};
