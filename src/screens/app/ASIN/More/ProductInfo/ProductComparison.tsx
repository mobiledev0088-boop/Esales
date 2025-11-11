import {View, ScrollView, TouchableOpacity} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import Card from '../../../../../components/Card';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppImage from '../../../../../components/customs/AppImage';

interface ProductInfoItem {
  id?: string | number;
  PD_sales_model_name?: string;
  PD_storage_installed?: string;
  PD_processor?: string;
  PD_memory_installed?: string;
  PD_operating_system?: string;
  PD_form_factor?: string;
  PD_Made_In_India?: string;
  Empty_ExtraRAM?: string;
  ExtraEmpty_Storage_Slot?: string;
  [k: string]: any;
}

type RouteParams = {
  ProductComparison: {
    product1: ProductInfoItem;
    product2: ProductInfoItem;
  };
};

const ComparisonRow = ({
  label,
  value1,
  value2,
  icon,
  iconType = 'feather',
}: {
  label: string;
  value1: string;
  value2: string;
  icon?: string;
  iconType?: any;
}) => {
  const isDifferent = value1 !== value2;

  return (
    <View className="py-3">
      <View className="flex-row items-center mb-2.5">
        {icon && (
          <AppIcon
            name={icon}
            type={iconType}
            size={16}
            color="#6B7280"
          />
        )}
        <AppText
          size="xs"
          weight="semibold"
          className="text-gray-600 dark:text-gray-400 ml-2 uppercase">
          {label}
        </AppText>
      </View>
      <View className="flex-row gap-3">
        <View
          className={`flex-1 p-3 rounded-lg ${
            isDifferent ? 'bg-primary/20 border-2 border-primary/40' : 'bg-gray-100 dark:bg-gray-800'
          }`}>
          <AppText size="sm" weight={isDifferent ? 'semibold' : 'medium'} className="text-text text-center">
            {value1 || '—'}
          </AppText>
        </View>
        <View
          className={`flex-1 p-3 rounded-lg ${
            isDifferent ? 'bg-primary/20 border-2 border-primary/40' : 'bg-gray-100 dark:bg-gray-800'
          }`}>
          <AppText size="sm" weight={isDifferent ? 'semibold' : 'medium'} className="text-text text-center">
            {value2 || '—'}
          </AppText>
        </View>
      </View>
      {/* Row Divider */}
      <View className="h-[1px] bg-gray-200 dark:bg-gray-700 mt-3" />
    </View>
  );
};

export default function ProductComparison() {
  const route = useRoute<RouteProp<RouteParams, 'ProductComparison'>>();
  const {product1, product2} = route.params;
  const AppTheme = useThemeStore(state => state.AppTheme);

  const getOS = (product: ProductInfoItem) =>
    product?.PD_operating_system?.split(/\s*-\s*/)?.[0] || '—';

  return (
    <AppLayout needBack title="Product Comparison">
      <ScrollView className="flex-1 bg-slate-50">
        <View className="px-4 pt-5 pb-8">
          {/* Product Headers - Equal Space */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Card className="p-4">
                <View className="items-center">
                  <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
                    <AppIcon
                      name="laptop"
                      type="material-community"
                      size={32}
                      color="#5A67D8"
                    />
                  </View>
                  <AppText
                    size="sm"
                    weight="bold"
                    className="text-center text-text mb-1"
                    numberOfLines={2}>
                    {product1?.PD_sales_model_name || 'Product 1'}
                  </AppText>
                  {/* {product1?.PD_Made_In_India === 'Y' && (
                    <AppImage
                      source={require('../../../../../assets/images/Indian_Flag.png')}
                      style={{width: 24, height: 24, marginTop: 4}}
                      resizeMode="contain"
                    />
                  )} */}
                </View>
              </Card>
            </View>

            <View className="flex-1">
              <Card className="p-4">
                <View className="items-center">
                  <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
                    <AppIcon
                      name="laptop"
                      type="material-community"
                      size={32}
                      color="#5A67D8"
                    />
                  </View>
                  <AppText
                    size="sm"
                    weight="bold"
                    className="text-center text-text mb-1"
                    numberOfLines={2}>
                    {product2?.PD_sales_model_name || 'Product 2'}
                  </AppText>
                  {/* {product2?.PD_Made_In_India === 'Y' && (
                    <AppImage
                      source={require('../../../../../assets/images/Indian_Flag.png')}
                      style={{width: 24, height: 24, marginTop: 4}}
                      resizeMode="contain"
                    />
                  )} */}
                </View>
              </Card>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-300 dark:bg-gray-700 mb-4" />

          {/* Highlighted Differences - Above Specifications */}
          <View className="flex-row items-center mb-4 px-2">
            <View className="w-4 h-4 rounded bg-primary/20 mr-2" />
            <AppText size="sm" weight="bold" className="text-gray-700 dark:text-gray-300">
              Highlighted fields indicate differences between products
            </AppText>
          </View>

          {/* Comparison Table */}
          <Card className="p-4">
            <View className="flex-row items-center mb-4">
              <AppIcon
                name="compare-arrows"
                type="materialIcons"
                size={22}
                color="#5A67D8"
              />
              <AppText size="lg" weight="bold" className="ml-2 text-text">
                Specifications
              </AppText>
            </View>

            <ComparisonRow
              label="Processor"
              icon="cpu"
              value1={product1?.PD_processor || '—'}
              value2={product2?.PD_processor || '—'}
            />

            <ComparisonRow
              label="RAM"
              icon="memory"
              iconType="material-community"
              value1={product1?.PD_memory_installed || '—'}
              value2={product2?.PD_memory_installed || '—'}
            />

            <ComparisonRow
              label="Storage"
              icon="hard-drive"
              value1={product1?.PD_storage_installed || '—'}
              value2={product2?.PD_storage_installed || '—'}
            />

            <ComparisonRow
              label="Operating System"
              icon="microsoft-windows"
              iconType="material-community"
              value1={getOS(product1)}
              value2={getOS(product2)}
            />

            <ComparisonRow
              label="Form Factor"
              icon="cube-outline"
              iconType="material-community"
              value1={product1?.PD_form_factor || '—'}
              value2={product2?.PD_form_factor || '—'}
            />

            <ComparisonRow
              label="Made in India"
              icon="flag"
              value1={product1?.PD_Made_In_India === 'Y' ? 'Yes' : 'No'}
              value2={product2?.PD_Made_In_India === 'Y' ? 'Yes' : 'No'}
            />

            <ComparisonRow
              label="Expandable RAM"
              icon="memory"
              iconType="material-community"
              value1={product1?.Empty_ExtraRAM === 'Y' ? 'Yes' : 'No'}
              value2={product2?.Empty_ExtraRAM === 'Y' ? 'Yes' : 'No'}
            />

            <ComparisonRow
              label="Expandable Storage"
              icon="harddisk"
              iconType="material-community"
              value1={product1?.ExtraEmpty_Storage_Slot === '1x ' ? 'Yes' : 'No'}
              value2={product2?.ExtraEmpty_Storage_Slot === '1x ' ? 'Yes' : 'No'}
            />
          </Card>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
