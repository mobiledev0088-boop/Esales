import {
  View,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import React, {useState} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppInput from '../../../../../components/customs/AppInput';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import {getShadowStyle} from '../../../../../utils/appStyles';
import {Watermark} from '../../../../../components/Watermark';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppImage from '../../../../../components/customs/AppImage';
import {useMutation} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {showToast} from '../../../../../utils/commonFunctios';

const ProductInfo = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const AppTheme = useThemeStore(state => state.AppTheme);

  const {mutate, data, isPending, isError} = useMutation({
    mutationFn: async () => {
      const res = await handleASINApiCall('/Information/GetProductInfo', {
        ProductSearch: searchQuery,
      });
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

  const shouldShowResults = hasSearched && !isPending;
  return (
    <AppLayout needBack title="Product Info">
      <FlatList
        data={data}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={({item, index}) =>
          renderProductInfo({item, index, AppTheme})
        }
        contentContainerStyle={{paddingBottom: 32}}
        ListHeaderComponent={
          <View className="py-2">
            {/* Search Input & Disclaimer */}
            <View className="flex-row items-center justify-between mb-4">
              <AppInput
                leftIcon="search"
                placeholder="Search Product"
                value={searchQuery}
                setValue={setSearchQuery}
                containerClassName={searchQuery.length ? 'w-[85%]' : 'w-[100%]'}
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

            <View className="border border-error rounded p-3 mb-4">
              <AppText size="sm" color="text" weight="semibold">
                <AppText color="error" weight="bold" size="sm">
                  Disclaimer -
                </AppText>{' '}
                Final Specifications will be as per the announced Pricelist
                shared by ASUS CPM. In case of any queries, feel free to contact
                ASUS Sales Representative.
              </AppText>
            </View>

            {isPending && (
              <View className="items-center justify-center mb-4">
                <ActivityIndicator size="large" color="#000" />
                <AppText>Loading...</AppText>
              </View>
            )}

            {isError && (
              <View className="items-center justify-center mb-4">
                <AppText color="error">Error fetching product info</AppText>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          shouldShowResults && data?.length === 0 ? (
            <View className="flex-1 items-center justify-center mt-12">
              <AppText color="text">No products found</AppText>
            </View>
          ) : null
        }
        initialNumToRender={10}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
        className="px-4"
      />
    </AppLayout>
  );
};

export default ProductInfo;

const renderProductInfo = ({
  item,
  index,
  AppTheme,
}: {
  item: any;
  index: number;
  AppTheme: 'light' | 'dark';
}) => {
  return (
    <TouchableOpacity
      key={index}
      className="bg-lightBg-surface dark:bg-darkBg-surface  py-2 px-3 rounded-md mt-5"
      style={getShadowStyle(3)}
      onPress={() => {
        console.log(item.PD_sales_model_name, 'Selected');
      }}>
      <View className="flex-row justify-between py-2">
        <View>
          <Watermark textSize="lg" />
          <View className="flex-row items-center mb-2 w-4/5">
            <View className="mr-2">
              <AppIcon
                name="laptop"
                type="material-community"
                size={60}
                color={AppColors[AppTheme].heading}
              />
            </View>
            <View>
              <AppText weight="bold" color="text">
                {item.PD_sales_model_name}
              </AppText>
              <AppText weight="regular" color="text">
                ({item.PD_storage_installed} , {item.PD_processor})
              </AppText>
            </View>
          </View>
          <View>
            <View className="border p-2">
              <AppText weight="regular" color="text">
                RAM: {item.PD_memory_installed}
              </AppText>
            </View>
            <View className="flex-row items-center mt-1">
              <View className="border p-2 ">
                <AppText weight="regular" color="text">
                  {item.PD_operating_system.split('-', [1])}
                </AppText>
              </View>
              <View className="border p-2 ml-2">
                <AppText weight="regular" color="text">
                  {item.PD_form_factor}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <View className="justify-center">
          {item?.PD_Made_In_India === 'Y' && (
            <AppImage
              source={require('../../../../../assets/images/Indian_Flag.png')}
              style={{
                position: 'absolute',
                top: -10,
                width: 40,
                height: 40,
                // backgroundColor: 'red',
              }}
              resizeMode="contain"
            />
          )}
          <AppIcon
            name="chevron-forward-circle-outline"
            size={35}
            type="ionicons"
            color={AppColors[AppTheme].bgSurface}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};
