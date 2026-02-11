import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useCallback,
  useMemo,
  use,
} from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Image,
  BackHandler,
  ScrollView,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useUserStore} from '../../../../../stores/useUserStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppIcon from '../../../../../components/customs/AppIcon';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../../types/navigation';
import {ASUS} from '../../../../../utils/constant';
import BackButton from '../../../../../components/BackButton';

type Region = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

interface RegionData {
  name: Region;
  description: string;
  image: any;
}

interface ShopExpType {
  ID: number;
  StoreName: string;
  StoreType: string;
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
  Partner_Name: string;
  eName: string;
  eNo: number;
  Branch: string;
  Territory: string;
  District: string;
  City: string;
  Region: string;
  BranchProductManager: string;
  RSM_Head: string;
  Branch_Head: string;
  TM_Code: string;
  CSE_Codes: string;
  PartnerCode: string;
  TwoD_Design: any;
  ThreeD_Design: any;
}

const REGIONS: RegionData[] = [
  {
    name: 'NORTH',
    description: 'Northern region coverage',
    image: require('../../../../../assets/images/northRegion.png'),
  },
  {
    name: 'EAST',
    description: 'Eastern region coverage',
    image: require('../../../../../assets/images/eastRegion.png'),
  },
  {
    name: 'SOUTH',
    description: 'Southern region coverage',
    image: require('../../../../../assets/images/southRegion.png'),
  },
  {
    name: 'WEST',
    description: 'Western region coverage',
    image: require('../../../../../assets/images/westRegion.png'),
  },
];

const DIRECTION_OFFSETS: Record<Region, {x: number; y: number}> = {
  NORTH: {x: 0, y: -100},
  EAST: {x: 100, y: 0},
  SOUTH: {x: 0, y: 100},
  WEST: {x: -100, y: 0},
};

const groupDataBy = (data: ShopExpType[], key: 'Branch' | 'StoreType') => {
  return data.reduce(
    (acc, item) => {
      const groupKey = item[key];
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, ShopExpType[]>,
  );
};

const useGetShopExpData = (selectedRegion: Region | null, isHo: boolean) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const empInfo = useUserStore(state => state.empInfo);
  const payload = {
    employeeCode,
    RoleId,
    YearQtr: empInfo?.Year_Qtr,
  };
  return useQuery({
    queryKey: ['shopExpansionData', ...Object.values(payload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/Partner/GetShopExpansion_PartnerCount',
        payload,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch partner demo summary');
      }
      return (result.Datainfo?.PartnerCount || []) as ShopExpType[];
    },
    enabled: isHo ? !!selectedRegion : true, // HO needs region selected, others can fetch immediately
  });
};

