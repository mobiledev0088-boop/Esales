// ChannelFriendlyClaimViewALP Screen
import {memo, useState, useCallback} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {getDeviceId} from 'react-native-device-info';
import moment from 'moment';
import AppLayout from '../../../../../components/layout/AppLayout';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import AppImage from '../../../../../components/customs/AppImage';
import {showConfirmationSheet} from '../../../../../components/ConfirmationSheet';
import {AppColors} from '../../../../../config/theme';
import {showToast} from '../../../../../utils/commonFunctions';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useLoaderStore} from '../../../../../stores/useLoaderStore';
import {AppNavigationProp} from '../../../../../types/navigation';
import {CHANNEL_FRIENDLY_QUERY_KEY} from './ChannelFriendlyClaimListALP';

// TYPE DEFINITIONS
interface ChannelFriendlyDataItem {
  eTailer_Name: string;
  Seller_Name: string;
  Online_SRP: string;
  Model_Name: string;
  Serial_No: string;
  End_Cust_Invoice_Date: string;
  T3_Invoice_Copy: string;
  T2_Invoice_Copy: string;
  Photo_Copy: string;
  BoxSrNo_Copy: string;
  Screenshot_Copy: string;
}

interface RouteParams {
  data: ChannelFriendlyDataItem;
  yearQTR: string;
}

interface SectionHeaderProps {
  title: string;
  icon: string;
  iconType: IconType;
}

interface InfoItemProps {
  label: string;
  value: string | number;
  icon?: string;
  iconType?: IconType;
  valueColor?: string;
}

interface ImageCardProps {
  title: string;
  imageUrl: string;
  icon: string;
}

interface SSNUpdatePayload {
  SSN: string;
  EndCustomerInvoiceDate: string;
  eTailerSRP: string;
  ALP_Claim_Status: string;
  ALP_Special_Approval_Cases: string;
  UserName: string;
}

interface NotificationPayload {
  MsgTitle: string;
  MsgBody: string;
  EmployeeCode: string;
  NotificationName: string;
  NotificationType: string;
  NotificationReceiver: string[];
  HighlitedValue: string;
  MachineName: string;
}

// CUSTOM HOOKS - API MUTATIONS
const useSSNUpdateStatusALPTeam = (
  navigation: AppNavigationProp,
  sendNotificationMutate: () => void,
  callBack: () => void,
) => {
  return useMutation({
    mutationFn: async (payload: SSNUpdatePayload) => {
      const res = await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_SSN_Update_Status_ALP_Team',
        payload);
      return res.DashboardData;
    },
    onSuccess: result => {
      if (result?.Status) {
        sendNotificationMutate();
        callBack();
        showToast('Claim status updated successfully');
        navigation.goBack();
      } else {
        showToast('Claim status update failed. Please try again.');
      }
    },
    onError: () => {
      showToast('An error occurred. Please try again.');
    },
  });
};

const useSendCFClaimALPNotification = (
  serialNo: string,
  claimStatus: string,
  employeeCode: string,
) => {
  const payload: NotificationPayload = {
    MsgTitle: `Channel friendly Claim of SN - ${serialNo} ${claimStatus} by ALP Team.`,
    MsgBody: `Channel friendly Claim of SN - ${serialNo} ${claimStatus} by ALP Team. Click to Check & Proceed further.`,
    EmployeeCode: employeeCode,
    NotificationName: 'Channel_Friendly_Claim_ALPStatus',
    NotificationType: 'Channel_Friendly_Claim',
    NotificationReceiver: [],
    HighlitedValue: serialNo,
    MachineName: getDeviceId(), 
  };

  return useMutation({
    mutationFn: async () => {
      const res = await handleASINApiCall(
        '/PushNotification/SendChannelFriendlyClaimNotification',
        payload,
      );
      return res;
    },
  });
};

// UI COMPONENTS
const SectionHeader: React.FC<SectionHeaderProps> = memo(
  ({title, icon, iconType}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
          style={{backgroundColor: AppColors.primary + '20'}}>
          <AppIcon
            name={icon}
            type={iconType}
            size={18}
            color={AppColors.primary}
          />
        </View>
        <AppText size="lg" weight="bold" style={{color: theme.heading}}>
          {title}
        </AppText>
      </View>
    );
  },
);

