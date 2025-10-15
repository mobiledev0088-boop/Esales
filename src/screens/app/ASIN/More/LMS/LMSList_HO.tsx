import {View, FlatList, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager} from 'react-native';
import React, {useCallback, useMemo, useState} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {getPastQuarters} from '../../../../../utils/commonFunctions';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';

const TotalCount =  [
                {
                    TotalAGPRequest: 46,
                    TotalQtyRequested: 102
                }
            ]
const BranchWiseDetails = [
                {
                    AWPCode: "ASIN012547",
                    AWPName: "Alpha Computers",
                    BranchName: "ANDHRA_PRADESH",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 2
                },
                {
                    AWPCode: "ASIN015228",
                    AWPName: "Ansh Intermediate Services( P )Limited/Sagar Enterprises",
                    BranchName: "UP_UTTARANCHAL",
                    AGPRequestCnt: 5,
                    QtyRequestCnt: 7
                },
                {
                    AWPCode: "ASIN014699",
                    AWPName: "Arora IT Solution",
                    BranchName: "DELHI",
                    AGPRequestCnt: 2,
                    QtyRequestCnt: 6
                },
                {
                    AWPCode: "ASIN013207",
                    AWPName: "Compu Electronic",
                    BranchName: "NAGPUR_RAIPUR",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN017365",
                    AWPName: "E Computer",
                    BranchName: "JOB",
                    AGPRequestCnt: 3,
                    QtyRequestCnt: 3
                },
                {
                    AWPCode: "ASIN014799",
                    AWPName: "Emerge Digitech - AWP",
                    BranchName: "KERALA",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN005512",
                    AWPName: "Ipex Technologies",
                    BranchName: "KARNATAKA",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN001522",
                    AWPName: "Matrimangala Electronics",
                    BranchName: "NORTH_EAST",
                    AGPRequestCnt: 3,
                    QtyRequestCnt: 3
                },
                {
                    AWPCode: "ASIN012576",
                    AWPName: "Mrig Technologies",
                    BranchName: "KARNATAKA",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN013258",
                    AWPName: "MULTI LAPTOPS",
                    BranchName: "PUNE",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN004080",
                    AWPName: "NEW TRACK  COMPUTERS PVT LTD",
                    BranchName: "PUNE",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN004719",
                    AWPName: "Service Point",
                    BranchName: "ANDHRA_PRADESH",
                    AGPRequestCnt: 2,
                    QtyRequestCnt: 2
                },
                {
                    AWPCode: "ASIN012505",
                    AWPName: "Shree Balaji Infosolutions",
                    BranchName: "NAGPUR_RAIPUR",
                    AGPRequestCnt: 2,
                    QtyRequestCnt: 6
                },
                {
                    AWPCode: "ASIN016492",
                    AWPName: "Siddharth InfoSolution ",
                    BranchName: "NAGPUR_RAIPUR",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN004248",
                    AWPName: "SILVER CELLULAR",
                    BranchName: "NAGPUR_RAIPUR",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN016893",
                    AWPName: "Suntronic Computers - AWP",
                    BranchName: "RAJASTHAN",
                    AGPRequestCnt: 2,
                    QtyRequestCnt: 2
                },
                {
                    AWPCode: "ASIN001139",
                    AWPName: "Supreme Computers Pvt Ltd",
                    BranchName: "TAMILNADU",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN015146",
                    AWPName: "Suyash Computech",
                    BranchName: "KARNATAKA",
                    AGPRequestCnt: 2,
                    QtyRequestCnt: 2
                },
                {
                    AWPCode: "ASIN014081",
                    AWPName: "Technorama Computers",
                    BranchName: "NAGPUR_RAIPUR",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN005039",
                    AWPName: "THE MICROFRAME COMPUTERS MARKETING AND SERVICES",
                    BranchName: "ANDHRA_PRADESH",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN014671",
                    AWPName: "UMS Infotech",
                    BranchName: "TAMILNADU",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                },
                {
                    AWPCode: "ASIN005256",
                    AWPName: "Unicom services",
                    BranchName: "KARNATAKA",
                    AGPRequestCnt: 5,
                    QtyRequestCnt: 8
                },
                {
                    AWPCode: "ASIN015390",
                    AWPName: "Universal SystemS",
                    BranchName: "NORTH_EAST",
                    AGPRequestCnt: 3,
                    QtyRequestCnt: 36
                },
                {
                    AWPCode: "ASIN017283",
                    AWPName: "Venkatesha Systems - AWP SROM",
                    BranchName: "PUNE",
                    AGPRequestCnt: 3,
                    QtyRequestCnt: 12
                },
                {
                    AWPCode: "ASIN017220",
                    AWPName: "WIDE ANGLE TECHNOLOGIES",
                    BranchName: "DELHI",
                    AGPRequestCnt: 1,
                    QtyRequestCnt: 1
                }
            ]

