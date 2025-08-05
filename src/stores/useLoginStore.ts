import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorage } from '../utils/mmkvStorage';
import { UserInfo } from '../types/user';

interface LoginState {
    isAutoLogin: boolean;
    token: string | null;
    userInfo: UserInfo | null;
    setAuthData: (token: string, userInfo: UserInfo) => void;
    removeAuthData: () => void;
}

export const useLoginStore = create<LoginState>()(
    persist(
        (set) => ({
            isAutoLogin: false,
            token: null,
            userInfo: null,
            setAuthData: (token: string, userInfo: UserInfo) => {
                set({ token, isAutoLogin: true, userInfo });
            },
            removeAuthData: () => {
                set({ token: null, isAutoLogin: false, userInfo: null });
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