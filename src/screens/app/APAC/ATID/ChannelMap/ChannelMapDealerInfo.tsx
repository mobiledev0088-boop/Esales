import {Linking, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {memo, useMemo} from 'react';
import {useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import AppLayout from '../../../../../components/layout/AppLayout';
import MaterialTabBar from '../../../../../components/MaterialTabBar';
import Skeleton from '../../../../../components/skeleton/skeleton';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {screenWidth} from '../../../../../utils/constant';
import {AppColors} from '../../../../../config/theme';
import Dashboard_Partner from '../Dashboard/Dashboard_Partner';

// ==================== TYPE DEFINITIONS ====================
interface DealerData {
  ACM_ID: number;
  Branch_Name: string | null;
  Territory: string | null;
  Partner_Type: string;
  Territory_Manager: string;
  TM_Code: string;
  CSE_Code: string;
  CSE_Code1: string;
  Shop_Name: string | null;
  Company_Name: string;
  ShopLandLine: string | null;
  ShopAddress: string | null;
  Pin_Code: string | null;
  ChannelMapCode: string | null;
  ASIN_Code: string | null;
  GST_No: string;
  Owner_Name: string | null;
  Owner_Number: string | null;
  Owner_Email: string | null;
  KeyPersonName: string | null;
  KeyPersonDesignation: string | null;
  KeyPersonNumber: string | null;
  KeyPersonMailID: string | null;
  Competition_Type_ASUS: string | null;
  Competition_Type_ASUS_Id: string | null;
  Competition_Num_ASUS: string | null;
  Competition_Type_HP: string | null;
  Competition_Type_HP_Id: string | null;
  Competition_Num_HP: string | null;
  Competition_Type_DELL: string | null;
  Competition_Type_DELL_Id: string | null;
  Competition_Num_DELL: string | null;
  Competition_Type_LENOVA: string | null;
  Competition_Type_LENOVA_Id: string | null;
  Competition_Num_LENOVA: string | null;
  Competition_Type_ACER: string | null;
  Competition_Type_ACER_Id: string | null;
  Competition_Num_ACER: string | null;
  Competition_Type_MSI: string | null;
  Competition_Type_MSI_Id: string | null;
  Competition_Num_MSI: string | null;
  Monthly_NB_Sales: string | null;
  Monthly_NB_Sales_Id: string | null;
  Monthly_DTAIO_Sales: string | null;
  Monthly_DTAIO_Sales_Id: string | null;
  Business_Type: string | null;
  Business_Type_Id: string | null;
  Monthly_TAM: string | null;
  NB_Display_Units: string | null;
  NB_Display_Units_Id: string | null;
  chainStore: string | null;
  NumberMobileStore: string | null;
  ShopArea: string | null;
  Signboard: string | null;
  Customize_Branding: string | null;
  IsActive: string | null;
  IsLoginCreated: string | null;
  ECommerceId: string;
  PSIS: string | null;
  Kiosk: string | null;
  Pkiosk: string | null;
  ROG_Kiosk: string | null;
  Pkiosk_ROG_Kiosk: string | null;
  Pkiosk_Cnt: string | null;
  ROG_Kiosk_Cnt: string | null;
  PhotoSelfie: string | null;
  PhotoInside1: string | null;
  PhotoInside2: string | null;
  lastYear: string | null;
  seconLastYear: string | null;
  YearStatus: string | null;
  LastQuarter: string | null;
  SecondLastQuarter: string | null;
  QuarterStatus: string | null;
  LastMonth: string | null;
  SecondLastMonth: string | null;
  MonthStatus: string | null;
}

interface SectionHeaderProps {
  title: string;
  icon: string;
  iconType?: IconType;
}

interface InfoRowProps {
  label: string;
  values: string | null;
  icon?: string;
  iconType?: IconType;
  isPhoneNumber?: boolean;
}

interface DealerInfoTabProps {
  dealerData: DealerData;
}

interface BrandData {
  name: string;
  type: string | null;
  number: string | null;
  color: string;
}

interface BrandConfig {
  name: string;
  color: string;
}

interface RouteParams {
  Dealer_Data: {
    ACM_Gst_No: string;
    ACM_CompanyName: string;
  };
}

// ==================== CONSTANTS ====================
const BRAND_CONFIGS: Record<string, BrandConfig> = {
  ASUS: {name: 'ASUS', color: AppColors.primary},
  HP: {name: 'HP', color: '#0096D6'},
  DELL: {name: 'DELL', color: '#007DB8'},
  LENOVO: {name: 'LENOVO', color: '#E2231A'},
  ACER: {name: 'ACER', color: '#83B81A'},
} as const;

const SKELETON_COUNT = 5;
const SKELETON_SPACING = 24;

// ==================== CUSTOM HOOKS ====================
const useDealerData = (shopName: string) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: roleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  return useQuery({
    queryKey: ['dealerInfo', employeeCode, roleId, shopName],
    queryFn: async (): Promise<DealerData> => {
      const response = await handleAPACApiCall('/Information/GetAGPInfo', {
        employeeCode,
        RoleId: roleId,
        Shop_Name: shopName,
      });

      const result = response?.DashboardData;

      if (!result?.Status) {
        throw new Error('Failed to fetch dealer information');
      }

      return result.Datainfo?.AGP_Info[0] || {};
    },
    enabled: !!shopName && !!employeeCode && !!roleId,
  });
};

// ==================== REUSABLE COMPONENTS ====================
const SectionHeader = memo<SectionHeaderProps>(
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
      <AppText size="lg" weight="bold" className="text-gray-800">
        {title}
      </AppText>
    </View>
  ),
);
const InfoRow = memo<InfoRowProps>(
  ({label, values, icon, iconType = 'feather', isPhoneNumber = false}) => {
    const displayValue = values || 'N/A';

    const handlePhonePress = () => {
      if (isPhoneNumber && displayValue !== 'N/A') {
        const phoneNumber = displayValue.replace(/[^0-9+]/g, '');
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
              selectable
              style={
                isPhoneNumber && displayValue !== 'N/A'
                  ? {color: AppColors.primary, textDecorationLine: 'underline'}
                  : undefined
              }>
              {displayValue}
            </AppText>
          </ContentWrapper>
        </View>
      </View>
    );
  },
);
const InfoItemWrapper = ({children}: {children: React.ReactNode}) => (
  <View className="w-1/2 mb-2">{children}</View>
);
const LoadingSkeleton = memo(() => (
  <View className="px-3 pt-3">
    {Array.from({length: SKELETON_COUNT}).map((_, index) => (
      <Skeleton
        key={index}
        width={screenWidth - SKELETON_SPACING}
        height={100}
        borderRadius={8}
      />
    ))}
  </View>
));

// ==================== TAB COMPONENTS ====================
const BasicInfoTab = memo<DealerInfoTabProps>(({dealerData}) => {
  return (
    <ScrollView
      className="bg-lightBg-base dark:bg-darkBg-base px-3"
      showsVerticalScrollIndicator={false}>
      {/* Shop Information Card */}
      <Card className="mb-4">
        <SectionHeader title="Shop Information" icon="shopping-bag" />
        <View className="flex-row flex-wrap">
          <InfoItemWrapper>
            <InfoRow
              label="Shop Name"
              values={dealerData.Shop_Name}
              icon="store"
              iconType="materialIcons"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="GST No"
              values={dealerData.GST_No}
              icon="file-text"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Address"
              values={dealerData.ShopAddress}
              icon="map-pin"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Pin Code"
              values={dealerData.Pin_Code}
              icon="map-pin"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Owner Name"
              values={dealerData.Owner_Name}
              icon="user"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Owner Number"
              values={dealerData.Owner_Number}
              icon="phone"
              iconType="feather"
              isPhoneNumber
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Key Person"
              values={dealerData.KeyPersonName}
              icon="user-check"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Key Person Designation"
              values={dealerData.KeyPersonDesignation}
              icon="briefcase"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Key Person Email"
              values={dealerData.KeyPersonMailID}
              icon="mail"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Key Person Number"
              values={dealerData.KeyPersonNumber}
              icon="phone"
              iconType="feather"
              isPhoneNumber
            />
          </InfoItemWrapper>
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
          <InfoItemWrapper>
            <InfoRow
              label="ASIN Code"
              values={dealerData.ASIN_Code}
              icon="hash"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="E-Commerce ID"
              values={dealerData.ECommerceId}
              icon="shopping-cart"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Is Active"
              values={dealerData.IsActive === 'A' ? 'Active' : 'Inactive'}
              icon="activity"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Login Created"
              values={dealerData.IsLoginCreated === 'Y' ? 'Yes' : 'No'}
              icon="lock"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Business Type"
              values={dealerData.Business_Type}
              icon="briefcase"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Branch"
              values={dealerData.Branch_Name}
              icon="git-branch"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Territory"
              values={dealerData.Territory}
              icon="earth"
              iconType="ionicons"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Territory Manager"
              values={dealerData.Territory_Manager}
              icon="account-tie"
              iconType="material-community"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="CSE Code"
              values={dealerData.CSE_Code}
              icon="credit-card"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Channel Map Code"
              values={dealerData.ChannelMapCode}
              icon="map"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="P-Kiosk"
              values={dealerData.Pkiosk}
              icon="monitor"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="P-Kiosk Count"
              values={dealerData.Pkiosk_Cnt}
              icon="hash"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="ROG Kiosk"
              values={dealerData.ROG_Kiosk}
              icon="monitor"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="ROG Kiosk Count"
              values={dealerData.ROG_Kiosk_Cnt}
              icon="hash"
              iconType="feather"
            />
          </InfoItemWrapper>
        </View>
      </Card>
    </ScrollView>
  );
});

const CompetitionInfoTab = memo<DealerInfoTabProps>(({dealerData}) => {
  // Memoize brand data to avoid recalculation on every render
  const brands = useMemo<BrandData[]>(
    () => [
      {
        name: BRAND_CONFIGS.ASUS.name,
        type: dealerData.Competition_Type_ASUS,
        number: dealerData.Competition_Num_ASUS,
        color: BRAND_CONFIGS.ASUS.color,
      },
      {
        name: BRAND_CONFIGS.HP.name,
        type: dealerData.Competition_Type_HP,
        number: dealerData.Competition_Num_HP,
        color: BRAND_CONFIGS.HP.color,
      },
      {
        name: BRAND_CONFIGS.DELL.name,
        type: dealerData.Competition_Type_DELL,
        number: dealerData.Competition_Num_DELL,
        color: BRAND_CONFIGS.DELL.color,
      },
      {
        name: BRAND_CONFIGS.LENOVO.name,
        type: dealerData.Competition_Type_LENOVA,
        number: dealerData.Competition_Num_LENOVA,
        color: BRAND_CONFIGS.LENOVO.color,
      },
      {
        name: BRAND_CONFIGS.ACER.name,
        type: dealerData.Competition_Type_ACER,
        number: dealerData.Competition_Num_ACER,
        color: BRAND_CONFIGS.ACER.color,
      },
    ],
    [dealerData],
  );

  return (
    <ScrollView
      className="bg-lightBg-base dark:bg-darkBg-base px-3"
      showsVerticalScrollIndicator={false}>
      {/* Competition Brands Card */}
      <Card className="mb-4">
        <SectionHeader
          title="Competition Brands"
          icon="trending-up"
          iconType="feather"
        />
        <View className="flex-row flex-wrap -mx-1">
          {brands.map(brand => (
            <View key={brand.name} className="w-1/2 px-1 mb-2">
              <View className="bg-gray-50 dark:bg-gray-700 p-2.5 rounded-lg border border-gray-100 dark:border-gray-600">
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
          <InfoItemWrapper>
            <InfoRow
              label="Monthly NB Sales"
              values={dealerData.Monthly_NB_Sales}
              icon="shopping-cart"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="Monthly DT/AIO Sales"
              values={dealerData.Monthly_DTAIO_Sales}
              icon="monitor"
              iconType="feather"
            />
          </InfoItemWrapper>
          <InfoItemWrapper>
            <InfoRow
              label="NB Display Units"
              values={dealerData.NB_Display_Units}
              icon="tv"
              iconType="feather"
            />
          </InfoItemWrapper>
        </View>
      </Card>
    </ScrollView>
  );
});

const ResultsTab = memo(({ DifferentEmployeeCode }: { DifferentEmployeeCode?: string }) => (
  <Dashboard_Partner DifferentEmployeeCode={DifferentEmployeeCode} />
));

// ==================== MAIN COMPONENT ====================
export default function ChannelMapDealerInfo() {
  const {params} = useRoute();
  const {Dealer_Data} = params as RouteParams;
  console.log('Dealer_Data:', Dealer_Data);
  const dealerGstNo = Dealer_Data?.ACM_Gst_No;

  const {data: dealerData, isLoading} = useDealerData(dealerGstNo);

  if (isLoading) {
    return (
      <AppLayout title="Dealer Info" needBack>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dealer Info" needBack>
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center">
          <AppIcon
            name="store"
            type="materialIcons"
            size={24}
            color={AppColors.primary}
            style={{marginRight: 4}}
          />
          <AppText size="xl" weight="bold" className="text-gray-900">
            {Dealer_Data?.ACM_CompanyName || 'N/A'}
          </AppText>
        </View>
        <AppText size="sm" weight="medium" className="text-gray-500 mt-1">
          GST No: {Dealer_Data?.ACM_Gst_No || 'N/A'}
        </AppText>
      </View>
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
        {dealerData && (
          <MaterialTabBar
            tabs={[
              {
                name: 'Basic Information',
                component: <BasicInfoTab dealerData={dealerData} />,
                label: 'Basic Info',
              },
              {
                name: 'Competition Info',
                component: <CompetitionInfoTab dealerData={dealerData} />,
                label: 'Competition Info',
              },
              {
                name: 'Results',
                component: <ResultsTab DifferentEmployeeCode={Dealer_Data?.ACM_Gst_No} />,
                label: 'Results',
              },
            ]}
          />
        )}
      </View>
    </AppLayout>
  );
}