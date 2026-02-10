import {RefreshControl, ScrollView, TouchableOpacity, View} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import Accordion from '../../../../../components/Accordion';
import {useNavigation} from '@react-navigation/native';
import {APIResponse, AppNavigationProp} from '../../../../../types/navigation';
import {getShadowStyle} from '../../../../../utils/appStyles';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useQuery} from '@tanstack/react-query';
import {useState} from 'react';
import AppImage from '../../../../../components/customs/AppImage';

interface AllocationStatusType {
  Allocation_Id: number;
  Request_Id: string;
  Ticket_No: string;
  Partner_Code: string;
  Parent_Code: string;
  Sub_Code: string;
  Allocation_Remark: string;
  Allocation_Status: string;
  Logistics_Remark: string | null;
  CMKT_Remark: string | null;
  Shop_Expansion_Remark: string | null;
  AWB_Number: string | null;
  Courier_Company: string | null;
  User_Employee_Id: string;
  User_Name: string;
  User_Email: string;
  Uploaded_On: string;
  Sub_Request_Id: string;
  Allocation_Item: string;
  Stand_Type: string;
  Min_Validation: number;
  Max_Validation: number;
  Is_Image_Compulsory: boolean;
  Allocation_Qty: number;
  Image_Url: string;
  Image_Url_Path: string;
  Delivery_Status: string;
  Delivery_Remark: string;
  Delivery_Image_Url: string;
  Delivery_Image_Url_Path: string;
  Delivery_Uploaded_Time: string;
  ChannelMap_Code: string;
  Store_Name: string;
  Store_Address: string;
  Store_Pincode: string;
  Store_Type: string;
  Store_Email_Id: string;
  Store_Contact: string;
  Store_Region: string;
  Store_Branch: string;
  Store_Territory: string;
  Store_District: string;
  Store_State: string;
  Store_City: string;
  Branch_Product_Manager: string;
  Regional_Sales_Manager: string;
  Branch_Head: string;
  Territoty_Manager: string;
  CSE_Codes: string | null;
}

const useRequestNumbersList = () => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo || {},
  );

  return useQuery<AppDropdownItem[], Error>({
    queryKey: ['requestNumbers', employeeCode, RoleId],
    enabled: Boolean(employeeCode && RoleId),
    queryFn: async () => {
      const res = await handleASINApiCall<
        APIResponse<{RequestID: {Ticket_No: string; Request_Id: string}[]}>
      >('/StandPOSM/StandPOSMAllocation_RequestIDList', {
        employeeCode,
        RoleId,
      });

      const result = res?.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to load request numbers');
      }
      const requestList = result?.Datainfo?.RequestID ?? [];
      const uniqueRequestsMap = new Map<string, AppDropdownItem>();
      for (const {Request_Id, Ticket_No} of requestList) {
        if (
          Ticket_No &&
          Ticket_No.trim() !== '' &&
          !uniqueRequestsMap.has(Request_Id)
        ) {
          uniqueRequestsMap.set(Request_Id, {
            label: Ticket_No,
            value: Request_Id,
          });
        }
      }

      return Array.from(uniqueRequestsMap.values());
    },
  });
};

const useAllocationStatus = (RequestId: string) => {
  return useQuery({
    queryKey: ['allocationStatus', RequestId],
    enabled: !!RequestId,
    queryFn: async () => {
      const res = await handleASINApiCall<
        APIResponse<{AllocationStatus: AllocationStatusType[]}>
      >('/StandPOSM/StandPOSMAllocation_GetStatusDetails', {
        RequestId,
      },{},true);

      const result = res?.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to load allocation status');
      }

      const allocationData = result.Datainfo.AllocationStatus;
      return allocationData && allocationData.length > 0
        ? allocationData
        : null;
    },
  });
};

