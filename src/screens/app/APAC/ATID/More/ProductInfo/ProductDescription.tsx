import { useQuery } from '@tanstack/react-query';
import AppLayout from '../../../../../../components/layout/AppLayout'
import { useLoginStore } from '../../../../../../stores/useLoginStore';
import { handleAPACApiCall } from '../../../../../../utils/handleApiCall';
import { useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../../../components/customs/AppIcon';
import { AppColors } from '../../../../../../config/theme';
import AppText from '../../../../../../components/customs/AppText';
import { SheetManager } from 'react-native-actions-sheet';
import Card from '../../../../../../components/Card';

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

const useGetModelSchemeData = (searchedModel: string) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  return useQuery({
    queryKey: ['GetModelInfo', employeeCode, RoleId, searchedModel],
    queryFn: async () => {
      try {
        const response = await handleAPACApiCall('/Information/GetModelInfo', {
          employeeCode,
          RoleId,
          ModelName: searchedModel,
        });
        const result = response?.DashboardData;
        if (!result?.Status) {
          console.error('API returned status false:', result);
          throw new Error('Failed to fetch partner list');
        }
        return result.Datainfo || [];
      } catch (error) {
        console.error('Error in getPartnerList:', error);
        throw error;
      }
    },
    enabled: Boolean(searchedModel),
  });
};