const InfoItem: React.FC<InfoItemProps> = memo(
  ({label, value, icon, iconType, valueColor}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <View className="mb-3">
        <View className="flex-row items-center mb-1">
          {icon && iconType && (
            <AppIcon
              name={icon}
              type={iconType}
              size={14}
              color={theme.text}
              style={{opacity: 0.5, marginRight: 4}}
            />
          )}
          <AppText
            size="xs"
            weight="medium"
            style={{color: theme.text, opacity: 0.6}}>
            {label}
          </AppText>
        </View>
        <AppText
          size="sm"
          weight="semibold"
          style={{color: valueColor || theme.text, marginLeft: icon ? 18 : 0}}>
          {value || 'N/A'}
        </AppText>
      </View>
    );
  },
);

const ImageCard: React.FC<ImageCardProps> = memo(({title, imageUrl, icon}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  // Display placeholder when no image is available
  if (!imageUrl) {
    return (
      <View style={{width: '48%', marginBottom: 12}}>
        <View className="flex-row items-center mb-2">
          <AppIcon
            name={icon}
            type="material-community"
            size={14}
            color={theme.text}
            style={{opacity: 0.5}}
          />
          <AppText
            size="xs"
            weight="semibold"
            style={{color: theme.text, marginLeft: 4}}
            numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <View
          className="rounded-xl items-center justify-center"
          style={{backgroundColor: theme.text + '10', aspectRatio: 3 / 4}}>
          <AppIcon
            name="image-off"
            type="material-community"
            size={32}
            color={theme.text}
            style={{opacity: 0.3}}
          />
          <AppText
            size="xs"
            style={{color: theme.text, opacity: 0.5, marginTop: 4}}>
            No image
          </AppText>
        </View>
      </View>
    );
  }

  // Display image with zoom capability
  return (
    <View style={{width: '48%', marginBottom: 12}}>
      <View className="flex-row items-center mb-2">
        <AppIcon
          name={icon}
          type="material-community"
          size={14}
          color={AppColors.primary}
        />
        <AppText
          size="xs"
          weight="semibold"
          style={{color: theme.text, marginLeft: 4}}
          numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <AppImage
        source={{uri: imageUrl}}
        style={{width: '100%', aspectRatio: 3 / 4}}
        resizeMode="cover"
        enableModalZoom
      />
    </View>
  );
});

