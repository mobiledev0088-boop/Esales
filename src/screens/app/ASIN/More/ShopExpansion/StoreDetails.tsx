import {Text, View, ScrollView, TouchableOpacity, FlatList} from 'react-native';
import {useState} from 'react';
import {useRoute} from '@react-navigation/native';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import useEmpStore from '../../../../../stores/useEmpStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppLayout from '../../../../../components/layout/AppLayout';
import MaterialTabBar from '../../../../../components/MaterialTabBar';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppImage from '../../../../../components/customs/AppImage';
import Pdf from 'react-native-pdf';
import {screenHeight, screenWidth} from '../../../../../utils/constant';
import AppModal from '../../../../../components/customs/AppModal';
import {AppColors} from '../../../../../config/theme';
import ImageSlider, {SwiperItem} from '../../../../../components/ImageSlider';
import AppTabBar, {TabItem} from '../../../../../components/CustomTabBar';

interface PartnerDetails {
  PS_ID: number;
  ID: number;
  StoreName: string;
  StoreType: string;
  Region: string;
  Branch: string;
  Territory: string;
  City: string;
  MapCode: string;
  GSTNo: string;
  ParentCode: string;
  SubCode: string;
  HandoverDate: string;
  StoreSize: string;
  AddedBy: string;
  UpdatedBy: string;
  IsActive: string;
  UpdatedTime: string;
  CreatedTime: string;
  BaseUrl: string;
  MediaUrl: string;
  UPD_BANNED: string;
  UPD_BANNEDON: string;
  UPD_PROPERTY: string;
  UPD_COUNTRY: string;
  UPD_BRANCH: string;
  UPD_USER: string;
  UPD_TODAY: string;
  UPD_MODULE: string;
  UPD_MACHINENAME: string;
  BranchName: string;
  three_d_design: string;
  two_d_design: string;
}
interface Table1 {
  ID: number;
  ParentCode: string;
  SubCode: string;
  ImageType: string;
  ImageName: string;
  UPD_BANNED: string;
  UPD_BANNEDON: string;
  UPD_PROPERTY: string;
  UPD_COUNTRY: string;
  UPD_BRANCH: string;
  UPD_USER: string;
  UPD_TODAY: string;
  UPD_MODULE: string;
  UPD_MACHINENAME: string;
}
interface Table2 {
  ID: number;
  ParentCode: string;
  SubCode: string;
  KVType: string;
  Name: string;
  Dimension: string;
  KVDate: string;
  ImagePath: string;
  UPD_BANNED: string;
  UPD_BANNEDON: string;
  UPD_PROPERTY: string;
  UPD_COUNTRY: string;
  UPD_BRANCH: string;
  UPD_USER: string;
  UPD_TODAY: string;
  UPD_MODULE: string;
  UPD_MACHINENAME: string;
  KVYear: any;
  KVQtr: any;
}
interface Table3 {
  ID: number;
  ParentCode: string;
  SubCode: string;
  SignBoardType: string;
  Size: string;
  LogoSize: string;
  Color: string;
  ImagePath: string;
  UPD_BANNED: string;
  UPD_BANNEDON: string;
  UPD_PROPERTY: string;
  UPD_COUNTRY: string;
  UPD_BRANCH: string;
  UPD_USER: string;
  UPD_TODAY: string;
  UPD_MODULE: string;
  UPD_MACHINENAME: string;
}
interface shopExpansionData {
  // Define the structure of shop expansion data here
  PartnerDetails: PartnerDetails[];
  Table1: Table1[];
  Table2: Table2[];
  Table3: Table3[];
  Table4: any[];
}

const useGetStoreDetails = (PartnerCode: string) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const empInfo = useEmpStore(state => state.empInfo);
  const payload = {
    employeeCode,
    RoleId,
    PartnerCode,
    YearQtr: empInfo?.Year_Qtr,
  };
  return useQuery({
    queryKey: ['StoreDetails', ...Object.values(payload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/Partner/GetShopExpansion_PartnerDetails',
        payload,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch partner demo summary');
      }
      return {
        ...result.Datainfo,
        MediaUrl: result.Datainfo?.PartnerDetails?.[0]?.MediaUrl || '',
      };
    },
    enabled: !!PartnerCode,
  });
};

// Section Header Component
const SectionHeader = ({
  title,
  icon,
  iconType = 'feather',
}: {
  title: string;
  icon: string;
  iconType?: any;
}) => (
  <View className="flex-row items-center mb-4">
    <View className="bg-primary/10 p-2 rounded-lg mr-3">
      <AppIcon
        name={icon}
        type={iconType}
        size={20}
        color={AppColors.primary}
      />
    </View>
    <AppText size="lg" weight="bold" className="text-gray-800 dark:text-gray-100">
      {title}
    </AppText>
  </View>
);

