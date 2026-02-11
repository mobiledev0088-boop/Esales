import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import AppText from '../../../../../components/customs/AppText';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import Card from '../../../../../components/Card';
import FAB from '../../../../../components/FAB';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import {useUserStore} from '../../../../../stores/useUserStore';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {AppNavigationProp} from '../../../../../types/navigation';
import clsx from 'clsx';
import {useImagePicker} from '../../../../../hooks/useImagePicker';
import ImageCropModal from '../../../../../components/ImageCropModal';
import moment from 'moment';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';

interface ChannelFriendlyClaim {
  Parent_Name: string;
  Parent_Code: string;
  Serial_No: string;
  End_Cust_Invoice_Date: string;
  eTailer_Name: string;
  Seller_Name: string;
  ChannelFriendlyClaim_Status: string;
  APCAE_Id?: number;
  Model_Name?: string;
  Received_Date?: string;
}

const STATUS_STYLES: Record<string, {color: string; icon: string}> = {
  'Waiting for Reviewer': {color: AppColors.warning, icon: 'hourglass-outline'},
  'Under Review': {color: AppColors.utilColor2, icon: 'sync'},
  'CN Under Process': {color: AppColors.utilColor1, icon: 'checkmark-circle'},
  Approved: {color: AppColors.success, icon: 'checkmark-circle'},
  Rejected: {color: AppColors.error, icon: 'close-circle'},
};

const formatDate = (dateString?: string) => {
  const date = moment(dateString);
  return date.isValid() ? date.format('DD MMM YYYY') : 'N/A';
};

const InfoRow: React.FC<{
  icon: string;
  iconType: IconType;
  label: string;
  value?: string;
}> = ({icon, iconType, label, value}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  if (!value) {
    return null;
  }

  return (
    <View className="flex-row items-center w-1/2">
      <AppIcon
        name={icon}
        type={iconType}
        size={16}
        color={theme.text}
        style={{opacity: 0.6, marginRight: 8}}
      />
      <View className="flex-1">
        <AppText size="xs" color="gray" className="mb-0.5">
          {label}
        </AppText>
        <AppText size="sm" weight="semibold" style={{color: theme.text}}>
          {value}
        </AppText>
      </View>
    </View>
  );
};

const ClaimCard: React.FC<{
  item: ChannelFriendlyClaim;
  onPress: () => void;
}> = ({item, onPress}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];
  const statusConfig = STATUS_STYLES[item.ChannelFriendlyClaim_Status] || {
    color: AppColors.primary,
    icon: 'information-circle',
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Card className="mb-4">
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 pr-3">
            <AppText
              size="lg"
              weight="bold"
              style={{color: theme.heading}}
              numberOfLines={1}>
              {item.Parent_Name || 'Partner'}
            </AppText>
            <AppText size="sm" color="gray" className="mt-1">
              {item.Parent_Code
                ? `Code: ${item.Parent_Code}`
                : 'Code not shared'}
            </AppText>
          </View>

          {/* Chevron Left With bg for Navigation */}
          <View className="w-8 h-8 rounded-full justify-center items-center bg-zinc-200 dark:bg-zinc-700">
            <AppIcon
              name="chevron-forward"
              type="ionicons"
              size={20}
              color={theme.text}
              style={{left: 1}}
            />
          </View>
        </View>
        <View className="flex-row flex-wrap justify-between gap-y-4">
          <InfoRow
            icon="barcode-outline"
            iconType="ionicons"
            label="Serial Number"
            value={item.Serial_No}
          />
          <InfoRow
            icon="calendar-outline"
            iconType="ionicons"
            label="Invoice Date"
            value={formatDate(item.End_Cust_Invoice_Date)}
          />

          <InfoRow
            icon="storefront"
            iconType="ionicons"
            label="eTailer"
            value={item.eTailer_Name}
          />

          <InfoRow
            icon="people"
            iconType="ionicons"
            label="Seller"
            value={item.Seller_Name}
          />
        </View>

        <View className="flex-row items-center justify-between mt-4 border-t pt-3 border-slate-200 dark:border-slate-700">
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{backgroundColor: statusConfig.color + '20'}}>
            <AppIcon
              name={statusConfig.icon}
              type="ionicons"
              size={16}
              color={statusConfig.color}
            />
            <AppText
              size="sm"
              weight="semibold"
              style={{color: statusConfig.color, marginLeft: 6}}
              numberOfLines={1}>
              {item.ChannelFriendlyClaim_Status || 'Pending'}
            </AppText>
          </View>
          <View className="flex-row items-center">
            <AppIcon
              name="time-outline"
              type="ionicons"
              size={16}
              color={theme.text}
              style={{opacity: 0.5, marginRight: 6}}
            />
            <AppText size="sm" color="gray">
              {formatDate(item.Received_Date || item.End_Cust_Invoice_Date)}
            </AppText>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const useGetChannelFriendlyClaims = (YearQtr: string, PartnerCode: string) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const UserName = userInfo?.EMP_Code || '';
  const RoleId = userInfo?.EMP_RoleId || '';

  return useQuery({
    queryKey: ['channelFriendlyClaims', YearQtr, UserName, RoleId, PartnerCode],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_Detail_PartnerWise',
        {
          UserName,
          RoleId,
          YearQtr,
          PartnerCode,
        },
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch data');
      }
      return result?.Datainfo?.List || [];
    },
  });
};

