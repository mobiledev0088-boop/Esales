import { persist } from "zustand/middleware";
import { EmpInfo } from "../types/user";
import { create } from "zustand";
import { createMMKVStorage } from "../utils/mmkvStorage";

interface EmpState {
    empInfo: EmpInfo | null;
    setEmpInfo: (empInfo: EmpInfo | null) => void;
}


export const useEmpStore = create<EmpState>()(
    persist(
        (set) => ({
            empInfo: null,
            setEmpInfo: (empInfo) => set({ empInfo }),
        }),
        {
            name: 'emp-store',
            storage: createMMKVStorage<EmpState>('emp'),
        }
    )
);

export default useEmpStore;