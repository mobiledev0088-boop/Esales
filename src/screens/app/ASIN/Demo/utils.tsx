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
  tint: 'slate' | 'violet' | 'teal' | 'amber';
};

export type Filters = {
  category: string | null;
  premiumKiosk: string | null;
  rogKiosk: string | null;
  partnerType: string | null;
  agpName: string | null;
};

export const METRIC_COLOR: Record<MetricProps['tint'], string> = {
  slate: 'text-slate-600',
  violet: 'text-violet-600',
  teal: 'text-teal-600',
  amber: 'text-amber-600',
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