const RegionCard = memo<{
  region: RegionData;
  index: number;
  isSelected: boolean;
  onSelect: (region: Region) => void;
}>(({region, index, isSelected, onSelect}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideXAnim = useRef(new Animated.Value(0)).current;
  const slideYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0.6)).current;

  // Initial entrance animation from direction
  useEffect(() => {
    const offset = DIRECTION_OFFSETS[region.name];
    slideXAnim.setValue(offset.x);
    slideYAnim.setValue(offset.y);

    const delay = index * 150;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideXAnim, {
        toValue: 0,
        delay,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(slideYAnim, {
        toValue: 0,
        delay,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [region.name, index, fadeAnim, slideXAnim, slideYAnim]);

  // Selection animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.02 : 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(imageOpacity, {
        toValue: isSelected ? 1 : 0.6,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected, scaleAnim, imageOpacity]);

  const handlePress = useCallback(() => {
    onSelect(region.name);
  }, [onSelect, region.name]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {translateX: slideXAnim},
          {translateY: slideYAnim},
          {scale: scaleAnim},
        ],
      }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="mb-4">
        <Card>
          <View className="flex-row items-center py-1">
            <Animated.View style={{opacity: imageOpacity}} className="mr-4">
              <Image
                source={region.image}
                style={{width: 64, height: 64}}
                resizeMode="contain"
              />
            </Animated.View>

            <View className="flex-1">
              <AppText size="lg" weight="semibold" className="mb-1">
                {region.name} Region
              </AppText>
              <AppText
                size="sm"
                weight="medium"
                className="text-gray-600 dark:text-gray-400">
                {region.description}
              </AppText>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Skeleton Loaders
const BranchSkeleton = memo(() => (
  <View className="mb-6">
    {[1, 2, 3].map(i => (
      <Card key={i} className="mb-3">
        <View className="flex-row items-center">
          <Skeleton width={56} height={56} borderRadius={12} />
          <View className="flex-1 ml-3">
            <Skeleton width={150} height={18} />
            <Skeleton width={100} height={14} />
          </View>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
      </Card>
    ))}
  </View>
));

const StoreTypeSkeleton = memo(() => (
  <View className="flex-row flex-wrap justify-between mb-6">
    {[1, 2, 3, 4].map(i => (
      <View key={i} className="w-[48%] mb-3">
        <Card>
          <View className="items-center py-3">
            <Skeleton width={48} height={48} borderRadius={12} />
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={24} borderRadius={12} />
          </View>
        </Card>
      </View>
    ))}
  </View>
));

// Empty State Component
const EmptyState = memo<{message: string}>(({message}) => (
  <Card className="bg-yellow-50 dark:bg-yellow-950">
    <View className="flex-row items-center">
      <AppIcon
        type="material-community"
        name="information"
        size={20}
        color="#eab308"
      />
      <AppText
        size="sm"
        weight="medium"
        className="ml-3 text-yellow-700 dark:text-yellow-400">
        {message}
      </AppText>
    </View>
  </Card>
));

// Branch List Component
const BranchItem = memo<{
  branch: string;
  count: number;
  onSelect: (branch: string) => void;
}>(({branch, count, onSelect}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [imageOpacity]);

  const branchImageUri = `https://esalesindia.asus.com/images/branch/${branch}.png`;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {toValue: 0.97, useNativeDriver: true}).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true}).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        onPress={() => onSelect(branch)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}>
        <Card className="mb-3">
          <View className="flex-row items-center py-1">
            {/* Branch Image */}
            <Animated.View style={{opacity: imageOpacity}}>
              {!imageError ? (
                <Image
                  source={{uri: branchImageUri}}
                  style={{width: 56, height: 56, borderRadius: 12}}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View className="w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary-dark/20 items-center justify-center">
                  <AppIcon
                    type="material-community"
                    name="office-building"
                    size={28}
                    color="#3b82f6"
                  />
                </View>
              )}
            </Animated.View>

            {/* Branch Info */}
            <View className="flex-1 ml-3">
              <AppText size="base" weight="semibold" className="mb-1">
                {branch}
              </AppText>
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400">
                {count} Store{count !== 1 ? 's' : ''} available
              </AppText>
            </View>

            {/* Chevron Icon */}
            <AppIcon
              type="material-community"
              name="chevron-right"
              size={24}
              color="#94a3b8"
            />
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Store image
const STORE_IMAGE = require('../../../../../assets/images/shopExpansionStore.png');

