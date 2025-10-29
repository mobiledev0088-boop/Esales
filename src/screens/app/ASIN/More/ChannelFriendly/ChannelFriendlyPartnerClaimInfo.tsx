import {FlatList, View, Pressable} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {
  APIResponse,
  AppNavigationParamList,
  AppNavigationProp,
} from '../../../../../types/navigation';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import React, {useMemo, useState, useCallback, memo} from 'react';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import Skeleton from '../../../../../components/skeleton/skeleton';
import moment from 'moment';

interface ClaimInfoItem {
  APCAE_Id: number;
  Received_YearQtr: string;
  Received_Date: string;
  Branch_Name: string;
  Branch_Head: string;
  Territory_Name: string;
  Territory_Manager: string;
  Partner_Type: string;
  Parent_Code: string;
  Parent_Name: string;
  Sub_Code: string;
  SubCode_Name: string;
  T3_Partner_Name: string;
  End_Cust_Invoice_Date: string;
  Serial_No: string;
  Model_Name: string;
  Activation_status: string;
  Activation_Date: string;
  Online_SRP: string;
  eTailer_Code: string;
  eTailer_Name: string;
  Seller_ASIN_Code: string;
  Seller_Name: string;
  T2_Invoice_Copy: string;
  Photo_Copy: string;
  Screenshot_Copy: string;
  T3_Invoice_Copy: string;
  BoxSrNo_Copy: string;
  ALP_Team_Status: string;
  ALP_Team_Status_Update_On: string;
  ALP_Team_Special_Approval_Status: string;
  Claim_Team_Status: any;
  ChannelFriendlyClaim_Status: string;
  Pre_Tax_Amount: any;
  Tax_Amount: any;
  Post_Tax_Amount: any;
  IsEditAllowed: string;
}

interface ChannelFriendlyPartnerClaimInfo {
  List: ClaimInfoItem[];
}

interface SummaryCardProps {
  title: string;
  count: number;
  color: string;
  icon: string;
  iconType: IconType;
  legend?: string;
}

interface ClaimCardProps {
  item: ClaimInfoItem;
  onPress: () => void;
}

interface InfoRowProps {
  label: string;
  value: string | number;
  icon?: string;
  iconType?: IconType;
}

interface StatusBadgeProps {
  status: string;
}

// Constants
const STATUS_CONFIG: Record<
  string,
  {color: string; icon: string; iconType: IconType; legend: string}
> = {
  'Waiting for Reviewer': {
    color: AppColors.warning,
    icon: 'hourglass-outline',
    iconType: 'ionicons',
    legend: 'WR',
  },
  'Under Review': {
    color: AppColors.utilColor2,
    icon: 'sync',
    iconType: 'ionicons',
    legend: 'UR',
  },
  'CN Under Process': {
    color: AppColors.utilColor1,
    icon: 'checkmark-circle',
    iconType: 'ionicons',
    legend: 'UP',
  },
  Rejected: {
    color: AppColors.error,
    icon: 'close-circle',
    iconType: 'ionicons',
    legend: 'Rejected',
  },
};

// Custom Hooks
const useGetChannelFriendlyPartnerClaimInfo = (
  YearQtr: string,
  PartnerCode: string,
) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const UserName = userInfo?.EMP_Code || '';
  const RoleId = userInfo?.EMP_RoleId || '';

  return useQuery({
    queryKey: [
      'channelFriendlyPartnerClaimInfo',
      YearQtr,
      UserName,
      RoleId,
      PartnerCode,
    ],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_Detail_PartnerWise',
        {
          UserName,
          RoleId,
          YearQtr,
          PartnerCode,
        },
      )) as APIResponse<ChannelFriendlyPartnerClaimInfo>;

      const result = response.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch data');
      }
      return result.Datainfo?.List || [];
    },
  });
};

const useClaimSummary = (data: ClaimInfoItem[]) => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalClaims: 0,
        statusCounts: {},
      };
    }

    const statusCounts: Record<string, number> = {};

    data.forEach(item => {
      const status = item.ChannelFriendlyClaim_Status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      totalClaims: data.length,
      statusCounts,
    };
  }, [data]);
};

const useFilteredClaims = (
  data: ClaimInfoItem[],
  searchSerial: string,
  selectedStatus: AppDropdownItem | null,
) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    let filtered = [...data];

    // Filter by serial number
    if (searchSerial.trim()) {
      filtered = filtered.filter(item =>
        item.Serial_No?.toLowerCase().includes(searchSerial.toLowerCase()),
      );
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(
        item => item.ChannelFriendlyClaim_Status === selectedStatus.value,
      );
    }

    return filtered;
  }, [data, searchSerial, selectedStatus]);
};

