import {create} from 'zustand';

export type ASESortKey = 'Target_Qty' | 'Sellout_Qty' | 'Activaton_Qty' | 'H_Rate' | null;
export type ASEOrder = 'asc' | 'desc';

interface ASEPerformanceState {
  search: string;
  partner: string | null;
  sortKey: ASESortKey;
  sortOrder: ASEOrder;
  page: number; // 1-based page index
  pageSize: number;
  setSearch: (v: string) => void;
  setPartner: (v: string | null) => void;
  setSort: (key: ASESortKey) => void;
  setPage: (p: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export const useASEPerformanceStore = create<ASEPerformanceState>(set => ({
  search: '',
  partner: null,
  sortKey: null,
  sortOrder: 'desc',
  page: 1,
  pageSize: 10,
  setSearch: v => set({search: v, page: 1}),
  setPartner: v => set({partner: v, page: 1}),
  setSort: key =>
    set(state => {
      if (key === null) return {sortKey: null};
      if (state.sortKey !== key) return {sortKey: key, sortOrder: 'desc', page: 1};
      // toggle desc -> asc -> none
      if (state.sortOrder === 'desc') return {sortKey: key, sortOrder: 'asc', page: 1};
      if (state.sortOrder === 'asc') return {sortKey: null, page: 1};
      return {sortKey: key, sortOrder: 'desc', page: 1};
    }),
  setPage: p => set({page: p < 1 ? 1 : p}),
  nextPage: () => set(state => ({page: state.page + 1})),
  prevPage: () => set(state => ({page: state.page > 1 ? state.page - 1 : 1})),
  reset: () =>
    set({
      search: '',
      partner: null,
      sortKey: null,
      sortOrder: 'desc',
      page: 1,
      pageSize: 10,
    }),
}));
