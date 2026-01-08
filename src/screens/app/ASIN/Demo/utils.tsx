import {AppDropdownItem} from '../../../../components/customs/AppDropdown';

// Reseller Demo
export interface DemoItemReseller {
  BranchName: string;
  AGP_Code: string;
  AGP_Name: string;
  AGP_Or_T3: string;
  DemoExecuted: number;
  TotalCompulsoryDemo: number;
  Pkiosk_Cnt: number;
  ROG_Kiosk_cnt: number;
  PKIOSK_ROG_KIOSK: number;
}
export interface DemoItemRetailer {
  BranchName: string;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  DemoExecuted: number;
  TotalCompulsoryDemo: number;
  Demo_UnitModel: string;
}
export interface DemoItemLFR {
  BranchName: string;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  ASE_Name: string;
  IchanelID: string;
  Employee_Code: string;
  DemoExecuted: number;
  TotalCompulsoryDemo: number;
}

export interface DemoItemROI {
  BranchName: string;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  Total_Demo_Count: number;
  Activation_count: number;
  Inventory_Count: number;
  Model_Series: string;
}

// Reseller Demo - Unified
export interface TransformedBranchRes {
  id: string;
  state: string;
  partner_count: number;
  at_least_single_demo: number;
  demo_100: number;
  rog_kiosk: number;
  pkiosk: number;
  awp_Count: number;
  pkiosk_rogkiosk: number;
  partners: DemoItemReseller[];
}

export interface TerritoryItemRes {
  id: string;
  territory: string;
  partner_count: number;
  at_least_single_demo: number;
  demo_100: number;
  rog_kiosk: number;
  pkiosk: number;
  awp_Count: number;
  pkiosk_rogkiosk: number;
  partners: DemoItemReseller[];
}

export interface TransformedBranchRet {
  id: string;
  state: string;
  at_least_single_demo: number;
  demo_100: number;
  at_80_demo: number;
  partner_count: number;
  partners: DemoItemRetailer[];
}
export interface TerritoryItemRet {
  id: string;
  territory: string;
  at_least_single_demo: number;
  at_80_demo: number;
  demo_100: number;
  partner_count: number;
  partners: DemoItemRetailer[];
}
export interface GroupConfig {
  groupType: 'branch' | 'territory';
  labelKey: 'state' | 'territory';
}

export interface DemoFilterResult {
  category?: string | null;
  premiumKiosk?: number | null;
  rogKiosk?: number | null;
  partnerType?: string | null;
  agpName?: string | null;
  compulsory?: string | null;
}

export interface ResellerFilterType {
  category: string;
  premiumKiosk: number;
  rogKiosk: number;
  partnerType: string | null;
}

export interface StatsHeaderProps {
  stats: {
    label: string;
    value: number;
    icon: string;
    iconType?: string;
    name: keyof typeof STAT_PALETTE;
  }[];
  counts: {
    awp_count: number | null;
    total_partners: number | null;
  };

}

export interface ProgressStatProps {
  label: string;
  percent: number;
  current: number;
  total: number;
  barTint: string;
  percentTint: string;
}

export interface MetricProps {
  label: string;
  value: number;
  icon: string;
  tint: 'slate' | 'violet' | 'teal' | 'amber' | 'blue';
}

export interface Filters {
  category: string | null;
  premiumKiosk?: string | null;
  rogKiosk?: string | null;
  partnerType: string | null;
  agpName?: string | null;
  compulsory?: string | null;
}

// helpers
export const STAT_PALETTE = {
  lap_icon: {tint: 'text-red-600', iconBg: 'bg-red-500'},
  grow_icon: {tint: 'text-blue-600', iconBg: 'bg-blue-500'},
  perc_icon: {tint: 'text-green-600', iconBg: 'bg-green-500'},
  pause_icon: {tint: 'text-yellow-600', iconBg: 'bg-yellow-500'},
} as const;
export const OFFLINE_STATUS_STYLES: Record<
  string,
  {bg: string; text: string; border: string; accent: string}
> = {
  'Offline/Not ON': {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-200',
    border: 'border border-rose-100 dark:border-rose-900',
    accent: 'border-l-rose-400 dark:border-l-rose-500',
  },
};
export const METRIC_COLOR: Record<MetricProps['tint'], string> = {
  slate: 'text-slate-600 dark:text-slate-400',
  violet: 'text-violet-600 dark:text-violet-400',
  teal: 'text-teal-600 dark:text-teal-400',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
};
export const METRIC_BG_COLOR: Record<MetricProps['tint'], string> = {
  slate: 'bg-slate-100 dark:bg-slate-800',
  violet: 'bg-violet-100 dark:bg-violet-900',
  teal: 'bg-teal-100 dark:bg-teal-900',
  amber: 'bg-amber-100 dark:bg-amber-900',
  blue: 'bg-blue-100 dark:bg-blue-900',
};
export const METRIC_ICON_COLOR: Record<MetricProps['tint'], string> = {
  slate: '#64748b',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  amber: '#f59e0b',
  blue: '#3b82f6',
};

