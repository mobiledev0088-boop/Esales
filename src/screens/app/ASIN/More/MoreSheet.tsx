import {View, TouchableOpacity} from 'react-native';
import {useMemo} from 'react';

import AppText from '../../../../components/customs/AppText';
import {AppColors} from '../../../../config/theme';
import {useThemeStore} from '../../../../stores/useThemeStore';
import {getShadowStyle} from '../../../../utils/appStyles';
import AppIcon, {IconType} from '../../../../components/customs/AppIcon';
import Swiper from 'react-native-swiper';
import {screenHeight} from '../../../../utils/constant';
import {Watermark} from '../../../../components/Watermark';
import {useLoginStore} from '../../../../stores/useLoginStore';
import useEmpStore from '../../../../stores/useEmpStore';
import {AppNavigationParamList,AppNavigationProp} from '../../../../types/navigation';
import ActionSheet, {SheetManager} from 'react-native-actions-sheet';
import {useNavigation} from '@react-navigation/native';

type Option = {
  label: string;
  iconName: string;
  iconType: IconType;
  navigateTo?: keyof AppNavigationParamList;
};

const chunkArray = <T,>(array: T[], size: number): T[][] =>
  Array.from({length: Math.ceil(array.length / size)}, (_, i) =>
    array.slice(i * size, i * size + size),
  );

const hasRole = (roleId: number | undefined, allowedRoles: number[]) =>
  roleId !== undefined && allowedRoles.includes(roleId);

const getASINOptions = (
  roleId: number,
  empType: string,
  empCode: string,
): Option[] => {
  const options: Option[] = [];

  if (hasRole(roleId, [1, 2, 3, 4, 9, 10, 12, 13, 14, 17, 25, 26, 29])) {
    options.push({
      label: 'Channel Map',
      iconName: 'codesandbox',
      iconType: 'feather',
    });
  }
  if (hasRole(roleId, [1, 2, 3, 4, 6, 9, 10, 25, 26, 29])) {
    options.push({
      label: 'Channel Friendly',
      iconName: 'houzz',
      iconType: 'entypo',
    });
    options.push({
      label: 'Activated Details',
      iconName: 'toggle-switch',
      iconType: 'material-community',
      navigateTo: 'ActivatedDetails',
    });
  }
  if (
    hasRole(roleId, [1, 2, 3, 4, 9, 10, 25, 26, 29]) ||
    (roleId === 6 && ['AWP', 'T3Partner'].includes(empType))
  ) {
    options.push({
      label: 'LMS',
      iconName: 'package',
      iconType: 'feather',
      navigateTo: 'LMSList_HO',
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

  if (['KN2200052', 'KN1800037', 'KN2500069'].includes(empCode)) {
    options.push({
      label: 'Asus SpotLight Videos',
      iconName: 'youtube',
      iconType: 'antdesign',
      navigateTo: 'SpotLightVideos',
    });
  }

  if (roleId === 24) {
    options.push({
      label: 'Incentive',
      iconName: 'money',
      iconType: 'fontAwesome',
      navigateTo: 'ASEIncentive',
    });
  }
  if (hasRole(roleId, [1, 2, 3, 4, 9, 10, 25, 26])) {
    options.push({
      label: 'Shop Expansion',
      iconName: 'store-outline',
      iconType: 'material-community',
    });
  }
  if (['KN2100033', 'KN2100029', 'KN2200052', 'KN1800037'].includes(empCode)) {
    options.push({
      label: 'Display Stand & POSM',
      iconName: 'storefront-outline',
      iconType: 'material-community',
    });
  }
  if ([1, 2, 9, 3, 7, 25, 26, 28].includes(roleId)) {
    options.push({
      label: 'Credit Limit',
      iconName: 'credit-card',
      iconType: 'fontAwesome',
      navigateTo: 'CreditLimit',
    });
  }
  return options;
};

const getAPEXOptions = (countryId?: string): Option[] => {
  const opts: Option[] = [
    {label: 'EDM Info', iconName: 'laptop', iconType: 'antdesign'},
  ];

  if (countryId === 'ATID') {
    opts.push({
      label: 'SN Upload',
      iconName: 'barcode-scan',
      iconType: 'material-community',
    });
  }
  if (countryId === 'ACMY') {
    opts.push({
      label: 'Product Info',
      iconName: 'laptop',
      iconType: 'material-community',
    });
  }

  return opts;
};

const MoreSheet = () => {
  const empInfo = useEmpStore(state => state.empInfo);
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();

  const roleId = userInfo.EMP_RoleId;
  const empType = userInfo.EMP_Type ?? '';
  const empCode = empInfo?.EMP_Code ?? '';
  const countryId = userInfo?.EMP_CountryID;

  const options: Option[] = useMemo(() => {
    if (countryId === 'ASIN') {
      return getASINOptions(roleId, empType, empCode);
    }
    return getAPEXOptions(countryId);
  }, [roleId, empType, empCode, countryId]);

  const chunkedOptions = useMemo(() => chunkArray(options, 9), [options]);
  const handlePress = (whereTo: keyof AppNavigationParamList) => {
    navigation.navigate(whereTo as any);
    SheetManager.hide('MoreSheet');
  };

  return (
    <View>
      <ActionSheet zIndex={100} gestureEnabled indicatorStyle={{
        // backgroundColor: '#'
      }}>
        {/* Create Indicator */}
        {/*  */}
        <View style={{height: screenHeight / 2, zIndex: 100}}>
          <Watermark />
          <Swiper
            loop={false}
            showsPagination={true}
            height={300}
            dotColor={AppColors.formLabel}>
            {chunkedOptions.map((chunk, pageIndex) => (
              <View key={pageIndex} className="mt-5 mx-5 flex-row flex-wrap">
                {chunk.map((item, index) => (
                  <View key={index} className="w-1/3 mb-5">
                    <EachMoreOption
                      label={item.label}
                      iconName={item.iconName}
                      iconType={item.iconType}
                      onPress={() => {
                        if (item.navigateTo) {
                          handlePress(item.navigateTo);
                        }
                      }}
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
};

export default MoreSheet;

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
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View className="items-center">
        <View
          className="bg-[#f5f5f5] dark:bg-util-blue justify-center items-center p-2 rounded border border-util-blue dark:border-util-cyan"
          style={getShadowStyle(3)}>
          <AppIcon
            type={iconType}
            name={iconName}
            size={43}
            color={isDarkMode ? '#fff' : AppColors.utilColor2}
          />
        </View>
        <View className="mt-2 items-center">
          <AppText
            size="sm"
            weight="semibold"
            className="text-heading-light dark:text-heading-dark text-center w-16"
            numberOfLines={2}>
            {label}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

//   <View className="w-1/6 h-2 rounded bg-gray-700 dark:bg-white self-center my-2" />
