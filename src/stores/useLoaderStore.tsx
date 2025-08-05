import { create } from 'zustand';

interface LoaderState {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

export const useLoaderStore = create<LoaderState>((set, get) => ({
    isLoading: false,
    setLoading: (loading: boolean) => set({ isLoading: loading }),
}));