export default function LMSList_HO() {

  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter]=useState<AppDropdownItem | null>(quarters[0] || null);
  return (
    <AppLayout title="LMS List" needBack>
      <View className="pt-5 pb-3 px-3">
        <View className="w-36 self-end pb-3">
          <AppDropdown
            data={quarters}
            selectedValue={selectedQuarter?.value || null}
            onSelect={setSelectedQuarter}
            mode="dropdown"
            placeholder="Select Quarter"
            style={{height: 36}}
          />
        </View>
                        {/* <SummarySection total={TotalCount} branches={BranchWiseDetails} /> */}
                        {/* <BranchExplorer rawData={BranchWiseDetails} /> */}
      </View>
    </AppLayout>
  );
}

// ---------------- Derived Utilities ----------------
type TotalType = {TotalAGPRequest: number; TotalQtyRequested: number};
type BranchDetail = {
    AWPCode: string;
    AWPName: string;
    BranchName: string;
    AGPRequestCnt: number;
    QtyRequestCnt: number;
};

// Color helper (simple scale based on percentage)
const getBarColor = (pct: number) => {
    if (pct >= 70) return 'bg-green-500 dark:bg-green-400';
    if (pct >= 40) return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-blue-500 dark:bg-blue-400';
};

// ---------------- Summary Section ----------------
const SummarySection: React.FC<{total: TotalType[]; branches: BranchDetail[]}> = ({
    total,
    branches,
}) => {
    const {totalAGP, totalQty, uniqueBranches} = useMemo(() => {
        const totalAGP = total?.[0]?.TotalAGPRequest || 0;
        const totalQty = total?.[0]?.TotalQtyRequested || 0;
        const uniqueBranches = new Set(branches.map(b => b.BranchName)).size;
        return {totalAGP, totalQty, uniqueBranches};
    }, [total, branches]);

    return (
        <View className="flex-row gap-3 mb-4">
            <Card className="flex-1 p-4 justify-between">
                <AppText size="sm" weight="medium" className="text-gray-500 dark:text-gray-400">
                    Total AGP Requests
                </AppText>
                <AppText size="3xl" weight="bold" className="mt-1">
                    {totalAGP}
                </AppText>
                <AppText size="xs" className="text-gray-400 mt-1" weight="medium">
                    Across {uniqueBranches} branches
                </AppText>
            </Card>
            <Card className="flex-1 p-4 justify-between">
                <AppText size="sm" weight="medium" className="text-gray-500 dark:text-gray-400">
                    Total Qty Requested
                </AppText>
                <AppText size="3xl" weight="bold" className="mt-1">
                    {totalQty}
                </AppText>
                <AppText size="xs" className="text-gray-400 mt-1" weight="medium">
                    Avg {(totalQty / Math.max(totalAGP, 1)).toFixed(1)} per request
                </AppText>
            </Card>
        </View>
    );
};

// ---------------- Branch Explorer (Merged + Expandable) ----------------
type MergedBranch = {
    branch: string;
    totalAGP: number;
    totalQty: number;
    awps: BranchDetail[];
};

// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//     UIManager.setLayoutAnimationEnabledExperimental(true);
// }

