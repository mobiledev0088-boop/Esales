import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage
const storage = new MMKV();

type ThemeType = 'light' | 'dark';
interface ThemeState {
    AppTheme: ThemeType;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    AppTheme: storage.getString('AppTheme') as ThemeType ?? 'light',
    toggleTheme: () => {
        const newTheme = get().AppTheme === 'light' ? 'dark' : 'light';
        storage.set('AppTheme', newTheme);
        set({ AppTheme: newTheme });
    },
    setTheme: (theme: ThemeType) => {
        storage.set('AppTheme', theme);
        set({ AppTheme: theme });
    },
}));
