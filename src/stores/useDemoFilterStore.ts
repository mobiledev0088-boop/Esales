import {create} from 'zustand';

/**
 * ============================================
 * Demo Filter Store Types
 * ============================================
 * Centralized type definitions for all demo filter states
 */

/**
 * Reseller filter configuration
 * Used in Reseller tab for filtering demo data
 */
export interface ResellerFilterType {
  category: string; // Product category filter (e.g., 'All', 'Laptop', 'Desktop')
  pKiosk: number | null; // Premium Kiosk count filter
  rogKiosk: number | null; // ROG Kiosk count filter
  partnerType: string[]; // Partner type classification (supports multiple selection)
}

/**
 * Retailer filter configuration
 * Used in Retailer tab for filtering demo data
 */
export interface RetailerFilterType {
  category: string; // Product category filter
  compulsory: string; // Compulsory demo type ('bonus' | 'nopenalty')
  partnerType: string[]; // Partner type classification (supports multiple selection)
}

/**
 * LFR (Large Format Retail) filter configuration
 * Used in LFR tab for filtering demo data
 */
export interface LFRFilterType {
  lfrType: string[]; // LFR partner type (supports multiple selection)
  partnerName: string; // Specific partner name filter
  category: string; // Product category filter
}

/**
 * ROI (Return on Investment) filter configuration
 * Used in ROI tab for filtering demo data
 */
export interface ROIFilterType {
  category: string; // Product category filter
  series: string; // Product series filter
  partnerType: string[]; // Partner type classification (supports multiple selection)
}

/**
 * ============================================
 * Demo Filter Store State Interface
 * ============================================
 */
interface DemoFilterState {
  // ========== State Properties ==========
  
  /** Reseller tab filters */
  resellerFilters: ResellerFilterType;
  
  /** Retailer tab filters */
  retailerFilters: RetailerFilterType;
  
  /** LFR tab filters */
  lfrFilters: LFRFilterType;
  
  /** ROI tab filters */
  roiFilters: ROIFilterType;

  // ========== Actions/Setters ==========
  
  /**
   * Update Reseller filters
   * @param filters - Partial or complete reseller filter object
   */
  setResellerFilters: (filters: Partial<ResellerFilterType>) => void;
  
  /**
   * Update Retailer filters
   * @param filters - Partial or complete retailer filter object
   */
  setRetailerFilters: (filters: Partial<RetailerFilterType>) => void;
  
  /**
   * Update LFR filters
   * @param filters - Partial or complete LFR filter object
   */
  setLFRFilters: (filters: Partial<LFRFilterType>) => void;
  
  /**
   * Update ROI filters
   * @param filters - Partial or complete ROI filter object
   */
  setROIFilters: (filters: Partial<ROIFilterType>) => void;
  
  /**
   * Reset Reseller filters to default values
   */
  resetResellerFilters: () => void;
  
  /**
   * Reset Retailer filters to default values
   */
  resetRetailerFilters: () => void;
  
  /**
   * Reset LFR filters to default values
   */
  resetLFRFilters: () => void;
  
  /**
   * Reset ROI filters to default values
   */
  resetROIFilters: () => void;
  
  /**
   * Reset all filters across all demo types
   */
  resetAllFilters: () => void;
}

/**
 * ============================================
 * Default Filter Values
 * ============================================
 */

/** Default Reseller filter values */
/** Default Reseller filter values */
const defaultResellerFilters: ResellerFilterType = {
  category: 'All',
  pKiosk: null,
  rogKiosk: null,
  partnerType: [], // Empty array for multi-select
};

/** Default Retailer filter values */
const defaultRetailerFilters: RetailerFilterType = {
  category: 'All',
  compulsory: 'bonus', // Default to 'bonus' type
  partnerType: [], // Empty array for multi-select
};

/** Default LFR filter values */
const defaultLFRFilters: LFRFilterType = {
  lfrType: [], // Empty array for multi-select
  partnerName: '',
  category: 'All',
};

/** Default ROI filter values */
const defaultROIFilters: ROIFilterType = {
  category: 'All',
  series: '',
  partnerType: [], // Empty array for multi-select
};

/**
 * ============================================
 * Demo Filter Store
 * ============================================
 * Global state management for demo filters across all tabs
 * 
 * @example
 * // Access in any component
 * const { retailerFilters, setRetailerFilters } = useDemoFilterStore();
 * 
 * // Update specific filter
 * setRetailerFilters({ compulsory: 'nopenalty' });
 * 
 * // Access specific filter value
 * const compulsoryValue = useDemoFilterStore(state => state.retailerFilters.compulsory);
 */
export const useDemoFilterStore = create<DemoFilterState>((set, get) => ({
  // ========== Initial State ==========
  resellerFilters: defaultResellerFilters,
  retailerFilters: defaultRetailerFilters,
  lfrFilters: defaultLFRFilters,
  roiFilters: defaultROIFilters,

  // ========== Reseller Actions ==========
  setResellerFilters: (filters: Partial<ResellerFilterType>) => {
    set(state => ({
      resellerFilters: {
        ...state.resellerFilters,
        ...filters,
      },
    }));
  },

  resetResellerFilters: () => {
    set({resellerFilters: defaultResellerFilters});
  },

  // ========== Retailer Actions ==========
  setRetailerFilters: (filters: Partial<RetailerFilterType>) => {
    set(state => ({
      retailerFilters: {
        ...state.retailerFilters,
        ...filters,
      },
    }));
  },

  resetRetailerFilters: () => {
    set({retailerFilters: defaultRetailerFilters});
  },

  // ========== LFR Actions ==========
  setLFRFilters: (filters: Partial<LFRFilterType>) => {
    set(state => ({
      lfrFilters: {
        ...state.lfrFilters,
        ...filters,
      },
    }));
  },

  resetLFRFilters: () => {
    set({lfrFilters: defaultLFRFilters});
  },

  // ========== ROI Actions ==========
  setROIFilters: (filters: Partial<ROIFilterType>) => {
    set(state => ({
      roiFilters: {
        ...state.roiFilters,
        ...filters,
      },
    }));
  },

  resetROIFilters: () => {
    set({roiFilters: defaultROIFilters});
  },

  // ========== Global Reset ==========
  resetAllFilters: () => {
    set({
      resellerFilters: defaultResellerFilters,
      retailerFilters: defaultRetailerFilters,
      lfrFilters: defaultLFRFilters,
      roiFilters: defaultROIFilters,
    });
  },
}));