// Store Item Component
const StoreItem = memo<{
  store: ShopExpType;
  index: number;
  onPress: (store: ShopExpType) => void;
}>(({store, index, onPress}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 50;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {toValue: 0.97, useNativeDriver: true}).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true}).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{translateY: slideAnim}, {scale: scaleAnim}],
      }}>
      <TouchableOpacity
        onPress={() => onPress(store)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}>
        <Card className="mb-3">
          <View className="flex-row items-center py-2">
            {/* Store Icon */}
            <View className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary-dark/20 items-center justify-center mr-3">
              <AppIcon
                type="material-community"
                name="store"
                size={24}
                color="#3b82f6"
              />
            </View>

            {/* Store Details */}
            <View className="flex-1">
              <AppText
                size="base"
                weight="semibold"
                className="mb-0.5"
                numberOfLines={1}>
                {store.StoreName}
              </AppText>

              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 mb-1">
                {store.ParentCode}
              </AppText>

              <View className="flex-row flex-wrap gap-2">
                <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-blue-700 dark:text-blue-300">
                    {store.StoreType}
                  </AppText>
                </View>
                <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-green-700 dark:text-green-300">
                    {store.Branch}
                  </AppText>
                </View>
                <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-purple-700 dark:text-purple-300">
                    {store.Region}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Chevron Icon */}
            <AppIcon
              type="material-community"
              name="chevron-right"
              size={24}
              color="#94a3b8"
            />
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Store List Skeleton
const StoreSkeleton = memo(() => (
  <View className="mb-6">
    {[1, 2, 3, 4].map(i => (
      <Card key={i} className="mb-3">
        <View className="flex-row items-center py-2">
          <Skeleton width={48} height={48} borderRadius={12} />
          <View className="flex-1 ml-3">
            <Skeleton width={200} height={16} />
            <View className="flex-row gap-2 mt-2">
              <Skeleton width={70} height={20} borderRadius={4} />
              <Skeleton width={80} height={20} borderRadius={4} />
              <Skeleton width={60} height={20} borderRadius={4} />
            </View>
          </View>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
      </Card>
    ))}
  </View>
));

