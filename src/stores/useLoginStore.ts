import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorage } from '../utils/mmkvStorage';
import { UserInfo } from '../types/user';

interface LoginState {
    isAutoLogin: boolean;
    token: string | null;
    userInfo: UserInfo;
    setAuthData: (token: string, userInfo: UserInfo) => void;
    removeAuthData: () => void;
}

const initialUserInfo: UserInfo = {
    EMP_Btype: 0,
    EMP_Code: '',
    EMP_CountryID: '',
    EMP_Dept: 0,
    EMP_EmailID: '',
    EMP_IsLoyaltyAccepted: null,
    EMP_IsLoyaltyAccepted_Date: null,
    EMP_LoginFlag: "N",
    EMP_LoginFlagChangedDate: null,
    EMP_Menu: '',
    EMP_Name: '',
    EMP_Password: '',
    EMP_PwdChangeDate: '',
    EMP_ROG_LoginFlag: null,
    EMP_ROG_LoginFlagChangedDate: null,
    EMP_ResetCnt: 0,
    EMP_ResetMailSentDate: null,
    EMP_RoleId: 0,
    EMP_SystemGenPasswordFlag: 0,
    EMP_Type: null,
    EMP_WrongAttemptCnt: 0,
    EMP_WrongMaxCnt: 0,
    Is_Multiple_BusinessType: "No",
    Is_Multiple_Login: "No",
    Token: '',
    UPD_BANNED: '',
    UPD_BANNEDON: '',
    UPD_BRANCH: '',
    UPD_COUNTRY: '',
    UPD_MACHINENAME: '',
    UPD_MODULE: '',
    UPD_PROPERTY: '',
    UPD_TODAY: '',
    UPD_USER: '',
}

export const useLoginStore = create<LoginState>()(
    persist(
        (set) => ({
            isAutoLogin: false,
            token: null,
            userInfo: initialUserInfo,
            setAuthData: (token: string, userInfo: UserInfo) => {
                set({ token, isAutoLogin: true, userInfo });
            },
            removeAuthData: () => {
                set({ token: null, isAutoLogin: false, userInfo: initialUserInfo });
            },
        }),
        {
            name: 'auth-store',
            storage: createMMKVStorage<LoginState>('auth'),
            onRehydrateStorage: () => () => {
                console.log('✅ Zustand rehydrated from MMKV:');
            },
        }
    )
);