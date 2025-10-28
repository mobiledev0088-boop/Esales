import React, {useCallback, useEffect, useState} from 'react';
import {View, TouchableOpacity} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {twMerge} from 'tailwind-merge';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import Card from '../../../../components/Card';
import AppModal from '../../../../components/customs/AppModal';
import {AppColors} from '../../../../config/theme';
import {useThemeStore} from '../../../../stores/useThemeStore';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import moment from 'moment';

// ---------------- Types ----------------
export interface CSEStat {
  name: string;
  active: number;
  sleeping: number;
  inactive: number;
}
export interface Territory {
  name: string;
  active: number;
  sleeping: number;
  inactive: number;
  CSE?: CSEStat[];
}
export interface BranchBlock {
  branch: string;
  total: number;
  territories: Territory[];
}
export interface RawRow {
  Branch_Name: string | null;
  Territory_name: string | null;
  CSE_Name: string | null;
  ACM_CSE_Name?: string | null;
  Year_On_Year_Status: string | null;
  Quarter_On_Quarter_Status: string | null;
  Month_On_Month_Status: string | null;
  // Newly referenced fields for list extraction
  ACM_BranchName?: string | null;
  ACM_Partner_Type?: string | null;
}
export type StatusMode = 'YoY' | 'QoQ' | 'MoM';

export interface CSEColumn {
  key: 'name' | 'active' | 'sleeping' | 'inactive' | 'action';
  label?: string;
  flex?: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
  tint?: string;
}

// --------------- Constants ---------------
export const STAT_PALETTE = [
  {tint: 'text-green-600', iconBg: 'bg-green-500', icon: 'check-circle'},
  {tint: 'text-blue-600', iconBg: 'bg-blue-500', icon: 'pause-circle'},
  {tint: 'text-red-600', iconBg: 'bg-red-500', icon: 'x-circle'},
] as const;

export const TABS = [
  'Year on Year (YoY)',
  'Quarter on Quarter (QoQ)',
  'Month on Month (MoM)',
] as const;

// --------------- Utilities ---------------
const STATUS_FIELD: Record<StatusMode, keyof RawRow> = {
  YoY: 'Year_On_Year_Status',
  QoQ: 'Quarter_On_Quarter_Status',
  MoM: 'Month_On_Month_Status',
};

export function normalizeStatus(
  raw: string | null | undefined,
): 'active' | 'sleeping' | 'inactive' | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'active') return 'active';
  if (v === 'sleeping') return 'sleeping';
  if (v === 'inactive') return 'inactive';
  return null;
}

export interface BuildBranchBlocksResult {
  data: BranchBlock[];
  branchList: string[];
  partnerTypeList: string[];
}

export function buildBranchBlocks(
  rows: RawRow[],
  mode: StatusMode,
): BuildBranchBlocksResult {
  const statusField = STATUS_FIELD[mode];
  const branchMap = new Map<
    string,
    {
      branch: string;
      total: number;
      territories: Map<
        string,
        {
          name: string;
          active: number;
          sleeping: number;
          inactive: number;
          CSE: Map<
            string,
            {name: string; active: number; sleeping: number; inactive: number}
          >;
        }
      >;
    }
  >();
  // Sets to store unique values without duplicates
  const branchSet = new Set<string>();
  const partnerTypeSet = new Set<string>();

  for (let r of rows as any[]) {
    const branchName = (r.Branch_Name || 'UNKNOWN').trim();
    const territoryName = (r.Territory_name || 'UNKNOWN TERRITORY').trim();
    let cseNameSource: string | null | undefined = r.CSE_Name;
    const isInvalid = (val: any) =>
      !val ||
      (typeof val === 'string' &&
        (val.trim() === '' || val.trim().toLowerCase() === 'null'));
    if (isInvalid(cseNameSource)) cseNameSource = r.ACM_CSE_Name;
    if (isInvalid(cseNameSource)) continue;
    const cseName = (cseNameSource as string).trim();
    const bucket = normalizeStatus(r[statusField] as string | null);
    if (!bucket) continue;

    let branchEntry = branchMap.get(branchName);
    if (!branchEntry) {
      branchEntry = {branch: branchName, total: 0, territories: new Map()};
      branchMap.set(branchName, branchEntry);
    }
    let terrEntry = branchEntry.territories.get(territoryName);
    if (!terrEntry) {
      terrEntry = {
        name: territoryName,
        active: 0,
        sleeping: 0,
        inactive: 0,
        CSE: new Map(),
      };
      branchEntry.territories.set(territoryName, terrEntry);
    }
    terrEntry[bucket] += 1;
    branchEntry.total += 1;
    if (cseName) {
      let cseEntry = terrEntry.CSE.get(cseName);
      if (!cseEntry) {
        cseEntry = {name: cseName, active: 0, sleeping: 0, inactive: 0};
        terrEntry.CSE.set(cseName, cseEntry);
      }
      cseEntry[bucket] += 1;
    }
    // Collect unique ACM_BranchName & ACM_Partner_Type if present (trim + non-empty)
    const acmBranch = (r.ACM_BranchName || '').toString().trim();
    if (acmBranch) branchSet.add(acmBranch);
    const partnerType = (r.ACM_Partner_Type || '').toString().trim();
    if (partnerType) partnerTypeSet.add(partnerType);
  }
  const branchBlocks: BranchBlock[] = Array.from(branchMap.values()).map(
    br => ({
      branch: br.branch,
      total: br.total,
      territories: Array.from(br.territories.values()).map(t => ({
        name: t.name,
        active: t.active,
        sleeping: t.sleeping,
        inactive: t.inactive,
        CSE: Array.from(t.CSE.values()),
      })),
    }),
  );
  branchBlocks.sort((a, b) => a.branch.localeCompare(b.branch));
  branchBlocks.forEach(r =>
    r.territories.sort((a, b) => a.name.localeCompare(b.name)),
  );
  const branchList = Array.from(branchSet.values()).sort((a, b) => a.localeCompare(b));
  const partnerTypeList = Array.from(partnerTypeSet.values()).sort((a, b) => a.localeCompare(b));
  return {data: branchBlocks, branchList, partnerTypeList};
}