// StoreType Item Component
const StoreTypeItem = memo<{
  storeType: string;
  partnerCount: number;
  index: number;
  onSelect: (storeType: string) => void;
}>(({storeType, partnerCount, index, onSelect}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 30;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {toValue: 0.95, useNativeDriver: true}).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true}).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{translateY: slideAnim}, {scale: scaleAnim}],
      }}
      className="w-[48%]">
      <TouchableOpacity
        onPress={() => onSelect(storeType)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}>
        <Card>
          <View className="flex-row items-center py-2">
            {/* Store Image */}
            <Image
              source={STORE_IMAGE}
              style={{width: 48, height: 48}}
              resizeMode="contain"
            />

            {/* Content Column */}
            <View className="flex-1 items-center">
              {/* Partner Count */}
              <AppText
                size="2xl"
                weight="extraBold"
                className="text-primary dark:text-primary-dark mb-1">
                {partnerCount}
              </AppText>

              {/* Store Type Name */}
              <AppText
                size="xs"
                weight="semibold"
                className="text-gray-600 dark:text-gray-400 text-center"
                numberOfLines={2}>
                {storeType}
              </AppText>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ShopExpansion() {
  const {EMP_RoleId} = useLoginStore(state => state.userInfo);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedStoreType, setSelectedStoreType] = useState<string | null>(
    null,
  );
  const contentAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<AppNavigationProp>();
  const {DIR_HOD_MAN, HO_EMPLOYEES, COUNTRY_HEAD, RSM, CHANNEL_MARKETING} =
    ASUS.ROLE_ID;
  const isHo = [
    DIR_HOD_MAN,
    HO_EMPLOYEES,
    COUNTRY_HEAD,
    CHANNEL_MARKETING,
  ].includes(EMP_RoleId as any);
  const isRegionManager = EMP_RoleId === RSM;
  const isOtherRole = !isHo && !isRegionManager;

  const {data: shopData = [], isLoading} = useGetShopExpData(
    selectedRegion,
    isHo,
  );

  // Group data by region, branch, and store type based on role
  const groupedData = useMemo(() => {
    // For HO: Need region selected first
    if (isHo && !selectedRegion) return null;

    // Filter data based on role and selections
    let filteredData = shopData;
    console.log('Shop Data:', shopData);
    if (isHo && selectedRegion) {
      filteredData = shopData.filter(item => item.Region === selectedRegion);
    }
    // For RegionManager and Others, use all data from backend (already filtered)

    const branchesData = groupDataBy(filteredData, 'Branch');
    console.log('Branches Data:', branchesData);

    // If branch not selected yet, return branches data
    if (!selectedBranch) {
      return {branches: branchesData};
    }

    console.log('Filtered Data for Branches:', filteredData);
    const branchData = filteredData.filter(
      item => item.Branch === selectedBranch,
    );
    const storeTypesData = groupDataBy(branchData, 'StoreType');
    console.log('Store Types Data:', storeTypesData);
    if (!selectedStoreType) {
      return {branches: branchesData, storeTypes: storeTypesData};
    }

    console.log('Filtered Data for Store Types:', branchData);
    const stores = branchData.filter(
      item => item.StoreType === selectedStoreType,
    );
    console.log('Stores Data:', stores);
    return {branches: branchesData, storeTypes: storeTypesData, stores};
  }, [shopData, selectedRegion, selectedBranch, selectedStoreType, isHo]);

  // Animate content on selection change
  useEffect(() => {
    // For HO, animate when region is selected
    // For RegionManager and Others, animate immediately
    if (isHo ? selectedRegion : true) {
      Animated.spring(contentAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      contentAnim.setValue(0);
    }
  }, [selectedRegion, selectedBranch, selectedStoreType, contentAnim, isHo]);

  const handleSelectRegion = useCallback((region: Region) => {
    setSelectedRegion(region);
    setSelectedBranch(null);
    setSelectedStoreType(null);
  }, []);

  const handleSelectBranch = useCallback((branch: string) => {
    setSelectedBranch(branch);
    setSelectedStoreType(null);
  }, []);

  const handleSelectStoreType = useCallback((storeType: string) => {
    setSelectedStoreType(storeType);
  }, []);

  const handleBack = useCallback(() => {
    if (selectedStoreType) {
      setSelectedStoreType(null);
    } else if (selectedBranch) {
      setSelectedBranch(null);
    } else if (isHo && selectedRegion) {
      setSelectedRegion(null);
    }
  }, [selectedRegion, selectedBranch, selectedStoreType, isHo]);

  return (
    <AppLayout title="Shop Expansion" needBack>
      <ScrollView className="px-4 py-6">
        {/* Custom Back Navigation */}
        {/* Header Section */}
        <View className="mb-6">
          <AppText size="xl" weight="bold" className="mb-2">
            {isHo && !selectedRegion
              ? 'Select Region'
              : !selectedBranch
                ? isHo && selectedRegion
                  ? `${selectedRegion} - Select Branch`
                  : 'Select Branch'
                : !selectedStoreType
                  ? `${selectedBranch} - Store Types`
                  : `${selectedStoreType} Stores`}
          </AppText>
          <AppText
            size="sm"
            weight="medium"
            className="text-gray-600 dark:text-gray-400">
            {isHo && !selectedRegion
              ? 'Choose a region to explore shop expansion data'
              : !selectedBranch
                ? 'Select a branch to view store types'
                : !selectedStoreType
                  ? `${Object.keys(groupedData?.storeTypes || {}).length} store type${
                      Object.keys(groupedData?.storeTypes || {}).length !== 1
                        ? 's'
                        : ''
                    } available`
                  : `${groupedData?.stores?.length || 0} store${
                      groupedData?.stores?.length !== 1 ? 's' : ''
                    } in ${selectedBranch}${isHo && selectedRegion ? `, ${selectedRegion}` : ''}`}
          </AppText>
        </View>

        {/* Region Selection - Only for HO */}
        {isHo && !selectedRegion && (
          <View className="mb-6">
            {REGIONS.map((region, index) => (
              <RegionCard
                key={region.name}
                region={region}
                index={index}
                isSelected={false}
                onSelect={handleSelectRegion}
              />
            ))}
          </View>
        )}

        {/* Branch Selection - For HO after region selection, or RegionManager/Others immediately */}
        {((isHo && selectedRegion && !selectedBranch) ||
          (!isHo && !selectedBranch)) && (
          <Animated.View
            style={{
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            {isLoading ? (
              <BranchSkeleton />
            ) : groupedData?.branches &&
              Object.keys(groupedData.branches).length > 0 ? (
              <View>
                {Object.entries(groupedData.branches).map(([branch, items]) => (
                  <BranchItem
                    key={branch}
                    branch={branch}
                    count={items.length}
                    onSelect={handleSelectBranch}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                message={
                  isHo
                    ? 'No branches found in this region'
                    : 'No branches found'
                }
              />
            )}
          </Animated.View>
        )}

        {/* StoreType Display - For HO/RegionManager after branch, or Others immediately */}
        {((isHo || isRegionManager) && selectedBranch && !selectedStoreType) ||
        (isOtherRole && !selectedBranch && !selectedStoreType) ? (
          <Animated.View
            style={{
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            {isLoading ? (
              <StoreTypeSkeleton />
            ) : groupedData?.storeTypes &&
              Object.keys(groupedData.storeTypes).length > 0 ? (
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {Object.entries(groupedData.storeTypes).map(
                  ([storeType, items], index) => (
                    <StoreTypeItem
                      key={storeType}
                      storeType={storeType}
                      partnerCount={items.length}
                      index={index}
                      onSelect={handleSelectStoreType}
                    />
                  ),
                )}
              </View>
            ) : (
              <EmptyState message="No store types found in this branch" />
            )}
          </Animated.View>
        ) : null}

        {/* Store List Display - After store type selection for all roles */}
        {selectedStoreType && (
          <Animated.View
            style={{
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}>
            {isLoading ? (
              <StoreSkeleton />
            ) : groupedData?.stores && groupedData.stores.length > 0 ? (
              <View>
                {groupedData.stores.map((store, index) => (
                  <StoreItem
                    key={store.ID}
                    store={store}
                    index={index}
                    onPress={store => {
                      navigation.push('StoreDetails', {
                        PartnerCode: store.PartnerCode,
                        StoreType: store.StoreType,
                      });
                    }}
                  />
                ))}
              </View>
            ) : (
              <EmptyState message="No stores found for this store type" />
            )}
          </Animated.View>
        )}
      </ScrollView>
      {((isHo && selectedRegion) ||
        (!isHo && (selectedBranch || selectedStoreType))) && (
        <BackButton
          onPress={handleBack}
          Title={
            selectedStoreType
              ? 'Back to Store Types'
              : selectedBranch
                ? 'Back to Branches'
                : isHo
                  ? 'Back to Regions'
                  : ''
          }
          SubTitle={
            selectedStoreType
              ? `View all store types in ${selectedBranch}`
              : selectedBranch
                ? isHo
                  ? `View all branches in ${selectedRegion}`
                  : 'View all branches'
                : isHo
                  ? 'Select a different region'
                  : ''
          }
        />
      )}
    </AppLayout>
  );
}

//   <Card
//     className="mb-4 py-2 border border-slate-200 dark:border-slate-700 bg-error/10 dark:bg-primary-dark/20"
//     noshadow>
//     <TouchableOpacity
//       onPress={handleBack}
//       className="flex-row items-center py-2"
//       activeOpacity={0.7}>
//       <View className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center mr-3">
//         <AppIcon
//           type="material-community"
//           name="arrow-left"
//           size={18}
//           color="#3b82f6"
//         />
//       </View>
//       <View className="flex-1">
//         <AppText
//           size="md"
//           weight="bold"
//           className="text-primary dark:text-primary-dark">
//           {selectedStoreType
//             ? 'Back to Store Types'
//             : selectedBranch
//               ? 'Back to Branches'
//               : isHo
//                 ? 'Back to Regions'
//                 : ''}
//         </AppText>
//         <AppText
//           size="sm"
//           weight="medium"
//           className="text-primary dark:text-primary-dark">
//           {selectedStoreType
//             ? `View all store types in ${selectedBranch}`
//             : selectedBranch
//               ? isHo
//                 ? `View all branches in ${selectedRegion}`
//                 : 'View all branches'
//               : isHo
//                 ? 'Select a different region'
//                 : ''}
//         </AppText>
//       </View>
//     </TouchableOpacity>
//   </Card>
