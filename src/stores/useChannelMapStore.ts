import {create} from 'zustand';
import {AppDropdownItem} from '../components/customs/AppDropdown';

interface channelMapState {
  dropdownList: AppDropdownItem[] | null;
  setDropdownList: (items: AppDropdownItem[] | null) => void;
}

export const useChannelMapStore = create<channelMapState>((set, get) => ({
  dropdownList: null,
  setDropdownList: (items: AppDropdownItem[] | null) => {
    set({dropdownList: items});
  },
}));
