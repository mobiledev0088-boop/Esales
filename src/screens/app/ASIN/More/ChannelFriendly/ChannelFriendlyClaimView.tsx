import {View, Image, Pressable, Linking, Alert} from 'react-native';
import React, {memo, useCallback} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import {RouteProp, useRoute} from '@react-navigation/native';
import {AppNavigationParamList} from '../../../../../types/navigation';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import moment from 'moment';
import AppImage from '../../../../../components/customs/AppImage';

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

interface StatusBadgeProps {
  status: string;
}

interface ImageCardProps {
  title: string;
  imageUrl: string;
  icon: string;
}

// Constants
const STATUS_CONFIG: Record<
  string,
  {color: string; icon: string; iconType: IconType}
> = {
  'Waiting for Reviewer': {
    color: AppColors.warning,
    icon: 'hourglass-outline',
    iconType: 'ionicons',
  },
  'Under Review': {
    color: AppColors.utilColor2,
    icon: 'sync',
    iconType: 'ionicons',
  },
  'CN Under Process': {
    color: AppColors.utilColor1,
    icon: 'checkmark-circle',
    iconType: 'ionicons',
  },
  Rejected: {
    color: AppColors.error,
    icon: 'close-circle',
    iconType: 'ionicons',
  },
  Approved: {
    color: AppColors.success,
    icon: 'checkmark-circle',
    iconType: 'ionicons',
  },
};

// Components
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

const StatusBadge: React.FC<StatusBadgeProps> = memo(({status}) => {
  const config = STATUS_CONFIG[status] || {
    color: '#6B7280',
    icon: 'help-circle',
    iconType: 'ionicons' as IconType,
  };

  return (
    <View
      className="flex-row items-center px-4 py-2 rounded-full self-start"
      style={{backgroundColor: config.color + '20'}}>
      <AppIcon
        name={config.icon}
        type={config.iconType}
        size={18}
        color={config.color}
      />
      <AppText
        size="sm"
        weight="bold"
        style={{color: config.color, marginLeft: 6}}>
        {status}
      </AppText>
    </View>
  );
});