export default function ProductDescription() {
    const route = useRoute();
  const [displaySchemeInfo, setDisplaySchemeInfo] = useState(false);
  const {product} = route.params as {product: ProductInfoItem};
  const {data: modelSchemeData, isLoading} = useGetModelSchemeData(
    product.PD_sales_model_name || '',
  );
  const checkModelScheme = (checkModelSchemeData: any) => {
    const isOngoingScheme = !checkModelSchemeData?.Model_Info_Ongoing?.some(
      (value: any) => Object.keys(value)?.includes('ErrorMessage'),
    );
    const isHistoricScheme = !checkModelSchemeData?.Model_Info_Historic?.some(
      (value: any) => Object.keys(value)?.includes('ErrorMessage'),
    );
    if (isOngoingScheme || isHistoricScheme ) {
      setDisplaySchemeInfo(true);
    } else {
      setDisplaySchemeInfo(false);
    }
  };

  useEffect(() => {
    if (modelSchemeData) {
      checkModelScheme(modelSchemeData);
    }
  }, [modelSchemeData]);

  const productData = product;

  const InfoRow: React.FC<{
    icon: string;
    iconType: any;
    label: string;
    value?: string;
    multiline?: boolean;
  }> = ({icon, iconType, label, value, multiline = false}) => {
    if (!value || value === 'N/A' || value === '') return null;

    return (
      <View className="mb-4">
        <View className="flex-row items-center mb-1.5">
          <AppIcon
            name={icon}
            type={iconType}
            size={18}
            color={AppColors.primary}
          />
          <AppText size="sm" weight="semibold" color="gray" className="ml-2">
            {label}
          </AppText>
        </View>
        <AppText size="base" weight="medium" className="ml-7 leading-6">
          {value}
        </AppText>
      </View>
    );
  };

  const SectionHeader: React.FC<{
    icon: string;
    iconType: any;
    title: string;
  }> = ({icon, iconType, title}) => (
    <View className="flex-row items-center mb-4">
      <View className="bg-primary/10 dark:bg-primary-dark/10 p-2.5 rounded-lg">
        <AppIcon
          name={icon}
          type={iconType}
          size={22}
          color={AppColors.primary}
        />
      </View>
      <AppText size="xl" weight="bold" className="ml-3">
        {title}
      </AppText>
    </View>
  );

  const handleDownloadPDF = () => {
    console.log('Download PDF Pressed');
    // Add your PDF download logic here
  };

  const handleEnquireStock = () => {
    console.log('Enquire Stock Pressed');
    // Add your enquire stock logic here
  };

  const handleOpenSchemeSheet = () => {
    SheetManager.show('SchemeInfoSheet', {
      payload: {
        schemeData: modelSchemeData,
      },
    });
  };
  return (
   <AppLayout title='Product Description' needBack needPadding>
    <ScrollView className='flex-1' contentContainerClassName='flex-grow py-4' showsVerticalScrollIndicator={false}>
      {/* Action Buttons Row */}
      <View className="flex-row justify-between mb-4 gap-3 ">
        {/* Download PDF Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDownloadPDF}
          className="flex-1 bg-primary dark:bg-primary-dark rounded-xl py-3.5 px-4 flex-row items-center justify-center">
          <AppIcon
            name="download"
            type="feather"
            size={20}
            color="#FFFFFF"
          />
          <AppText size="base" weight="semibold" className="text-white ml-2">
            PDF Download
          </AppText>
        </TouchableOpacity>

        {/* Enquire Stock Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleEnquireStock}
          className="flex-1 bg-primary dark:bg-primary-dark rounded-xl py-3.5 px-4 flex-row items-center justify-center">
          <AppIcon
            name="inbox"
            type="feather"
            size={20}
            color="#FFFFFF"
          />
          <AppText size="base" weight="semibold" className="text-white ml-2">
            Enquire Stock
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Product Header Card */}
      <Card className="mb-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <AppText size="2xl" weight="bold" className="mb-2">
              {productData.PD_sales_model_name || 'Product Name'}
            </AppText>
            <AppText size="sm" weight="medium" color="gray" className="mb-1">
              Part Number: {productData.PD_part_number || 'N/A'}
            </AppText>
            <AppText size="sm" weight="medium" color="gray">
              Product Line: {productData.PD_product_line_id || 'N/A'}
            </AppText>
          </View>
          {productData.PD_Made_In_India === 'Y' && (
            <View className="bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
              <AppText
                size="xs"
                weight="bold"
                className="text-green-700 dark:text-green-400">
                Made in India
              </AppText>
            </View>
          )}
        </View>

        {productData.PD_form_factor && (
          <View className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg mt-2">
            <AppText size="sm" weight="semibold" className="text-center">
              {productData.PD_form_factor}
            </AppText>
          </View>
        )}
      </Card>

      {/* Core Specifications */}
      <Card className="mb-4">
        <SectionHeader
          icon="cpu"
          iconType="feather"
          title="Core Specifications"
        />

        <InfoRow
          icon="cpu"
          iconType="feather"
          label="Processor"
          value={productData.PD_processor}
          multiline
        />

        <InfoRow
          icon="memory"
          iconType="material-community"
          label="Memory (RAM)"
          value={productData.PD_memory_installed}
        />

        <InfoRow
          icon="harddisk"
          iconType="material-community"
          label="Storage"
          value={productData.PD_storage_installed}
        />

        <InfoRow
          icon="layers"
          iconType="feather"
          label="Operating System"
          value={productData.PD_operating_system}
          multiline
        />

        {productData.PD_chipset && (
          <InfoRow
            icon="developer-board"
            iconType="materialIcons"
            label="Chipset"
            value={productData.PD_chipset}
          />
        )}
      </Card>

      {/* Graphics & Display */}
      {(productData.PD_graphic || productData.PD_display) && (
        <Card className="mb-4">
          <SectionHeader
            icon="monitor"
            iconType="feather"
            title="Graphics & Display"
          />

          {productData.PD_display && (
            <InfoRow
              icon="monitor"
              iconType="feather"
              label="Display"
              value={productData.PD_display}
              multiline
            />
          )}

          {productData.PD_graphic && (
            <InfoRow
              icon="videogame-asset"
              iconType="materialIcons"
              label="Graphics Card"
              value={productData.PD_graphic}
              multiline
            />
          )}

          {productData.PD_vga && (
            <InfoRow
              icon="videocam"
              iconType="ionicons"
              label="VGA"
              value={productData.PD_vga}
            />
          )}

          {productData.PD_vram && (
            <InfoRow
              icon="memory"
              iconType="material-community"
              label="VRAM"
              value={productData.PD_vram}
            />
          )}

          {productData.PD_graphic_wattage && (
            <InfoRow
              icon="flash"
              iconType="ionicons"
              label="Graphics Wattage"
              value={productData.PD_graphic_wattage}
              multiline
            />
          )}

          {productData.PD_Refresh_Rate && (
            <InfoRow
              icon="refresh"
              iconType="ionicons"
              label="Refresh Rate"
              value={productData.PD_Refresh_Rate}
            />
          )}

          {productData.PD_Display_Touch && (
            <InfoRow
              icon="hand-left"
              iconType="ionicons"
              label="Touch Display"
              value={productData.PD_Display_Touch}
            />
          )}
        </Card>
      )}

      {/* Connectivity */}
      {(productData.PD_wireless_connectivity || productData.PD_interface) && (
        <Card className="mb-4">
          <SectionHeader icon="wifi" iconType="feather" title="Connectivity" />

          {productData.PD_wireless_connectivity && (
            <InfoRow
              icon="wifi"
              iconType="feather"
              label="Wireless"
              value={productData.PD_wireless_connectivity}
              multiline
            />
          )}

          {productData.PD_interface && (
            <InfoRow
              icon="settings-input-hdmi"
              iconType="materialIcons"
              label="Ports & Interfaces"
              value={productData.PD_interface}
              multiline
            />
          )}

          {productData.PD_expansion_slot && (
            <InfoRow
              icon="extension"
              iconType="materialIcons"
              label="Expansion Slots"
              value={productData.PD_expansion_slot}
              multiline
            />
          )}
        </Card>
      )}

      {/* Input & Multimedia */}
      {(productData.PD_input_device ||
        productData.PD_camera ||
        productData.PD_audio) && (
        <Card className="mb-4">
          <SectionHeader
            icon="keyboard"
            iconType="materialIcons"
            title="Input & Multimedia"
          />

          {productData.PD_input_device && (
            <InfoRow
              icon="keyboard"
              iconType="materialIcons"
              label="Input Devices"
              value={productData.PD_input_device}
              multiline
            />
          )}

          {productData.PD_camera && (
            <InfoRow
              icon="camera"
              iconType="feather"
              label="Camera"
              value={productData.PD_camera}
            />
          )}

          {productData.PD_audio && (
            <InfoRow
              icon="headphones"
              iconType="feather"
              label="Audio System"
              value={productData.PD_audio}
              multiline
            />
          )}

          {productData.PD_screenpad && (
            <InfoRow
              icon="tablet"
              iconType="feather"
              label="ScreenPad"
              value={productData.PD_screenpad}
              multiline
            />
          )}
        </Card>
      )}

      {/* Battery & Power */}
      {(productData.PD_battery || productData.PD_power) && (
        <Card className="mb-4">
          <SectionHeader
            icon="battery-charging"
            iconType="feather"
            title="Battery & Power"
          />

          {productData.PD_battery && (
            <InfoRow
              icon="battery-full"
              iconType="ionicons"
              label="Battery"
              value={productData.PD_battery}
              multiline
            />
          )}

          {productData.PD_power && (
            <InfoRow
              icon="flash"
              iconType="ionicons"
              label="Power Adapter"
              value={productData.PD_power}
              multiline
            />
          )}
        </Card>
      )}

      {/* Physical Specifications */}
      {(productData.PD_weight_and_dimension || productData.PD_color) && (
        <Card className="mb-4">
          <SectionHeader
            icon="ruler"
            iconType="material-community"
            title="Physical Specifications"
          />

          {productData.PD_color && (
            <InfoRow
              icon="color-palette"
              iconType="ionicons"
              label="Color"
              value={productData.PD_color}
            />
          )}

          {productData.PD_weight_and_dimension && (
            <InfoRow
              icon="weight"
              iconType="material-community"
              label="Weight & Dimensions"
              value={productData.PD_weight_and_dimension}
              multiline
            />
          )}
        </Card>
      )}

      {/* Security */}
      {productData.PD_security && (
        <Card className="mb-4">
          <SectionHeader
            icon="shield"
            iconType="feather"
            title="Security Features"
          />

          <InfoRow
            icon="shield-checkmark"
            iconType="ionicons"
            label="Security"
            value={productData.PD_security}
            multiline
          />
        </Card>
      )}

      {/* Box Contents & Accessories */}
      {(productData.PD_included_in_the_box ||
        productData.PD_optional_accessory) && (
        <Card className="mb-4">
          <SectionHeader
            icon="package"
            iconType="feather"
            title="Box Contents"
          />

          {productData.PD_included_in_the_box && (
            <InfoRow
              icon="gift"
              iconType="feather"
              label="Included Items"
              value={productData.PD_included_in_the_box}
              multiline
            />
          )}

          {productData.PD_optional_accessory && (
            <InfoRow
              icon="plus-circle"
              iconType="feather"
              label="Optional Accessories"
              value={productData.PD_optional_accessory}
              multiline
            />
          )}
        </Card>
      )}

      {/* Software & Services */}
      {(productData.PD_office ||
        productData.PD_antivirus ||
        productData.PD_xbox_game_pass) && (
        <Card className="mb-4">
          <SectionHeader
            icon="package"
            iconType="feather"
            title="Software & Services"
          />

          {productData.PD_office && productData.PD_office !== 'N/A' && (
            <InfoRow
              icon="file-text"
              iconType="feather"
              label="Office Suite"
              value={productData.PD_office}
            />
          )}

          {productData.PD_antivirus && productData.PD_antivirus !== 'N/A' && (
            <InfoRow
              icon="shield"
              iconType="feather"
              label="Antivirus"
              value={productData.PD_antivirus}
            />
          )}

          {productData.PD_xbox_game_pass && (
            <InfoRow
              icon="game-controller"
              iconType="ionicons"
              label="Xbox Game Pass"
              value={productData.PD_xbox_game_pass}
            />
          )}
        </Card>
      )}

      {/* Warranty & Support */}
      {productData.PD_warranty && (
        <Card className="mb-4">
          <SectionHeader
            icon="award"
            iconType="feather"
            title="Warranty & Support"
          />

          <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex-row items-center">
            <AppIcon
              name="checkmark-circle"
              type="ionicons"
              size={24}
              color={AppColors.primary}
            />
            <View className="ml-3 flex-1">
              <AppText size="sm" weight="medium" color="gray" className="mb-1">
                Warranty Period
              </AppText>
              <AppText size="lg" weight="bold">
                {productData.PD_warranty} Months
              </AppText>
            </View>
          </View>
        </Card>
      )}

      {/* Additional Information */}
      {(productData.PD_certificate ||
        productData.PD_military_grade ||
        productData.PD_asus_exclusive_technology) && (
        <Card className="mb-4">
          <SectionHeader
            icon="info"
            iconType="feather"
            title="Additional Information"
          />

          {productData.PD_certificate && (
            <InfoRow
              icon="certificate"
              iconType="materialIcons"
              label="Certifications"
              value={productData.PD_certificate}
              multiline
            />
          )}

          {productData.PD_military_grade && (
            <InfoRow
              icon="shield-check"
              iconType="material-community"
              label="Military Grade"
              value={productData.PD_military_grade}
            />
          )}

          {productData.PD_asus_exclusive_technology && (
            <InfoRow
              icon="star"
              iconType="feather"
              label="Exclusive Technology"
              value={productData.PD_asus_exclusive_technology}
              multiline
            />
          )}
        </Card>
      )}
      </ScrollView>
   </AppLayout>
  )
}