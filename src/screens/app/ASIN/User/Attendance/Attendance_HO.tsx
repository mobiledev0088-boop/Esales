import {FlatList, TouchableOpacity, View} from 'react-native';
import {useMemo, useState, useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';

import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import Accordion from '../../../../../components/Accordion';
import AppIcon from '../../../../../components/customs/AppIcon';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {DataStateView} from '../../../../../components/DataStateView';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {AppNavigationProp} from '../../../../../types/navigation';
import {screenWidth} from '../../../../../utils/constant';
import {useGetAttendanceHistory} from './component';
import {ASEData} from './utils';

const PAGE_SIZE = 10;

type BranchGroup = {
  Branch_Name: string;
  ASE: ASEData[];
};
type BranchAccordionProps = {
  branch: BranchGroup;
  onPressASE: (ase: ASEData, branchName: string) => void;
};

const formatBranchName = (raw: string) => raw.replace(/_/g, ' ');

const AttendanceHOBranchSkeleton = () => {
  const cardWidth = screenWidth - 20;
  return (
    <View className="px-3 mt-4">
      <Skeleton width={cardWidth} height={50} borderRadius={12} />
      <View className="mt-4">
        {[...Array(5)].map((_, index) => (
          <Skeleton
            key={index}
            width={cardWidth}
            height={80}
            borderRadius={12}
          />
        ))}
      </View>
    </View>
  );
};

const BranchAccordion = ({branch, onPressASE}: BranchAccordionProps) => {
  const totalItems = branch.ASE.length;
  const [visibleCount, setVisibleCount] = useState(
    Math.min(PAGE_SIZE, totalItems),
  );

  const pagedItems = useMemo(() => {
    return branch.ASE.slice(0, visibleCount || 0);
  }, [branch.ASE, visibleCount]);

  const isAtEnd = visibleCount >= totalItems;

  const handleSeeMoreLess = useCallback(() => {
    if (!totalItems) return;
    if (isAtEnd) {
      // Reset back to initial batch
      setVisibleCount(Math.min(PAGE_SIZE, totalItems));
      return;
    }
    setVisibleCount(prev =>
      Math.min(prev + PAGE_SIZE, totalItems || PAGE_SIZE),
    );
  }, [isAtEnd, totalItems]);

  const displayName = formatBranchName(branch.Branch_Name);
  const startIndex = totalItems === 0 ? 0 : 1;
  const endIndex = Math.min(visibleCount, totalItems);

  return (
    <Accordion
      header={
        <View className="flex-row items-center flex-1">
          <View className="h-9 w-9 rounded-full items-center justify-center bg-emerald-50 dark:bg-emerald-900/40 mr-3">
            <AppIcon
              type="feather"
              name="map-pin"
              size={18}
              style={{color: '#047857'}}
            />
          </View>
          <View className="flex-1">
            <AppText
              weight="semibold"
              size="lg"
              className="text-slate-900 dark:text-slate-50">
              {displayName}
            </AppText>
            <View className='flex-row items-center gap-x-1'>
              <AppIcon
                type="feather"
                name="users"
                size={14}
                style={{color: '#6B7280'}}
              />
            <AppText size="sm" className="text-slate-500 mt-0.5">
              {totalItems} ASE{totalItems !== 1 ? 's' : ''}
            </AppText>
            </View>
          </View>
        </View>
      }
      needShadow
      needBottomBorder={false}
      containerClassName="rounded-2xl bg-lightBg-surface dark:bg-darkBg-surface"
      contentClassName="px-3 mx-3"
      headerClassName="pt-2">
      {pagedItems.map(item => (
        <TouchableOpacity
          key={item.AIM_IChannelID}
          activeOpacity={0.7}
          onPress={() => onPressASE(item, displayName)}
          className="mb-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl flex-row items-center justify-between">
          <View className="flex-1 mr-3 flex-row items-center">
            <View className="h-9 w-9 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800 mr-3">
              <AppIcon
                type="feather"
                name="user"
                size={18}
                style={{color: '#4B5563'}}
              />
            </View>
            <View className="flex-1">
              <AppText
                weight="semibold"
                size="md"
                className="text-slate-900 dark:text-slate-50">
                {item.AIM_ISPName}
              </AppText>
              <View className="flex-row items-center mt-0.5">
                <AppIcon
                  type="entypo"
                  name="shop"
                  size={14}
                  style={{color: '#6B7280', marginRight: 4}}
                />
                <AppText size="sm" className="text-slate-500">
                  {item.AIM_DealerName}
                </AppText>
              </View>
              <View className="flex-row flex-wrap mt-2 gap-1.5">
                <View className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 flex-row items-center">
                  <AppIcon
                    type="feather"
                    name="map"
                    size={12}
                    style={{color: '#6B7280', marginRight: 4}}
                  />
                  <AppText
                    size="xs"
                    className="text-slate-700 dark:text-slate-200">
                    {item.AIM_Territory}
                  </AppText>
                </View>
                <View className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex-row items-center">
                  <AppIcon
                    type="feather"
                    name="hash"
                    size={12}
                    style={{color: '#047857', marginRight: 4}}
                  />
                  <AppText
                    size="xs"
                    className="text-emerald-700 dark:text-emerald-300">
                    {item.AIM_IChannelID}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
          <View className="items-end">
            <AppIcon
              type="feather"
              name="chevron-right"
              size={22}
              style={{color: '#9CA3AF'}}
            />
          </View>
        </TouchableOpacity>
      ))}
      {totalItems > 0 && (
        <View className="py-3 flex-row items-center justify-between">
          <AppText size="xs" className="text-slate-500">
            Showing {startIndex}–{endIndex} of {totalItems}
          </AppText>
          <TouchableOpacity
            disabled={totalItems <= PAGE_SIZE}
            onPress={handleSeeMoreLess}
            activeOpacity={0.8}
            className={`px-4 py-1.5 rounded-full border flex-row items-center justify-center ${
              totalItems <= PAGE_SIZE
                ? 'border-slate-100 bg-slate-50 dark:bg-slate-900/40 opacity-50'
                : 'border-slate-300 bg-white dark:bg-neutral-900'
            }`}>
            <AppText
              size="xs"
              className="mr-1 text-slate-700 dark:text-slate-200">
              {isAtEnd ? 'See Less' : 'See More'}
            </AppText>
            <AppIcon
              type="feather"
              name={isAtEnd ? 'chevron-up' : 'chevron-down'}
              size={16}
              style={{color: '#6B7280'}}
            />
          </TouchableOpacity>
        </View>
      )}
    </Accordion>
  );
};

export default function Attendance_HO() {
  const navigation = useNavigation<AppNavigationProp>();
  const {data, isLoading, error} = useGetAttendanceHistory();
  const [selectedASE, setSelectedASE] = useState<AppDropdownItem | null>(null);

  const attendanceData: BranchGroup[] = useMemo(
    () => data?.ASE_List ?? [],
    [data?.ASE_List],
  );

  const aseOptions: AppDropdownItem[] = useMemo(() => {
    const options: AppDropdownItem[] = [];
    attendanceData.forEach(branch => {
      branch.ASE.forEach(ase => {
        options.push({
          label: `${ase.AIM_ISPName} · ${ase.AIM_DealerName} (${formatBranchName(branch.Branch_Name)})`,
          value: ase.AIM_IChannelID,
          branchName: branch.Branch_Name,
          ase,
        });
      });
    });
    return options;
  }, [attendanceData]);

  const handlePressASE = useCallback(
    (ase: ASEData, branchName: string) => {
      navigation.navigate('Attendance', {
        iChannelCode: ase.AIM_IChannelID,
        aseName: ase.AIM_ISPName,
        branchName,
      });
    },
    [navigation],
  );

  const handleDropdownSelect = useCallback((item: AppDropdownItem | null) => {
    setSelectedASE(item);
  }, []);

  const filteredData: BranchGroup[] = useMemo(() => {
    if (!selectedASE) return attendanceData;
    const targetBranch = selectedASE.branchName as string;
    const targetCode = selectedASE.value as string;
    return attendanceData
      .map(branch => {
        if (branch.Branch_Name !== targetBranch) return null;
        const matched = branch.ASE.filter(
          ase => ase.AIM_IChannelID === targetCode,
        );
        if (!matched.length) return null;
        return {
          Branch_Name: branch.Branch_Name,
          ASE: matched,
        };
      })
      .filter(Boolean) as BranchGroup[];
  }, [attendanceData, selectedASE]);

  const renderItem = useCallback(
    ({item}: {item: BranchGroup}) => (
      <BranchAccordion branch={item} onPressASE={handlePressASE} />
    ),
    [handlePressASE],
  );

  return (
    <AppLayout title="Attendance ASE List" needBack needPadding={false}>
      <DataStateView
        isLoading={isLoading}
        isError={!!error}
        isEmpty={!isLoading && !error && filteredData.length === 0}
        LoadingComponent={<AttendanceHOBranchSkeleton />}>
        <View className="px-3 py-4">
          <AppDropdown
            data={aseOptions}
            onSelect={handleDropdownSelect}
            selectedValue={selectedASE?.value ?? null}
            mode="autocomplete"
            placeholder="Search or select ASE"
            allowClear
            searchPlaceholder="Type ASE name, dealer or code"
            needIndicator
          />
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={item => item.Branch_Name}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 24, paddingHorizontal: 12}}
          ItemSeparatorComponent={() => <View className="h-3" />}
        />
      </DataStateView>
    </AppLayout>
  );
}
