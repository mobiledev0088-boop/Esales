import {RefreshControl, ScrollView, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../../utils/handleApiCall';
import {DataStateView} from '../../../../../../components/DataStateView';
import FAB from '../../../../../../components/FAB';
import {useCallback, useMemo, useState} from 'react';
import AppIcon from '../../../../../../components/customs/AppIcon';
import AppText from '../../../../../../components/customs/AppText';
import Card from '../../../../../../components/Card';
import AppImage from '../../../../../../components/customs/AppImage';
import Skeleton from '../../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../../utils/constant';
import Swiper from 'react-native-swiper';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../../../types/navigation';
import {convertSnakeCaseToSentence} from '../../../../../../utils/commonFunctions';
import useQuarterHook from '../../../../../../hooks/useQuarterHook';

interface RawGalleryImageItem {
  Image_Link: string;
  Image_Type: string;
  Partner_Code: string;
  YearQTR: string;
  StandType: string;
}

interface GroupedGalleryImageItem {
  Image_Links: string[];
  Image_Type: string;
  Partner_Code: string;
  YearQTR: string;
}

interface QuarterGalleryItem {
  ImageType: string;
  Image_Links: string[];
  Partner_Code: string;
}

type GroupedGalleryByQuarter = Record<string, GroupedGalleryImageItem[]>;

type DisplayGalleryByQuarter = Record<string, QuarterGalleryItem[]>;

function transformGalleryData(
  data: RawGalleryImageItem[] | null | undefined,
): GroupedGalleryByQuarter {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }

  const quarterMap: Record<string, Map<string, GroupedGalleryImageItem>> = {};

  for (const item of data) {
    const {YearQTR, Image_Type, Partner_Code, Image_Link} = item;

    if (!YearQTR || !Image_Type || !Partner_Code || !Image_Link) {
      continue;
    }

    if (!quarterMap[YearQTR]) {
      quarterMap[YearQTR] = new Map();
    }

    const mergeKey = `${Image_Type}_${Partner_Code}`;
    const existing = quarterMap[YearQTR].get(mergeKey);

    if (existing) {
      existing.Image_Links.push(Image_Link);
    } else {
      quarterMap[YearQTR].set(mergeKey, {
        Image_Links: [Image_Link],
        Image_Type: Image_Type,
        Partner_Code,
        YearQTR,
      });
    }
  }
  const groupedData = Object.fromEntries(
    Object.entries(quarterMap).map(([yearQTR, value]) => [
      yearQTR,
      Array.from(value.values()),
    ]),
  );
  return groupedData;
}

function transformReferenceImages(
  data: RawGalleryImageItem[] | null | undefined,
): {Image_Link: string; StandType: string}[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  const referenceImages: {Image_Link: string; StandType: string}[] = [];
  for (const item of data) {
    const {Image_Link, StandType} = item;
    referenceImages.push({Image_Link, StandType});
  }
  return referenceImages;
}

const useGetStoreDetails = (partnerCode: string, partnerType: string) => {
  const payload = {
    PartnerCode: partnerCode,
    PartnerType: partnerType,
  };

  return useQuery({
    queryKey: ['StoreDetails', ...Object.values(payload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/Partner/ShopExpansionGalleryImages_Get',
        payload,
      );
      const result = response?.DashboardData;

      if (!result?.Status) {
        throw new Error('Failed to fetch gallery images');
      }

      const dataInfo = result.Datainfo ?? {};
      return {
        galleryData: dataInfo.SuccessData ?? [],
        referenceImages: dataInfo.ReferenceImages ?? [],
      };
    },
    enabled: Boolean(partnerCode) && Boolean(partnerType),
    select: data => {
      return {
        galleryData: transformGalleryData(data.galleryData),
        referenceImages: transformReferenceImages(data.referenceImages),
      };
    },
  });
};

