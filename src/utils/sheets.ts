import {registerSheet, SheetDefinition} from 'react-native-actions-sheet';
import MoreSheet from '../screens/app/ASIN/More/MoreSheet';
import ConfirmationSheet from '../components/ConfirmationSheet';
import DatePickerSheet from '../components/DatePickerSheet';
import { FilterActionSheet } from '../screens/app/ASIN/More/ActivatedDetails/component';
import DemoFilterSheet from '../screens/app/ASIN/Demo/DemoFilterSheet';
 
registerSheet('MoreSheet', MoreSheet);
registerSheet('ConfirmationSheet', ConfirmationSheet);
registerSheet('DatePickerSheet', DatePickerSheet);
registerSheet('FilterActionSheet', FilterActionSheet);
registerSheet('DemoFilterSheet', DemoFilterSheet);
 
// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'MoreSheet': SheetDefinition;
    'ConfirmationSheet': SheetDefinition;
    'DatePickerSheet': SheetDefinition;
    'FilterActionSheet': SheetDefinition;
    'DemoFilterSheet': SheetDefinition;
  }
}
 
export {};