const useStatusOptions = (data: ClaimInfoItem[]): AppDropdownItem[] => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const uniqueStatuses = Array.from(
      new Set(
        data.map(item => item.ChannelFriendlyClaim_Status).filter(Boolean),
      ),
    );

    return uniqueStatuses
      .sort((a, b) => a.localeCompare(b))
      .map(status => ({
        label: status,
        value: status,
      }));
  }, [data]);
};

const useSerialOptions = (data: ClaimInfoItem[]): AppDropdownItem[] => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const uniqueSerials = Array.from(
      new Set(data.map(item => item.Serial_No).filter(Boolean)),
    );

    return uniqueSerials
      .sort((a, b) => a.localeCompare(b))
      .map(serial => ({
        label: serial,
        value: serial,
      }));
  }, [data]);
};

// Components
const StatusBadge: React.FC<StatusBadgeProps> = memo(({status}) => {
  const config = STATUS_CONFIG[status] || {
    color: '#6B7280',
    icon: 'help-circle',
    iconType: 'ionicons' as IconType,
  };

  return (
    <View
      className="flex-row items-center px-3 py-1.5 rounded-full"
      style={{backgroundColor: config.color + '20'}}>
      <AppIcon
        name={config.icon}
        type={config.iconType}
        size={14}
        color={config.color}
      />
      <AppText
        size="xs"
        weight="semibold"
        style={{color: config.color, marginLeft: 4}}>
        {status}
      </AppText>
    </View>
  );
});

const InfoRow: React.FC<InfoRowProps> = memo(
  ({label, value, icon, iconType}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <View className="flex-row items-center mb-2">
        {icon && iconType && (
          <AppIcon
            name={icon}
            type={iconType}
            size={14}
            color={theme.text}
            style={{opacity: 0.6, marginRight: 6}}
          />
        )}
        <AppText
          size="xs"
          style={{color: theme.text, opacity: 0.7, flex: 1}}
          numberOfLines={1}>
          {label}:
        </AppText>
        <AppText
          size="xs"
          weight="semibold"
          style={{color: theme.text, flex: 2}}
          numberOfLines={1}>
          {value || 'N/A'}
        </AppText>
      </View>
    );
  },
);

const ClaimCard: React.FC<ClaimCardProps> = memo(({item, onPress}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center">
              <AppText size="base" weight="bold" style={{color: theme.heading}}>
                {item.Model_Name || 'Unknown Model'}
              </AppText>
            </View>
            <View className="flex-row items-center mt-1 ">
              <AppIcon
                name="barcode"
                type="material-community"
                size={16}
                color={theme.text}
                style={{opacity: 0.6, marginTop: 2}}
              />
              <AppText size="xs" style={{color: theme.text, marginLeft: 4}}>
                {item.Serial_No}
              </AppText>
            </View>
          </View>
          <StatusBadge status={item.ChannelFriendlyClaim_Status} />
        </View>

        {/* Divider */}
        <View
          className="h-px mb-3"
          style={{backgroundColor: theme.border, opacity: 0.3}}
        />

        {/* Info Section */}
        <View className="space-y-2">
          <InfoRow
            label="Partner"
            value={item.Parent_Name}
            icon="people-outline"
            iconType="ionicons"
          />
          <InfoRow
            label="Seller"
            value={`${item.eTailer_Name || 'N/A'} | ${item.Seller_Name || 'N/A'}`}
            icon="storefront-outline"
            iconType="ionicons"
          />
          <InfoRow
            label="T3 Partner"
            value={item.T3_Partner_Name}
            icon="person-outline"
            iconType="ionicons"
          />
          <InfoRow
            label="Branch"
            value={item.Branch_Name}
            icon="business-outline"
            iconType="ionicons"
          />
          <InfoRow
            label="Territory"
            value={item.Territory_Name}
            icon="location-outline"
            iconType="ionicons"
          />
        </View>

        {/* Dates Section */}
        <View className="flex-row justify-between pt-3">
          <View className="flex-1 mr-2">
            <AppText size="xs" style={{color: theme.text, marginBottom: 2}}>
              Received Date
            </AppText>
            <AppText size="xs" weight="semibold" style={{color: theme.text}}>
              {moment(item.Received_Date).format('DD-MMM-YYYY') || 'N/A'}
            </AppText>
          </View>
          {item.Activation_Date && (
            <View className="flex-1">
              <AppText
                size="xs"
                style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                Activation Date
              </AppText>
              <AppText size="xs" weight="semibold" style={{color: theme.text}}>
                {moment(item.Activation_Date).format('DD-MMM-YYYY') || 'N/A'}
              </AppText>
            </View>
          )}
        </View>

        {/* Tap to view indicator */}
        <View
          className="mt-3 pt-2 flex-row items-center justify-center"
          style={{borderTopWidth: 0.3, borderTopColor: theme.border}}>
          <AppText size="sm" color="primary" className="underline">
            Tap to view details
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
});

