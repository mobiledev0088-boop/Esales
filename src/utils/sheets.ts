import {registerSheet, SheetDefinition} from 'react-native-actions-sheet';
import MoreSheet from '../screens/app/India/More/MoreSheet';
 
registerSheet('MoreSheet', MoreSheet);
 
// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'MoreSheet': SheetDefinition;
  }
}
 
export {};
