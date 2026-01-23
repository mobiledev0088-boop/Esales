import {memo, useMemo} from 'react';
import {Linking, ScrollView, TouchableOpacity, View} from 'react-native';
import {
  AGPBasicInfoProps,
  AGPCompetitionInfoProps,
  BasicInfoProps,
  BrandConfig,
  BrandData,
  CompetitionInfoProps,
  InfoRowProps,
  LFRBasicInfoProps,
  LFRCompetitionInfoProps,
  SectionHeaderProps,
} from './ChannelMapTypes';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import {screenWidth} from '../../../../../utils/constant';
import Skeleton from '../../../../../components/skeleton/skeleton';

// Constants
const SKELETON_CONFIG = {
  TAB_WIDTH: screenWidth / 3 - 14,
  CARD_WIDTH: screenWidth - 40,
  DROPDOWN_WIDTH: screenWidth - 16,
  TAB_HEIGHT: 36,
  CARD_HEIGHTS: {
    LARGE: 320,
    MEDIUM: 220,
    SMALL: 180,
  },
} as const;

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  ASUS: {name: 'ASUS', color: AppColors.primary},
  HP: {name: 'HP', color: '#0096D6'},
  DELL: {name: 'DELL', color: '#007DB8'},
  LENOVO: {name: 'LENOVO', color: '#E2231A'},
  ACER: {name: 'ACER', color: '#83B81A'},
} as const;

// Components
export const InfoRow = memo<InfoRowProps>(
  ({label, value, icon, iconType = 'feather', isPhoneNumber = false}) => {
    const handlePhonePress = () => {
      if (isPhoneNumber && value && value !== 'N/A') {
        const phoneNumber = value.replace(/[^0-9+]/g, ''); // Remove non-numeric characters except +
        Linking.openURL(`tel:${phoneNumber}`);
      }
    };

    const ContentWrapper = isPhoneNumber ? TouchableOpacity : View;
    const wrapperProps = isPhoneNumber
      ? {onPress: handlePhonePress, activeOpacity: 0.7}
      : {};

    return (
      <View className="flex-row items-start mb-3">
        {icon && (
          <View className="mt-1 mr-3">
            <AppIcon
              name={icon}
              type={iconType}
              size={18}
              color={AppColors.text}
            />
          </View>
        )}
        <View className="flex-1">
          <AppText size="sm" weight="medium" className="text-gray-500 mb-0.5">
            {label}
          </AppText>
          <ContentWrapper {...wrapperProps}>
            <AppText
              weight="semibold"
              className="text-gray-800"
              selectable={true}
              style={
                isPhoneNumber && value && value !== 'N/A'
                  ? {color: AppColors.primary, textDecorationLine: 'underline'}
                  : undefined
              }>
              {value || 'N/A'}
            </AppText>
          </ContentWrapper>
        </View>
      </View>
    );
  },
);

export const SectionHeader = memo<SectionHeaderProps>(
  ({title, icon, iconType = 'feather'}) => (
    <View className="flex-row items-center mb-4">
      <View className="bg-primary/10 p-2 rounded-lg mr-3">
        <AppIcon
          name={icon}
          type={iconType}
          size={20}
          color={AppColors.primary}
        />
      </View>
      <AppText size="lg" weight="bold" className="text-gray-800 ">
        {title}
      </AppText>
    </View>
  ),
);

export const BasicInfo = memo<BasicInfoProps>(({alpDetails}) => {
  return (
    <View>
      {/* Shop Information Card */}
      <Card className="mb-4">
        <SectionHeader title="Shop Information" icon="shopping-bag" />
        <View className="flex-row flex-wrap">
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Shop Name"
              value={alpDetails.PM_Name}
              icon="store"
              iconType="materialIcons"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Shop Code"
              value={alpDetails.PM_Code}
              icon="hash"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Demo Hub ID"
              value={alpDetails.PM_eID}
              icon="credit-card"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="GST No"
              value={alpDetails.PM_VATCode}
              icon="file-text"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Partner Type"
              value={alpDetails.PQT_PartnerType}
              icon="briefcase"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Target"
              value={alpDetails.PQT_L2}
              icon="layers"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Owner Name"
              value={alpDetails.PM_Person}
              icon="user"
              iconType="feather"
            />
          </View>
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Contact"
              value={alpDetails.PM_Contact}
              icon="phone"
              iconType="feather"
              isPhoneNumber={true}
            />
          </View>

          <View className="w-full mb-2">
            <InfoRow
              label="Email"
              value={alpDetails.PM_Email}
              icon="mail"
              iconType="feather"
            />
          </View>

          <View className="w-full">
            <InfoRow
              label="Address"
              value={alpDetails.PM_Address}
              icon="map-pin"
              iconType="feather"
            />
          </View>
        </View>
      </Card>

      {/* ASUS Information Card */}
      <Card className="mb-6">
        <SectionHeader
          title="ASUS Information"
          icon="domain"
          iconType="materialIcons"
        />

        <View className="flex-row flex-wrap ">
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Branch"
              value={alpDetails.Loc_Branch}
              icon="git-branch"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="State"
              value={alpDetails.Loc_State}
              icon="map-marker-radius"
              iconType="material-community"
            />
          </View>

          <View className="w-1/2 ">
            <InfoRow
              label="Territory"
              value={alpDetails.Loc_Territory}
              icon="earth"
              iconType="ionicons"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="City"
              value={alpDetails.Loc_City}
              icon="location-city"
              iconType="materialIcons"
            />
          </View>

          <View className="w-1/2 pr-2">
            <InfoRow
              label="Branch Head"
              value={alpDetails.BH_Name}
              icon="account-supervisor"
              iconType="material-community"
            />
          </View>

          <View className="w-1/2 pl-2">
            <InfoRow
              label="Territory Manager"
              value={alpDetails.TM_Name}
              icon="account-tie"
              iconType="material-community"
            />
          </View>
        </View>
      </Card>
    </View>
  );
});

