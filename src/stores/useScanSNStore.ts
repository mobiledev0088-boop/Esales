import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorage } from '../utils/mmkvStorage';

interface ScanSNState {
    recentSearches: string[];
    addRecentSearch: (search: string) => void;
    clearRecentSearches: () => void;
}

export const useScanSNStore = create<ScanSNState>()(
    persist(
        (set) => ({
            recentSearches: [],
            addRecentSearch: (search: string) => {
                set((state) => ({
                    recentSearches: [...state.recentSearches.filter((s) => s !== search), search].slice(-5),
                }));
            },
            clearRecentSearches: () => {
                set({ recentSearches: [] });
            },
        }),
        {
            name: 'ScanSN-store',
            storage: createMMKVStorage<ScanSNState>(),
            // onRehydrateStorage: () => () => {
            //     console.log('✅ Zustand rehydrated from MMKV:');
            // },
        }
    )
);