const ImageCard: React.FC<ImageCardProps> = memo(({title, imageUrl, icon}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

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

export default function ChannelFriendlyClaimView() {
  const {params} = useRoute();
  const {data} = params as {data: ClaimInfoItem};
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

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
    <AppLayout title="Claim Details" needBack needScroll>
      <View className="p-4">
        {/* Header Card - Status & ID */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <AppText
                size="xs"
                style={{color: theme.text, opacity: 0.6, marginBottom: 4}}>
                Claim ID
              </AppText>
              <AppText size="2xl" weight="bold" style={{color: theme.heading}}>
                #{data.APCAE_Id}
              </AppText>
            </View>
            <StatusBadge status={data.ChannelFriendlyClaim_Status} />
          </View>

          <View
            className="h-px mb-4"
            style={{backgroundColor: theme.border, opacity: 0.3}}
          />

          {/* Model & Serial */}
          <View className="flex-row items-center mb-2">
            <AppIcon
              name="devices"
              type="materialIcons"
              size={20}
              color={AppColors.primary}
            />
            <AppText
              size="lg"
              weight="bold"
              style={{color: theme.text, marginLeft: 8}}>
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
              S/N: {data.Serial_No}
            </AppText>
          </View>
        </Card>

        {/* Amount Details */}
        {(data.Pre_Tax_Amount || data.Post_Tax_Amount) && (
          <Card className="mb-4">
            <SectionHeader
              title="Claim Amount"
              icon="cash"
              iconType="ionicons"
            />
            <View className="flex-row justify-between items-center mb-3">
              <AppText size="sm" style={{color: theme.text, opacity: 0.7}}>
                Pre-Tax Amount
              </AppText>
              <AppText size="lg" weight="bold" style={{color: theme.text}}>
                ₹
                {data.Pre_Tax_Amount
                  ? parseFloat(data.Pre_Tax_Amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'}
              </AppText>
            </View>
            <View className="flex-row justify-between items-center mb-3">
              <AppText size="sm" style={{color: theme.text, opacity: 0.7}}>
                Tax Amount
              </AppText>
              <AppText
                size="base"
                weight="semibold"
                style={{color: theme.text}}>
                ₹
                {data.Tax_Amount
                  ? parseFloat(data.Tax_Amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'}
              </AppText>
            </View>
            <View
              className="h-px mb-3"
              style={{backgroundColor: theme.border, opacity: 0.3}}
            />
            <View className="flex-row justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <AppText
                size="base"
                weight="bold"
                style={{color: AppColors.success}}>
                Total Amount
              </AppText>
              <AppText
                size="2xl"
                weight="bold"
                style={{color: AppColors.success}}>
                ₹
                {data.Post_Tax_Amount
                  ? parseFloat(data.Post_Tax_Amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'}
              </AppText>
            </View>
          </Card>
        )}

        {/* Partner Information */}
        <Card className="mb-4">
          <SectionHeader
            title="Partner Information"
            icon="people"
            iconType="ionicons"
          />
          <View className="flex-row flex-wrap justify-between mt-2">
            <View style={{width: '48%'}}>
              <InfoItem
                label="Parent Name"
                value={data.Parent_Name}
                icon="business"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Parent Code"
                value={data.Parent_Code}
                icon="tag"
                iconType="materialIcons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="SubCode Name"
                value={data.SubCode_Name}
                icon="business-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Sub Code"
                value={data.Sub_Code}
                icon="tag"
                iconType="materialIcons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="T3 Partner Name"
                value={data.T3_Partner_Name}
                icon="person"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Partner Type"
                value={data.Partner_Type}
                icon="label"
                iconType="material-community"
              />
            </View>
          </View>
        </Card>

        {/* Branch & Territory */}
        <Card className="mb-4">
          <SectionHeader
            title="Branch & Territory"
            icon="location"
            iconType="ionicons"
          />
          <View className="flex-row flex-wrap justify-between">
            <View style={{width: '48%'}}>
              <InfoItem
                label="Branch Name"
                value={data.Branch_Name}
                icon="business-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Branch Head"
                value={data.Branch_Head}
                icon="person-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Territory Name"
                value={data.Territory_Name}
                icon="location-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Territory Manager"
                value={data.Territory_Manager}
                icon="person-circle-outline"
                iconType="ionicons"
              />
            </View>
          </View>
        </Card>

        {/* Seller Information */}
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
                label="eTailer Code"
                value={data.eTailer_Code}
                icon="barcode-outline"
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
            <View style={{width: '48%'}}>
              <InfoItem
                label="Seller ASIN Code"
                value={data.Seller_ASIN_Code}
                icon="code"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Online SRP"
                value={data.Online_SRP ? `₹${data.Online_SRP}` : 'N/A'}
                icon="pricetag"
                iconType="ionicons"
                valueColor={AppColors.success}
              />
            </View>
          </View>
        </Card>

        {/* Dates & Activation */}
        <Card className="mb-4">
          <SectionHeader
            title="Dates & Activation"
            icon="calendar"
            iconType="ionicons"
          />
          <View className="flex-row flex-wrap justify-between">
            <View style={{width: '48%'}}>
              <InfoItem
                label="Received Date"
                value={
                  data.Received_Date
                    ? moment(data.Received_Date).format('DD-MMM-YYYY')
                    : 'N/A'
                }
                icon="calendar-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Year/Quarter"
                value={data.Received_YearQtr}
                icon="time-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Activation Date"
                value={
                  data.Activation_Date
                    ? moment(data.Activation_Date).format('DD-MMM-YYYY')
                    : 'N/A'
                }
                icon="checkmark-circle-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Activation Status"
                value={data.Activation_status}
                icon="flash-outline"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Customer Invoice Date"
                value={
                  data.End_Cust_Invoice_Date
                    ? moment(data.End_Cust_Invoice_Date).format('DD-MMM-YYYY')
                    : 'N/A'
                }
                icon="receipt-outline"
                iconType="ionicons"
              />
            </View>
          </View>
        </Card>

        {/* Status Information */}
        <Card className="mb-4">
          <SectionHeader
            title="Status Information"
            icon="information-circle"
            iconType="ionicons"
          />
          <View className="flex-row flex-wrap justify-between">
            <View style={{width: '48%'}}>
              <InfoItem
                label="ALP Team Status"
                value={data.ALP_Team_Status}
                icon="checkmark-done"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="ALP Status Updated On"
                value={
                  data.ALP_Team_Status_Update_On
                    ? moment(data.ALP_Team_Status_Update_On).format(
                        'DD-MMM-YYYY HH:mm',
                      )
                    : 'N/A'
                }
                icon="time"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Special Approval Status"
                value={data.ALP_Team_Special_Approval_Status}
                icon="shield-checkmark"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Claim Team Status"
                value={data.Claim_Team_Status || 'N/A'}
                icon="people-circle"
                iconType="ionicons"
              />
            </View>
            <View style={{width: '48%'}}>
              <InfoItem
                label="Edit Allowed"
                value={data.IsEditAllowed === 'Y' ? 'Yes' : 'No'}
                icon={data.IsEditAllowed === 'Y' ? 'create' : 'lock-closed'}
                iconType="ionicons"
                valueColor={
                  data.IsEditAllowed === 'Y'
                    ? AppColors.success
                    : AppColors.error
                }
              />
            </View>
          </View>
        </Card>

        {/* Document Images */}
        <Card className="mb-4">
          <SectionHeader
            title="Documents & Images"
            icon="document-attach"
            iconType="ionicons"
          />
          <View className="flex-row flex-wrap justify-between">
            <ImageCard
              title="T2 Invoice"
              imageUrl={data.T2_Invoice_Copy}
              icon="file-document"
            />
            <ImageCard
              title="Photo Copy"
              imageUrl={data.Photo_Copy}
              icon="camera"
            />
            <ImageCard
              title="Screenshot"
              imageUrl={data.Screenshot_Copy}
              icon="monitor-screenshot"
            />
            <ImageCard
              title="Box Serial No"
              imageUrl={data.BoxSrNo_Copy}
              icon="package-variant"
            />
          </View>
        </Card>
      </View>
    </AppLayout>
  );
}