const SummaryCard: React.FC<SummaryCardProps> = memo(
  ({title, count, color, icon, iconType, legend}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <View className="w-1/4 items-center">
        <View className="flex-row items-start justify-between mb-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{backgroundColor: color + '20'}}>
            <AppIcon name={icon} type={iconType} size={22} color={color} />
          </View>
        </View>
        <AppText size="xl" weight="bold" style={{color, marginBottom: 2}}>
          {count !== undefined && count !== null
            ? count.toLocaleString()
            : 'N/A'}
        </AppText>
        <View className="items-center">
          <AppText
            size="sm"
            weight="semibold"
            className="text-center h-10"
            style={{color: theme.text, opacity: 0.8}}>
            {title}
          </AppText>
          {legend && (
            <View
              className="mt-1 px-2 py-0.5 rounded"
              style={{backgroundColor: color + '10'}}>
              <AppText
                size="sm"
                weight="bold"
                className="text-center"
                style={{color: color}}>
                {legend}
              </AppText>
            </View>
          )}
        </View>
      </View>
    );
  },
);

const SummarySection: React.FC<{
  totalClaims: number;
  statusCounts: Record<string, number>;
}> = memo(({totalClaims, statusCounts}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  // Define the 4 main statuses we want to display
  const mainStatuses = [
    'Waiting for Reviewer',
    'Under Review',
    'CN Under Process',
    'Rejected',
  ];

  return (
    <Card className="mb-4">
      {/* Total Claims */}
      <View
        className="pb-2 mb-2 flex-row items-center gap-1"
        style={{borderBottomWidth: 1, borderBottomColor: theme.border}}>
        <AppText size="sm" color="text">
          Total Claims -
        </AppText>
        <AppText size="base" weight="bold">
          {totalClaims.toLocaleString()}
        </AppText>
      </View>

      {/* Status Breakdown - Only show the 4 main statuses */}
      <View className="flex-row flex-wrap justify-between">
        {mainStatuses.map(status => {
          const count = statusCounts[status] || 0;
          const config = STATUS_CONFIG[status] || {
            color: '#6B7280',
            icon: 'help-circle',
            iconType: 'ionicons' as IconType,
            legend: 'N/A',
          };
          return (
            <SummaryCard
              key={status}
              title={status}
              count={count}
              color={config.color}
              icon={config.icon}
              iconType={config.iconType}
              legend={config.legend}
            />
          );
        })}
      </View>
    </Card>
  );
});

const FilterSection: React.FC<{
  searchSerial: string;
  onSearchSerialChange: (text: string) => void;
  selectedStatus: AppDropdownItem | null;
  onStatusSelect: (item: AppDropdownItem | null) => void;
  statusOptions: AppDropdownItem[];
  serialOptions: AppDropdownItem[];
}> = memo(
  ({
    searchSerial,
    onSearchSerialChange,
    selectedStatus,
    onStatusSelect,
    statusOptions,
    serialOptions,
  }) => {
    return (
      <View className="flex-row justify-between mb-4 px-3">
        <View style={{width: '56%'}}>
          <AppDropdown
            data={serialOptions}
            mode="autocomplete"
            placeholder="Search Serial No"
            searchPlaceholder="Type serial number..."
            onSelect={item => onSearchSerialChange(item?.value || '')}
            selectedValue={searchSerial || null}
            zIndex={5000}
            listHeight={150}
            label="Serial Number"
            allowClear
            onClear={() => onSearchSerialChange('')}
          />
        </View>
        <View style={{width: '40%'}}>
          <AppDropdown
            data={statusOptions}
            mode="dropdown"
            placeholder="Select Status"
            searchPlaceholder="Search status..."
            onSelect={onStatusSelect}
            selectedValue={selectedStatus?.value || null}
            zIndex={4000}
            listHeight={200}
            label="Claim Status"
            allowClear
            onClear={() => onStatusSelect(null)}
          />
        </View>
      </View>
    );
  },
);