export function renderHighlightedCSEName(
  name: string,
  query: string,
): React.ReactNode {
  if (!query || query.length < 3)
    return (
      <AppText
        size="sm"
        weight="medium"
        className="text-slate-700"
        numberOfLines={1}>
        {name}
      </AppText>
    );
  const q = query.toLowerCase();
  const lower = name.toLowerCase();
  if (!lower.includes(q))
    return (
      <AppText
        size="sm"
        weight="medium"
        className="text-slate-700"
        numberOfLines={1}>
        {name}
      </AppText>
    );
  const parts: {text: string; match: boolean}[] = [];
  let start = 0;
  while (true) {
    const idx = lower.indexOf(q, start);
    if (idx === -1) {
      parts.push({text: name.slice(start), match: false});
      break;
    }
    if (idx > start) parts.push({text: name.slice(start, idx), match: false});
    parts.push({text: name.slice(idx, idx + q.length), match: true});
    start = idx + q.length;
  }
  return (
    <AppText
      size="sm"
      weight="medium"
      className="text-slate-700"
      numberOfLines={1}>
      {parts.map((p, i) =>
        p.match ? (
          <AppText
            key={i}
            size="sm"
            weight="semibold"
            className="text-blue-700 bg-blue-100 px-0.5 rounded">
            {p.text}
          </AppText>
        ) : (
          <AppText key={i} size="sm" weight="medium" className="text-slate-700">
            {p.text}
          </AppText>
        ),
      )}
    </AppText>
  );
}

export const Metric: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({label, value, color}) => (
  <View className="flex-1 mb-1">
    <AppText
      size="xs"
      weight="medium"
      className={twMerge('uppercase tracking-wide text-center', color)}>
      {label}
    </AppText>
    <AppText
      size="lg"
      weight="semibold"
      className={twMerge('text-center', color)}>
      {value}
    </AppText>
  </View>
);

export interface TerritoryRowProps {
  t: Territory;
  expanded: boolean;
  toggle: () => void;
  last: boolean;
  searchQuery?: string;
}

export const CSE_COLUMNS: CSEColumn[] = [
  {key: 'name', label: 'CSE', flex: 2, align: 'left'},
  {
    key: 'active',
    label: 'Active',
    flex: 1,
    align: 'center',
    tint: 'text-green-600',
  },
  {
    key: 'sleeping',
    label: 'Sleeping',
    flex: 1,
    align: 'center',
    tint: 'text-blue-600',
  },
  {
    key: 'inactive',
    label: 'Inactive',
    flex: 1,
    align: 'center',
    tint: 'text-red-600',
  },
  {key: 'action', width: 36, align: 'center'},
];

export interface CSERow {
  name: string;
  active: number;
  sleeping: number;
  inactive: number;
}

