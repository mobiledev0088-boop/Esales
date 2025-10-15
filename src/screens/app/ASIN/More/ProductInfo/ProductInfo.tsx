import {View, TouchableOpacity, Keyboard, FlatList, Switch} from 'react-native';
import {useState, useRef, useCallback, memo, useMemo} from 'react';
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
  PD_sales_model_name?: string;
  PD_storage_installed?: string;
  PD_processor?: string;
  PD_memory_installed?: string; // RAM
  PD_operating_system?: string;
  PD_form_factor?: string;
  PD_Made_In_India?: string; // 'Y' | 'N'
  [k: string]: any;
}

export const Disclaimer = () => (
  <View className="bg-red-100 rounded-lg p-3 border border-red-600 ">
    <View className="flex-row items-center gap-2">
      <AppIcon
        type="ionicons"
        name="information-circle-outline"
        size={20}
        color="#DC2626"
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

const EmptyState = ({onReset}: {onReset: () => void}) => {
  return (
    <View className="items-center justify-center mt-16 px-6">
      <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-5 relative">
        {/* Main package icon (valid name) */}
        <AppIcon
          name="package-variant-closed"
          type="material-community"
          size={56}
          color="#5A67D8"
        />
        {/* Overlay search icon */}
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
      <AppText size="sm" color="gray" className="text-center mb-4">
        We couldn't find any products matching your search. Try adjusting the
        keywords or check for typos.
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
};


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
  ({item, AppTheme,handleNavigation}: {item: ProductInfoItem; AppTheme: 'light' | 'dark', handleNavigation: (item: ProductInfoItem) => void}) => {
    const os = item?.PD_operating_system?.split(/\s*-\s*/)?.[0] || '—';
    const ram = item?.PD_memory_installed || '—';
    const storage = item?.PD_storage_installed || '—';
    const cpu = item?.PD_processor || '—';
    const ff = item?.PD_form_factor || '—';
    const isIndia = item?.PD_Made_In_India === 'Y';

    return (
      <Card className="px-0">
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavigation(item)}>
          <View className="flex-row items-center mb-3 px-3">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
              <AppIcon
                name="laptop"
                type="material-community"
                size={25}
                color={AppColors[AppTheme].heading}
              />
            </View>
            <View className="flex-1">
              <AppText size="xs" color="gray">Sales Model Name</AppText>
              <AppText weight="semibold" size="base" className="text-text">
                {item?.PD_sales_model_name || 'Unknown Model'}
              </AppText>
            </View>
            <View className="ml-2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center">
              <AppIcon
                name="chevron-right"
                size={20}
                type="feather"
                color={AppTheme === 'light' ? '#6B7280' : '#CBD5E1'}
              />
            </View>
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
        </TouchableOpacity>
      </Card>
    );
  },
  (prev, next) => prev.item === next.item && prev.AppTheme === next.AppTheme,
);

export default function ProductInfo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [onlyIndia, setOnlyIndia] = useState(false); // filter toggle
  const listRef = useRef<FlatList>(null);
  const AppTheme = useThemeStore(state => state.AppTheme);
  const navigation = useNavigation<AppNavigationProp>();

  const {mutate, data, isPending, isError} = useMutation({
    mutationFn: async () => {
      const res = await handleASINApiCall(
        '/Information/GetProductInfo',
        {
          ProductSearch: searchQuery,
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

  const getProductsList = () => {
    Keyboard.dismiss();
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    mutate();
  };

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
    Keyboard.dismiss();
    listRef.current?.scrollToOffset({offset: 0, animated: true});
  }, []);

  const handleNavigation = useCallback((item: ProductInfoItem) => {
    navigation.navigate('ProductDescription', { product: item });
  }, []);

  const shouldShowResults = hasSearched && !isPending;
  const rawData = hasSearched ? data || [] : [];
  
  const displayedData = useMemo(
    () =>
      onlyIndia
        ? rawData.filter(
            (i: any) => i?.PD_Made_In_India && i.PD_Made_In_India === 'Y',
          )
        : rawData,
    [rawData, onlyIndia],
  );

  return (
    <AppLayout needBack title="Product Info">
      <View className="flex-1 bg-slate-50 ">
        <FlatList
          ref={listRef}
          data={displayedData}
          keyExtractor={(item, index) =>
            item?.id?.toString() || index.toString()
          }
          renderItem={({item, index}) => (
            <ProductInfoCard item={item} AppTheme={AppTheme} handleNavigation={handleNavigation} />
          )}
          contentContainerStyle={{paddingBottom: 32, gap: 12}}
          ListHeaderComponent={
            <View className="pt-5">
              <View className="flex-row items-center justify-between mb-2">
                <AppInput
                  leftIcon="search"
                  placeholder="Search Product"
                  value={searchQuery}
                  setValue={setSearchQuery}
                  containerClassName={
                    searchQuery.length ? 'w-[85%]' : 'w-[100%]'
                  }
                  inputWapperStyle={{backgroundColor: 'white'}}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    className="bg-primary p-4 rounded"
                    onPress={getProductsList}>
                    <AppIcon
                      name="search"
                      size={24}
                      color="#fff"
                      type="feather"
                    />
                  </TouchableOpacity>
                )}
              </View>
              {/* Made In India Filter */}
              <View className="flex-row items-center justify-between mb-3 px-1">
                <View className="flex-row items-center">
                  <AppImage
                    source={require('../../../../../assets/images/Indian_Flag.png')}
                    style={{width: 20, height: 20}}
                    resizeMode="contain"
                  />
                  <AppText size="xs" weight="medium" className="ml-2">
                    Made in India only
                  </AppText>
                </View>
                <Switch
                  value={onlyIndia}
                  onValueChange={setOnlyIndia}
                  trackColor={{false: '#CBD5E1', true: AppColors.primary}}
                  thumbColor={onlyIndia ? '#ffffff' : '#f4f3f4'}
                />
              </View>
              <Disclaimer />
            </View>
          }
          ListEmptyComponent={
            shouldShowResults && displayedData.length === 0 ? (
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

        {showScrollTop && (
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
}
