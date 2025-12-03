import {View, TouchableOpacity, Keyboard, FlatList, ScrollView} from 'react-native';
import {useState, useRef, useCallback, memo, useMemo, useEffect} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppInput from '../../../../../components/customs/AppInput';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import {getShadowStyle} from '../../../../../utils/appStyles';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppImage from '../../../../../components/customs/AppImage';
import {useMutation} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {showToast} from '../../../../../utils/commonFunctions';
import Card from '../../../../../components/Card';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../../../types/navigation';

interface ProductInfoItem {
  id?: string | number;
  PD_ID?: string | number;
  PD_sales_model_name?: string;
  PD_storage_installed?: string;
  PD_processor?: string;
  PD_memory_installed?: string; // RAM
  PD_operating_system?: string;
  PD_form_factor?: string;
  PD_Made_In_India?: string; // 'Y' | 'N'
  [k: string]: any;
}

const Disclaimer = () => {
  const isDarkTheme = useThemeStore(state => state.AppTheme) === 'dark';
  return(
  <View className="bg-red-100 dark:bg-[#EF4444] rounded-lg p-3 border border-red-600 dark:border-0 ">
    <View className="flex-row items-center gap-2">
      <AppIcon
        type="ionicons"
        name="information-circle-outline"
        size={20}
        color={isDarkTheme ? "#fff" : "#DC2626"}
      />
      <AppText size="base" weight="semibold" className="text-error mb-1">
        Disclaimer
      </AppText>
    </View>
    <AppText className="text-error " size="xs">
      Final Specifications will be as per the announced Pricelist shared by ASUS
      CPM. In case of any queries, feel free to contact ASUS Sales
      Representative.
    </AppText>
  </View>
);
}

const InitialState = () => (
  <View className="items-center justify-center mt-20 px-6">
    <View className="w-28 h-28 rounded-full bg-primary/10 items-center justify-center mb-6">
      <AppIcon
        name="search"
        type="feather"
        size={64}
        color="#5A67D8"
      />
    </View>
    <AppText
      size="xl"
      weight="bold"
      color="text"
      className="mb-3 text-center">
      Search for Products
    </AppText>
    <AppText size="sm" color="gray" className="text-center leading-5">
      Enter a product name or model in the search field above, or enable the "Made in India" filter to browse available products.
    </AppText>
  </View>
);

const EmptyState = ({onReset}: {onReset: () => void}) => (
  <View className="items-center justify-center mt-16 px-6">
    <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-5 relative">
      <AppIcon
        name="package-variant-closed"
        type="material-community"
        size={56}
        color="#5A67D8"
      />
      <View className="absolute bottom-3 right-4 bg-primary p-2 rounded-full">
        <AppIcon name="search" type="feather" size={16} color="#fff" />
      </View>
    </View>
    <AppText
      size="lg"
      weight="semibold"
      color="text"
      className="mb-2 text-center">
      No Products Found
    </AppText>
    <AppText size="sm" color="gray" className="text-center mb-4 leading-5">
      We couldn't find any products matching your search. Try adjusting the keywords or check for typos.
    </AppText>
    <TouchableOpacity
      onPress={onReset}
      activeOpacity={0.85}
      className="px-5 py-3 bg-primary rounded-full flex-row items-center">
      <AppIcon name="rotate-ccw" type="feather" size={18} color="#fff" />
      <AppText size="sm" weight="semibold" color="white" className="ml-2">
        Reset Search
      </AppText>
    </TouchableOpacity>
  </View>
);

