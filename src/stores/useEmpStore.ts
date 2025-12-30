import {persist} from 'zustand/middleware';
import {EmpInfo} from '../types/user';
import {create} from 'zustand';
import {createMMKVStorage} from '../utils/mmkvStorage';

interface EmpState {
  empInfo: EmpInfo;
  setEmpInfo: (empInfo: Partial<EmpInfo>) => void;
  resetEmpInfo: () => void;
}

const initialEmpInfo: EmpInfo = {
  ASE_PDF_Link: null,
  Activation_Update: '',
  BT_Code: '',
  BT_Name: '',
  BT_id: 0,
  BannerURL_Link: '',
  Banner_Link: '',
  Branch_Name: null,
  DT_Code: '',
  DT_Id: 0,
  DT_Name: '',
  DemoHub_Update: '',
  EMP_Code: '',
  EMP_Country: '',
  EMP_EmailID: '',
  EMP_Name: '',
  EMP_Type: null,
  ISPSellout_Update: '',
  IsParentCode: false,
  Is_LoginAs: '',
  Is_Multiple_Login: '',
  POD_Update: '',
  PerformanceLink: null,
  Po_RoleId: null,
  RoleCode: '',
  RoleId: 0,
  RoleName: '',
  Sellout_Update: '',
  Sellthru_Update: '',
  Sync_Date: '',
  Territory_Name: null,
  Year_Qtr: '',
  android_version: '',
  ios_version: '',
  Inventory_Sync_Date: '',
};

export const useEmpStore = create<EmpState>()(
  persist(
    set => ({
      empInfo: initialEmpInfo,
      setEmpInfo: payload =>
        set(state => ({
          empInfo: {
            ...state.empInfo,
            ...payload,
          },
        })),
      resetEmpInfo: () => set({empInfo: initialEmpInfo}),
    }),
    {
      name: 'emp-store',
      storage: createMMKVStorage<EmpState>(),
      onRehydrateStorage: () => () => {
        console.log('✅ Zustand rehydrated from MMKV empStore :');
      },
    },
  ),
);

export default useEmpStore;