// Reseller Demo - Unified
export const transformDemoData = (apiData: {
  DemoDetailsList: DemoItemReseller[];
  PartnerCount: {
    BranchName: string;
    PartnerCnt: number;
  }[];
}): TransformedBranchRes[] => {
  const branchMap = new Map<string, TransformedBranchRes>();

  apiData.DemoDetailsList.forEach(item => {
    const branchName = item.BranchName;

    // Calculate demo percentage for this partner
    let percentage = 0;
    if (item.TotalCompulsoryDemo !== 0) {
      percentage = (item.DemoExecuted / item.TotalCompulsoryDemo) * 100;
    }

    // Get or create branch
    if (!branchMap.has(branchName)) {
      branchMap.set(branchName, {
        id: branchMap.size + 1 + '', // Generate sequential ID
        state: branchName,
        partner_count: 0,
        at_least_single_demo: 0,
        demo_100: 0,
        rog_kiosk: 0,
        pkiosk: 0,
        pkiosk_rogkiosk: 0,
        awp_Count:
          apiData.PartnerCount.find(pc => {
            if (pc.BranchName === branchName) return pc;
            return 0;
          })?.PartnerCnt || 0,
        partners: [],
      });
    }

    const branch = branchMap.get(branchName)!;

    // Increment partner count
    branch.partner_count += 1;

    // Sum kiosk counts
    branch.rog_kiosk += item.ROG_Kiosk_cnt || 0;
    branch.pkiosk += item.Pkiosk_Cnt || 0;
    branch.pkiosk_rogkiosk += item.PKIOSK_ROG_KIOSK || 0;

    // Increment demo counters based on percentage
    if (percentage > 0 && percentage <= 50) {
      branch.at_least_single_demo += 1;
    } else if (percentage >= 51) {
      branch.demo_100 += 1;
    }

    // Add partner to the branch's partners array
    branch.partners.push(item);
  });

  return Array.from(branchMap.values());
};
export const transformTerritoryData = (apiData: {
  DemoDetailsList: DemoItemReseller[];
  PartnerCount?: {
    BranchName: string;
    PartnerCnt: number;
  }[];
}): TerritoryItemRes[] => {
  const territoryMap = new Map<string, TerritoryItemRes>();

  apiData.DemoDetailsList.forEach(item => {
    const territoryName = item.BranchName || 'Unknown Territory';

    // Calculate demo percentage for this partner
    let percentage = 0;
    if (item.TotalCompulsoryDemo !== 0) {
      percentage = (item.DemoExecuted / item.TotalCompulsoryDemo) * 100;
    }

    // Get or create territory
    if (!territoryMap.has(territoryName)) {
      territoryMap.set(territoryName, {
        id: territoryMap.size + 1 + '',
        territory: territoryName,
        partner_count: 0,
        at_least_single_demo: 0,
        demo_100: 0,
        rog_kiosk: 0,
        pkiosk: 0,
        awp_Count:
          apiData.PartnerCount?.find(pc => pc.BranchName === territoryName)
            ?.PartnerCnt || 0,
        pkiosk_rogkiosk: 0,
        partners: [],
      });
    }

    const territory = territoryMap.get(territoryName)!;

    // Increment partner count
    territory.partner_count += 1;

    // Sum kiosk counts
    territory.rog_kiosk += item.ROG_Kiosk_cnt || 0;
    territory.pkiosk += item.Pkiosk_Cnt || 0;
    territory.pkiosk_rogkiosk += item.PKIOSK_ROG_KIOSK || 0;

    // Increment demo counters based on percentage
    if (percentage > 0 && percentage <= 50) {
      territory.at_least_single_demo += 1;
    } else if (percentage >= 51) {
      territory.demo_100 += 1;
    }

    // Add partner to the territory's partners array
    territory.partners.push(item);
  });

  return Array.from(territoryMap.values());
};

// Retailer Demo - Unified
export const transformDemoDataRetailer = (
  apiData: DemoItemRetailer[],
  config: GroupConfig,
) => {
  const map = new Map<
    string,
    {
      id: string;
      partner_count: number;
      at_least_single_demo: number;
      at_80_demo: number;
      demo_100: number;
      partners: Map<string, DemoItemRetailer>;
    } & Record<typeof config.labelKey, string>
  >();

  /* -------------------- Step 1: Aggregate -------------------- */
  for (const item of apiData) {
    const {
      BranchName,
      PartnerName,
      PartnerType,
      PartnerCode,
      DemoExecuted,
      Demo_UnitModel,
    } = item;

    const groupKey = BranchName;
    const partnerKey = `${PartnerName}-${PartnerType}-${PartnerCode}`;

    if (!map.has(groupKey)) {
      map.set(groupKey, {
        id: String(map.size + 1),
        [config.labelKey]: BranchName,
        partner_count: 0,
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        partners: new Map(),
      } as any);
    }

    const group = map.get(groupKey)!;
    const existingPartner = group.partners.get(partnerKey);

    if (existingPartner) {
      existingPartner.DemoExecuted += DemoExecuted;

      if (Demo_UnitModel) {
        const models = new Set(
          existingPartner.Demo_UnitModel?.split(',') ?? [],
        );
        models.add(Demo_UnitModel);
        existingPartner.Demo_UnitModel = [...models].join(',');
      }
    } else {
      group.partners.set(partnerKey, { ...item });
      group.partner_count++;
    }
  }

  /* -------------------- Step 2: Calculate buckets -------------------- */
  for (const group of map.values()) {
    for (const partner of group.partners.values()) {
      const total = partner.TotalCompulsoryDemo || 0;
      const percentage = total ? (partner.DemoExecuted / total) * 100 : 0;

      if (percentage > 0 && percentage < 80) {
        group.at_least_single_demo++;
      } else if (percentage >= 80 && percentage < 100) {
        group.at_80_demo++;
      } else if (percentage >= 100) {
        group.demo_100++;
      }
    }
  }

  /* -------------------- Step 3: Normalize output -------------------- */
  return Array.from(map.values()).map(group => ({
    ...group,
    partners: Array.from(group.partners.values()),
  }));
};