const BranchExplorer: React.FC<{rawData: BranchDetail[]}> = ({rawData}) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'qty' | 'agp' | 'name'>('qty');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const merged = useMemo<MergedBranch[]>(() => {
        const map = new Map<string, MergedBranch>();
        rawData.forEach(item => {
            const key = item.BranchName;
            if (!map.has(key)) {
                map.set(key, {branch: key, totalAGP: 0, totalQty: 0, awps: []});
            }
            const ref = map.get(key)!;
            ref.totalAGP += item.AGPRequestCnt;
            ref.totalQty += item.QtyRequestCnt;
            ref.awps.push(item);
        });
        let arr = Array.from(map.values());
        // Filter
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(
                b =>
                    b.branch.toLowerCase().includes(q) ||
                    b.awps.some(a => a.AWPName.toLowerCase().includes(q) || a.AWPCode.toLowerCase().includes(q)),
            );
        }
        // Sort
        arr.sort((a, b) => {
            switch (sortBy) {
                case 'agp':
                    return b.totalAGP - a.totalAGP;
                case 'name':
                    return a.branch.localeCompare(b.branch);
                case 'qty':
                default:
                    return b.totalQty - a.totalQty;
            }
        });
        return arr;
    }, [rawData, search, sortBy]);

    const grandTotals = useMemo(
        () => merged.reduce((acc, b) => {
            acc.agp += b.totalAGP;
            acc.qty += b.totalQty;
            return acc;
        }, {agp: 0, qty: 0}),
        [merged],
    );

    const toggle = useCallback((branch: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(branch) ? next.delete(branch) : next.add(branch);
            return next;
        });
    }, []);

    const renderItem = useCallback(
        ({item, index}: {item: MergedBranch; index: number}) => {
            const pct = grandTotals.qty ? (item.totalQty / grandTotals.qty) * 100 : 0;
            const isOpen = expanded.has(item.branch);
            return (
                <MergedBranchCard
                    data={item}
                    percentage={pct}
                    expanded={isOpen}
                    onToggle={() => toggle(item.branch)}
                    index={index}
                />
            );
        },
        [grandTotals.qty, expanded, toggle],
    );

    return (
        <View className="flex-1">
            <View className="mb-3">
                <Card className="p-3">
                    <View className="flex-row items-center">
                        <AppIcon name="search" type="feather" size={16} style={{marginRight: 8}} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search branch or AWP..."
                            placeholderTextColor={'#9ca3af'}
                            className="flex-1 text-sm"
                            style={{padding: 0, margin: 0}}
                            returnKeyType="search"
                        />
                    </View>
                    <View className="mt-3 flex-row justify-between">
                        <SortChip label="Qty" active={sortBy === 'qty'} onPress={() => setSortBy('qty')} />
                        <SortChip label="AGP" active={sortBy === 'agp'} onPress={() => setSortBy('agp')} />
                        <SortChip label="Name" active={sortBy === 'name'} onPress={() => setSortBy('name')} />
                    </View>
                </Card>
            </View>
            <FlatList
                data={merged}
                keyExtractor={i => i.branch}
                renderItem={renderItem}
                contentContainerStyle={{paddingBottom: 140}}
                ListEmptyComponent={
                    <Card className="p-6 mt-6 items-center">
                        <AppText weight="bold">No branches</AppText>
                        <AppText size="sm" className="text-gray-500 mt-1">
                            Adjust search or filters.
                        </AppText>
                    </Card>
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

// ---------------- Cards ----------------
const MergedBranchCard: React.FC<{
    data: MergedBranch;
    percentage: number;
    expanded: boolean;
    onToggle: () => void;
    index: number;
}> = React.memo(({data, percentage, expanded, onToggle}) => {
    const pctDisplay = percentage.toFixed(1);
    return (
        <Card className="mb-3 p-4">
            <TouchableOpacity
                onPress={onToggle}
                activeOpacity={0.7}
                className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                    <AppText weight="semibold" size="md">
                        {data.branch.replace(/_/g, ' ')}
                    </AppText>
                    <View className="flex-row items-center mt-1 flex-wrap">
                        <InfoPill label={`${data.awps.length} AWP`} />
                        <InfoPill label={`AGP ${data.totalAGP}`} />
                        <InfoPill label={`Qty ${data.totalQty}`} />
                        <InfoPill label={`${pctDisplay}%`} variant="soft" />
                    </View>
                </View>
                <View className="items-end">
                    <AppIcon
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        type="feather"
                        size={18}
                        color={expanded ? '#2563eb' : '#64748b'}
                    />
                </View>
            </TouchableOpacity>
            <View className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-3">
                <View
                    className={`h-full ${getBarColor(percentage)} rounded-full`}
                    style={{width: `${Math.min(percentage, 100)}%`}}
                />
            </View>
            {expanded && (
                <View className="mt-4">
                    {data.awps.map(a => (
                        <View
                            key={a.AWPCode}
                            className="flex-row justify-between mb-3 last:mb-0">
                            <View className="flex-1 pr-3">
                                <AppText size="sm" weight="medium" numberOfLines={1}>
                                    {a.AWPName}
                                </AppText>
                                <AppText size="xs" className="text-gray-500 mt-0.5">
                                    {a.AWPCode}
                                </AppText>
                            </View>
                            <View className="items-end">
                                <AppText weight="bold" size="sm">
                                    {a.QtyRequestCnt}
                                </AppText>
                                <AppText size="xs" className="text-gray-400 -mt-0.5">
                                    Qty
                                </AppText>
                                <AppText size="xs" className="text-gray-500 mt-0.5">
                                    AGP {a.AGPRequestCnt}
                                </AppText>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </Card>
    );
});

// Removed standalone AWPCard (integrated inside expanded branch)

// Sort Chip
const SortChip: React.FC<{label: string; active: boolean; onPress: () => void}> = ({
    label,
    active,
    onPress,
}) => (
    <TouchableOpacity
        onPress={onPress}
        className={`px-4 py-2 rounded-full mr-2 ${
            active
                ? 'bg-primary dark:bg-primary-dark'
                : 'bg-gray-200 dark:bg-gray-700'
        }`}
        accessibilityRole="button"
        accessibilityState={{selected: active}}>
        <AppText
            size="xs"
            weight="semibold"
            className={active ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>
            {label}
        </AppText>
    </TouchableOpacity>
);

// Info Pill
const InfoPill: React.FC<{label: string; variant?: 'solid' | 'soft'}> = ({
    label,
    variant = 'solid',
}) => (
    <View
        className={`px-2 py-1 rounded-full mr-2 mb-2 ${
            variant === 'solid'
                ? 'bg-gray-200 dark:bg-gray-700'
                : 'bg-blue-100 dark:bg-blue-900/40'
        }`}>
        <AppText size="xs" weight="medium" className="text-gray-700 dark:text-gray-200">
            {label}
        </AppText>
    </View>
);