export const CompetitionInfo = memo<CompetitionInfoProps>(({alpDetails}) => {
  const brands = useMemo<BrandData[]>(
    () => [
      {
        name: BRAND_CONFIGS.ASUS.name,
        type: alpDetails.Competition_Type_ASUS,
        number: alpDetails.Competition_Num_ASUS,
        color: BRAND_CONFIGS.ASUS.color,
      },
      {
        name: BRAND_CONFIGS.HP.name,
        type: alpDetails.Competition_Type_HP,
        number: alpDetails.Competition_Num_HP,
        color: BRAND_CONFIGS.HP.color,
      },
      {
        name: BRAND_CONFIGS.DELL.name,
        type: alpDetails.Competition_Type_DELL,
        number: alpDetails.Competition_Num_DELL,
        color: BRAND_CONFIGS.DELL.color,
      },
      {
        name: BRAND_CONFIGS.LENOVO.name,
        type: alpDetails.Competition_Type_LENOVO,
        number: alpDetails.Competition_Num_LENOVO,
        color: BRAND_CONFIGS.LENOVO.color,
      },
      {
        name: BRAND_CONFIGS.ACER.name,
        type: alpDetails.Competition_Type_ACER,
        number: alpDetails.Competition_Num_ACER,
        color: BRAND_CONFIGS.ACER.color,
      },
    ],
    [
      alpDetails.Competition_Type_ASUS,
      alpDetails.Competition_Num_ASUS,
      alpDetails.Competition_Type_HP,
      alpDetails.Competition_Num_HP,
      alpDetails.Competition_Type_DELL,
      alpDetails.Competition_Num_DELL,
      alpDetails.Competition_Type_LENOVO,
      alpDetails.Competition_Num_LENOVO,
      alpDetails.Competition_Type_ACER,
      alpDetails.Competition_Num_ACER,
    ],
  );
  return (
    <View>
      <Card className="mb-4">
        <SectionHeader
          title="Competition Brands"
          icon="trending-up"
          iconType="feather"
        />
        <View className="flex-row flex-wrap -mx-1">
          {brands.map((brand, index) => (
            <View key={brand.name} className="w-1/2 px-1 mb-2">
              <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <View className="flex-row items-center mb-2">
                  <View
                    className="p-1.5 rounded-md mr-2"
                    style={{backgroundColor: `${brand.color}15`}}>
                    <AppIcon
                      name="laptop"
                      type="material-community"
                      size={16}
                      color={brand.color}
                    />
                  </View>
                  <AppText weight="bold" style={{color: brand.color}}>
                    {brand.name}
                  </AppText>
                </View>
                <View className="flex-row gap-x-2">
                  <View className="flex-1">
                    <AppText
                      size="xs"
                      weight="medium"
                      className="text-gray-500 mb-0.5">
                      Type
                    </AppText>
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-gray-800">
                      {brand.type || 'N/A'}
                    </AppText>
                  </View>
                  <View className="flex-1">
                    <AppText
                      size="xs"
                      weight="medium"
                      className="text-gray-500 mb-0.5">
                      Number
                    </AppText>
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-gray-800">
                      {brand.number || 'N/A'}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Monthly Sales Card */}
      <Card className="mb-6">
        <SectionHeader
          title="Monthly Sales Information"
          icon="bar-chart-2"
          iconType="feather"
        />
        <View className="flex-row flex-wrap">
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Monthly TAM"
              value={alpDetails.Monthly_TAM}
              icon="target"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Monthly NB Sales"
              value={alpDetails.Monthly_NB_Sales}
              icon="shopping-cart"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Monthly DT/AIO Sales"
              value={alpDetails.Monthly_DTAIO_Sales}
              icon="monitor"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="NB Display Units"
              value={alpDetails.NB_Display_Units}
              icon="tv"
              iconType="feather"
            />
          </View>
        </View>
      </Card>
    </View>
  );
});

export const ListSkeleton = memo(() => (
  <View>
    <Skeleton
      width={SKELETON_CONFIG.DROPDOWN_WIDTH}
      height={50}
      borderRadius={8}
    />
  </View>
));

export const ALPDetailsLoadingSkeleton = memo(() => (
  <ScrollView
    className="flex-1 pt-4 bg-lightBg-base dark:bg-darkBg-base px-3"
    showsVerticalScrollIndicator={false}>
    <View className="px-1">
      <View className="flex-row mb-4 gap-x-2">
        <Skeleton
          width={SKELETON_CONFIG.TAB_WIDTH}
          height={SKELETON_CONFIG.TAB_HEIGHT}
          borderRadius={8}
        />
        <Skeleton
          width={SKELETON_CONFIG.TAB_WIDTH}
          height={SKELETON_CONFIG.TAB_HEIGHT}
          borderRadius={8}
        />
        <Skeleton
          width={SKELETON_CONFIG.TAB_WIDTH}
          height={SKELETON_CONFIG.TAB_HEIGHT}
          borderRadius={8}
        />
      </View>

      <View className="mb-4">
        <Skeleton
          width={SKELETON_CONFIG.CARD_WIDTH}
          height={SKELETON_CONFIG.CARD_HEIGHTS.LARGE}
          borderRadius={12}
        />
      </View>
      <View className="mb-4">
        <Skeleton
          width={SKELETON_CONFIG.CARD_WIDTH}
          height={SKELETON_CONFIG.CARD_HEIGHTS.MEDIUM}
          borderRadius={12}
        />
      </View>
      <View className="mb-4">
        <Skeleton
          width={SKELETON_CONFIG.CARD_WIDTH}
          height={SKELETON_CONFIG.CARD_HEIGHTS.SMALL}
          borderRadius={12}
        />
      </View>
    </View>
  </ScrollView>
));

export const EmptySelectionState = memo(() => (
  <View className="flex-1 items-center justify-center p-8">
    <AppIcon name="search" type="feather" size={48} color="#94a3b8" />
    <AppText
      size="md"
      weight="medium"
      className="text-gray-500 mt-4 text-center">
      Please select an ALP to view details
    </AppText>
  </View>
));

export const NoDetailsState = memo(() => (
  <View className="flex-1 items-center justify-center p-8">
    <AppIcon name="alert-circle" type="feather" size={48} color="#94a3b8" />
    <AppText
      size="md"
      weight="medium"
      className="text-gray-500 mt-4 text-center">
      No details available for the selected ALP.
    </AppText>
  </View>
));

export const ErrorState = memo<{message: string}>(({message}) => (
  <View className="flex-1 items-center justify-center p-8">
    <AppIcon name="alert-triangle" type="feather" size={48} color="#ef4444" />
    <AppText
      size="md"
      weight="medium"
      className="text-gray-500 mt-4 text-center">
      {message}
    </AppText>
  </View>
));

export const AGPBasicInfo = memo<AGPBasicInfoProps>(
  ({agpDetails, showEditButton, handlePress}) => {
    return (
      <View>
        {/* Shop Information Card */}
        <Card className="mb-4">
          <View className="flex-row">
            <SectionHeader title="Shop Information" icon="shopping-bag" />
            <View className="flex-1">
              {showEditButton && (
                <TouchableOpacity
                  className="p-2 self-end flex-row items-center gap-x-2"
                  onPress={handlePress}>
                  <AppIcon
                    type="feather"
                    name="edit"
                    size={20}
                    color="#2563eb"
                  />
                  <AppText className="underline" color="primary">
                    Edit Info
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <InfoRow
                label="Shop Name"
                value={agpDetails.Shop_Name}
                icon="store"
                iconType="materialIcons"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="GST No"
                value={agpDetails.GST_No}
                icon="file-text"
                iconType="feather"
              />
            </View>
            <View className="w-1/2 mb-2">
              <InfoRow
                label="Address"
                value={agpDetails.ShopAddress}
                icon="map-pin"
                iconType="feather"
              />
            </View>
            <View className="w-1/2 mb-2">
              <InfoRow
                label="Pin Code"
                value={String(agpDetails.Pin_Code)}
                icon="map-pin"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Owner Name"
                value={agpDetails.Owner_Name}
                icon="user"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Owner Number"
                value={String(agpDetails.Owner_Number)}
                icon="phone"
                iconType="feather"
                isPhoneNumber={true}
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Key Person"
                value={agpDetails.KeyPersonName}
                icon="user-check"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Key Person Designation"
                value={agpDetails.KeyPersonDesignation}
                icon="briefcase"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Key Person Email"
                value={agpDetails.KeyPersonMailID}
                icon="mail"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Key Person Number"
                value={String(agpDetails.KeyPersonNumber)}
                icon="phone"
                iconType="feather"
                isPhoneNumber={true}
              />
            </View>
          </View>
        </Card>

        {/* ASUS Information Card */}
        <Card className="mb-6">
          <SectionHeader
            title="ASUS Information"
            icon="domain"
            iconType="materialIcons"
          />

          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <InfoRow
                label="ASIN Code"
                value={agpDetails.ASIN_Code}
                icon="hash"
                iconType="feather"
              />
            </View>
            <View className="w-1/2 mb-2">
              <InfoRow
                label="E-Commerce ID"
                value={agpDetails.ECommerceId || 'N/A'}
                icon="shopping-cart"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Is Active"
                value={agpDetails.IsActive === 'A' ? 'Active' : 'Inactive'}
                icon="activity"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Login Created"
                value={agpDetails.IsLoginCreated === 'Y' ? 'Yes' : 'No'}
                icon="lock"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Business Type"
                value={agpDetails.Business_Type}
                icon="briefcase"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Branch"
                value={agpDetails.Branch_Name}
                icon="git-branch"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Territory"
                value={agpDetails.Territory}
                icon="earth"
                iconType="ionicons"
              />
            </View>
            <View className="w-1/2 mb-2">
              <InfoRow
                label="Territory Manager"
                value={agpDetails.Territory_Manager}
                icon="account-tie"
                iconType="material-community"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="CSE Name"
                value={agpDetails.CSE_Code}
                icon="credit-card"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Channel Map Code"
                value={agpDetails.ChannelMapCode}
                icon="map"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="P-Kiosk"
                value={agpDetails.Pkiosk || 'N/A'}
                icon="monitor"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="P-Kiosk Count"
                value={agpDetails.Pkiosk_Cnt || 'N/A'}
                icon="hash"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="ROG Kiosk"
                value={agpDetails.ROG_Kiosk || 'N/A'}
                icon="monitor"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="ROG Kiosk Count"
                value={agpDetails.ROG_Kiosk_Cnt || 'N/A'}
                icon="hash"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="P-Kiosk ROG Kiosk"
                value={agpDetails.Pkiosk_ROG_Kiosk || 'N/A'}
                icon="monitor"
                iconType="feather"
              />
            </View>
          </View>
        </Card>
      </View>
    );
  },
);

export const AGPCompetitionInfo = memo<AGPCompetitionInfoProps>(
  ({agpDetails}) => {
    const competitionBrands = useMemo<BrandData[]>(
      () => [
        {
          name: 'ASUS',
          type: agpDetails.Competition_Type_ASUS,
          number: String(agpDetails.Competition_Num_ASUS),
          color: AppColors.primary,
        },
        {
          name: 'HP',
          type: agpDetails.Competition_Type_HP,
          number: String(agpDetails.Competition_Num_HP),
          color: '#0096D6',
        },
        {
          name: 'DELL',
          type: agpDetails.Competition_Type_DELL,
          number: String(agpDetails.Competition_Num_DELL),
          color: '#007DB8',
        },
        {
          name: 'LENOVO',
          type: agpDetails.Competition_Type_LENOVA,
          number: String(agpDetails.Competition_Num_LENOVA),
          color: '#E2231A',
        },
        {
          name: 'ACER',
          type: agpDetails.Competition_Type_ACER,
          number: String(agpDetails.Competition_Num_ACER),
          color: '#83B81A',
        },
        {
          name: 'MSI',
          type: agpDetails.Competition_Type_MSI,
          number: String(agpDetails.Competition_Num_MSI),
          color: '#FF0000',
        },
        {
          name: 'Samsung',
          type: agpDetails.Competition_Type_Samsung,
          number: String(agpDetails.Competition_Num_Samsung),
          color: '#1428A0',
        },
      ],
      [
        agpDetails.Competition_Type_ASUS,
        agpDetails.Competition_Num_ASUS,
        agpDetails.Competition_Type_HP,
        agpDetails.Competition_Num_HP,
        agpDetails.Competition_Type_DELL,
        agpDetails.Competition_Num_DELL,
        agpDetails.Competition_Type_LENOVA,
        agpDetails.Competition_Num_LENOVA,
        agpDetails.Competition_Type_ACER,
        agpDetails.Competition_Num_ACER,
        agpDetails.Competition_Type_MSI,
        agpDetails.Competition_Num_MSI,
        agpDetails.Competition_Type_Samsung,
        agpDetails.Competition_Num_Samsung,
      ],
    );

    const cdtBrands = useMemo<BrandData[]>(
      () => [
        {
          name: 'ASUS',
          type: agpDetails.CDT_Type_Asus,
          number: String(agpDetails.ACM_CDTNumASUS),
          color: AppColors.primary,
        },
        {
          name: 'HP',
          type: agpDetails.CDT_Type_HP,
          number: String(agpDetails.ACM_CDTNumHP),
          color: '#0096D6',
        },
        {
          name: 'DELL',
          type: agpDetails.CDT_Type_Dell,
          number: String(agpDetails.ACM_CDTNumDELL),
          color: '#007DB8',
        },
        {
          name: 'LENOVO',
          type: agpDetails.CDT_Type_Lenovo,
          number: String(agpDetails.ACM_CDTNumLENOVO),
          color: '#E2231A',
        },
        {
          name: 'ACER',
          type: agpDetails.CDT_Type_Acer,
          number: String(agpDetails.ACM_CDTNumACER),
          color: '#83B81A',
        },
      ],
      [
        agpDetails.CDT_Type_Asus,
        agpDetails.ACM_CDTNumASUS,
        agpDetails.CDT_Type_HP,
        agpDetails.ACM_CDTNumHP,
        agpDetails.CDT_Type_Dell,
        agpDetails.ACM_CDTNumDELL,
        agpDetails.CDT_Type_Lenovo,
        agpDetails.ACM_CDTNumLENOVO,
        agpDetails.CDT_Type_Acer,
        agpDetails.ACM_CDTNumACER,
      ],
    );

    const gdtBrands = useMemo<BrandData[]>(
      () => [
        {
          name: 'ASUS',
          type: agpDetails.GDT_Type_Asus,
          number: String(agpDetails.ACM_GDTNumASUS),
          color: AppColors.primary,
        },
        {
          name: 'HP',
          type: agpDetails.GDT_Type_HP,
          number: String(agpDetails.ACM_GDTNumHP),
          color: '#0096D6',
        },
        {
          name: 'DELL',
          type: agpDetails.GDT_Type_Dell,
          number: String(agpDetails.ACM_GDTNumDELL),
          color: '#007DB8',
        },
        {
          name: 'LENOVO',
          type: agpDetails.GDT_Type_Lenovo,
          number: String(agpDetails.ACM_GDTNumLENOVO),
          color: '#E2231A',
        },
        {
          name: 'ACER',
          type: agpDetails.GDT_Type_Acer,
          number: String(agpDetails.ACM_GDTNumACER),
          color: '#83B81A',
        },
      ],
      [
        agpDetails.GDT_Type_Asus,
        agpDetails.ACM_GDTNumASUS,
        agpDetails.GDT_Type_HP,
        agpDetails.ACM_GDTNumHP,
        agpDetails.GDT_Type_Dell,
        agpDetails.ACM_GDTNumDELL,
        agpDetails.GDT_Type_Lenovo,
        agpDetails.ACM_GDTNumLENOVO,
        agpDetails.GDT_Type_Acer,
        agpDetails.ACM_GDTNumACER,
      ],
    );

    const aioBrands = useMemo<BrandData[]>(
      () => [
        {
          name: 'ASUS',
          type: agpDetails.AIO_Type_Asus,
          number: String(agpDetails.ACM_AIONumASUS),
          color: AppColors.primary,
        },
        {
          name: 'HP',
          type: agpDetails.AIO_Type_HP,
          number: String(agpDetails.ACM_AIONumHP),
          color: '#0096D6',
        },
        {
          name: 'DELL',
          type: agpDetails.AIO_Type_Dell,
          number: String(agpDetails.ACM_AIONumDELL),
          color: '#007DB8',
        },
        {
          name: 'LENOVO',
          type: agpDetails.AIO_Type_Lenovo,
          number: String(agpDetails.ACM_AIONumLENOVO),
          color: '#E2231A',
        },
        {
          name: 'ACER',
          type: agpDetails.AIO_Type_Acer,
          number: String(agpDetails.ACM_AIONumACER),
          color: '#83B81A',
        },
      ],
      [
        agpDetails.AIO_Type_Asus,
        agpDetails.ACM_AIONumASUS,
        agpDetails.AIO_Type_HP,
        agpDetails.ACM_AIONumHP,
        agpDetails.AIO_Type_Dell,
        agpDetails.ACM_AIONumDELL,
        agpDetails.AIO_Type_Lenovo,
        agpDetails.ACM_AIONumLENOVO,
        agpDetails.AIO_Type_Acer,
        agpDetails.ACM_AIONumACER,
      ],
    );

    return (
      <View>
        {/* Competition Brands Card */}
        <Card className="mb-4">
          <SectionHeader
            title="Competition Brands"
            icon="trending-up"
            iconType="feather"
          />
          <View className="flex-row flex-wrap -mx-1">
            {competitionBrands.map(brand => (
              <View key={brand.name} className="w-1/2 px-1 mb-2">
                <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="p-1.5 rounded-md mr-2"
                      style={{backgroundColor: `${brand.color}15`}}>
                      <AppIcon
                        name="laptop"
                        type="material-community"
                        size={16}
                        color={brand.color}
                      />
                    </View>
                    <AppText weight="bold" style={{color: brand.color}}>
                      {brand.name}
                    </AppText>
                  </View>
                  <View className="flex-row gap-x-2">
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Type
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.type || 'N/A'}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Number
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.number || 'N/A'}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Consumer Desktop Card */}
        <Card className="mb-4">
          <SectionHeader
            title="Consumer Desktop (CDT)"
            icon="monitor"
            iconType="feather"
          />
          <View className="flex-row flex-wrap -mx-1">
            {cdtBrands.map(brand => (
              <View key={brand.name} className="w-1/2 px-1 mb-2">
                <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="p-1.5 rounded-md mr-2"
                      style={{backgroundColor: `${brand.color}15`}}>
                      <AppIcon
                        name="desktop-mac"
                        type="materialIcons"
                        size={16}
                        color={brand.color}
                      />
                    </View>
                    <AppText weight="bold" style={{color: brand.color}}>
                      {brand.name}
                    </AppText>
                  </View>
                  <View className="flex-row gap-x-2">
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Type
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.type || 'N/A'}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Number
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.number || 'N/A'}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* CDT Additional Info */}
          <View className="mt-4 pt-4 border-t border-gray-100">
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Business Type"
                  value={agpDetails.CDT_Desktop_Business_Type}
                  icon="briefcase"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Mode of Business"
                  value={agpDetails.CDT_Mode_Of_Business}
                  icon="settings"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Monthly Number"
                  value={String(agpDetails.CDTMonthlyNumber)}
                  icon="calendar"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Commercial Monthly"
                  value={String(agpDetails.CDTCommercialMonthlyNumber)}
                  icon="trending-up"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="White Brand"
                  value={String(agpDetails.CDT_White_Brand_Monthly_No)}
                  icon="box"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Deal Ratio"
                  value={String(agpDetails.CDT_Num_Deal_Ratio)}
                  icon="percent"
                  iconType="feather"
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Gaming Desktop Card */}
        <Card className="mb-4">
          <SectionHeader
            title="Gaming Desktop (GDT)"
            icon="cpu"
            iconType="feather"
          />
          <View className="flex-row flex-wrap -mx-1">
            {gdtBrands.map(brand => (
              <View key={brand.name} className="w-1/2 px-1 mb-2">
                <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="p-1.5 rounded-md mr-2"
                      style={{backgroundColor: `${brand.color}15`}}>
                      <AppIcon
                        name="controller-classic"
                        type="material-community"
                        size={16}
                        color={brand.color}
                      />
                    </View>
                    <AppText weight="bold" style={{color: brand.color}}>
                      {brand.name}
                    </AppText>
                  </View>
                  <View className="flex-row gap-x-2">
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Type
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.type || 'N/A'}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Number
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.number || 'N/A'}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* GDT Additional Info */}
          <View className="mt-4 pt-4 border-t border-gray-100">
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Monthly Number"
                  value={String(agpDetails.GDT_Monthly_Number)}
                  icon="calendar"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Monthly DIY"
                  value={String(agpDetails.GDT_Monthly_DIY)}
                  icon="tool"
                  iconType="feather"
                />
              </View>
            </View>
          </View>
        </Card>

        {/* All-in-One Desktop Card */}
        <Card className="mb-6">
          <SectionHeader
            title="All-in-One Desktop (AIO)"
            icon="monitor"
            iconType="feather"
          />
          <View className="flex-row flex-wrap -mx-1">
            {aioBrands.map(brand => (
              <View key={brand.name} className="w-1/2 px-1 mb-2">
                <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="p-1.5 rounded-md mr-2"
                      style={{backgroundColor: `${brand.color}15`}}>
                      <AppIcon
                        name="monitor"
                        type="feather"
                        size={16}
                        color={brand.color}
                      />
                    </View>
                    <AppText weight="bold" style={{color: brand.color}}>
                      {brand.name}
                    </AppText>
                  </View>
                  <View className="flex-row gap-x-2">
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Type
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.type || 'N/A'}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Number
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.number || 'N/A'}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* AIO Additional Info */}
          <View className="mt-4 pt-4 border-t border-gray-100">
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Business Type"
                  value={agpDetails.AIO_Desktop_Business_Type}
                  icon="briefcase"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Mode of Business"
                  value={agpDetails.AIO_Mode_Of_Business}
                  icon="settings"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Monthly Number"
                  value={String(agpDetails.AIOMonthlyNumber)}
                  icon="calendar"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Commercial Monthly"
                  value={String(agpDetails.AIOCommercialMonthlyNumber)}
                  icon="trending-up"
                  iconType="feather"
                />
              </View>
              <View className="w-1/2 mb-2">
                <InfoRow
                  label="Deal Ratio"
                  value={String(agpDetails.AIO_Num_Deal_Ratio)}
                  icon="percent"
                  iconType="feather"
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Monthly Sales Card */}
        <Card className="mb-6">
          <SectionHeader
            title="Monthly Sales Information"
            icon="bar-chart-2"
            iconType="feather"
          />
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <InfoRow
                label="Monthly NB Sales"
                value={agpDetails.Monthly_NB_Sales}
                icon="shopping-cart"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Monthly DT/AIO Sales"
                value={agpDetails.Monthly_DTAIO_Sales}
                icon="monitor"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="NB Display Units"
                value={agpDetails.NB_Display_Units}
                icon="tv"
                iconType="feather"
              />
            </View>
          </View>
        </Card>
      </View>
    );
  },
);

export const AGPEmptySelectionState = memo(() => (
  <View className="flex-1 items-center justify-center p-8">
    <AppIcon name="search" type="feather" size={48} color="#94a3b8" />
    <AppText
      size="md"
      weight="medium"
      className="text-gray-500 mt-4 text-center">
      Please select an AGP to view details
    </AppText>
  </View>
));

export const AGPNoDetailsState = memo(() => (
  <View className="flex-1 items-center justify-center p-8">
    <AppIcon name="alert-circle" type="feather" size={48} color="#94a3b8" />
    <AppText
      size="md"
      weight="medium"
      className="text-gray-500 mt-4 text-center">
      No details available for the selected AGP.
    </AppText>
  </View>
));

export const LFRBasicInfo = memo<LFRBasicInfoProps>(({lfrDetails}) => {
  return (
    <View>
      {/* Shop Information Card */}
      <Card className="mb-4">
        <SectionHeader title="Shop Information" icon="shopping-bag" />
        <View className="flex-row flex-wrap">
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Shop Name"
              value={lfrDetails.Shop_Name}
              icon="store"
              iconType="materialIcons"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Company Name"
              value={lfrDetails.Company_Name}
              icon="domain"
              iconType="materialIcons"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Store Code"
              value={lfrDetails.Store_Code}
              icon="hash"
              iconType="feather"
            />
          </View>
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Owner Number"
              value={lfrDetails.Task_Owner_Name}
              icon="user"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Owner Number"
              value={String(lfrDetails.Owner_Number)}
              icon="phone"
              iconType="feather"
              isPhoneNumber={true}
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Owner Email"
              value={lfrDetails.Owner_Email}
              icon="mail"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Key Person"
              value={lfrDetails.KeyPersonName}
              icon="user-check"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Key Person Designation"
              value={lfrDetails.KeyPersonDesignation}
              icon="briefcase"
              iconType="feather"
            />
          </View>

          <View className="w-1/2">
            <InfoRow
              label="Key Person Number"
              value={String(lfrDetails.KeyPersonNumber)}
              icon="phone"
              iconType="feather"
              isPhoneNumber={true}
            />
          </View>

          <View className="w-1/2">
            <InfoRow
              label="Key Person Email"
              value={lfrDetails.KeyPersonMailID}
              icon="mail"
              iconType="feather"
            />
          </View>
             <View className="w-full">
            <InfoRow
              label="Pin code"
              value={String(lfrDetails.Pin_Code)}
              icon="map-pin"
              iconType="feather"
            />
          </View>
          <View className="w-full">
            <InfoRow
              label="Address"
              value={lfrDetails.ShopAddress}
              icon="map"
              iconType="feather"
            />
          </View>
        </View>
      </Card>

      {/* ASUS Information Card */}
      <Card className="mb-6">
        <SectionHeader
          title="ASUS Information"
          icon="domain"
          iconType="materialIcons"
        />

        <View className="flex-row flex-wrap">
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Business Type"
              value={lfrDetails.Business_Type}
              icon="briefcase"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Partner Type"
              value={lfrDetails.Partner_Type}
              icon="users"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Branch"
              value={lfrDetails.Branch_Name}
              icon="git-branch"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Territory"
              value={lfrDetails.Territory}
              icon="earth"
              iconType="ionicons"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Territory Manager"
              value={lfrDetails.Territory_Manager}
              icon="account-tie"
              iconType="material-community"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="AM Name"
              value={lfrDetails.AM_Name}
              icon="account-supervisor"
              iconType="material-community"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="ASE Name"
              value={lfrDetails.CSE_Name || 'N/A'}
              icon="account"
              iconType="material-community"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Task Owner"
              value={lfrDetails.Task_Owner_Name}
              icon="user-check"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Channel Map Code"
              value={lfrDetails.ChannelMapCode}
              icon="map"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="E-Commerce ID"
              value={lfrDetails.ECommerceId}
              icon="shopping-cart"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="PSIS"
              value={lfrDetails.PSIS}
              icon="info"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Is Active"
              value={lfrDetails.IsActive === 'A' ? 'Active' : 'Inactive'}
              icon="activity"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="Login Created"
              value={lfrDetails.IsLoginCreated === 'Y' ? 'Yes' : 'No'}
              icon="lock"
              iconType="feather"
            />
          </View>

                    <View className="w-1/2 mb-2">
            <InfoRow
              label="P-Kiosk ROG Kiosk"
              value={lfrDetails.Pkiosk_ROG_Kiosk || 'N/A'}
              icon="monitor"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="P-Kiosk"
              value={lfrDetails.Pkiosk || 'N/A'}
              icon="monitor"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="P-Kiosk Count"
              value={
                lfrDetails.Pkiosk_Cnt ? String(lfrDetails.Pkiosk_Cnt) : 'N/A'
              }
              icon="hash"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="ROG Kiosk"
              value={lfrDetails.ROG_Kiosk || 'N/A'}
              icon="monitor"
              iconType="feather"
            />
          </View>

          <View className="w-1/2 mb-2">
            <InfoRow
              label="ROG Kiosk Count"
              value={
                lfrDetails.ROG_Kiosk_Cnt
                  ? String(lfrDetails.ROG_Kiosk_Cnt)
                  : 'N/A'
              }
              icon="hash"
              iconType="feather"
            />
          </View>
        </View>
      </Card>
    </View>
  );
});

export const LFRCompetitionInfo = memo<LFRCompetitionInfoProps>(
  ({lfrDetails}) => {
    const competitionBrands = useMemo<BrandData[]>(
      () => [
        {
          name: 'ASUS',
          type: lfrDetails.Competition_Type_ASUS || 'N/A',
          number: lfrDetails.Competition_Num_ASUS
            ? String(lfrDetails.Competition_Num_ASUS)
            : 'N/A',
          color: AppColors.primary,
        },
        {
          name: 'HP',
          type: lfrDetails.Competition_Type_HP || 'N/A',
          number: lfrDetails.Competition_Num_HP
            ? String(lfrDetails.Competition_Num_HP)
            : 'N/A',
          color: '#0096D6',
        },
        {
          name: 'DELL',
          type: lfrDetails.Competition_Type_DELL || 'N/A',
          number: lfrDetails.Competition_Num_DELL
            ? String(lfrDetails.Competition_Num_DELL)
            : 'N/A',
          color: '#007DB8',
        },
        {
          name: 'LENOVO',
          type: lfrDetails.Competition_Type_LENOVA || 'N/A',
          number: lfrDetails.Competition_Num_LENOVA
            ? String(lfrDetails.Competition_Num_LENOVA)
            : 'N/A',
          color: '#E2231A',
        },
        {
          name: 'ACER',
          type: lfrDetails.Competition_Type_ACER || 'N/A',
          number: lfrDetails.Competition_Num_ACER
            ? String(lfrDetails.Competition_Num_ACER)
            : 'N/A',
          color: '#83B81A',
        },
        {
          name: 'MSI',
          type: lfrDetails.Competition_Type_MSI || 'N/A',
          number: lfrDetails.Competition_Num_MSI
            ? String(lfrDetails.Competition_Num_MSI)
            : 'N/A',
          color: '#FF0000',
        },
      ],
      [
        lfrDetails.Competition_Type_ASUS,
        lfrDetails.Competition_Num_ASUS,
        lfrDetails.Competition_Type_HP,
        lfrDetails.Competition_Num_HP,
        lfrDetails.Competition_Type_DELL,
        lfrDetails.Competition_Num_DELL,
        lfrDetails.Competition_Type_LENOVA,
        lfrDetails.Competition_Num_LENOVA,
        lfrDetails.Competition_Type_ACER,
        lfrDetails.Competition_Num_ACER,
        lfrDetails.Competition_Type_MSI,
        lfrDetails.Competition_Num_MSI,
      ],
    );

    return (
      <View>
        {/* Competition Brands Card */}
        <Card className="mb-4">
          <SectionHeader
            title="Competition Brands"
            icon="trending-up"
            iconType="feather"
          />
          <View className="flex-row flex-wrap -mx-1">
            {competitionBrands.map(brand => (
              <View key={brand.name} className="w-1/2 px-1 mb-2">
                <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="p-1.5 rounded-md mr-2"
                      style={{backgroundColor: `${brand.color}15`}}>
                      <AppIcon
                        name="laptop"
                        type="material-community"
                        size={16}
                        color={brand.color}
                      />
                    </View>
                    <AppText weight="bold" style={{color: brand.color}}>
                      {brand.name}
                    </AppText>
                  </View>
                  <View className="flex-row gap-x-2">
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Type
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.type}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="medium"
                        className="text-gray-500 mb-0.5">
                        Number
                      </AppText>
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-gray-800">
                        {brand.number}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Monthly Sales Information Card */}
        <Card className="mb-6">
          <SectionHeader
            title="Monthly Sales Information"
            icon="bar-chart-2"
            iconType="feather"
          />
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <InfoRow
                label="Monthly NB Sales"
                value={
                  lfrDetails.Monthly_NB_Sales
                    ? String(lfrDetails.Monthly_NB_Sales)
                    : 'N/A'
                }
                icon="shopping-cart"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="Monthly DT/AIO Sales"
                value={lfrDetails.Monthly_DTAIO_Sales || 'N/A'}
                icon="monitor"
                iconType="feather"
              />
            </View>

            <View className="w-1/2 mb-2">
              <InfoRow
                label="NB Display Units"
                value={
                  lfrDetails.NB_Display_Units
                    ? String(lfrDetails.NB_Display_Units)
                    : 'N/A'
                }
                icon="tv"
                iconType="feather"
              />
            </View>
          </View>
        </Card>
      </View>
    );
  },
);

export const LFRDetailsLoadingSkeleton = memo(() => (
  <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false}>
    <View className="px-1">
      <View className="flex-row mb-4 gap-x-2">
        <Skeleton
          width={SKELETON_CONFIG.TAB_WIDTH}
          height={SKELETON_CONFIG.TAB_HEIGHT}
          borderRadius={8}
        />
        <Skeleton
          width={SKELETON_CONFIG.TAB_WIDTH}
          height={SKELETON_CONFIG.TAB_HEIGHT}
          borderRadius={8}
        />
      </View>

      <View className="mb-4">
        <Skeleton
          width={SKELETON_CONFIG.CARD_WIDTH}
          height={SKELETON_CONFIG.CARD_HEIGHTS.LARGE}
          borderRadius={12}
        />
      </View>
      <View className="mb-4">
        <Skeleton
          width={SKELETON_CONFIG.CARD_WIDTH}
          height={SKELETON_CONFIG.CARD_HEIGHTS.MEDIUM}
          borderRadius={12}
        />
      </View>
    </View>
  </ScrollView>
));