const getStatusStyling = (status: string) => {
  const normalizedStatus = status?.toLowerCase().trim() || '';
  
  if (normalizedStatus.includes('approved') || normalizedStatus.includes('delivered')) {
    return {
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-700',
    };
  }
  
  if (normalizedStatus.includes('pending') || normalizedStatus.includes('process')) {
    return {
      bg: 'bg-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
    };
  }
  
  if (normalizedStatus.includes('reject') || normalizedStatus.includes('cancel')) {
    return {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-700',
    };
  }
  
  return {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
  };
};

const formatDate = (dateString: string | null | undefined, includeTime = false): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return includeTime ? date.toLocaleString() : date.toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number | null | undefined;
  icon?: string;
}) => {
  if (!value && value !== 0) return null;

  return (
    <View className="flex-row items-start mb-3">
      {icon && (
        <View className="mr-2 mt-0.5">
          <AppIcon type="ionicons" name={icon} size={16} color="#00539B" />
        </View>
      )}
      <View className="flex-1">
        <AppText size="xs" color="gray" className="mb-0.5">
          {label}
        </AppText>
        <AppText size="sm" weight="semibold" className="text-gray-800">
          {value}
        </AppText>
      </View>
    </View>
  );
};

const StatusBadge = ({status}: {status: string}) => {
  if (!status) return null;
  
  const styling = getStatusStyling(status);
  
  return (
    <View className={`px-3 py-1.5 rounded-full border ${styling.bg} ${styling.border} self-start`}>
      <AppText size="xs" weight="semibold" className={styling.text}>
        {status}
      </AppText>
    </View>
  );
};

const CompactStatusBadge = ({status}: {status: string}) => {
  if (!status) return null;
  
  const styling = getStatusStyling(status);
  
  return (
    <View className={`px-2 py-0.5 rounded ${styling.bg}`}>
      <AppText size="xs" weight="medium" className={styling.text}>
        {status}
      </AppText>
    </View>
  );
};

const SectionHeader = ({title, icon}: {title: string; icon: string}) => (
  <View className="flex-row items-center mb-3">
    <View className="bg-primary/10 rounded-full p-2 mr-2">
      <AppIcon type="ionicons" name={icon} size={20} color="#00539B" />
    </View>
    <AppText size="lg" weight="bold" color="primary">
      {title}
    </AppText>
  </View>
);

const RemarkCard = ({
  icon,
  title,
  content,
  bgColor,
  borderColor,
  textColor,
}: {
  icon: string;
  title: string;
  content: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}) => (
  <View className={`mb-2 p-2 ${bgColor} rounded-lg border ${borderColor}`}>
    <View className="flex-row items-center mb-1">
      <AppIcon type="ionicons" name={icon} size={12} color={textColor.includes('gray') ? '#6B7280' : textColor.replace('text-', '#')} />
      <AppText size="xs" weight="semibold" className={`${textColor} ml-1`}>
        {title}
      </AppText>
    </View>
    <AppText size="xs" className="text-gray-700">
      {content}
    </AppText>
  </View>
);

