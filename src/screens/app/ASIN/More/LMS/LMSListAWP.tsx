import {View, FlatList} from 'react-native';
import {useCallback} from 'react';
import moment from 'moment';
import AppLayout from '../../../../../components/layout/AppLayout';
import Card from '../../../../../components/Card';
import Accordion from '../../../../../components/Accordion';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {DataStateView} from '../../../../../components/DataStateView';
import {screenWidth} from '../../../../../utils/constant';

// API Response Data Type
interface LMSLeadItem {
  GSTNo?: string;
  PartnerName: string;
  ChannelMapCode?: string;
  PartnerType?: string;
  ModelName?: string;
  Quantity?: number;
  Received_On?: string;
  ReceivedDate?: string;
  ReceivedTime?: string;
}

interface GroupedData {
  partnerName: string;
  items: LMSLeadItem[];
  gst: string;
}

const useGetRequestedQuantityList = () => {
  const Code = useLoginStore(state => state.userInfo.EMP_Code);
  return useQuery({
    queryKey: ['LMS_LeadTracking_AWP', Code],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/LMS/GetLMSAGPRequestedQuantity_InfoList',
        {Code},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch LMS list');
      }
      return (result.Datainfo?.AGPRequestedQuantityList || []) as LMSLeadItem[];
    },
    enabled: !!Code,
    select: data => {
      const grouped = data.reduce(
        (acc, item) => {
          const partnerName = item.PartnerName || 'Unknown Partner';

          if (!acc[partnerName]) {
            acc[partnerName] = {
              partnerName,
              items: [],
              gst: item.GSTNo || 'N/A',
            };
          }

          acc[partnerName].items.push(item);
          return acc;
        },
        {} as Record<string, GroupedData>,
      );
      return Object.values(grouped);
    },
  });
};

export default function LMSListAWP() {
  const {data, isLoading, error} = useGetRequestedQuantityList();
  console.log('LMSListAWP Data:', data);

  // Format date using moment
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD/MM/YYYY');
  }, []);

  // Format time
  const formatTime = useCallback((timeString?: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  }, []);

  // Render skeleton loader
  const renderSkeleton = () => (
    <View className="px-4 pt-4">
      {[1, 2, 3, 4, 5].map(index => (
        <View key={index} className="mb-3">
          <Skeleton width={screenWidth - 14} height={80} borderRadius={12} />
        </View>
      ))}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <AppIcon type="feather" name="inbox" size={64} color="#9CA3AF" />
      <AppText size="lg" weight="semibold" className="text-gray-500 mt-4">
        No Data Available
      </AppText>
      <AppText size="sm" className="text-gray-400 mt-2 text-center px-8">
        There are no lead tracking records to display at this moment.
      </AppText>
    </View>
  );

  // Render detail row
  const renderDetailRow = (
    icon: string,
    label: string,
    value?: string | number,
    iconType: any = 'feather',
  ) => (
    <View className="flex-row items-start mb-3">
      <View className="w-8 items-center pt-0.5">
        <AppIcon type={iconType} name={icon} size={18} color="#6B7280" />
      </View>
      <View className="flex-1">
        <AppText size="xs" weight="medium" className="text-gray-500 mb-0.5">
          {label}
        </AppText>
        <AppText size="sm" weight="semibold" className="text-gray-800">
          {value || 'N/A'}
        </AppText>
      </View>
    </View>
  );

  // Render single item details
  const renderItemDetails = useCallback(
    (item: LMSLeadItem, index: number) => (
      <View
        key={index}
        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-3 mx-2">
        {/* Item Badge */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="bg-blue-500 rounded-full px-3 py-1">
              <AppText size="xs" weight="bold" className="text-white">
                #{index + 1}
              </AppText>
            </View>
            {item.PartnerType && (
              <View className="bg-purple-100 rounded-full px-3 py-1 ml-2">
                <AppText
                  size="xs"
                  weight="semibold"
                  className="text-purple-700">
                  {item.PartnerType}
                </AppText>
              </View>
            )}
          </View>
          {item.Quantity && (
            <View className="bg-green-100 rounded-full px-3 py-1">
              <AppText size="xs" weight="bold" className="text-green-700">
                Qty: {item.Quantity}
              </AppText>
            </View>
          )}
        </View>

        {/* Details Grid */}
        <View className="border-t border-gray-200 pt-3">
          {renderDetailRow('box', 'Model Name', item.ModelName)}
          {renderDetailRow('hash', 'Channel Map Code', item.ChannelMapCode)}
          {/* {renderDetailRow('file-text', 'GST Number', item.GSTNo, 'feather')} */}

          {/* Date & Time Row */}
          <View className="flex-row items-start">
            <View className="flex-1 pr-2">
              {renderDetailRow(
                'calendar',
                'Received Date',
                formatDate(item.Received_On),
              )}
            </View>
            <View className="flex-1 pl-2">
              {renderDetailRow(
                'clock',
                'Received Time',
                formatTime(item.ReceivedTime),
              )}
            </View>
          </View>
        </View>
      </View>
    ),
    [formatDate, formatTime],
  );

  // Render accordion header
  const renderAccordionHeader = (group: GroupedData) => (
    <View className="flex-1 py-2">
      <View className="flex-1 flex-row items-center gap-x-2">
        <AppText size="base" weight="bold" className="text-gray-900">
          {group.partnerName}
        </AppText>
        <AppText size="sm" className="text-gray-600">
          ({group.gst})
        </AppText>
      </View>
      <View className="flex-row items-center mt-1">
        <AppIcon type="feather" name="package" size={14} color="#6B7280" />
        <AppText size="xs" className="text-gray-600 ml-1">
          {group.items.length} {group.items.length === 1 ? 'record' : 'records'}
        </AppText>
      </View>
    </View>
  );

  // Render accordion item
  const renderAccordionItem = useCallback(
    ({item}: {item: GroupedData}) => (
      <Card
        className="mb-3 border border-slate-200 dark:border-slate-700 p-1"
        noshadow>
        <Accordion
          header={renderAccordionHeader(item)}
          needBottomBorder={false}>
          {item.items.map((record, index) => renderItemDetails(record, index))}
        </Accordion>
      </Card>
    ),
    [renderItemDetails],
  );

  // Key extractor
  const keyExtractor = useCallback((item: GroupedData) => item.partnerName, []);
  const renderListHeader = () => (
    <View className="mb-4">
      <AppText size="xl" weight="bold" className="text-gray-900">
        Requests List
      </AppText>
    </View>
  );

  return (
    <AppLayout title="LMS Lead Tracking List" needBack>
      <DataStateView
        isLoading={isLoading}
        isError={!!error}
        isEmpty={!data?.length}
        LoadingComponent={renderSkeleton()}
        EmptyComponent={renderEmptyState()}>
        <FlatList
          data={data}
          renderItem={renderAccordionItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 12}}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </DataStateView>
    </AppLayout>
  );
}