const FilterPill = ({
  isActive,
  onPress,
  icon,
  iconType = 'feather',
  label,
  imageSource,
  badge,
}: {
  isActive: boolean;
  onPress: () => void;
  icon?: string;
  iconType?: any;
  label: string;
  imageSource?: any;
  badge?: number;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className={`flex-row items-center px-3.5 py-2.5 rounded-full mr-2.5 ${
      isActive
        ? 'bg-primary'
        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
    }`}>
    {imageSource ? (
      <AppImage
        source={imageSource}
        style={{width: 18, height: 18}}
        resizeMode="contain"
      />
    ) : icon ? (
      <AppIcon name={icon} type={iconType} size={18} color={isActive ? '#fff' : '#6B7280'} />
    ) : null}
    <AppText
      size="sm"
      weight="semibold"
      className={`ml-2 ${
        isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
      }`}>
      {label}
    </AppText>
    {isActive && badge !== undefined && badge > 0 && (
      <View className="ml-2 bg-white/30 rounded-full px-2 py-0.5">
        <AppText size="xs" weight="bold" className="text-white">
          {badge}
        </AppText>
      </View>
    )}
    {isActive && badge === undefined && (
      <View className="ml-2 bg-white/20 rounded-full p-0.5">
        <AppIcon name="check" type="feather" size={13} color="#fff" />
      </View>
    )}
  </TouchableOpacity>
);

const SpecItem = ({
  icon,
  type = 'feather',
  value,
  label,
}: {
  icon: string;
  type?: any;
  value?: string;
  label?: string;
}) => {
  if (!value) return null;
  return (
    <View className="flex-row items-start mr-4 mb-3 w-[45%] ">
      <AppIcon name={icon} type={type} size={20} color="#4B5563" />
      <View className="ml-2 flex-1">
        {label && (<AppText size="xs" className="mb-0.5 leading-3 text-gray-400">{label}</AppText>)}
        <AppText size="sm" weight="medium">{value}</AppText>
      </View>
    </View>
  );
};

const ProductInfoCard = memo(
  ({
    item,
    AppTheme,
    handleNavigation,
    compareMode,
    isSelected,
    onCompareToggle,
    isSelectionDisabled,
  }: {
    item: ProductInfoItem;
    AppTheme: 'light' | 'dark';
    handleNavigation: (item: ProductInfoItem) => void;
    compareMode?: boolean;
    isSelected?: boolean;
    onCompareToggle?: (item: ProductInfoItem) => void;
    isSelectionDisabled?: boolean;
  }) => {
    const os = item?.PD_operating_system?.split(/\s*-\s*/)?.[0] || '—';
    const ram = item?.PD_memory_installed || '—';
    const storage = item?.PD_storage_installed || '—';
    const cpu = item?.PD_processor || '—';
    const ff = item?.PD_form_factor || '—';
    const isIndia = item?.PD_Made_In_India === 'Y';

    const onPress = () => {
      if (compareMode) {
        onCompareToggle?.(item);
      } else {
        handleNavigation(item);
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={compareMode && isSelectionDisabled && !isSelected}>
        <Card 
          className={`px-0 mb-3 ${
            isSelected ? 'border-2 border-primary' : ''
          }`}>
          <View className="flex-row items-center mb-3 px-3">
            {compareMode && (
              <View className="mr-3">
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : isSelectionDisabled
                      ? 'border-gray-300 bg-gray-100'
                      : 'border-gray-400 bg-white'
                  }`}>
                  {isSelected && (
                    <AppIcon name="check" type="feather" size={14} color="#fff" />
                  )}
                </View>
              </View>
            )}
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
              <AppIcon
                name="laptop"
                type="material-community"
                size={25}
                color={AppColors[AppTheme].heading}
              />
            </View>
            <View className="flex-1">
              <AppText size="xs" color="gray">
                Sales Model Name
              </AppText>
              <AppText weight="semibold" size="base" className="text-text">
                {item?.PD_sales_model_name || 'Unknown Model'}
              </AppText>
            </View>
            {!compareMode && (
              <View className="ml-2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center">
                <AppIcon
                  name="chevron-right"
                  size={20}
                  type="feather"
                  color={AppTheme === 'light' ? '#6B7280' : '#CBD5E1'}
                />
              </View>
            )}
          </View>
          <View className="border-b border-gray-200 dark:border-gray-700 mb-4" />
          <View className="flex-row flex-wrap px-3">
            <SpecItem icon="cpu" type="feather" label="CPU" value={cpu} />
            <SpecItem
              icon="memory"
              type="material-community"
              label="RAM"
              value={ram}
            />
            <SpecItem
              icon="hard-drive"
              type="feather"
              label="Storage"
              value={storage}
            />
            <SpecItem
              icon="microsoft-windows"
              type="material-community"
              label="OS"
              value={os}
            />
            <SpecItem
              icon="cube-outline"
              type="material-community"
              label="Form"
              value={ff}
            />
            {isIndia && (
              <View className="w-[45%] items-end self-end">
                <AppImage
                  source={require('../../../../../assets/images/Indian_Flag.png')}
                  style={{width: 48, height: 48, marginTop: -6}}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    const prevKey = prev.item.PD_ID || prev.item.PD_sales_model_name;
    const nextKey = next.item.PD_ID || next.item.PD_sales_model_name;
    
    return (
      prevKey === nextKey &&
      prev.AppTheme === next.AppTheme &&
      prev.compareMode === next.compareMode &&
      prev.isSelected === next.isSelected &&
      prev.isSelectionDisabled === next.isSelectionDisabled
    );
  },
);

export default function ProductInfo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [onlyIndia, setOnlyIndia] = useState(false);
  const [expandableRAM, setExpandableRAM] = useState(false);
  const [expandableStorage, setExpandableStorage] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductInfoItem[]>([]);
  const listRef = useRef<FlatList>(null);
  const AppTheme = useThemeStore(state => state.AppTheme);
  const navigation = useNavigation<AppNavigationProp>();

  const {mutate, data, isPending, isError} = useMutation({
    mutationFn: async (searchTerm: string) => {
      const res = await handleASINApiCall(
        '/Information/GetProductInfo',
        {
          ProductSearch: searchTerm,
        },
        {},
        true,
      );
      const result = res.DashboardData;
      if (result.Status) {
        return result.Datainfo.ProductInfo;
      } else {
        showToast('No Product Found as per the search');
        return [];
      }
    },
  });

  const getProductsList = useCallback(() => {
    Keyboard.dismiss();
    const hasActiveFilter = onlyIndia || expandableRAM || expandableStorage;
    if (!searchQuery.trim() && !hasActiveFilter) return;
    setHasSearched(true);
    mutate(searchQuery);
  }, [searchQuery, onlyIndia, expandableRAM, expandableStorage]);

  const handleScroll = useCallback(
    (e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      if (y > 300 && !showScrollTop) setShowScrollTop(true);
      else if (y <= 300 && showScrollTop) setShowScrollTop(false);
    },
    [showScrollTop],
  );

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({offset: 0, animated: true});
  }, []);

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setHasSearched(false);
    setOnlyIndia(false);
    setExpandableRAM(false);
    setExpandableStorage(false);
    setCompareMode(false);
    setSelectedProducts([]);
    Keyboard.dismiss();
    listRef.current?.scrollToOffset({offset: 0, animated: true});
  }, []);

  const handleNavigation = useCallback((item: ProductInfoItem) => {
    navigation.push('ProductDescription', {product: item});
  }, [navigation]);

  const toggleCompareMode = useCallback(() => {
    const newValue = !compareMode;
    setCompareMode(newValue);
    setSelectedProducts([]);
    
    // If enabling compare mode without prior search, fetch all products
    if (newValue && !hasSearched) {
      setHasSearched(true);
      mutate('');
    }
  }, [compareMode, hasSearched]);

  const handleCompareToggle = useCallback((item: ProductInfoItem) => {
    setSelectedProducts(prev => {
      // Use PD_ID as primary identifier, fallback to PD_sales_model_name
      const itemKey = item.PD_ID || item.PD_sales_model_name;
      const isAlreadySelected = prev.some(
        p => (p.PD_ID || p.PD_sales_model_name) === itemKey
      );
      
      if (isAlreadySelected) {
        return prev.filter(p => (p.PD_ID || p.PD_sales_model_name) !== itemKey);
      } else if (prev.length < 2) {
        return [...prev, item];
      }
      
      return prev;
    });
  }, []);

  const handleCompareNow = useCallback(() => {
    if (selectedProducts.length === 2) {
      navigation.push('ProductComparison', {
        product1: selectedProducts[0],
        product2: selectedProducts[1],
      });
      // Reset compare mode after navigation
      setCompareMode(false);
      setSelectedProducts([]);
    }
  }, [selectedProducts, navigation]);

  const toggleIndiaFilter = useCallback(() => {
    const newValue = !onlyIndia;
    setOnlyIndia(newValue);
    
    // If enabling filter without prior search, fetch all products
    if (newValue && !hasSearched) {
      setHasSearched(true);
      mutate('');
    }
  }, [onlyIndia, hasSearched]);

  const toggleExpandableRAM = useCallback(() => {
    const newValue = !expandableRAM;
    setExpandableRAM(newValue);
    
    // If enabling filter without prior search, fetch all products
    if (newValue && !hasSearched) {
      setHasSearched(true);
      mutate('');
    }
  }, [expandableRAM, hasSearched]);

  const toggleExpandableStorage = useCallback(() => {
    const newValue = !expandableStorage;
    setExpandableStorage(newValue);
    
    // If enabling filter without prior search, fetch all products
    if (newValue && !hasSearched) {
      setHasSearched(true);
      mutate('');
    }
  }, [expandableStorage, hasSearched]);

  const shouldShowResults = hasSearched && !isPending;
  const rawData = hasSearched ? data || [] : [];
  
  const displayedData = useMemo(() => {
    let filtered = rawData;
    
    if (onlyIndia) {
      filtered = filtered.filter((item: any) => item?.PD_Made_In_India === 'Y');
    }
    
    if (expandableRAM) {
      filtered = filtered.filter((item: any) => item?.Empty_ExtraRAM === '1x ');
    }
    
    if (expandableStorage) {
      filtered = filtered.filter((item: any) => item?.ExtraEmpty_Storage_Slot === '1x ');
    }
    
    return filtered;
  }, [rawData, onlyIndia, expandableRAM, expandableStorage]);

  const showInitialState = !hasSearched && !isPending;

  // Reset search state when search query becomes empty and no filters are active
  useEffect(() => {
    const hasActiveFilter = onlyIndia || expandableRAM || expandableStorage;
    if (searchQuery.length === 0 && !hasActiveFilter && hasSearched) {
      setHasSearched(false);
    }
  }, [searchQuery, onlyIndia, expandableRAM, expandableStorage, hasSearched]);

  return (
    <AppLayout needBack title="Product Info">
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base ">
        <FlatList
          ref={listRef}
          data={showInitialState ? [] : displayedData}
          keyExtractor={(item, index) =>
            item?.PD_ID?.toString() || item?.PD_sales_model_name?.toString() || index.toString()
          }
          renderItem={({item}) => {
            const itemKey = item.PD_ID || item.PD_sales_model_name;
            const isSelected = selectedProducts.some(
              p => (p.PD_ID || p.PD_sales_model_name) === itemKey
            );
            const isSelectionDisabled = selectedProducts.length >= 2 && !isSelected;
            
            return (
              <ProductInfoCard
                item={item}
                AppTheme={AppTheme}
                handleNavigation={handleNavigation}
                compareMode={compareMode}
                isSelected={isSelected}
                onCompareToggle={handleCompareToggle}
                isSelectionDisabled={isSelectionDisabled}
              />
            );
          }}
          contentContainerStyle={{paddingBottom: 32, gap: 12}}
          ListHeaderComponent={
            <View className="pt-5">
              {/* Filter Pills Section */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2.5 px-1">
                  <View className="flex-row items-center">
                    <AppIcon 
                      name="information-circle-outline" 
                      type="ionicons" 
                      size={18} 
                      color="#6B7280" 
                    />
                    <AppText size="xs" weight="medium" className="ml-1.5 text-gray-600 dark:text-gray-400">
                      Filter Options
                    </AppText>
                  </View>
                  
                  {/* Compare Button - Top Right */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={toggleCompareMode}
                    disabled={displayedData.length === 0}
                    className={`flex-row items-center px-4 py-2 rounded-full ${
                      compareMode
                        ? 'bg-primary'
                        : displayedData.length === 0
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                    }`}
                    style={[
                      displayedData.length === 0 ? {opacity: 0.5} : {},
                      getShadowStyle(1)
                    ]}>
                    <AppIcon 
                      name="compare-arrows" 
                      type="materialIcons" 
                      size={18} 
                      color={compareMode ? '#fff' : displayedData.length === 0 ? '#9CA3AF' : '#6B7280'} 
                    />
                    <AppText
                      size="sm"
                      weight="semibold"
                      className={`ml-1.5 ${
                        compareMode 
                          ? 'text-white' 
                          : displayedData.length === 0
                          ? 'text-gray-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                      Compare
                    </AppText>
                    {compareMode && selectedProducts.length > 0 && (
                      <View className="ml-1.5 bg-white/30 rounded-full px-1.5 py-0.5 min-w-[18px] items-center">
                        <AppText size="xs" weight="bold" className="text-white">
                          {selectedProducts.length}
                        </AppText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingHorizontal: 4}}
                  className="flex-row">
                  <FilterPill
                    isActive={onlyIndia}
                    onPress={toggleIndiaFilter}
                    label="Made in India"
                    imageSource={require('../../../../../assets/images/Indian_Flag.png')}
                  />
                  <FilterPill
                    isActive={expandableRAM}
                    onPress={toggleExpandableRAM}
                    icon="memory"
                    iconType="material-community"
                    label="Expandable RAM"
                  />
                  <FilterPill
                    isActive={expandableStorage}
                    onPress={toggleExpandableStorage}
                    icon="harddisk"
                    iconType="material-community"
                    label="Expandable Storage"
                  />
                </ScrollView>
              </View>

              {/* Search Section */}
              <View className="flex-row items-center mb-3 gap-2">
                <View className="flex-1">
                  <AppInput
                    leftIcon="search"
                    placeholder="Search Product"
                    value={searchQuery}
                    setValue={setSearchQuery}
                    inputWapperStyle={{backgroundColor: AppColors[AppTheme].bgSurface}}
                    onSubmitEditing={getProductsList}
                    returnKeyType="search"
                  />
                </View>
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    className="bg-primary dark:bg-secondary-dark p-3.5 rounded-xl items-center justify-center"
                    style={getShadowStyle(2)}
                    activeOpacity={0.8}
                    onPress={getProductsList}>
                    <AppIcon
                      name="search"
                      size={22}
                      color="#fff"
                      type="feather"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <Disclaimer />
            </View>
          }
          ListEmptyComponent={
            showInitialState ? (
              <InitialState />
            ) : shouldShowResults && displayedData.length === 0 ? (
              <EmptyState onReset={resetSearch} />
            ) : null
          }
          initialNumToRender={10}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={true}
          className="px-3"
          onScroll={handleScroll}
          scrollEventThrottle={60}
        />

        {/* Compare FAB */}
        {compareMode && selectedProducts.length === 2 && (
          <View className="absolute bottom-0 left-0 right-0 pb-6 items-center">
            <TouchableOpacity
              onPress={handleCompareNow}
              activeOpacity={0.85}
              className="bg-primary rounded-full px-8 py-4 flex-row items-center"
              style={getShadowStyle(6)}>
              <AppIcon name="compare-arrows" type="materialIcons" size={22} color="#fff" />
              <AppText size="base" weight="bold" className="text-white ml-2">
                Compare Now
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Scroll to Top FAB */}
        {showScrollTop && !compareMode && (
          <TouchableOpacity
            onPress={scrollToTop}
            activeOpacity={0.85}
            className="absolute bottom-6 right-4 bg-primary rounded-full items-center justify-center w-14 h-14"
            style={getShadowStyle(4)}>
            <AppIcon name="arrow-up" type="feather" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </AppLayout>
  );
};