export default function ChannelFriendlyClaimListPartner() {
  const {EMP_Code} = useLoginStore(state => state.userInfo);
  const {IsParentCode} = useUserStore(state => state.empInfo);
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const [partnerCode, setPartnerCode] = useState<string>(EMP_Code);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<AppNavigationProp>();
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  const {data, isLoading,refetch} = useGetChannelFriendlyClaims(
    selectedQuarter?.value || '',
    partnerCode,
  );

  const claims = useMemo(() => data || [], [data]);

  const handleClaimPress = useCallback(
    (item: ChannelFriendlyClaim) => {
      navigation.push('ChannelFriendlyClaimView', {data: item});
    },
    [navigation],
  );

  const renderClaim = useCallback(
    ({item}: {item: ChannelFriendlyClaim}) => (
      <ClaimCard item={item} onPress={() => handleClaimPress(item)} />
    ),
    [handleClaimPress],
  );

  const renderEmpty = useCallback(
    () => (
      <View className="">
        {isLoading ? (
          <View className="gap-y-3">
            {[...Array(5)].map((_, index) => (
              <Skeleton
                key={index}
                width={screenWidth - 20}
                height={150}
                borderRadius={12}
              />
            ))}
          </View>
        ) : (
          <View className="items-center mt-20">
            <AppIcon
              name="alert-circle-outline"
              type="ionicons"
              size={36}
              color={theme.text}
              style={{opacity: 0.4}}
            />
            <AppText color="gray" className="mt-3 text-center">
              No claims found for the selected quarter.
            </AppText>
          </View>
        )}
      </View>
    ),
    [isLoading, theme.text],
  );

  const handleRefresh = useCallback(() => { 
    setRefreshing(true);
    try{
      refetch();
    }finally{
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <AppLayout title="Channel Friendly Claims" needBack>
      <View
        className={clsx(
          'flex-row items-center gap-x-2 my-4 px-3',
          IsParentCode ? 'justify-between' : 'justify-end',
        )}>
        {IsParentCode && (
          <View className="flex-1">
            <AppDropdown
              data={[]}
              selectedValue={partnerCode}
              mode="dropdown"
              placeholder="Select Partner"
              onSelect={item =>
                setPartnerCode((item as AppDropdownItem)?.value as string)
              }
              allowClear
              onClear={() => setPartnerCode(EMP_Code)}
            />
          </View>
        )}
        <View className="w-40">
          <AppDropdown
            data={quarters}
            selectedValue={selectedQuarter?.value}
            mode="dropdown"
            placeholder="Quarter"
            onSelect={setSelectedQuarter}
          />
        </View>
      </View>
      <FlatList
        data={claims}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderClaim}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{paddingBottom: 32, paddingHorizontal: 12}}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      <FAB onPress={() => navigation.push('ChannelFriendlyClaimsUpload')} />
    </AppLayout>
  );
}

// export const DirectSourceExample = () => {
//   const {
//     imageUri,
//     showCropModal,
//     tempImageUri,
//     pickImage,
//     handleCropComplete,
//     handleCropCancel,
//     reset,
//   } = useImagePicker({
//     enableCrop: true,
//     quality: 0.9,
//   });

//   useEffect(() => {
//     if (imageUri) {
//       console.log('Final Image URI:', imageUri);
//     }
//   }, [imageUri]);

//   useEffect(() => {
//     if (tempImageUri) {
//       console.log('Temp Image URI (for crop):', tempImageUri);
//     }
//   }, [tempImageUri]);

//   return (
//     <View className="p-5 items-center">
//       <AppText className="text-lg font-bold mb-4 text-center">
//         Image Picker with Crop
//       </AppText>
//       <AppText>{imageUri}</AppText>

//       {imageUri ? (
//         <>
//           <Image
//             source={{uri: imageUri}}
//             className="w-full h-[300px] rounded-lg mb-4 bg-gray-300"
//             resizeMode="cover"
//           />
//           <TouchableOpacity
//             onPress={reset}
//             className="bg-[#007AFF] px-6 py-3 rounded-lg mt-2">
//             <AppText className="text-white text-base font-semibold">
//               Clear
//             </AppText>
//           </TouchableOpacity>
//         </>
//       ) : (
//         <View className="flex-row gap-3 w-full">
//           <TouchableOpacity
//             onPress={() => pickImage('camera')}
//             className="flex-1 bg-[#007AFF] py-3 rounded-lg items-center">
//             <AppText className="text-white text-base font-semibold">
//               📷 Camera
//             </AppText>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => pickImage('gallery')}
//             className="flex-1 bg-[#007AFF] py-3 rounded-lg items-center">
//             <AppText className="text-white text-base font-semibold">
//               🖼️ Gallery
//             </AppText>
//           </TouchableOpacity>
//         </View>
//       )}

//       <ImageCropModal
//         visible={showCropModal}
//         imageUri={tempImageUri}
//         onCropComplete={handleCropComplete}
//         onCancel={handleCropCancel}
//         quality={0.9}
//       />
//     </View>
//   );
// };
