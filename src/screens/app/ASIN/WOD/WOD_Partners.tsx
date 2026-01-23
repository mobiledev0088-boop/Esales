import {FlatList, TouchableOpacity, View} from 'react-native';
import {useMemo, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import moment from 'moment';

import AppLayout from '../../../../components/layout/AppLayout';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import AppIcon from '../../../../components/customs/AppIcon';
import {normalizeStatus, STAT_PALETTE} from './components';
import {twMerge} from 'tailwind-merge';
import { AppNavigationProp } from '../../../../types/navigation';

interface WODPartnerItem {
  ACM_ShopName: string;
  ACM_ChannelMapCode: string;
  Year_On_Year_Status: string;
  Quarter_On_Quarter_Status: string;
  Month_On_Month_Status: string;
  Sellout_Date: string | null;
  GST_Number: string;
}

interface WODPartnersRouteParams {
  branchName: string;
  territoryName: string;
  tm_name: string;
  CSEName: string;
  activeTab: number;
  GST_Number: string;
  data: WODPartnerItem[];
}

type dropdown = AppDropdownItem | null;

const STATUS_CONFIG = [
  {key: 'Year_On_Year_Status' as const, label: 'Year-on-Year'},
  {key: 'Quarter_On_Quarter_Status' as const, label: 'Quarter-on-Quarter'},
  {key: 'Month_On_Month_Status' as const, label: 'Month-on-Month'},
];

export default function WOD_Partners() {
  const navigation = useNavigation<AppNavigationProp>();
  const {params} = useRoute();
  const {CSEName, branchName, data, territoryName, tm_name, activeTab} =
    params as WODPartnersRouteParams;

  const [selectedPartnerCode, setSelectedPartnerCode] =
    useState<dropdown>(null);
  const [selectedStatus, setSelectedStatus] = useState<dropdown>(null);

  const dropdownItems: AppDropdownItem[] = useMemo(
    () =>
      data?.map(item => ({
        label: item.ACM_ShopName,
        value: item.ACM_ChannelMapCode,
      })) || [],
    [data],
  );

  const filteredPartners = useMemo(() => {
    let temp = data;
    if (selectedPartnerCode?.value) {
      temp = temp.filter(
        partner => partner.ACM_ChannelMapCode === selectedPartnerCode.value,
      );
    }
    if (selectedStatus?.value) {
      const statusKey = STATUS_CONFIG[activeTab]?.key;
      temp = temp.filter(partner => {
        const currentStatus = partner[statusKey];
        const bucket = normalizeStatus(currentStatus as any);
        return bucket === selectedStatus.value;
      });
    }
    return temp;
  }, [data, activeTab, selectedPartnerCode?.value, selectedStatus?.value]);

  const currentStatusConfig = STATUS_CONFIG[activeTab] || STATUS_CONFIG[0];

  const totals = useMemo(() => {
    const summary = {active: 0, sleeping: 0, inactive: 0};
    data.forEach(item => {
      const raw = item[currentStatusConfig.key];
      const bucket = normalizeStatus(raw as any);
      if (bucket && summary[bucket] !== undefined) {
        summary[bucket] += 1;
      }
    });
    return summary;
  }, [data, currentStatusConfig.key]);

  const activeModeShort = useMemo(
    () => (activeTab === 0 ? 'YoY' : activeTab === 1 ? 'QoQ' : 'MoM'),
    [activeTab],
  );

  const handlePress = (item: WODPartnerItem) => {
    const name =`${item.ACM_ShopName} - ${item.GST_Number} - ${branchName}`
    navigation.push('ChannelMap',{
        activeTab: 1,
        AGP_PartnerName: name,
        AGP_PartnerCode: item.GST_Number,
    })
  };

  const renderPartnerCard = ({item}: {item: WODPartnerItem}) => {
    const currentStatus = item[currentStatusConfig.key];
    const bucket = normalizeStatus(currentStatus as any);
    const statusColorClass =
      bucket === 'active'
        ? 'text-green-600'
        : bucket === 'sleeping'
          ? 'text-blue-600'
          : bucket === 'inactive'
            ? 'text-red-600'
            : 'text-slate-600';

    const formattedSelloutDate = item.Sellout_Date
      ? moment(item.Sellout_Date).format('DD-MM-YYYY')
      : 'N/A';

    return (
      <TouchableOpacity className="mb-3" onPress={() => handlePress(item)}>
        <Card>
          {/* Shop name */}
          <View className="flex-row items-center justify-between">
            <AppText
              size="md"
              weight="semibold"
              className="text-slate-800"
              numberOfLines={2}>
              {item.ACM_ShopName}
            </AppText>
            {/* Chevron icon */}
            <View className="w-7 h-7 items-center justify-center bg-slate-100 rounded-full">
              <AppIcon
                name="chevron-right"
                type="feather"
                size={20}
                color="#9CA3AF"
                style={{marginLeft: 1}}
              />
            </View>
          </View>

          {/* Code / Status / Date row */}
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-1 ">
              <AppText size="xs" color="gray" className="uppercase">
                Code
              </AppText>
              <AppText size="sm" numberOfLines={1}>
                {item.ACM_ChannelMapCode || '-'}
              </AppText>
            </View>

            <View className="flex-1 items-center">
              <AppText size="xs" color="gray" className="uppercase">
                SellOut Date
              </AppText>
              <AppText size="sm" numberOfLines={1}>
                {formattedSelloutDate}
              </AppText>
            </View>

            <View className="flex-1 items-center">
              <AppText size="xs" color="gray" className="uppercase">
                Status
              </AppText>
              <AppText
                size="sm"
                weight="medium"
                className={statusColorClass}
                numberOfLines={1}>
                {currentStatus || '-'}
              </AppText>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout title="WOD Partners" needBack>
      {/* Summary Card */}
      <Card
        className="mx-3 mt-4 border border-slate-200 dark:border-slate-700"
        noshadow>
        <AppText className="mb-2" weight="semibold" size="lg">
          Summary
        </AppText>
        <View className="flex-row flex-wrap gap-y-3">
          <View className="w-1/2 pr-3">
            <AppText size="xs" color="gray" className="uppercase">
              Branch
            </AppText>
            <AppText size="sm" weight="medium" numberOfLines={1}>
              {branchName || '-'}
            </AppText>
          </View>

          <View className="w-1/2 pl-3">
            <AppText size="xs" color="gray" className="uppercase">
              Territory
            </AppText>
            <AppText size="sm" weight="medium" numberOfLines={1}>
              {territoryName || '-'}
            </AppText>
          </View>

          <View className="w-1/2 pr-3">
            <AppText size="xs" color="gray" className="uppercase">
              TM Name
            </AppText>
            <AppText size="sm" weight="medium" numberOfLines={1}>
              {tm_name || '-'}
            </AppText>
          </View>

          <View className="w-1/2 pl-3">
            <AppText size="xs" color="gray" className="uppercase">
              CSE Name
            </AppText>
            <AppText size="sm" weight="medium" numberOfLines={1}>
              {CSEName || '-'}
            </AppText>
          </View>
        </View>

        <View className="mt-4 border-b border-gray-200 pb-2" />
        <View className="pt-3 flex-row">
          {(['active', 'sleeping', 'inactive'] as const).map((key, idx) => {
            const value = totals[key];
            const palette = STAT_PALETTE[idx % STAT_PALETTE.length];
            return (
              <View key={key} className="flex-1 items-center">
                <View
                  className={twMerge(
                    'w-10 h-10 rounded-xl items-center justify-center mb-1',
                    palette.iconBg,
                  )}>
                  <AppIcon
                    name={palette.icon as any}
                    type="feather"
                    size={18}
                    color="white"
                  />
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  className={twMerge('uppercase tracking-wide', palette.tint)}>
                  {key}
                </AppText>
                <AppText
                  size="xl"
                  weight="semibold"
                  className={twMerge('leading-tight', palette.tint)}>
                  {value}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>
      {/* Filter */}
      <View className="mt-3 mb-3 mx-3 flex-row items-center justify-between">
        <AppDropdown
          data={dropdownItems}
          mode="autocomplete"
          placeholder="Select Partner"
          label="Partner"
          allowClear
          selectedValue={selectedPartnerCode?.value}
          onSelect={setSelectedPartnerCode}
          style={{width: '59%'}}
        />
        <AppDropdown
          data={[
            {label: 'Active', value: 'active'},
            {label: 'Sleeping', value: 'sleeping'},
            {label: 'Inactive', value: 'inactive'},
          ]}
          mode="dropdown"
          placeholder="Select Status"
          label="Status"
          allowClear
          selectedValue={selectedStatus?.value}
          onSelect={setSelectedStatus}
          style={{width: '40%'}}
        />
      </View>
      <FlatList
        data={filteredPartners}
        keyExtractor={(item, index) =>
          `${item.ACM_ChannelMapCode || 'partner'}_${index}`
        }
        renderItem={renderPartnerCard}
        contentContainerStyle={{paddingBottom: 16, paddingHorizontal: 12}}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
      />
    </AppLayout>
  );
}