export const CSETable: React.FC<{
  rows: CSERow[];
  territoryTotals: {active: number; sleeping: number; inactive: number};
  searchQuery?: string;
}> = ({rows, searchQuery}) => {
  if (!rows.length)
    return (
      <View className="bg-slate-50 rounded-xl border border-dashed border-slate-300 py-8 items-center justify-center">
        <AppIcon name="user" type="feather" size={24} color="#94a3b8" />
        <AppText size="sm" weight="medium" className="text-slate-500 mt-3">
          No CSE data
        </AppText>
      </View>
    );
  const renderCellContainer = (
    col: any,
    content: React.ReactNode,
    first?: boolean,
  ) => {
    const baseStyle: any = {};
    if (col.flex) baseStyle.flex = col.flex;
    if (col.width) baseStyle.width = col.width;
    const alignment =
      col.align === 'left'
        ? 'items-start'
        : col.align === 'right'
          ? 'items-end'
          : 'items-center';
    const padding = first ? 'pl-3 pr-2' : col.key === 'name' ? 'px-2' : 'px-1';
    return (
      <View
        key={col.key}
        style={baseStyle}
        className={twMerge('py-2 justify-center', alignment, padding)}>
        {content}
      </View>
    );
  };
  return (
    <View className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <View className="flex-row bg-slate-50/70 border-b border-slate-200">
        {CSE_COLUMNS.map((col, idx) =>
          renderCellContainer(
            col,
            col.label ? (
              <AppText
                size="xs"
                weight="semibold"
                className={twMerge(
                  'uppercase tracking-wide',
                  col.tint || 'text-slate-500',
                )}
                numberOfLines={1}>
                {col.label}
              </AppText>
            ) : null,
            idx === 0,
          ),
        )}
      </View>
      {rows.map((r, rowIdx) => (
        <TouchableOpacity
          key={r.name + rowIdx}
          activeOpacity={0.85}
          className={twMerge(
            'flex-row',
            rowIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white',
            rowIdx !== rows.length - 1 && 'border-b border-slate-100',
          )}>
          {CSE_COLUMNS.map((col, colIdx) => {
            const first = colIdx === 0;
            let node: React.ReactNode = null;
            switch (col.key) {
              case 'name':
                node = renderHighlightedCSEName(r.name, searchQuery || '');
                break;
              case 'active':
                node = (
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-green-600">
                    {r.active}
                  </AppText>
                );
                break;
              case 'sleeping':
                node = (
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-blue-600">
                    {r.sleeping}
                  </AppText>
                );
                break;
              case 'inactive':
                node = (
                  <AppText size="sm" weight="semibold" className="text-red-600">
                    {r.inactive}
                  </AppText>
                );
                break;
              case 'action':
                node = (
                  <AppIcon
                    name="chevron-right"
                    type="feather"
                    size={16}
                    color="#94a3b8"
                  />
                );
                break;
            }
            return renderCellContainer(col, node, first);
          })}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const TerritoryRow: React.FC<TerritoryRowProps> = ({
  t,
  expanded,
  toggle,
  last,
  searchQuery,
}) => (
  <View
    className={twMerge(
      !last && !expanded && 'border-b border-slate-100',
    )}>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={toggle}
      activeOpacity={0.75}
      className="px-4 py-4">
      <View className="flex-row">
        <View className="flex-1 pr-3">
          <AppText
            size="sm"
            weight="semibold"
            className="text-slate-800 mb-1"
            numberOfLines={2}>
            {t.name}
          </AppText>
          <View className="flex-row gap-2 mt-1">
            <Metric label="Active" value={t.active} color="text-green-600" />
            <Metric label="Sleeping" value={t.sleeping} color="text-blue-600" />
            <Metric label="Inactive" value={t.inactive} color="text-red-600" />
          </View>
        </View>
        <View className="justify-center pl-1">
          <AppIcon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            type="feather"
            size={20}
            color="#64748b"
          />
        </View>
      </View>
    </TouchableOpacity>
    {expanded && (
      <View className={twMerge('px-3 pb-4', last && 'rounded-b-md')}>
        <CSETable
          rows={t.CSE || []}
          territoryTotals={{
            active: t.active,
            sleeping: t.sleeping,
            inactive: t.inactive,
          }}
          searchQuery={searchQuery}
        />
      </View>
    )}
  </View>
);

export const BranchCard: React.FC<{
  block: BranchBlock;
  searchQuery?: string;
  collapseSignal?: number;
}> = ({block, searchQuery, collapseSignal}) => {
  const [expandedTerritories, setExpandedTerritories] = useState<Set<string>>(
    new Set(),
  );
  const effectiveSearch = (searchQuery || '').trim();
  const searchActive = effectiveSearch.length >= 3;
  useEffect(() => {
    if (!searchActive) return;
    const next = new Set<string>();
    block.territories.forEach(terr => {
      const hasMatch = (terr.CSE || []).some(c =>
        c.name.toLowerCase().includes(effectiveSearch.toLowerCase()),
      );
      if (hasMatch) next.add(terr.name);
    });
    setExpandedTerritories(next);
  }, [searchActive, effectiveSearch, block]);
  useEffect(() => {
    if (!searchActive) setExpandedTerritories(new Set());
  }, [collapseSignal]);
  const totals = block.territories.reduce(
    (acc, t) => {
      acc.active += t.active;
      acc.sleeping += t.sleeping;
      acc.inactive += t.inactive;
      return acc;
    },
    {active: 0, sleeping: 0, inactive: 0},
  );
  const branchTotal = block.total || totals.active + totals.sleeping + totals.inactive;
  return (
    <Card className="p-0 overflow-hidden rounded-xl border border-slate-200">
      <View className="px-4 py-4 border-b border-slate-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-xl bg-blue-100 items-center justify-center mr-3">
              <AppIcon
                name="map-pin"
                type="feather"
                size={18}
                color="#2563EB"
              />
            </View>
            <AppText
              size="base"
              weight="semibold"
              className="text-slate-800"
              numberOfLines={1}>
              {block.branch}
            </AppText>
          </View>
          <View className="flex-row items-center bg-slate-100/80 px-3 py-1 rounded-full">
            <AppText
              size="xs"
              weight="medium"
              className="text-[10px] text-slate-400 ml-1">
              Partners:{" "}
            </AppText>
            <AppText
              size="md"
              weight="bold"
              className="text-[10px] text-slate-700">
              {branchTotal}
            </AppText>
          </View>
        </View>
        {/* <View className="mt-3" /> */}
      </View>
      {block.territories.map((t, idx) => (
        <TerritoryRow
          key={t.name}
          t={t}
          expanded={expandedTerritories.has(t.name)}
          toggle={() =>
            setExpandedTerritories(prev => {
              const copy = new Set(prev);
              copy.has(t.name) ? copy.delete(t.name) : copy.add(t.name);
              return copy;
            })
          }
          last={idx === block.territories.length - 1}
          searchQuery={searchQuery}
        />
      ))}
    </Card>
  );
};

export const TabHeader: React.FC<{
  tabs: string[];
  activeIndex: number;
  onChange?: (i: number) => void;
}> = ({tabs, activeIndex, onChange}) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDark = appTheme === 'dark';
  const containerWidth = useSharedValue(0);
  const animIndex = useSharedValue(0);
  const baseTabWidth = useDerivedValue(() => {
    if (!containerWidth.value || !tabs.length) return 0;
    return (containerWidth.value - 16) / tabs.length;
  }, [tabs.length]);

  useEffect(() => {
    animIndex.value = withSpring(activeIndex, {
      damping: 14,
      stiffness: 180,
      mass: 0.5,
      overshootClamping: false,
    });
  }, [activeIndex, animIndex]);

  const translateXStyle = useAnimatedStyle(() => {
    const w = baseTabWidth.value;
    if (!w) return {opacity: 0};
    const x = 4 + animIndex.value * w;
    return {transform: [{translateX: x}], opacity: 1};
  });
  const indicatorStyle = useAnimatedStyle(() => {
    const w = baseTabWidth.value;
    if (!w) return {width: 0};
    return {width: w - 2};
  });

  const TabLabel: React.FC<{
    label: string;
    index: number;
    isActive: boolean;
    onPress?: () => void;
    activeText: string;
    inactiveText: string;
  }> = ({label, index, isActive, onPress, activeText, inactiveText}) => {
    const labelStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        animIndex.value,
        [index - 1, index, index + 1],
        [1, 1.05, 1],
        Extrapolation.CLAMP,
      );
      return {transform: [{scale}]};
    });
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="flex-1 items-center justify-center"
        style={{paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8}}>
        <Animated.View style={labelStyle}>
          <AppText
            size="sm"
            weight="semibold"
            style={{color: isActive ? activeText : inactiveText}}
            className="tracking-wider">
            {label}
          </AppText>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const handleContainerLayout = useCallback(
    (e: any) => {
      containerWidth.value = e.nativeEvent.layout.width;
    },
    [containerWidth],
  );
  const palette = isDark ? AppColors.dark : AppColors.light;
  const bg = palette.bgSurface;
  const activeBg = palette.tabSelected;
  const activeText = palette.bgBase;
  const inactiveText = palette.heading;

  return (
    <View className="mt-2">
      <View
        onLayout={handleContainerLayout}
        className="flex-row rounded-md px-1 py-2"
        style={[
          {backgroundColor: bg, position: 'relative', overflow: 'hidden'},
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 8,
              bottom: 8,
              left: 4,
              borderRadius: 10,
              backgroundColor: activeBg,
            },
            translateXStyle,
            indicatorStyle,
          ]}
        />
        {tabs.map((t, i) => (
          <TabLabel
            key={t}
            label={t}
            index={i}
            isActive={i === activeIndex}
            onPress={() => onChange?.(i)}
            activeText={activeText}
            inactiveText={inactiveText}
          />
        ))}
      </View>
    </View>
  );
};

// ---------------- Modal (moved from WOD.tsx) ----------------
export const StatusInfoModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({visible, onClose}) => {
  if (!visible) return null;
  const currentYear = moment().year();
  const previousYear = currentYear - 1;
  return (
    <AppModal
      isOpen={visible}
      onClose={onClose}
      animationType="slide"
      modalWidth="86%"
      overlayClassName="items-center justify-center"
      cardClassName="p-0 overflow-hidden rounded-2xl"
      showCloseButton>
      <View className="px-5 pt-5 pb-4 border-b border-slate-200 flex-row items-center justify-between bg-white ">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-100 mr-4">
            <AppIcon
              type="materialIcons"
              name={'info'}
              size={20}
              color="#3B82F6"
            />
          </View>
          <AppText size="lg" weight="semibold" className="text-slate-800">
            Status Categorization
          </AppText>
        </View>
      </View>
      <View className="px-5 py-4 bg-white">
        <View className="rounded-xl border border-slate-200 overflow-hidden">
          <View className="flex-row bg-slate-50">
            <View className="w-1/3 px-3 py-3 border-r border-slate-200">
              <AppText
                size="xs"
                weight="semibold"
                className="uppercase tracking-wide text-slate-600">
                Status
              </AppText>
            </View>
            <View className="flex-1 flex-row">
              {[previousYear, currentYear].map(year => (
                <View
                  key={year}
                  className="flex-1 px-2 py-3 border-l border-slate-200 items-center justify-center">
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="uppercase tracking-wide text-slate-600">
                    {year}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
          {[
            {label: 'Active', color: 'text-green-600', checks: [true, true]},
            {
              label: 'Sleeping',
              color: 'text-blue-600',
              checks: [true, false],
            },
            {
              label: 'In-Active',
              color: 'text-red-600',
              checks: [false, false],
            },
          ].map((row, idx, arr) => (
            <View
              key={row.label}
              className={twMerge(
                'flex-row bg-white',
                idx !== arr.length - 1 && 'border-b border-slate-200',
              )}>
              <View className="w-1/3 px-3 py-3 border-r border-slate-200 justify-center">
                <AppText size="sm" weight="semibold" className={row.color}>
                  {row.label}
                </AppText>
              </View>
              <View className="flex-1 flex-row">
                {row.checks.map((val, i) => (
                  <View
                    key={i}
                    className="flex-1 items-center justify-center py-3 border-l border-slate-200">
                    {val ? (
                      <AppIcon
                        name="check"
                        type="feather"
                        size={20}
                        color="#16a34a"
                      />
                    ) : (
                      <AppIcon
                        name="x"
                        type="feather"
                        size={20}
                        color="#dc2626"
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </AppModal>
  );
};

export const WODSkeleton: React.FC = () => (
  <View className="flex-1 px-3 pt-2 bg-lightBg-base dark:bg-darkBg-base">
    <Skeleton width={screenWidth - 24} height={46} borderRadius={10} />
    <View className="flex-row mt-4 gap-2">
      <Skeleton
        width={(screenWidth - 24) * 0.82}
        height={44}
        borderRadius={8}
      />
      <Skeleton
        width={(screenWidth - 24) * 0.16}
        height={44}
        borderRadius={8}
      />
    </View>
    <Skeleton width={140} height={16} borderRadius={4} />
    <View className="mt-2">
      <Skeleton width={screenWidth - 24} height={140} borderRadius={12} />
    </View>
    <View className="mt-6">
      <Skeleton width={160} height={16} borderRadius={4} />
    </View>
    <View className="mt-3 gap-4">
      <Skeleton width={screenWidth - 24} height={120} borderRadius={16} />
      <Skeleton width={screenWidth - 24} height={120} borderRadius={16} />
      <Skeleton width={screenWidth - 24} height={120} borderRadius={16} />
    </View>
  </View>
);