// MAIN COMPONENT
export default function ChannelFriendlyClaimViewALP() {
  // HOOKS & STATE
  const navigation = useNavigation<AppNavigationProp>();
  const {params} = useRoute();
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];
  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Extract user information
  const userInfo = useLoginStore(state => state.userInfo);
  const UserName = userInfo?.EMP_Name.split('_')[0] || '';
  const EmployeeCode = userInfo?.EMP_Code || '';
  const RoleId = userInfo?.EMP_RoleId || '';

  // Extract route parameters with type safety
  const {data, yearQTR} = (params || {}) as RouteParams;

  // Local state for form inputs
  const [onlineSRP, setOnlineSRP] = useState(data?.Online_SRP || '');
  const [claimStatus, setClaimStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  // Notification mutation hook - initialized with claim data
  const notificationMutation = useSendCFClaimALPNotification(
    data?.Serial_No || '',
    claimStatus,
    EmployeeCode,
  );

  // Callback to refresh summary after successful update using query invalidation
  const refreshSummary = useCallback(() => {
    // Invalidate the query to refetch data when navigating back
    queryClient.invalidateQueries({
      queryKey: [CHANNEL_FRIENDLY_QUERY_KEY, yearQTR, EmployeeCode, RoleId],
    });
  }, [queryClient, yearQTR, EmployeeCode, RoleId]);

  // Main mutation for updating claim status
  const {mutate: updateClaimStatus} = useSSNUpdateStatusALPTeam(
    navigation,
    () => notificationMutation.mutate(),
    refreshSummary,
  );


  // Handle accept button click
  const handleAccept = useCallback(() => {
    setClaimStatus('Accepted');
    setRemarks(''); // Clear remarks when accepting
  }, []);

  // Handle reject button click
  const handleReject = useCallback(() => {
    setClaimStatus('Rejected');
  }, []);

  // Validate and submit claim decision
  const handleSubmit = useCallback(() => {
    const {setGlobalLoading} = useLoaderStore.getState();

    // Prepare payload for API call
    const payload: SSNUpdatePayload = {
      SSN: data.Serial_No || '',
      EndCustomerInvoiceDate: data.End_Cust_Invoice_Date || '',
      eTailerSRP: onlineSRP || '',
      ALP_Claim_Status: `${claimStatus}${remarks ? ' - ' + remarks : ''}`,
      ALP_Special_Approval_Cases: '',
      UserName: UserName,
    };

    // Show global loader during API call
    setGlobalLoading(true);

    // Execute mutation
    updateClaimStatus(payload, {
      onSettled: () => {
        // Hide loader after request completes (success or error)
        setGlobalLoading(false);
      },
    });
  }, [data, onlineSRP, claimStatus, remarks, UserName, updateClaimStatus]);

  // Show confirmation dialog before submitting
  const handleConfirmation = useCallback(() => {
    // Validation: Check if Online SRP is provided
    if (!onlineSRP.trim()) {
      showToast('Please enter the Online SRP value.');
      return;
    }

    // Validation: Check if remarks provided for rejection
    if (claimStatus === 'Rejected' && !remarks.trim()) {
      showToast('Please enter remarks for rejection.');
      return;
    }

    // Show confirmation sheet
    showConfirmationSheet({
      title: 'Submit Claim Decision',
      message: `Are you sure you want to ${claimStatus.toLowerCase()} this claim?`,
      onConfirm: handleSubmit,
      confirmText: 'Submit',
      cancelText: 'Cancel',
    });
  }, [onlineSRP, claimStatus, remarks, handleSubmit]);

  // RENDER

  // Show error state if no data available
  if (!data) {
    return (
      <AppLayout title="Claim View" needBack>
        <View className="flex-1 items-center justify-center p-4">
          <AppIcon
            name="alert-circle-outline"
            type="ionicons"
            size={64}
            color={AppColors.error}
            style={{marginBottom: 16}}
          />
          <AppText size="lg" weight="semibold" style={{color: theme.text}}>
            No claim data available
          </AppText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Claim Review" needBack needScroll>
      <View className="p-4">
        {/* Product Header Card */}
        <Card className="mb-4">
          <View className="flex-row items-center mb-3">
            <AppIcon
              name="devices"
              type="materialIcons"
              size={24}
              color={AppColors.primary}
            />
            <AppText
              size="xl"
              weight="bold"
              style={{color: theme.heading, marginLeft: 8}}>
              {data.Model_Name}
            </AppText>
          </View>
          <View className="flex-row items-center">
            <AppIcon
              name="barcode"
              type="material-community"
              size={18}
              color={theme.text}
              style={{opacity: 0.6}}
            />
            <AppText
              size="sm"
              style={{color: theme.text, opacity: 0.7, marginLeft: 8}}>
              Serial No: {data.Serial_No}
            </AppText>
          </View>
        </Card>

        {/* Seller Information Section */}
        <Card className="mb-4">
          <SectionHeader
            title="Seller Information"
            icon="storefront"
            iconType="ionicons"
          />
          <View className="flex-row flex-wrap justify-between">
            <View style={{width: '48%'}}>
              <InfoItem
                label="eTailer Name"
                value={data.eTailer_Name}
                icon="storefront-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Seller Name"
                value={data.Seller_Name}
                icon="person-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '100%'}}>
              <InfoItem
                label="Customer Invoice Date"
                value={
                  data.End_Cust_Invoice_Date
                    ? moment(data.End_Cust_Invoice_Date).format('DD-MMM-YYYY')
                    : 'N/A'
                }
                icon="calendar-outline"
                iconType="ionicons"
              />
            </View>
          </View>
        </Card>

        {/* Online SRP - Editable Section */}
        <Card className="mb-4">
          <SectionHeader
            title="Price Information"
            icon="pricetag"
            iconType="ionicons"
          />
          <View className="mb-2">
            <AppText
              size="xs"
              weight="medium"
              style={{color: theme.text, opacity: 0.6, marginBottom: 6}}>
              Online SRP (Selling Price) *
            </AppText>
            <AppInput
              value={onlineSRP}
              setValue={setOnlineSRP}
              placeholder="Enter Online SRP"
              keyboardType="numeric"
              leftIconTsx={
                <AppIcon
                  name="currency-inr"
                  type="material-community"
                  size={20}
                  color={theme.text}
                />
              }
              variant="border"
              size="md"
            />
          </View>
        </Card>

        {/* Document Images Section */}
        <Card className="mb-4">
          <SectionHeader
            title="Documents & Proofs"
            icon="document-attach"
            iconType="ionicons"
          />
          <View className="flex-row flex-wrap justify-between">
            {/* Only show T3 invoice if it's a valid long URL */}
            {data.T3_Invoice_Copy && data.T3_Invoice_Copy.length > 70 && (
              <ImageCard
                title="T3 Invoice"
                imageUrl={data.T3_Invoice_Copy}
                icon="file-document"
              />
            )}
            <ImageCard
              title="T2 Invoice"
              imageUrl={data.T2_Invoice_Copy}
              icon="file-document-outline"
            />
            <ImageCard
              title="Photo Copy"
              imageUrl={data.Photo_Copy}
              icon="camera"
            />
            <ImageCard
              title="Box Serial No"
              imageUrl={data.BoxSrNo_Copy}
              icon="package-variant"
            />
            <ImageCard
              title="Screenshot"
              imageUrl={data.Screenshot_Copy}
              icon="monitor-screenshot"
            />
          </View>
        </Card>

        {/* Action Buttons - Claim Decision Section */}
        <Card className="mb-4">
          <SectionHeader
            title="Claim Decision"
            icon="checkmark-done-circle"
            iconType="ionicons"
          />

          {/* Accept/Reject Option Cards */}
          <View className="flex-row gap-3 mb-3">
            {/* Accept Option */}
            <TouchableOpacity
              className="flex-1 flex-row items-center px-3 py-2.5 rounded-lg"
              activeOpacity={0.7}
              style={{
                backgroundColor:
                  claimStatus === 'Accepted'
                    ? AppColors.success + '15'
                    : theme.bgSurface,
                borderColor:
                  claimStatus === 'Accepted' ? AppColors.success : theme.border,
                borderWidth: 1.5,
              }}
              onPress={handleAccept}>
              <AppIcon
                name="checkmark-circle"
                type="ionicons"
                size={18}
                color={
                  claimStatus === 'Accepted' ? AppColors.success : theme.text
                }
                style={{marginRight: 6}}
              />
              <AppText
                size="sm"
                weight="semibold"
                style={{
                  color:
                    claimStatus === 'Accepted' ? AppColors.success : theme.text,
                }}>
                Accept
              </AppText>
            </TouchableOpacity>

            {/* Reject Option */}
            <TouchableOpacity
              className="flex-1 flex-row items-center px-3 py-2.5 rounded-lg"
              activeOpacity={0.7}
              style={{
                backgroundColor:
                  claimStatus === 'Rejected'
                    ? AppColors.error + '15'
                    : theme.bgSurface,
                borderColor:
                  claimStatus === 'Rejected' ? AppColors.error : theme.border,
                borderWidth: 1.5,
              }}
              onPress={handleReject}>
              <AppIcon
                name="close-circle"
                type="ionicons"
                size={18}
                color={
                  claimStatus === 'Rejected' ? AppColors.error : theme.text
                }
                style={{marginRight: 6}}
              />
              <AppText
                size="sm"
                weight="semibold"
                style={{
                  color:
                    claimStatus === 'Rejected' ? AppColors.error : theme.text,
                }}>
                Reject
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Helper Text - Show selected decision */}
          {claimStatus && (
            <View
              className="flex-row items-center px-3 py-2 rounded-lg mb-3"
              style={{
                backgroundColor:
                  claimStatus === 'Accepted'
                    ? AppColors.success + '10'
                    : AppColors.error + '10',
              }}>
              <AppIcon
                name="information-circle"
                type="ionicons"
                size={16}
                color={
                  claimStatus === 'Accepted'
                    ? AppColors.success
                    : AppColors.error
                }
                style={{marginRight: 6}}
              />
              <AppText
                size="xs"
                style={{
                  color:
                    claimStatus === 'Accepted'
                      ? AppColors.success
                      : AppColors.error,
                  flex: 1,
                }}>
                {claimStatus === 'Accepted'
                  ? 'You have selected to accept this claim'
                  : 'You have selected to reject this claim'}
              </AppText>
            </View>
          )}

          {/* Remarks Input - Show only for rejection */}
          {claimStatus === 'Rejected' && (
            <View>
              <AppInput
                value={remarks}
                setValue={setRemarks}
                placeholder="Enter reason for rejection"
                isOptional={false}
                variant="border"
                size="sm"
                inputClassName="ml-2"
                label="Remarks *"
              />
            </View>
          )}
        </Card>

        {/* Submit Button */}
        <AppButton
          title="Submit Decision"
          onPress={handleConfirmation}
          iconName="send"
          className="mb-6 py-4"
          disabled={
            !claimStatus ||
            (claimStatus === 'Rejected' && !remarks.trim())
          }
        />
      </View>
    </AppLayout>
  );
}