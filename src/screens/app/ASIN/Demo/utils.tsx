export type DemoItem = {
  AGP_Code: string;
  AGP_Name: string;
  AGP_Or_T3: string;
  BranchName: string;
  DemoExecuted: number;
  PKIOSK_ROG_KIOSK: number;
  Pkiosk_Cnt: number;
  ROG_Kiosk_cnt: number;
  TotalCompulsoryDemo: number;
  PartnerType: string;
};

export interface DemoItemRetailer {
  BranchName: string;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  DemoExecuted: number;
  TotalCompulsoryDemo: number;
  Demo_UnitModel: string;
}

export type TransformedBranch = {
  id: string;
  state: string;
  partner_count: number;
  at_least_single_demo: number;
  demo_100: number;
  rog_kiosk: number;
  pkiosk: number;
  awp_Count: number;
  pkiosk_rogkiosk: number;
  partners: DemoItem[];
  at_80_demo?: number;
};

export type TerritoryItem = {
  id: string;
  territory: string;
  partner_count: number;
  at_least_single_demo: number;
  demo_100: number;
  rog_kiosk: number;
  pkiosk: number;
  awp_Count: number;
  pkiosk_rogkiosk: number;
  partners: DemoItem[];
};

export type ProgressStatProps = {
  label: string;
  percent: number;
  current: number;
  total: number;
  barTint: string;
  percentTint: string;
};

export type MetricProps = {
  label: string;
  value: number;
  icon: string;
  tint: 'slate' | 'violet' | 'teal' | 'amber' | 'blue';
};

export type Filters = {
  category: string | null;
  premiumKiosk?: string | null;
  rogKiosk?: string | null;
  partnerType: string | null;
  agpName?: string | null;
  compulsory?: string | null;
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

export const filterDemoItemsByPartnerType = (
  items: DemoItem[],
  partnerType: string | null,
): DemoItem[] => {
  if (!partnerType || partnerType === 'All') return items;
  return items.filter(item => item.AGP_Or_T3 === partnerType);
};

export const transformTerritoryData = (apiData: {
  DemoDetailsList: DemoItem[];
  PartnerCount?: {
    BranchName: string;
    PartnerCnt: number;
  }[];
}): TerritoryItem[] => {
  const territoryMap = new Map<string, TerritoryItem>();

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

export const transformDemoData = (apiData: {
  DemoDetailsList: DemoItem[];
  PartnerCount: {
    BranchName: string;
    PartnerCnt: number;
  }[];
}): TransformedBranch[] => {
  const branchMap = new Map<string, TransformedBranch>();

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

export const transformDemoDataRetailer = (apiData: DemoItemRetailer[]): TransformedBranch[] => {
  const branchMap = new Map<
    string,
    {
      id: string;
      state: string;
      partner_count: number;
      at_least_single_demo: number;
      at_80_demo: number;
      demo_100: number;
      rog_kiosk: number;
      pkiosk: number;
      awp_Count: number;
      pkiosk_rogkiosk: number;
      partners: Map<string, DemoItemRetailer>; // store partners in a Map to merge directly
    }
  >();

  // Step 1: Aggregate data by branch and partner
  for (const item of apiData) {
    const {
      BranchName,
      PartnerName,
      PartnerType,
      PartnerCode,
      DemoExecuted,
      Demo_UnitModel,
    } = item;

    const branchKey = BranchName;
    const partnerKey = `${PartnerName}-${PartnerType}-${PartnerCode}`;

    // Ensure branch exists
    if (!branchMap.has(branchKey)) {
      branchMap.set(branchKey, {
        id: String(branchMap.size + 1),
        state: BranchName,
        partner_count: 0,
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        rog_kiosk: 0,
        pkiosk: 0,
        awp_Count: 0,
        pkiosk_rogkiosk: 0,
        partners: new Map(),
      });
    }
    const branch = branchMap.get(branchKey)!;
    const existingPartner = branch.partners.get(partnerKey);
    if (existingPartner) {
      // Merge partner details
      existingPartner.DemoExecuted += DemoExecuted;

      if (Demo_UnitModel) {
        const existingModels = new Set(
          existingPartner.Demo_UnitModel?.split(',') ?? [],
        );
        existingModels.add(Demo_UnitModel);
        existingPartner.Demo_UnitModel = Array.from(existingModels).join(',');
      }
    } else {
      // Add new partner
      branch.partners.set(partnerKey, {...item});
      branch.partner_count++;
    }
  }

  // Step 2: Compute percentages & category counts
  for (const branch of branchMap.values()) {
    for (const partner of branch.partners.values()) {
      const total = partner.TotalCompulsoryDemo || 0;
      const percentage = total > 0 ? (partner.DemoExecuted / total) * 100 : 0;
      if (percentage > 0 && percentage < 80) {
        branch.at_least_single_demo++;
      } else if (percentage >= 80 && percentage < 100) {
        branch.at_80_demo++;
      } else if (percentage >= 100) {
        branch.demo_100++;
      }
    }
  }

  //Step 3: Convert nested Maps to arrays
  return Array.from(branchMap.values()).map(branch => ({
    ...branch,
    partners: Array.from(branch.partners.values()) as any,
  }));
};
