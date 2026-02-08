import {View, TouchableOpacity, Linking} from 'react-native';
import {useMemo} from 'react';

import AppText from '../../../../components/customs/AppText';
import {AppColors} from '../../../../config/theme';
import {useThemeStore} from '../../../../stores/useThemeStore';
import {getShadowStyle} from '../../../../utils/appStyles';
import AppIcon, {IconType} from '../../../../components/customs/AppIcon';
import Swiper from 'react-native-swiper';
import {ASUS, screenHeight} from '../../../../utils/constant';
import {Watermark} from '../../../../components/Watermark';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {
  AppNavigationParamList,
  AppNavigationProp,
} from '../../../../types/navigation';
import ActionSheet, {SheetManager} from 'react-native-actions-sheet';
import {useNavigation} from '@react-navigation/native';

type Option = {
  label: string;
  iconName: string;
  iconType: IconType;
  navigateTo?: keyof AppNavigationParamList;
  linkTo?: string;
};

const chunkArray = <T,>(array: T[], size: number): T[][] =>
  Array.from({length: Math.ceil(array.length / size)}, (_, i) =>
    array.slice(i * size, i * size + size),
  );

const checkRole = (
  roleId: number | undefined,
  allowedRoles: number[],
  shouldHaveRole: boolean = true,
) => {
  if (roleId === undefined) return false;

  const hasRole = allowedRoles.includes(roleId);
  return shouldHaveRole ? hasRole : !hasRole;
};

const {
  AM,
  ASE,
  BPM,
  BSM,
  CHANNEL_MARKETING,
  COUNTRY_HEAD,
  DIR_HOD_MAN,
  DISTI_HO,
  DISTRIBUTORS,
  ESHOP_HO,
  HO_EMPLOYEES,
  LFR_HO,
  ONLINE_HO,
  PARTNERS,
  RSM,
  SA,
  SALES_REPS,
  TM,
} = ASUS.ROLE_ID;
const {
  T2: {AES, AWP},
  END_CUSTOMER,
  T3: {AGP, ASP, T3},
} = ASUS.PARTNER_TYPE;

const getASINOptions = (
  roleId: number,
  empType: string,
  empCode: string,
): Option[] => {
  const options: Option[] = [];

  // if (hasRole(roleId, [1, 2, 3, 4, 9, 10, 12, 13, 14, 17, 25, 26, 29])) {
  if (
    checkRole(
      roleId,
      [PARTNERS, DISTRIBUTORS, ESHOP_HO, SA, ASE, DISTI_HO],
      false,
    )
  ) {
    options.push({
      label: 'Channel Map',
      iconName: 'codesandbox',
      iconType: 'feather',
      navigateTo: 'ChannelMap',
    });
  }

  // if (checkRole(roleId, [1, 2, 3, 4, 6, 9, 10, 25, 26, 29])) {
  if (
    checkRole(
      roleId,
      [DISTRIBUTORS, LFR_HO, ONLINE_HO, ESHOP_HO, AM, SA, ASE, DISTI_HO],
      false,
    )
  ) {
    let navigateTo = () =>
      (roleId === PARTNERS
        ? 'ChannelFriendlyClaimListPartner'
        : ['KN2200052', 'KN1800045', 'KN1500008'].includes(empCode)
          ? 'ChannelFriendlyClaimListALP'
          : 'ChannelFriendlyClaimListHO') as any;
    options.push({
      label: 'Channel Friendly',
      iconName: 'houzz',
      iconType: 'entypo',
      navigateTo: navigateTo(),
    });
    options.push({
      label: 'Activated Details',
      iconName: 'toggle-switch',
      iconType: 'material-community',
      navigateTo: 'ActivatedDetails',
    });
  }
  // checkRole(roleId, [1, 2, 3, 4, 9, 10, 25, 26, 29]) ||
  if (
    checkRole(roleId, [
      DIR_HOD_MAN,
      HO_EMPLOYEES,
      BSM,
      TM,
      COUNTRY_HEAD,
      SALES_REPS,
      BPM,
      RSM,
      DISTI_HO,
    ]) ||
    (roleId === PARTNERS && [AWP, T3].includes(empType as any))
  ) {
    let navigateTo = 'LMSList_HO' as keyof AppNavigationParamList;
    if (roleId === PARTNERS && empType === AWP) navigateTo = 'LMSListAWP';
    // if (roleId === PARTNERS && empType === T3) navigateTo = 'LMS_Menu'; need to create this screen
    options.push({
      label: 'LMS',
      iconName: 'package',
      iconType: 'feather',
      navigateTo,
    });
  }

  options.push({
    label: 'Product Info',
    iconName: 'laptop',
    iconType: 'material-community',
    navigateTo: 'ProductInfo',
  });
  options.push({
    label: 'EDMInfo',
    iconName: 'laptop',
    iconType: 'antdesign',
    navigateTo: 'EDMInfo',
  });
  options.push({
    label: 'Asus SpotLight Videos',
    iconName: 'youtube',
    iconType: 'antdesign',
    navigateTo: 'SpotLightVideos',
  });

  if (roleId === 24) {
    options.push({
      label: 'Incentive',
      iconName: 'money',
      iconType: 'fontAwesome',
      navigateTo: 'ASEIncentive',
    });
  }
  if (
    checkRole(roleId, [
      DIR_HOD_MAN,
      HO_EMPLOYEES,
      BSM,
      TM,
      COUNTRY_HEAD,
      SALES_REPS,
      BPM,
      RSM,
      CHANNEL_MARKETING,
    ])
  ) {
    options.push({
      label: 'Shop Expansion',
      iconName: 'store-outline',
      iconType: 'material-community',
      navigateTo: 'ShopExpansion',
    });
  }
  if (
    ['KN2100033', 'KN2100029', 'KN2200052', 'KN1800037', 'KN2500069','KN1300078'].includes(empCode)
    ||
    checkRole(roleId, [CHANNEL_MARKETING])
  ) {
    options.push({
      label: 'Display Stand & POSM',
      iconName: 'storefront-outline',
      iconType: 'material-community',
      navigateTo: 'StandPOSM',
    });
  }
  // if ([1, 2, 9, 3, 7, 25, 26, 28].includes(roleId)) {
  if (
    checkRole(roleId, [
      DIR_HOD_MAN,
      HO_EMPLOYEES,
      BSM,
      DISTRIBUTORS,
      COUNTRY_HEAD,
      BPM,
      RSM,
      DISTI_HO,
    ])
  ) {
    options.push({
      label: 'Credit Limit',
      iconName: 'credit-card',
      iconType: 'fontAwesome',
      navigateTo: 'CreditLimit',
    });
  }
  if (roleId === ASE) {
    options.push({
      label: 'DSR Upload',
      iconName: 'upload-file',
      iconType: 'material-community',
      linkTo:
        'https://docs.google.com/forms/d/e/1FAIpQLSc5zEQbYhcOBHoACNbndMv1t4AjcAcsUO9Iex7x1PuZ9wNA5w/viewform',
    });
  }
  if (![ASE, CHANNEL_MARKETING].includes(roleId as any)) {
    options.push({
      label: 'DSR Report',
      iconName: 'file-download-outline',
      iconType: 'material-community',
      linkTo:
        'https://asus-my.sharepoint.com/:x:/p/salim_shaikh/IQAgf2shltq2Q5dk6hp1dfqAAe72T4AWWmMVFj-FUqGXccA?e=1b7Pev',
    });
  }
  options.push({
    label: 'Marketing Dispatch Tracker',
    iconName: 'truck-fast-outline',
    iconType: 'material-community',
    navigateTo: 'MarketingDispatchTracker',
  });
  return options;
};