// Info Row Component
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) => (
  <View className="mb-3">
    <AppText size="sm" className="text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </AppText>
    <AppText size="base" weight="bold" className="text-gray-900 dark:text-gray-100">
      {value || 'N/A'}
    </AppText>
  </View>
);

// Partner Details Section
const PartnerDetailsSection = ({
  partner,
}: {
  partner: PartnerDetails | undefined;
}) => {
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{url: string; title: string}>({
    url: '',
    title: '',
  });

  const handleViewPdf = (url: string, title: string) => {
    setSelectedPdf({url, title});
    setPdfModalOpen(true);
  };

  if (!partner) return null;

  return (
    <>
      <Card className="mb-4">
        <SectionHeader title="Partner Details" icon="store" iconType="materialIcons" />
        
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <InfoRow label="Store Name" value={partner.StoreName} />
          </View>
          <View className="w-1/2 pl-2">
            <InfoRow label="Store Type" value={partner.StoreType} />
          </View>
        </View>

        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <InfoRow label="City" value={partner.City} />
          </View>
          <View className="w-1/2 pl-2">
            <InfoRow label="Territory" value={partner.Territory} />
          </View>
        </View>

        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <InfoRow label="Region" value={partner.Region} />
          </View>
          <View className="w-1/2 pl-2">
            <InfoRow label="Branch" value={partner.BranchName} />
          </View>
        </View>

        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <InfoRow label="GST No" value={partner.GSTNo} />
          </View>
          <View className="w-1/2 pl-2">
            <InfoRow label="Store Size" value={partner.StoreSize} />
          </View>
        </View>

        {/* Store Designs */}
        {(partner.three_d_design || partner.two_d_design) && (
          <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppText size="base" weight="semibold" className="mb-3 text-gray-800 dark:text-gray-100">
              Store Designs
            </AppText>
            <View className="flex-row gap-3">
              {partner.three_d_design && (
                <TouchableOpacity
                  onPress={() => handleViewPdf(partner.three_d_design, '3D Store Layout')}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700"
                  activeOpacity={0.7}>
                  <View className="items-center">
                    <AppIcon
                      type="material-community"
                      name="cube-outline"
                      size={32}
                      color={AppColors.primary}
                    />
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-blue-700 dark:text-blue-300 mt-2 text-center">
                      3D Layout
                    </AppText>
                  </View>
                </TouchableOpacity>
              )}

              {partner.two_d_design && (
                <TouchableOpacity
                  onPress={() => handleViewPdf(partner.two_d_design, '2D Store Layout')}
                  className="flex-1 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700"
                  activeOpacity={0.7}>
                  <View className="items-center">
                    <AppIcon
                      type="material-community"
                      name="floor-plan"
                      size={32}
                      color="#10B981"
                    />
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-green-700 dark:text-green-300 mt-2 text-center">
                      2D Layout
                    </AppText>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Card>

      {/* PDF Modal */}
      <AppModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        showCloseButton>
        <View style={{height: screenHeight * 0.7}}>
          <AppText weight="semibold" className="mb-3 text-lg">
            {selectedPdf.title}
          </AppText>
          <Pdf
            source={{cache: true, uri: selectedPdf.url}}
            style={{flex: 1, borderWidth: 0.5, borderColor: '#ccc', borderRadius: 8}}
            trustAllCerts={false}
            onLoadComplete={pages =>
              console.log(`PDF loaded with ${pages} pages`)
            }
            onError={error => console.log('PDF Error:', error)}
          />
        </View>
      </AppModal>
    </>
  );
};

// Asset Details Section (Table1)
const AssetDetailsSection = ({
  assets,
  mediaUrl,
}: {
  assets: Table1[] | undefined;
  mediaUrl: string;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SwiperItem[]>([]);

  if (!assets || assets.length === 0) return null;

  // Group images by ImageType
  const groupedAssets = assets.reduce((acc, asset) => {
    const type = asset.ImageType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(asset);
    return acc;
  }, {} as Record<string, Table1[]>);

  // Split into two rows for better layout
  const imageTypes = Object.keys(groupedAssets);
  const midPoint = Math.ceil(imageTypes.length / 2);
  const row1 = imageTypes.slice(0, midPoint);
  const row2 = imageTypes.slice(midPoint);

  const handleImagePress = (images: SwiperItem[]) => {
    if (images.length > 1) {
      setSelectedImages(images);
      setModalOpen(true);
    }
  };

  const renderImageTypeGroup = (imageType: string) => {
    const items = groupedAssets[imageType];
    const images = items.map(item => ({
      image: `${mediaUrl}${item.ImageName}`,
      link: item.ImageName,
    })) as SwiperItem[];

    return (
      <View key={imageType} className="mr-3" style={{width: screenWidth * 0.45}}>
        <Card className="p-3">
          <View className="flex-row items-center justify-between mb-2">
            <AppText size="sm" weight="bold" className="text-gray-800 dark:text-gray-100 flex-1" numberOfLines={1}>
              {imageType}
            </AppText>
            <View className="bg-primary/10 px-2 py-1 rounded-full">
              <AppText size="xs" weight="bold" className="text-primary">
                {items.length}
              </AppText>
            </View>
          </View>
          
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleImagePress(images)}>
            <AppImage
              source={{uri: images[0].image}}
              style={{width: '100%', height: 140, borderRadius: 8}}
              resizeMode="cover"
              enableModalZoom={images.length === 1}
              showSkeleton
            />
            {images.length > 1 && (
              <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-md">
                <AppText size="xs" weight="bold" className="text-white">
                  +{images.length - 1}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  return (
    <>
      <View className="mb-4">
        <View className="px-3">
          <SectionHeader title="Asset Details" icon="image" />
        </View>
        
        {/* Combined ScrollView with both rows */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 12}}>
          <View>
            {/* Row 1 */}
            {row1.length > 0 && (
              <View className="flex-row mb-2">
                {row1.map(renderImageTypeGroup)}
              </View>
            )}

            {/* Row 2 */}
            {row2.length > 0 && (
              <View className="flex-row">
                {row2.map(renderImageTypeGroup)}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Image Slider Modal */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        showCloseButton>
        <View style={{height: screenHeight * 0.6}}>
          <AppText weight="semibold" className="mb-3 text-lg">
            Asset Images
          </AppText>
          <ImageSlider
            data={selectedImages}
            width={screenWidth * 0.9}
            height={screenHeight * 0.5}
            onPress={() => {}}
            show={true}
            autoplay={false}
            resizeMode="contain"
          />
        </View>
      </AppModal>
    </>
  );
};

// Helper function to convert snake_case or SCREAMING_SNAKE_CASE to Camel Case
const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word, index) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
};

// KV Details Section (Table2)
const KVDetailsSection = ({
  kvData,
  mediaUrl,
}: {
  kvData: Table2[] | undefined;
  mediaUrl: string;
}) => {
  if (!kvData || kvData.length === 0) return null;

  // Group by KVType
  const groupedKV = kvData.reduce((acc, kv) => {
    const type = kv.KVType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(kv);
    return acc;
  }, {} as Record<string, Table2[]>);

  // Create tabs for each KVType with Camel Case labels
  const tabs: TabItem[] = Object.entries(groupedKV).map(([kvType, items]) => ({
    label: toCamelCase(kvType),
    name: kvType,
    component: (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-3">
          <Card>
            {items.map((item, idx) => (
              <View
                key={idx}
                className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${
                  idx > 0 ? 'mt-3' : ''
                }`}>
                <View className="flex-row items-start">
                  {/* Left side - Details */}
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center mb-2">
                      <AppIcon
                        type="material-community"
                        name="image-filter-hdr"
                        size={16}
                        color={AppColors.primary}
                      />
                      <AppText size="sm" weight="bold" className="text-gray-800 dark:text-gray-100 ml-2">
                        {item.Name || 'N/A'}
                      </AppText>
                    </View>

                    <View className="mb-2">
                      <AppText size="xs" className="text-gray-500 dark:text-gray-400">
                        Dimension
                      </AppText>
                      <AppText size="sm" weight="bold" className="text-gray-900 dark:text-gray-100">
                        {item.Dimension || 'N/A'}
                      </AppText>
                    </View>

                    <View>
                      <AppText size="xs" className="text-gray-500 dark:text-gray-400">
                        Quarter
                      </AppText>
                      <AppText size="sm" weight="bold" className="text-gray-900 dark:text-gray-100">
                        {item.KVQtr ? `Q${item.KVQtr} ${item.KVYear}` : 'N/A'}
                      </AppText>
                    </View>
                  </View>

                  {/* Right side - Image */}
                  {item.ImagePath && (
                    <View style={{width: 120}}>
                      <AppImage
                        source={{uri: `${mediaUrl}${item.ImagePath}`}}
                        style={{width: 120, height: 120, borderRadius: 8}}
                        resizeMode="cover"
                        enableModalZoom
                        showSkeleton
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    ),
  }));

  return (
    <View className="mb-4">
      <View className="px-3">
        <SectionHeader title="KV Details" icon="layers" />
      </View>
      
      <View style={{minHeight: 400}}>
        <AppTabBar tabs={tabs} />
      </View>
    </View>
  );
};

// Signboard Details Section (Table3)
const SignboardDetailsSection = ({
  signboards,
  mediaUrl,
}: {
  signboards: Table3[] | undefined;
  mediaUrl: string;
}) => {
  if (!signboards || signboards.length === 0) return null;

  return (
    <Card className="mb-4">
      <SectionHeader title="Signboard Details" icon="award" />
      
      <FlatList
        data={signboards}
        scrollEnabled={false}
        keyExtractor={(item, index) => `signboard-${index}`}
        renderItem={({item, index}) => (
          <View
            className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${
              index > 0 ? 'mt-3' : ''
            }`}>
            <View className="flex-row items-start">
              {/* Left side - Details */}
              <View className="flex-1 pr-3">
                <View className="flex-row items-center mb-2">
                  <AppIcon
                    type="material-community"
                    name="sign-direction"
                    size={16}
                    color={AppColors.primary}
                  />
                  <AppText size="sm" weight="bold" className="text-gray-800 dark:text-gray-100 ml-2">
                    {item.SignBoardType || 'Signboard'}
                  </AppText>
                </View>

                <View className="mb-2">
                  <AppText size="xs" className="text-gray-500 dark:text-gray-400">
                    Size
                  </AppText>
                  <AppText size="sm" weight="bold" className="text-gray-900 dark:text-gray-100">
                    {item.Size || 'N/A'}
                  </AppText>
                </View>

                <View className="mb-2">
                  <AppText size="xs" className="text-gray-500 dark:text-gray-400">
                    Logo Size
                  </AppText>
                  <AppText size="sm" weight="bold" className="text-gray-900 dark:text-gray-100">
                    {item.LogoSize || 'N/A'}
                  </AppText>
                </View>

                <View>
                  <AppText size="xs" className="text-gray-500 dark:text-gray-400">
                    Color
                  </AppText>
                  <AppText size="sm" weight="bold" className="text-gray-900 dark:text-gray-100">
                    {item.Color || 'N/A'}
                  </AppText>
                </View>
              </View>

              {/* Right side - Image */}
              {item.ImagePath && (
                <View style={{width: 120}}>
                  <AppImage
                    source={{uri: `${mediaUrl}${item.ImagePath}`}}
                    style={{width: 120, height: 120, borderRadius: 8}}
                    resizeMode="cover"
                    enableModalZoom
                    showSkeleton
                  />
                </View>
              )}
            </View>
          </View>
        )}
      />
    </Card>
  );
};

// Empty State Component
const EmptyState = ({message}: {message: string}) => (
  <Card className="items-center justify-center py-8">
    <AppIcon
      type="material-community"
      name="information-outline"
      size={48}
      color="#9CA3AF"
    />
    <AppText size="base" className="text-gray-500 dark:text-gray-400 mt-3 text-center">
      {message}
    </AppText>
  </Card>
);

// Loading State
const LoadingState = () => (
  <View className="flex-1 items-center justify-center py-10">
    <AppText size="base" className="text-gray-500 dark:text-gray-400">
      Loading store details...
    </AppText>
  </View>
);

const ShopExpansion = ({
  data,
  isLoading,
}: {
  data: (shopExpansionData & {MediaUrl?: string}) | undefined;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!data) {
    return <EmptyState message="No store details available" />;
  }

  const partner = data.PartnerDetails?.[0];
  const assets = data.Table1;
  const kvData = data.Table2;
  const signboards = data.Table3;
  const mediaUrl = data.MediaUrl || '';

  return (
    <ScrollView 
      className="flex-1 bg-lightBg-base dark:bg-darkBg-base"
      showsVerticalScrollIndicator={false}>
      <View className="p-3">
        <PartnerDetailsSection partner={partner} />
        <AssetDetailsSection assets={assets} mediaUrl={mediaUrl} />
        <SignboardDetailsSection signboards={signboards} mediaUrl={mediaUrl} />
        <KVDetailsSection kvData={kvData} mediaUrl={mediaUrl} />
      </View>
    </ScrollView>
  );
};

export default function StoreDetails() {
  const {params} = useRoute();
  const {PartnerCode, StoreType} = params as {
    PartnerCode: string;
    StoreType: string;
  };
  const {data: storeDetails, isLoading} = useGetStoreDetails(PartnerCode);
  console.log('Store Details:', storeDetails, isLoading);
  return (
    <AppLayout title="Store Details" needBack needPadding>
      <MaterialTabBar
        tabs={[
          {
            name: 'Shop Expansion',
            label: 'Shop Expansion',
            component: (
              <ShopExpansion data={storeDetails} isLoading={isLoading} />
            ),
          },
          {
            name: 'Gallery Review',
            label: 'Gallery Review',
            component: (
              <View>
                <Text>Gallery Review Content</Text>
              </View>
            ),
          },
        ]}
      />
    </AppLayout>
  );
}