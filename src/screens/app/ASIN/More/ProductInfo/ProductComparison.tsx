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

 const sections = [
      {
        id: 'general',
        title: 'General',
        fields: [
          {
            label: 'Series',
            key: 'PD_product_line_id',
          },
          {
            label: 'Color',
            key: 'PD_color',
          },
          {
            label: 'Form Factor',
            key: 'PD_form_factor',
          },
          {
            label: 'Chipset',
            key: 'PD_chipset',
          },
          {
            label: 'Made in India',
            key: 'PD_Made_In_India',
            formatter: (value: any) => value === 'Y' ? 'Yes' : 'No',
          },
          {
            label: 'Included in Box',
            key: 'PD_included_in_the_box',
          },
        ],
      },
      {
        id: 'processor_graphics_memory',
        title: 'Processor, Graphics & Memory',
        fields: [
          {
            label: 'Processor Brand',
            key: 'PD_processor',
            formatter: (value: any) => value?.split(' ')[0] || value,
          },
          {
            label: 'Processor Name',
            key: 'PD_processor',
            formatter: (value: any) => value?.split('(')[0] || value,
          },
          {
            label: 'Processor Variant',
            key: 'PD_processor',
            formatter: (value: any) =>
              value?.split('(')[1] ? `(${value.split('(')[1]}` : value,
          },
          {
            label: 'Neural Processor',
            key: 'PD_Neural_Processor',
          },
          {
            label: 'Storage',
            key: 'PD_storage_installed',
          },
          {
            label: 'RAM',
            key: 'PD_memory_installed',
          },
          {
            label: 'Graphics',
            key: 'PD_graphic',
          },
          {
            label: 'Graphic Wattage',
            key: 'PD_graphic_wattage',
          },
          {
            label: 'Expansion Slot',
            key: 'PD_expansion_slot',
            formatter: (value: any) => value?.replace(/\n/g, ', ') || value,
          },
          {
            label: 'Expandable RAM',
            key: 'Empty_ExtraRAM',
            formatter: (value: any) => value === 'Y' ? 'Yes' : 'No',
          },
          {
            label: 'Expandable Storage',
            key: 'ExtraEmpty_Storage_Slot',
            formatter: (value: any) => value === '1x ' ? 'Yes' : 'No',
          },
        ],
      },
      {
        id: 'operating_system',
        title: 'Operating System',
        fields: [
          {
            label: 'OS',
            key: 'PD_operating_system',
          },
        ],
      },
      {
        id: 'ports_slots',
        title: 'Ports & Slots',
        fields: [
          {
            label: 'Ports & Slots',
            key: 'PD_interface',
          },
        ],
      },
      {
        id: 'display_audio',
        title: 'Display & Audio',
        fields: [
          {
            label: 'Screen Size',
            key: 'PD_display',
          },
          {
            label: 'Screen Type',
            key: 'PD_Screen_Type',
          },
          {
            label: 'Refresh Rate',
            key: 'PD_Refresh_Rate',
          },
          {
            label: 'Touchscreen Display',
            key: 'PD_Display_Touch',
          },
          {
            label: 'Audio',
            key: 'PD_audio',
          },
        ],
      },
      {
        id: 'connectivity',
        title: 'Connectivity Features',
        fields: [
          {
            label: 'Wireless LAN',
            key: 'PD_wireless_connectivity',
            formatter: (value: any) => value?.split('+')[0] || value,
          },
          {
            label: 'Bluetooth',
            key: 'PD_wireless_connectivity',
            formatter: (value: any) => value?.split('+')[1] || value,
          },
        ],
      },
      {
        id: 'dimensions',
        title: 'Dimensions',
        fields: [
          {
            label: 'Dimensions',
            key: 'PD_weight_and_dimension',
            formatter: (value: any) => value?.split('lbs)')[1] || value,
          },
          {
            label: 'Weight',
            key: 'PD_weight_and_dimension',
            formatter: (value: any) => value?.split('(')[0] || value,
          },
        ],
      },
      {
        id: 'battery_power',
        title: 'Battery & Power',
        fields: [
          {
            label: 'Battery',
            key: 'PD_battery',
          },
          {
            label: 'Power',
            key: 'PD_power',
          },
        ],
      },
      {
        id: 'additional_features',
        title: 'Additional Features',
        fields: [
          {
            label: 'Camera',
            key: 'PD_camera',
          },
          {
            label: 'Finger Print',
            key: 'PD_cfg_fingerprint',
            formatter: (value: any) => {
              if (!value) return value;
              if (value.includes('W/')) {
                return value.replace('W/', 'With ');
              }
              return value.replace('WO/', 'Without ');
            },
          },
          {
            label: 'Keyboard',
            key: 'PD_input_device',
          },
          {
            label: 'Numpad',
            key: 'PD_numpad',
          },
          {
            label: 'Security',
            key: 'PD_security',
          },
          {
            label: 'Anti-Virus',
            key: 'PD_antivirus',
          },
          {
            label: 'Office',
            key: 'PD_office',
          },
          {
            label: 'X-Box Game Pass',
            key: 'PD_xbox_game_pass',
          },
        ],
      },
      {
        id: 'warranty_certificates',
        title: 'Warranty & Certificates',
        fields: [
          {
            label: 'Warranty Summary',
            key: 'PD_warranty',
            formatter: (value: any) => (value ? `${value} months` : value),
          },
          {
            label: 'Military Grade',
            key: 'PD_military_grade',
          },
          {
            label: 'Certification',
            key: 'PD_certificate',
          },
        ],
      },
    ];

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

  // Helper function to get formatted field value
  const getFieldValue = (
    product: ProductInfoItem,
    key: string,
    formatter?: (value: any) => any
  ) => {
    const value = product?.[key];
    if (formatter && value) {
      return formatter(value);
    }
    return value || '—';
  };

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

            {sections.map((section, sectionIndex) => (
              <View key={section.id}>
                {/* Section Header */}
                <View className="mt-4 mb-3">
                  <AppText 
                    size="md" 
                    weight="bold" 
                    className="text-primary dark:text-primary-light">
                    {section.title}
                  </AppText>
                  <View className="h-[2px] bg-primary/30 mt-1 mb-2" />
                </View>

                {/* Section Fields */}
                {section.fields.map((field, fieldIndex) => {
                  const value1 = getFieldValue(product1, field.key, field.formatter);
                  const value2 = getFieldValue(product2, field.key, field.formatter);
                  
                  return (
                    <ComparisonRow
                      key={`${section.id}-${field.key}-${fieldIndex}`}
                      label={field.label}
                      value1={value1}
                      value2={value2}
                    />
                  );
                })}
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