const AllocationItemCard = ({item}: {item: AllocationStatusType}) => {
  // Validate item exists
  if (!item) return null;

  const hasDeliveryInfo = Boolean(
    item.Delivery_Status || item.AWB_Number || item.Delivery_Remark || item.Courier_Company || item.Delivery_Uploaded_Time
  );
  
  const hasImages = Boolean(item.Image_Url_Path || item.Delivery_Image_Url_Path);
  
  const hasRemarks = Boolean(
    item.Allocation_Remark ||
    item.Delivery_Remark ||
    item.Logistics_Remark ||
    item.CMKT_Remark ||
    item.Shop_Expansion_Remark
  );

  const AccordionHeader = (
    <View className="flex-1 flex-row items-center justify-between py-2 pr-2">
      <View className="flex-row items-center flex-1">
        <View className="flex-1">
          <AppText size="sm" weight="bold" className="text-gray-800" numberOfLines={1}>
            {item.Stand_Type || 'N/A'}
          </AppText>
          <AppText size="xs" color="gray" numberOfLines={1}>
            {item.Allocation_Item || 'No item specified'}
          </AppText>
        </View>
      </View>
      <View className="ml-2">
        <CompactStatusBadge status={item.Allocation_Status} />
      </View>
    </View>
  );

  return (
    <View className="mb-3">
      <Accordion
        header={AccordionHeader}
        initialOpening={false}
        duration={300}
        needShadow
        needBottomBorder={false}
        containerClassName="rounded-lg bg-white"
        headerClassName="px-3">
        <View className="px-4 pb-4 pt-2">
          {/* Allocation Details */}
          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <AppIcon type="ionicons" name="cube-outline" size={16} color="#00539B" />
              <AppText size="sm" weight="semibold" color="primary" className="ml-1">
                Allocation Details
              </AppText>
            </View>
            <InfoRow label="Sub Request ID" value={item.Sub_Request_Id} icon="layers" />
            <InfoRow label="Quantity" value={item.Allocation_Qty} icon="calculator" />
          </View>

          {/* Delivery Information */}
          {hasDeliveryInfo && (
            <View className="mb-3 pb-3 border-t border-gray-100 pt-3">
              <View className="flex-row items-center mb-2">
                <AppIcon type="ionicons" name="car-outline" size={16} color="#00539B" />
                <AppText size="sm" weight="semibold" color="primary" className="ml-1">
                  Delivery Information
                </AppText>
              </View>
              {item.Delivery_Status && (
                <View className="mb-2">
                  <AppText size="xs" color="gray" className="mb-1">
                    Delivery Status
                  </AppText>
                  <StatusBadge status={item.Delivery_Status} />
                </View>
              )}
              <InfoRow label="AWB Number" value={item.AWB_Number} icon="barcode" />
              <InfoRow label="Courier Company" value={item.Courier_Company} icon="airplane" />
              {item.Delivery_Uploaded_Time && (
                <InfoRow
                  label="Delivery Time"
                  value={formatDate(item.Delivery_Uploaded_Time, true)}
                  icon="time"
                />
              )}
            </View>
          )}

          {/* Images Section - Side by Side */}
          {hasImages && (
            <View className="mb-3 pb-3 border-t border-gray-100 pt-3">
              <View className="flex-row items-center mb-2">
                <AppIcon type="ionicons" name="images-outline" size={16} color="#00539B" />
                <AppText size="sm" weight="semibold" color="primary" className="ml-1">
                  Documentation Images
                </AppText>
              </View>
              <View className="flex-row gap-2">
                {item.Image_Url_Path && (
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <AppIcon type="ionicons" name="document-outline" size={12} color="#6B7280" />
                      <AppText size="xs" color="gray" className="ml-1">
                        Allocation
                      </AppText>
                    </View>
                    <AppImage
                      source={{uri: item.Image_Url_Path}}
                      style={{width: '100%', height: 140, borderRadius: 8}}
                      resizeMode="contain"
                      enableModalZoom
                    />
                  </View>
                )}
                {item.Delivery_Image_Url_Path && (
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <AppIcon type="ionicons" name="checkmark-circle-outline" size={12} color="#6B7280" />
                      <AppText size="xs" color="gray" className="ml-1">
                        Delivery
                      </AppText>
                    </View>
                    <AppImage
                      source={{uri: item.Delivery_Image_Url_Path}}
                      style={{width: '100%', height: 140, borderRadius: 8}}
                      resizeMode="contain"
                      enableModalZoom
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Remarks Section */}
          {hasRemarks && (
            <View className="border-t border-gray-100 pt-3">
              <View className="flex-row items-center mb-2">
                <AppIcon type="ionicons" name="chatbubbles-outline" size={16} color="#00539B" />
                <AppText size="sm" weight="semibold" color="primary" className="ml-1">
                  Remarks
                </AppText>
              </View>
              {item.Allocation_Remark && (
                <RemarkCard
                  icon="cube-outline"
                  title="Allocation Remark"
                  content={item.Allocation_Remark}
                  bgColor="bg-gray-50"
                  borderColor="border-gray-200"
                  textColor="text-gray-700"
                />
              )}
              {item.Delivery_Remark && (
                <RemarkCard
                  icon="car-outline"
                  title="Delivery Remark"
                  content={item.Delivery_Remark}
                  bgColor="bg-gray-50"
                  borderColor="border-gray-200"
                  textColor="text-gray-700"
                />
              )}
              {item.Logistics_Remark && (
                <RemarkCard
                  icon="cube-outline"
                  title="Logistics"
                  content={item.Logistics_Remark}
                  bgColor="bg-blue-50"
                  borderColor="border-blue-100"
                  textColor="text-blue-700"
                />
              )}
              {item.CMKT_Remark && (
                <RemarkCard
                  icon="pricetag-outline"
                  title="CMKT"
                  content={item.CMKT_Remark}
                  bgColor="bg-green-50"
                  borderColor="border-green-100"
                  textColor="text-green-700"
                />
              )}
              {item.Shop_Expansion_Remark && (
                <RemarkCard
                  icon="storefront-outline"
                  title="Shop Expansion"
                  content={item.Shop_Expansion_Remark}
                  bgColor="bg-purple-50"
                  borderColor="border-purple-100"
                  textColor="text-purple-700"
                />
              )}
            </View>
          )}
        </View>
      </Accordion>
    </View>
  );
};

const AllocationDetailsUI = ({data}: {data: AllocationStatusType[]}) => {
  const firstItem = data[0];

  return (
    <View className="flex-1 px-3 mt-4">
      {/* Request Overview Card - Common for all items */}
      <Card className="mb-4 p-4">
        <SectionHeader title="Request Overview" icon="document-text" />
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <InfoRow
              label="Ticket No"
              value={firstItem.Ticket_No}
              icon="ticket"
            />
            <InfoRow
              label="Request ID"
              value={firstItem.Request_Id}
              icon="barcode"
            />
          </View>
          <View className="w-1/2 pl-2">
            <InfoRow
              label="Uploaded On"
              value={formatDate(firstItem.Uploaded_On)}
              icon="calendar"
            />
            <InfoRow
              label="Partner Code"
              value={firstItem.Partner_Code}
              icon="business"
            />
          </View>
        </View>
        <View className="mt-2 p-3 bg-blue-50 rounded-lg">
          <View className="flex-row items-center">
            <AppIcon type="ionicons" name="layers" size={16} color="#00539B" />
            <AppText
              size="sm"
              weight="semibold"
              color="primary"
              className="ml-2">
              Total Allocations: {data.length}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Store Information Card - Common for all items */}
      <Card className="mb-4 p-4">
        <SectionHeader title="Store Information" icon="storefront" />
        <InfoRow
          label="Store Name"
          value={firstItem.Store_Name}
          icon="business"
        />
        <InfoRow label="Store Type" value={firstItem.Store_Type} icon="list" />
        <InfoRow
          label="Channel Map Code"
          value={firstItem.ChannelMap_Code}
          icon="map"
        />

        <View className="mt-2 p-3 bg-gray-50 rounded-lg">
          <AppText size="xs" color="gray" className="mb-1">
            Address
          </AppText>
          {firstItem.Store_Address && (
            <AppText size="sm" className="text-gray-700">
              {firstItem.Store_Address}
            </AppText>
          )}
          <AppText size="sm" className="text-gray-600 mt-1">
            {[firstItem.Store_City, firstItem.Store_State, firstItem.Store_Pincode]
              .filter(Boolean)
              .join(', ')}
          </AppText>
        </View>

        <View className="flex-row flex-wrap mt-3">
          <View className="w-1/2 pr-2">
            <InfoRow
              label="Contact"
              value={firstItem.Store_Contact}
              icon="call"
            />
            <InfoRow
              label="Region"
              value={firstItem.Store_Region}
              icon="globe"
            />
            <InfoRow
              label="Territory"
              value={firstItem.Store_Territory}
              icon="navigate"
            />
          </View>
          <View className="w-1/2 pl-2">
            <InfoRow
              label="Email"
              value={firstItem.Store_Email_Id}
              icon="mail"
            />
            <InfoRow
              label="Branch"
              value={firstItem.Store_Branch}
              icon="git-branch"
            />
            <InfoRow
              label="District"
              value={firstItem.Store_District}
              icon="location"
            />
          </View>
        </View>
      </Card>

      {/* Divider */}
      <View className="flex-row items-center mb-4">
        <View className="flex-1 h-px bg-gray-300" />
        <AppText size="sm" weight="semibold" className="text-gray-600 mx-3">
          Allocation Items
        </AppText>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* All Allocation Items */}
      {data.map((item, index) => (
        <AllocationItemCard
          key={`${item.Sub_Request_Id}-${index}`}
          item={item}
        />
      ))}
    </View>
  );
};

export default function StandPOSM() {
  const [selectedRequestId, setSelectedRequestId] =
    useState<AppDropdownItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<AppNavigationProp>();
  const {data, isLoading, refetch} = useRequestNumbersList();
  const {
    data: allocationStatusData,
    isLoading: isLoadingAllocationStatus,
    isError: isErrorAllocationStatus,
  } = useAllocationStatus(selectedRequestId?.value || '');

  const handleRefresh = () => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  };

  return (
    <AppLayout title="Stand POSM" needBack>
      <ScrollView 
      className="flex-1 mt-5 "
      contentContainerClassName='pb-24'
      refreshControl={
        <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      }
      >
        <View className="px-3">
          <AppDropdown
            data={data || []}
            mode="autocomplete"
            onSelect={setSelectedRequestId}
            placeholder={isLoading ? 'Loading...' : 'Select To View Details'}
            label="Request / Ticket Number"
            needIndicator
            allowClear
            disabled={isLoading}
            onClear={() => setSelectedRequestId(null)}
          />
        </View>

        {selectedRequestId?.value ? (
          isLoadingAllocationStatus ? (
            <View className="flex-1 items-center justify-center mt-10">
              <AppText size="base" color="gray" className="mt-3">
                Loading allocation details...
              </AppText>
            </View>
          ) : isErrorAllocationStatus ? (
            <View className="flex-1 items-center justify-center mt-10 px-6">
              <AppIcon
                type="ionicons"
                name="alert-circle"
                size={48}
                color="#EF4444"
              />
              <AppText size="base" color="error" className="mt-3 text-center">
                Failed to load allocation status
              </AppText>
              <AppText size="sm" color="gray" className="mt-2 text-center">
                Please try again later
              </AppText>
            </View>
          ) : allocationStatusData && allocationStatusData.length > 0 ? (
            <AllocationDetailsUI data={allocationStatusData} />
          ) : (
            <View className="flex-1 items-center justify-center mt-10 px-6">
              <AppIcon
                type="ionicons"
                name="document-text-outline"
                size={48}
                color="#9CA3AF"
              />
              <AppText size="base" color="gray" className="mt-3 text-center">
                No data found for this request
              </AppText>
            </View>
          )
        ) : (
          <View className="items-center justify-center px-6 mt-40">
            <AppIcon type="ionicons" name="search" size={64} color="#9CA3AF" />
            <AppText size="lg" weight="semibold" className="text-gray-700 mt-4">
              Select a Request
            </AppText>
            <AppText size="sm" color="gray" className="mt-2 text-center">
              Choose a request number from the dropdown above to view allocation
              details
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* (FAB) Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-16 h-16 bg-primary rounded-full shadow-lg items-center justify-center"
        style={getShadowStyle(5)}
        activeOpacity={0.8}
        onPress={() => navigation.push('AddNewStandPOSM')}>
        <AppIcon type="ionicons" name="add" size={28} color="white" />
      </TouchableOpacity>
    </AppLayout>
  );
}