const QuarterGallerySection = ({
  sectionIndex,
  items,
}: {
  sectionIndex: number;
  items: QuarterGalleryItem[];
}) => {
  return (
    <View key={sectionIndex} className="mt-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-x-2">
          <View className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <AppIcon name="info" size={18} color="#6B7280" type="feather" />
          </View>
          <View>
            <AppText size="sm" className="text-gray-500 dark:text-gray-400">
              Gallery Review
            </AppText>
            <AppText size="lg" weight="semibold">
              {sectionIndex === 0 ? 'Current Quarter' : 'Previous Quarter'}
            </AppText>
          </View>
        </View>
      </View>
      <View className="flex-row flex-wrap ">
        {items.map(item => (
          <View
            key={`${sectionIndex}-${item.ImageType}`}
            className="mb-3"
            style={{width: '50%'}}>
            <Card
              className="h-48 w-[95%] border border-slate-200 dark:border-slate-700"
              noshadow>
              {item.Image_Links && item.Image_Links.length > 1 && (
                <Swiper
                  autoplay={true}
                  autoplayTimeout={3}
                  showsPagination
                  dotColor={'#D1D5DB'}
                  activeDotColor={'#00539B'}
                  removeClippedSubviews={false}
                  style={{flexGrow: 1}}
                  paginationStyle={{bottom: 2}}>
                  {item.Image_Links.map((image, idx) => (
                    <AppImage
                      key={idx}
                      source={{uri: image}}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 12,
                      }}
                      resizeMode={'contain'}
                      enableModalZoom
                    />
                  ))}
                </Swiper>
              )}

              {item.Image_Links && item.Image_Links.length === 1 && (
                <AppImage
                  source={{uri: item.Image_Links[0]}}
                  style={{
                    width: '100%',
                    height: screenWidth * 0.28,
                    borderRadius: 12,
                  }}
                  resizeMode={'contain'}
                  enableModalZoom
                />
              )}

              {(!item.Image_Links || item.Image_Links.length === 0) && (
                <View className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
                  <AppIcon
                    name="image-off-outline"
                    size={28}
                    color="#9CA3AF"
                    type="material-community"
                  />
                  <AppText size="xs" className="mt-1 text-gray-400">
                    No images uploaded
                  </AppText>
                </View>
              )}
              <AppText size="sm" weight="semibold" className="mt-2 text-center">
                {item.ImageType || 'Unknown Type'}
              </AppText>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
};

const GalleryReviewSkeleton = () => {
  return (
    <View className="pt-3 px-4 gap-y-4 bg-lightBg-base dark:bg-darkBg-base">
      <View className="flex-row items-center gap-x-3">
        <Skeleton width={32} height={32} borderRadius={999} />
        <Skeleton width={140} height={20} borderRadius={8} />
      </View>
      {Array.from({length: 3}).map((_, sectionIndex) => (
        <View key={sectionIndex} className="gap-y-3">
          <View className="flex-row flex-wrap -mx-1">
            {Array.from({length: 4}).map((_, index) => (
              <View key={index} className="px-1 mb-3" style={{width: '50%'}}>
                <Skeleton
                  width={(screenWidth - 32 - 20) / 2}
                  height={160}
                  borderRadius={16}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default function GalleryReview({
  data,
  assetsKey,
}: {
  data: {PartnerCode: string; StoreType: string};
  assetsKey: string[];
}) {
  const navigation = useNavigation<AppNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const {selectedQuarter} = useQuarterHook();
  const {
    data: galleryQueryResult,
    isLoading,
    error,
    refetch,
  } = useGetStoreDetails(data.PartnerCode, data.StoreType);
  const galleryByQuarter: DisplayGalleryByQuarter = useMemo(() => {
    const emptyGallery = assetsKey.map(assetKey => ({
      ImageType: convertSnakeCaseToSentence(assetKey),
      Image_Links: [],
      Partner_Code: '',
    }));

    // 1️⃣ No data → return default for selected quarter
    if (
      !galleryQueryResult?.galleryData ||
      Object.keys(galleryQueryResult.galleryData).length === 0
    ) {
      return selectedQuarter?.value
        ? {[selectedQuarter.value]: emptyGallery}
        : {};
    }

    // 2️⃣ Data exists → normalize gallery data
    const result: DisplayGalleryByQuarter = {};

    for (const [yearQuarterKey, stores] of Object.entries(
      galleryQueryResult.galleryData,
    )) {
      if (!Array.isArray(stores)) continue;

      const storeMap = new Map(stores.map(item => [item.Image_Type, item]));

      result[yearQuarterKey] = assetsKey.map(assetKey => {
        const storeItem = storeMap.get(assetKey);

        return {
          ImageType: convertSnakeCaseToSentence(assetKey),
          Image_Links: storeItem?.Image_Links ?? [],
          Partner_Code: storeItem?.Partner_Code ?? '',
        };
      });
    }

    return result;
  }, [galleryQueryResult, assetsKey, selectedQuarter]);

  console.log('Transformed gallery by quarter:', galleryByQuarter);

  const isEmptyState =
    !isLoading && !error && Object.keys(galleryByQuarter).length === 0;

  const quarters = Object.values(galleryByQuarter);
  const currentQuarterImages = quarters[1] ? quarters[1] : quarters[0];
  const previousQuarterImages = !quarters[1] ? undefined : quarters[0];

  const handlePress = useCallback(() => {
    navigation.navigate('UploadGalleryReview', {
      data: currentQuarterImages || previousQuarterImages,
      storeCode: data.PartnerCode,
      referenceImages: galleryQueryResult?.referenceImages || [],
    });
  }, [data, galleryQueryResult, navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <DataStateView
      isLoading={isLoading}
      isError={!!error}
      isEmpty={isEmptyState}
      LoadingComponent={<GalleryReviewSkeleton />}>
      <ScrollView
        className="flex-1 bg-lightBg-base dark:bg-darkBg-base"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <View className="pt-3 pb-4 gap-y-4">
          {currentQuarterImages && (
            <QuarterGallerySection
              sectionIndex={0}
              items={currentQuarterImages}
            />
          )}
          {previousQuarterImages && (
            <QuarterGallerySection
              sectionIndex={1}
              items={previousQuarterImages}
            />
          )}
        </View>
      </ScrollView>
      <FAB onPress={handlePress} />
    </DataStateView>
  );
}
