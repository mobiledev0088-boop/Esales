import {useCallback, useState} from 'react';
import {View, FlatList, Pressable, Linking} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import AppText from '../../../../../components/customs/AppText';
import AppImage from '../../../../../components/customs/AppImage';
import AppIcon from '../../../../../components/customs/AppIcon';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';

interface SpotlightVideoItem {
  VideoLink: string;
  Model_Name: string;
}

const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regex = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const buildThumbnail = (videoLink: string) => {
  const id = getYouTubeVideoId(videoLink);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
};

// Full screen skeleton (dropdown + cards)
const SpotlightVideoScreenSkeleton = () => (
  <View className="pt-4 px-3">
    <View className="mb-4 px-1">
      <Skeleton width={screenWidth - 32} height={54} borderRadius={12} />
    </View>
    {[...Array(5)].map((_, i) => (
      <View key={i} className="mb-5 rounded-lg dark:bg-darkBg-surface">
        <Skeleton width={screenWidth - 32} height={200} borderRadius={12} />
        <View className="">
          <Skeleton width={screenWidth - 64} height={18} borderRadius={6} />
        </View>
      </View>
    ))}
  </View>
);

export default function SpotLightVideos() {
  const userInfo = useLoginStore(state => state.userInfo);
  const [modelName, setModelName] = useState<string>(''); // empty => API returns top

  // Model list (dropdown)
  const {
    data: modelOptions = [],
    isLoading: modelListLoading,
    error: modelListError,
    refetch: refetchModels,
  } = useQuery<AppDropdownItem[], Error>({
    queryKey: ['spotlightVideosModelList'],
    staleTime: 1000 * 60 * 10, // 10 minutes
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/Information/GetSpotlightModelList',
        {
          employeeCode: userInfo?.EMP_Code,
          RoleId: userInfo?.EMP_RoleId,
        },
      );
      const result = res.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to fetch model list');
      }
      const list = result?.Datainfo?.Spotlight_Model_List || [];
      return list.map((item: {Model_Name: string}) => ({
        label: item.Model_Name,
        value: item.Model_Name,
      }));
    },
  });

  // Videos data
  const {
    data: videos = [],
    isLoading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
    isRefetching: videosRefetching,
  } = useQuery<SpotlightVideoItem[], Error>({
    queryKey: ['spotlightVideosData', modelName || 'top'],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/Information/GetSpotlightModelInfo',
        {
          employeeCode: userInfo?.EMP_Code,
          RoleId: userInfo?.EMP_RoleId,
          ModelName: modelName,
        },
      );
      const result = res.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to fetch spotlight videos');
      }
      return (res?.DashboardData?.Datainfo?.Spotlight_Model_Info || []) as SpotlightVideoItem[];
    },
  });

  const handleOpenVideo = useCallback((url: string) => {
    if (!url) return;
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(finalUrl).catch(() => {
      if (!finalUrl.startsWith('https://')) {
        Linking.openURL(`https://${finalUrl}`);
      }
    });
  }, []);

  const renderItem = useCallback(
    ({item}: {item: SpotlightVideoItem}) => {
      const thumb = buildThumbnail(item.VideoLink);
      return (
        <Pressable
          onPress={() => handleOpenVideo(item.VideoLink)}
          className="mb-4 overflow-hidden rounded-lg active:opacity-70 bg-white dark:bg-darkBg-surface border border-gray-200 dark:border-darkBg-border">
          <View className="relative">
            {thumb ? (
              <AppImage
                source={{uri: thumb}}
                style={{width: '100%', height: 200, backgroundColor: '#e5e7eb'}}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{width: '100%', height: 200, backgroundColor: '#e5e7eb'}}
                className="items-center justify-center">
                <AppIcon type="feather" name="image" size={48} color="#999" />
              </View>
            )}
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-14 h-14 rounded-full bg-black/55 justify-center ">
                <AppIcon
                  type="feather"
                  name="play"
                  size={25}
                  color="red"
                  style={{alignSelf: 'center', marginLeft: 3}}
                />
              </View>
            </View>
          </View>
          <View className="p-3 flex-row items-center justify-between">
            <AppText
              weight="semibold"
              size="md"
              className="flex-1 mr-2"
              numberOfLines={1}>
              {item.Model_Name || 'Unknown Model'}
            </AppText>
            <AppIcon
              type="feather"
              name="external-link"
              size={18}
              color="#666"
            />
          </View>
        </Pressable>
      );
    },
    [handleOpenVideo],
  );

  const isEmpty = !videosLoading && !videosError && videos.length === 0;

  const listEmpty = useCallback(() => {
    if (videosError) {
      return (
        <View className="mt-10 items-center">
          <AppIcon
            type="feather"
            name="alert-circle"
            size={38}
            color="#dc2626"
          />
          <AppText className="mt-3 text-center" weight="medium" size="md">
            {videosError.message || 'Failed to load videos'}
          </AppText>
          <Pressable
            onPress={() => refetchVideos()}
            className="mt-4 rounded-full bg-primary px-6 py-2">
            <AppText color="white" weight="semibold">
              Retry
            </AppText>
          </Pressable>
        </View>
      );
    }
    if (isEmpty) {
      return (
        <View className="mt-10 items-center">
          <AppIcon type="feather" name="youtube" size={42} color="#666" />
          <AppText className="mt-3 text-center" weight="medium" size="md">
            No spotlight videos found.
          </AppText>
        </View>
      );
    }
    return null;
  }, [videosLoading, videosError, refetchVideos, isEmpty]);

  return (
    <AppLayout title="SpotLight Videos" needBack needPadding>
      {videosLoading ? (
        <SpotlightVideoScreenSkeleton />
      ) : (
        <View className="flex-1 bg-slate-50">
          <View className="pt-5 pb-5">
            <AppDropdown
              data={modelOptions}
              onSelect={item => setModelName(item?.value || '')}
              selectedValue={modelName || null}
              mode="autocomplete"
              placeholder={modelListLoading ? 'Loading...' : 'Filter by model'}
              label="Model"
              allowClear
              needIndicator
              zIndex={1000}
            />
            {modelListError && (
              <View className="flex-row items-center mt-2">
                <AppText
                  size="sm"
                  className="flex-1 text-red-600 dark:text-red-400">
                  {(modelListError as Error).message || 'Failed to load models'}
                </AppText>
                <Pressable
                  onPress={() => refetchModels()}
                  className="px-3 py-1 rounded-full bg-primary">
                  <AppText color="white" size="sm" weight="semibold">
                    Retry
                  </AppText>
                </Pressable>
              </View>
            )}
          </View>
          <FlatList
            data={videos}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItem}
            ListEmptyComponent={listEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 40}}
            refreshing={videosRefetching && !videosLoading}
            onRefresh={refetchVideos}
          />
        </View>
      )}
    </AppLayout>
  );
}