const LoadingSkeleton = () => (
  <View className="p-4">
    <View className="mb-4">
      <Skeleton height={200} borderRadius={12} />
    </View>
    <View className="mb-4">
      <Skeleton height={150} borderRadius={12} />
    </View>
    <View className="mb-3">
      <Skeleton height={180} borderRadius={12} />
    </View>
    <View className="mb-3">
      <Skeleton height={180} borderRadius={12} />
    </View>
    <Skeleton height={180} borderRadius={12} />
  </View>
);

const EmptyState: React.FC<{message?: string}> = ({
  message = 'No claims found',
}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  return (
    <View className="items-center justify-center py-12">
      <AppIcon
        name="document-text-outline"
        type="ionicons"
        size={64}
        color={theme.text}
        style={{opacity: 0.3, marginBottom: 16}}
      />
      <AppText
        size="lg"
        weight="semibold"
        style={{color: theme.text, opacity: 0.5}}>
        {message}
      </AppText>
    </View>
  );
};

const ErrorState: React.FC<{retry: () => void}> = ({retry}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  return (
    <View className="items-center justify-center py-12">
      <AppIcon
        name="alert-circle-outline"
        type="ionicons"
        size={64}
        color={AppColors.error}
        style={{marginBottom: 16}}
      />
      <AppText
        size="lg"
        weight="semibold"
        style={{color: theme.text, marginBottom: 8}}>
        Failed to load claims
      </AppText>
      <Pressable
        onPress={retry}
        className="px-6 py-3 rounded-lg mt-4"
        style={{backgroundColor: AppColors.primary}}>
        <AppText size="sm" weight="semibold" className="text-white">
          Retry
        </AppText>
      </Pressable>
    </View>
  );
};

export default function ChannelFriendlyPartnerClaimInfo() {
  const {params} =
    useRoute<
      RouteProp<AppNavigationParamList, 'ChannelFriendlyPartnerClaimInfo'>
    >();
  const navigation = useNavigation<AppNavigationProp>();
  const {partnerCode, yearQTR} = params;

  const {
    data: claimData,
    isLoading,
    isError,
    refetch,
  } = useGetChannelFriendlyPartnerClaimInfo(yearQTR, partnerCode);

  // State
  const [searchSerial, setSearchSerial] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AppDropdownItem | null>(
    null,
  );

  // Computed values
  const {totalClaims, statusCounts} = useClaimSummary(claimData || []);
  const statusOptions = useStatusOptions(claimData || []);
  const serialOptions = useSerialOptions(claimData || []);
  const filteredClaims = useFilteredClaims(
    claimData || [],
    searchSerial,
    selectedStatus,
  );

  // Handlers
  const handleClaimPress = useCallback((item: ClaimInfoItem) => {
    navigation.push('ChannelFriendlyClaimView',{data:item});
  }, []);

  const renderClaimItem = useCallback(
    ({item}: {item: ClaimInfoItem}) => (
      <ClaimCard item={item} onPress={() => handleClaimPress(item)} />
    ),
    [handleClaimPress],
  );

  const keyExtractor = useCallback(
    (item: ClaimInfoItem) => item.APCAE_Id.toString(),
    [],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <SummarySection totalClaims={totalClaims} statusCounts={statusCounts} />
    ),
    [totalClaims, statusCounts],
  );

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null;
    return (
      <EmptyState
        message={
          searchSerial || selectedStatus
            ? 'No claims match your filters'
            : 'No claims found'
        }
      />
    );
  }, [isLoading, searchSerial, selectedStatus]);

  return (
    <AppLayout title="Partner Claims" needBack>
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState retry={refetch} />
      ) : (
        <View>
          <FilterSection
            searchSerial={searchSerial}
            onSearchSerialChange={setSearchSerial}
            selectedStatus={selectedStatus}
            onStatusSelect={setSelectedStatus}
            statusOptions={statusOptions}
            serialOptions={serialOptions}
          />
          <FlatList
            data={filteredClaims}
            renderItem={renderClaimItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{paddingHorizontal: 12, paddingBottom: 80}}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </View>
      )}
    </AppLayout>
  );
}
