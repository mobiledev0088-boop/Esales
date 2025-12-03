import {useRoute} from '@react-navigation/native';
import AppLayout from '../../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import {handleAPACApiCall} from '../../../../../../utils/handleApiCall';
import {FlatList, View, RefreshControl} from 'react-native';
import {useMemo, useState, useCallback} from 'react';
import Card from '../../../../../../components/Card';
import AppText from '../../../../../../components/customs/AppText';
import AppDropdown from '../../../../../../components/customs/AppDropdown';
import moment from 'moment';
import Skeleton from '../../../../../../components/skeleton/skeleton';
import { screenWidth } from '../../../../../../utils/constant';

interface SelloutInfo {
  BranchName: string;
  Company_ID: string;
  Employee_Code: string;
  Final_remark: string;
  Model_Name: string;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  Promter_Name: string;
  Sellout_category: string;
  Serial_count: string;
  Uploaded_Date: string;
  activatedate: string;
  selloutToCompanyId: string | null;
}

const useGetSerialNoInfo = ({
  PartnerCode,
  Year_Qtr,
  StartDate,
  EndDate,
}: {
  PartnerCode: string;
  Year_Qtr: string;
  StartDate: string;
  EndDate: string;
}) => {
  const dataToSend = {
    employeeCode: PartnerCode,
    YearQtr: Year_Qtr,
    StartDate: StartDate,
    EndDate: EndDate,
  };
  return useQuery<SelloutInfo[]>({
    queryKey: ['SelloutInfo', PartnerCode, Year_Qtr, StartDate, EndDate],
    queryFn: async () => {
      const res = await handleAPACApiCall(
        '/Information/GetSelloutSerialNoInfoNew',
        dataToSend,
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      return result?.Datainfo?.Sellout_Info || [];
    },
  });
};

export default function SelloutInfo() {
  const {params} = useRoute();
  const ParmasData = params as {
    type: string;
    PartnerCode: string;
    Year_Qtr: string;
    StartDate: string;
    EndDate: string;
  };
  const {PartnerCode, Year_Qtr, StartDate, EndDate} = ParmasData;
  const {data: selloutInfoData = [], isLoading, refetch} = useGetSerialNoInfo({
    PartnerCode,
    Year_Qtr,
    StartDate,
    EndDate,
  });

  const [selectedSerialNo, setSelectedSerialNo] = useState<string | null>(null);

  // Get common data from first item
  const commonData = useMemo(() => {
    if (!selloutInfoData || selloutInfoData.length === 0) return null;
    const firstItem = selloutInfoData[0];
    return {
      category: firstItem.Sellout_category,
      partnerName: firstItem.PartnerName,
      employeeCode: firstItem.Employee_Code,
    };
  }, [selloutInfoData]);

  // Generate filter options from serial numbers
  const filterOptions = useMemo(() => {
    const serialNumbers = new Set<string>();
    selloutInfoData?.forEach(item => {
      if (item.Serial_count) {
        serialNumbers.add(item.Serial_count);
      }
    });
    return [
      ...Array.from(serialNumbers)
        .sort((a, b) => Number(a) - Number(b))
        .map(serial => ({label: serial, value: serial})),
    ];
  }, [selloutInfoData]);

  // Filter data based on selected serial number
  const filteredData = useMemo(() => {
    if (!selectedSerialNo) return selloutInfoData;
    return selloutInfoData?.filter(
      item => item.Serial_count === selectedSerialNo,
    );
  }, [selloutInfoData, selectedSerialNo]);

  // Determine text color for final_remark
  const getRemarkColor = useCallback((remark: string) => {
    const lowerRemark = remark?.toLowerCase() || '';
    if (lowerRemark.includes('point is valid')) {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-blue-600 dark:text-blue-400';
  }, []);

  // Reusable data row component to reduce repetition
  const DataRow = useCallback(
    ({
      label,
      value,
      valueWeight = 'medium',
    }: {
      label: string;
      value: string;
      valueWeight?: 'medium' | 'bold' | 'semibold';
    }) => (
      <View className="flex-row justify-between py-1">
        <AppText size="sm" color="gray" className="flex-1">
          {label}
        </AppText>
        <AppText size="sm" weight={valueWeight} className="flex-1 text-right">
          {value}
        </AppText>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({item}: {item: SelloutInfo}) => (
      <Card className="mb-3">
        <View className="gap-y-2">
          {/* Header Section */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <AppText size="base" weight="bold" className="mb-1">
                {item.Model_Name}
              </AppText>
            </View>
          </View>

          {/* Details Grid */}
          <View className="border-t border-gray-200 dark:border-gray-700">
            <DataRow label="Branch" value={item.BranchName} />
            <DataRow label="Partner Type" value={item.PartnerType} />
            <DataRow
              label="Serial Count"
              value={item.Serial_count}
              valueWeight="bold"
            />
            <DataRow
              label="Uploaded Date"
              value={moment(item.Uploaded_Date).format('YYYY-MM-DD')}
            />
            {item.activatedate && (
              <DataRow
                label="Activation Date"
                value={moment(item.activatedate).format('YYYY-MM-DD')}
              />
            )}
          </View>

          {/* Final Remark Section */}
          {item.Final_remark && (
            <View className="mt-3 pt-1 border-t border-gray-200 dark:border-gray-700">
              <AppText size="xs" color="gray" className="-mb-1">
                Remark
              </AppText>
              <AppText
                size="sm"
                weight="bold"
                className={getRemarkColor(item.Final_remark)}>
                {item.Final_remark}
              </AppText>
            </View>
          )}
        </View>
      </Card>
    ),
    [getRemarkColor, DataRow],
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View className="flex-1 justify-center items-center py-20">
        <AppText size="base" weight="semibold" color="gray">
          No sellout information found
        </AppText>
      </View>
    ),
    [],
  );

  const renderSkeleton = useCallback(
    () => (
      <View className="flex-1 mt-4 px-4">
        <Skeleton width={screenWidth - 32} height={50} borderRadius={8} />
        <View className="gap-3 mt-4">
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              width={screenWidth - 32}
              height={150}
              borderRadius={8}
            />
          ))}
        </View>
      </View>
    ),
    [],
  );

  return (
    <AppLayout title="Sellout Info" needBack needPadding={false}>
      <View className="flex-1">
        {/* Common Information Card */}
        {commonData && (
          <View className="px-4 pt-4 pb-2 bg-lightBg-background dark:bg-darkBg-background">
            <Card className="mb-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <AppText size="base" weight="bold" color="primary">
                    {commonData.partnerName}
                  </AppText>
                  <AppText size="xs" color="gray" className="mt-0.5">
                    {commonData.category}
                  </AppText>
                </View>
                <View className="bg-primary/10 dark:bg-primary-dark/10 px-3 py-1.5 rounded-full">
                  <AppText size="xs" weight="semibold" color="primary">
                    {commonData.employeeCode}
                  </AppText>
                </View>
              </View>
            </Card>
          </View>
        )}

        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
            {/* Filter Section */}
            <View className="px-4 pb-2 bg-lightBg-background dark:bg-darkBg-background">
              <AppDropdown
                data={filterOptions}
                selectedValue={selectedSerialNo}
                onSelect={item => setSelectedSerialNo(item?.value || null)}
                mode="dropdown"
                placeholder="Filter by serial number"
                label="Serial Number Filter"
                allowClear={true}
                onClear={() => setSelectedSerialNo(null)}
                zIndex={2000}
              />
            </View>

            {/* Results Count */}
            <View className="px-4 py-2 bg-lightBg-background dark:bg-darkBg-background">
              <AppText size="sm" color="gray">
                Showing {filteredData?.length || 0} of{' '}
                {selloutInfoData?.length || 0} items
              </AppText>
            </View>

            {/* List */}
            <FlatList
              data={filteredData}
              keyExtractor={(item, index) =>
                `${item.PartnerCode}-${item.Model_Name}-${index}`
              }
              renderItem={renderItem}
              contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 8}}
              ListEmptyComponent={renderEmptyComponent}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={refetch}
                  colors={['#007BE5']}
                  tintColor="#007BE5"
                />
              }
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </AppLayout>
  );
}