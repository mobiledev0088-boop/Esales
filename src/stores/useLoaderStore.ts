import { create } from 'zustand';

interface LoaderState {
    isLoading: boolean;
    globalLoading: boolean;
    setLoading: (loading: boolean) => void;
    setGlobalLoading: (loading: boolean) => void;
}

export const useLoaderStore = create<LoaderState>((set, get) => ({
    isLoading: false,
    globalLoading: false,
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),
}));