const getAPEXOptions = (countryId?: string): Option[] => {
  const opts: Option[] = [];
  if (countryId === 'ACMY') {
    opts.push({
      label: 'EDM Info',
      iconName: 'laptop',
      iconType: 'antdesign',
      navigateTo: 'EDMInfo',
    });
  }

  if (countryId === 'ATID') {
    opts.push({
      label: 'SN Upload',
      iconName: 'barcode-scan',
      iconType: 'material-community',
      navigateTo: 'Promoter',
    });
  }
  // if (countryId === 'ACMY') {
  opts.push({
    label: 'Product Info',
    iconName: 'laptop',
    iconType: 'material-community',
    navigateTo: 'ProductInfo',
  });
  // }

  return opts;
};

const EachMoreOption = ({
  label,
  iconName,
  iconType,
  onPress,
}: {
  label: string;
  iconName: string;
  iconType: IconType;
  onPress: () => void;
}) => {
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="items-center">
      <View
        className="bg-lightBg-surface dark:bg-darkBg-surface justify-center items-center p-2 rounded-xl border border-primary dark:border-secondary-dark"
        style={getShadowStyle(3)}>
        <AppIcon
          type={iconType}
          name={iconName}
          size={43}
          color={isDarkMode ? '#007BE5' : AppColors.primary}
        />
      </View>
      <View className="mt-2 items-center">
        <AppText
          size="sm"
          weight="semibold"
          className="text-heading dark:text-heading-dark text-center w-16"
          numberOfLines={2}
          >
          {label}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

export default function MoreSheet() {
  const userInfo = useLoginStore(state => state.userInfo);
  const AppTheme = useThemeStore(state => state.AppTheme);
  const navigation = useNavigation<AppNavigationProp>();

  const roleId = userInfo.EMP_RoleId;
  const empType = userInfo.EMP_Type ?? '';
  const empCode = userInfo?.EMP_Code ?? '';
  const countryId = userInfo?.EMP_CountryID;

  const options: Option[] = useMemo(() => {
    if (countryId === 'ASIN') {
      return getASINOptions(roleId, empType, empCode);
    }
    return getAPEXOptions(countryId);
  }, [roleId, empType, empCode, countryId]);

  const chunkedOptions = useMemo(() => chunkArray(options, 9), [options]);
  const handlePress = (item: Option) => {
    if (item.navigateTo) {
      navigation.navigate(item.navigateTo as any);
    } else if (item.linkTo) {
      Linking.openURL(item.linkTo);
    }
    SheetManager.hide('MoreSheet');
  };

  return (
    <View>
      <ActionSheet
        id="MoreSheet"
        gestureEnabled
        containerStyle={{
          backgroundColor: AppColors[AppTheme].bgBase,
        }}
        indicatorStyle={{backgroundColor: AppColors.formLabel}}>
        {/* Create Indicator */}
        <View
          style={{height: screenHeight / 2}}
          className="bg-lightBg-base dark:bg-darkBg-base">
          <Watermark />
          <Swiper
            loop={false}
            showsPagination={true}
            height={300}
            dotColor={AppColors.formLabel}>
            {chunkedOptions.map((chunk, pageIndex) => (
              <View key={pageIndex} className="mt-5 flex-row flex-wrap">
                {chunk.map((item, index) => (
                  <View key={index} className="w-1/3 mb-5">
                    <EachMoreOption
                      label={item.label}
                      iconName={item.iconName}
                      iconType={item.iconType}
                      onPress={() => handlePress(item)}
                    />
                  </View>
                ))}
              </View>
            ))}
          </Swiper>
        </View>
      </ActionSheet>
    </View>
  );
}
//   <View className="w-1/6 h-2 rounded bg-gray-700 dark:bg-white self-center my-2" />
