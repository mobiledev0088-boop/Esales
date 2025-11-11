import {View, TouchableOpacity, Alert} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useMutation, useQuery} from '@tanstack/react-query';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {APIResponse, AppNavigationProp} from '../../../../../types/navigation';
import {useState, useMemo, useCallback, useEffect} from 'react';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppImage from '../../../../../components/customs/AppImage';
import ImageCropModal from '../../../../../components/ImageCropModal';
import {useImagePicker} from '../../../../../hooks/useImagePicker';
import clsx from 'clsx';
import {convertImageToBase64, showToast} from '../../../../../utils/commonFunctions';
import { useLoaderStore } from '../../../../../stores/useLoaderStore';
import { useNavigation } from '@react-navigation/native';

interface ItemQty {
  Stand_Value: number;
  Stand_Type: string;
  Min_Validation: number;
  Max_Validation: number;
  Validation_Range: string;
  Is_Image_Compulsory: boolean;
}

interface FieldData {
  quantity: string;
  imageUri: string | null;
  error?: string;
}

const useGetPartnerCodeList = () => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo || {},
  );

  return useQuery<AppDropdownItem[], Error>({
    queryKey: ['partnerList', employeeCode, RoleId],
    enabled: Boolean(employeeCode && RoleId),
    queryFn: async () => {
      const res = await handleASINApiCall<
        APIResponse<{
          PartnerCode: {
            PartnerCode: string;
            PartnerName: string;
            PQT_PartnerType: string;
          }[];
        }>
      >('StandPOSM/StandPOSMAllocation_PartnerCode', {
        employeeCode,
        RoleId,
      });

      const result = res?.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to load request numbers');
      }
      const requestList = result?.Datainfo?.PartnerCode ?? [];
      const uniqueRequestsMap = new Map<string, AppDropdownItem>();
      for (const {PQT_PartnerType, PartnerName, PartnerCode} of requestList) {
        uniqueRequestsMap.set(PartnerCode, {
          label: `${PartnerName} (${PQT_PartnerType})`,
          value: PartnerCode,
          partner_type: PQT_PartnerType,
        });
      }

      return Array.from(uniqueRequestsMap.values());
    },
  });
};

const useGetRequestItemList = (partnerType: string | null) => {
  return useQuery({
    queryKey: ['requestItemList', partnerType],
    enabled: Boolean(partnerType),
    queryFn: async () => {
      const res = await handleASINApiCall<
        APIResponse<{
          ItemQtyValidation: ItemQty[];
        }>
      >('/StandPOSM/StandPOSMAllocation_ItemList', {partnerType});

      const result = res?.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to load request numbers');
      }
      return result?.Datainfo?.ItemQtyValidation ?? [];
    },
  });
};

const useInsertStandPOSMAllocation = () => {
  return useMutation<APIResponse<null>, Error, any>({
    mutationFn: async data => {
        console.log('Submitting Data:', data);
      const res = await handleASINApiCall<APIResponse<null>>(
        '/StandPOSM/StandPOSMAllocation_Insert',
        data,
      );
      console.log('Insertion Response:', res);
      if (!res?.DashboardData?.Status) {
        throw new Error(
          res?.DashboardData?.Message || 'Failed to insert allocation',
        );
      }
      return res;
    },
    onSuccess: () => {
        // navigation.goBack();
    },
    onError: error => {
      showToast(error.message || 'Failed to submit allocation');
    },
  });
};

export default function AddNewStandPOSM() {
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [formData, setFormData] = useState<Record<number, FieldData>>({});
  const [remark, setRemark] = useState<string>('');
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const {EMP_Code = ''} = useLoginStore(state => state.userInfo);
  const setGlobalLoading = useLoaderStore(state => state.setGlobalLoading);
  const navigation = useNavigation<AppNavigationProp>();
  const {data: partnerCodes = [], isLoading} = useGetPartnerCodeList();
  const {data: requestItems = [], isLoading: isLoadingItems} =
    useGetRequestItemList(selectedPartner?.partner_type || null);
  const {mutate: insertAllocation} = useInsertStandPOSMAllocation();

  // Image picker hook
  const {
    imageUri,
    showCropModal,
    tempImageUri,
    pickImage,
    handleCropComplete: onCropComplete,
    handleCropCancel: onCropCancel,
    reset: resetImage,
  } = useImagePicker({
    enableCrop: true,
    quality: 0.8,
  });

  // Initialize form data when items load
  const initializeFormData = useCallback(() => {
    const initialData: Record<number, FieldData> = {};
    requestItems.forEach((_, index) => {
      initialData[index] = {
        quantity: '',
        imageUri: null,
        error: undefined,
      };
    });
    setFormData(initialData);
  }, [requestItems]);

  // Reset form when partner changes
  const handlePartnerChange = useCallback((partner: any) => {
    setSelectedPartner(partner);
    setFormData({});
    setRemark('');
  }, []);

  // Initialize form when items load
  useMemo(() => {
    if (requestItems.length > 0 && Object.keys(formData).length === 0) {
      initializeFormData();
    }
  }, [requestItems, formData, initializeFormData]);

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (index: number, value: string, item: ItemQty) => {
      const numericValue = value.replace(/[^0-9]/g, '');
      let error: string | undefined;

      if (numericValue) {
        const quantity = parseInt(numericValue, 10);
        if (quantity < item.Min_Validation) {
          error = `Minimum quantity is ${item.Min_Validation}`;
        } else if (quantity > item.Max_Validation) {
          error = `Maximum quantity is ${item.Max_Validation}`;
        }
      }

      setFormData(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          quantity: numericValue,
          error,
        },
      }));
    },
    [],
  );

  // Handle image pick
  const handleImagePick = useCallback(
    async (index: number, source: 'camera' | 'gallery') => {
      setActiveFieldIndex(index);
      await pickImage(source);
    },
    [pickImage],
  );

  // Update form data when image is picked and cropped
  useEffect(() => {
    if (imageUri && activeFieldIndex !== null) {
      setFormData(prev => ({
        ...prev,
        [activeFieldIndex]: {
          ...prev[activeFieldIndex],
          imageUri: imageUri,
        },
      }));
    }
  }, [imageUri, activeFieldIndex]);

  // Handle crop complete
  const handleCropComplete = useCallback(
    (croppedUri: string) => {
      onCropComplete(croppedUri);
    },
    [onCropComplete],
  );

  // Handle crop cancel
  const handleCropCancel = useCallback(() => {
    setActiveFieldIndex(null);
    onCropCancel();
  }, [onCropCancel]);

  // Remove image
  const handleRemoveImage = useCallback(
    (index: number) => {
      setFormData(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          imageUri: null,
        },
      }));
      // Reset the image picker if this is the active field
      if (activeFieldIndex === index) {
        resetImage();
        setActiveFieldIndex(null);
      }
    },
    [activeFieldIndex, resetImage],
  );

  // Validate form
  const validateForm = useCallback(() => {
    let isValid = true;
    const updatedFormData = {...formData};

    requestItems.forEach((item, index) => {
      const field = formData[index];
      if (!field || !field.quantity) {
        return; // Skip empty fields
      }

      const quantity = parseInt(field.quantity, 10);

      // Check quantity validation
      if (quantity < item.Min_Validation || quantity > item.Max_Validation) {
        isValid = false;
        updatedFormData[index] = {
          ...field,
          error: `Quantity must be between ${item.Min_Validation} and ${item.Max_Validation}`,
        };
      }

      // Check image requirement
      if (item.Is_Image_Compulsory && quantity > 0 && !field.imageUri) {
        isValid = false;
        Alert.alert(
          'Image Required',
          `Please upload an image for ${item.Stand_Type}`,
        );
      }
    });

    setFormData(updatedFormData);
    return isValid;
  }, [formData, requestItems]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setGlobalLoading(true);

    // Collect data to submit
    const mappedItems = await Promise.all(
      requestItems.map(async (item, index) => {
        const field = formData[index];
        if (!field || !field.quantity) return null;
        return {
          StandType: item.Stand_Type,
          Quantity: parseInt(field.quantity, 10),
          ImageUrl: await convertImageToBase64(field.imageUri || ''),
        };
      }),
    );

    const Items = mappedItems.filter(Boolean);

    const dataToSubmit = {
      PartnerCode: selectedPartner?.value,
      Remark: remark,
      Username: EMP_Code,
      Items,
    };

    insertAllocation(dataToSubmit);
    setGlobalLoading(false);
  }, [validateForm, requestItems, formData, selectedPartner, remark]);

  // Check if any field is filled
  const hasAnyData = useMemo(() => {
    return Object.values(formData).some(field => field?.quantity);
  }, [formData]);

  return (
    <AppLayout title="Add New Stand POSM" needBack needScroll>
      <View className="flex-1 pb-6">
        {/* Partner Selection */}
        <View className="px-4 pt-4 pb-2">
          <AppDropdown
            data={partnerCodes || []}
            mode="autocomplete"
            onSelect={handlePartnerChange}
            placeholder={isLoading ? 'Loading...' : 'Select Partner'}
            label="Partner Code"
            needIndicator
            allowClear
            onClear={() => handlePartnerChange(null)}
          />
        </View>

        {/* Loading State */}
        {isLoadingItems && (
          <View className="flex-1 items-center justify-center py-20">
            <AppText size="base" color="gray">
              Loading items...
            </AppText>
          </View>
        )}

        {/* Items List */}
        {!isLoadingItems && requestItems.length > 0 && (
          <View className="px-4 mt-3">
            <View className="mb-3">
              <AppText size="lg" weight="semibold" className="text-gray-800">
                Allocation Items
              </AppText>
              <AppText size="sm" color="gray" className="mt-1">
                Enter quantities and upload images for allocation
              </AppText>
            </View>

            {requestItems.map((item, index) => (
              <ItemCard
                key={index}
                item={item}
                index={index}
                fieldData={formData[index]}
                onQuantityChange={handleQuantityChange}
                onImagePick={handleImagePick}
                onRemoveImage={handleRemoveImage}
                showCropModal={showCropModal && activeFieldIndex === index}
                tempImageUri={tempImageUri}
                onCropComplete={handleCropComplete}
                onCropCancel={handleCropCancel}
              />
            ))}

            {/* Remark Input */}
            <View className="mt-2 mb-5">
              <AppInput
                label="Remark"
                value={remark}
                setValue={setRemark}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                variant="border"
                size="md"
                inputContainerClassName="min-h-[100px]"
                containerClassName="min-h-[100px]"
              />
            </View>

            {/* Submit Button */}
            <View className="mt-6 mb-4">
              <AppButton
                title="Submit Allocation"
                onPress={handleSubmit}
                className="bg-primary rounded-lg py-4"
                size="lg"
                weight="semibold"
                disabled={!hasAnyData}
              />
            </View>
          </View>
        )}

        {/* Empty State */}
        {!isLoadingItems && requestItems.length === 0 && selectedPartner && (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <AppIcon
              type="material-community"
              name="package-variant-closed"
              size={64}
              color="#9CA3AF"
            />
            <AppText size="lg" weight="semibold" className="text-gray-800 mt-4">
              No Items Found
            </AppText>
            <AppText size="sm" color="gray" className="text-center mt-2">
              No allocation items available for the selected partner
            </AppText>
          </View>
        )}

        {/* Initial State */}
        {!selectedPartner && (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <AppIcon
              type="material-community"
              name="account-search"
              size={64}
              color="#00539B"
            />
            <AppText
              size="lg"
              weight="semibold"
              className="text-gray-800 mt-4 text-center">
              Select a Partner
            </AppText>
            <AppText size="sm" color="gray" className="text-center mt-2">
              Choose a partner from the dropdown above to view and allocate
              items
            </AppText>
          </View>
        )}
      </View>
    </AppLayout>
  );
}

// Item Card Component
interface ItemCardProps {
  item: ItemQty;
  index: number;
  fieldData: FieldData;
  onQuantityChange: (index: number, value: string, item: ItemQty) => void;
  onImagePick: (index: number, source: 'camera' | 'gallery') => void;
  onRemoveImage: (index: number) => void;
  showCropModal: boolean;
  tempImageUri: string | null;
  onCropComplete: (croppedUri: string) => void;
  onCropCancel: () => void;
}

function ItemCard({
  item,
  index,
  fieldData,
  onQuantityChange,
  onImagePick,
  onRemoveImage,
  showCropModal,
  tempImageUri,
  onCropComplete,
  onCropCancel,
}: ItemCardProps) {
  const hasQuantity =
    fieldData?.quantity && parseInt(fieldData.quantity, 10) > 0;
  const showImageRequired = item.Is_Image_Compulsory && hasQuantity && !fieldData?.imageUri;

  return (
    <>
      <Card
        className={clsx(
          'mb-3 border border-gray-200',
          showImageRequired && 'border-red-400',
        )}>
        {/* Header with Stand Type and Badge */}
        <View className="flex-row items-center justify-between mb-2">
          <AppText
            size="base"
            weight="semibold"
            className="text-gray-800 flex-1">
            {item.Stand_Type}
          </AppText>
          {showImageRequired && (
            <View className="bg-red-50 px-2.5 py-1 rounded-full ml-2">
              <AppText size="xs" weight="semibold" className="text-red-600">
                Image Required
              </AppText>
            </View>
          )}
        </View>

        {/* Quantity and Image Upload Section - Side by Side */}
        <View className="flex-row gap-3">
          {/* Left Side - Quantity Input */}
          <View className="flex-shrink-0" style={{width: 120}}>
            <AppInput
              label="Quantity"
              isOptional
              labelSize="base"
              value={fieldData?.quantity || ''}
              setValue={value => onQuantityChange(index, value, item)}
              placeholder="0"
              keyboardType="numeric"
              containerClassName="w-full"
              inputClassName="text-lg ml-3"
              showClearButton={false}
              variant="border"
              size="md"
            />
            {fieldData?.error ? (
              <AppText size="xs" className="text-red-500 mt-1 text-center">
                {fieldData?.error}
              </AppText>
            ) : (
              <View className="bg-blue-50 px-2 py-1 rounded-md mt-1">
                <AppText size="xs" className="text-blue-900 text-center">
                  {item.Min_Validation === item.Max_Validation
                    ? `${item.Max_Validation}`
                    : `${item.Min_Validation} - ${item.Max_Validation}`}
                </AppText>
              </View>
            )}
          </View>

          {/* Right Side - Image Upload */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <AppText size="xs" weight="semibold" className="text-gray-700">
                Upload Image
              </AppText>
            </View>

            {fieldData?.imageUri ? (
              <View>
                <AppImage
                  source={{uri: fieldData.imageUri}}
                  className="w-full rounded-lg"
                  style={{height: 130}}
                  resizeMode="cover"
                  enableModalZoom
                />
                <TouchableOpacity
                  onPress={() => onRemoveImage(index)}
                  className="bg-red-500 rounded-lg py-2 mt-2 flex-row items-center justify-center gap-1.5"
                  activeOpacity={0.7}>
                  <AppIcon
                    type="material-community"
                    name="delete-outline"
                    size={16}
                    color="white"
                  />
                  <AppText size="xs" weight="semibold" className="text-white">
                    Remove Image
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-1.5">
                <TouchableOpacity
                  onPress={() => onImagePick(index, 'camera')}
                  className="flex-1 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg py-2.5 items-center justify-center"
                  activeOpacity={0.7}>
                  <AppIcon
                    type="material-community"
                    name="camera"
                    size={22}
                    color="#00539B"
                  />
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-blue-900 mt-1">
                    Camera
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onImagePick(index, 'gallery')}
                  className="flex-1 bg-green-50 border-2 border-green-200 border-dashed rounded-lg py-2.5 items-center justify-center"
                  activeOpacity={0.7}>
                  <AppIcon
                    type="material-community"
                    name="image"
                    size={22}
                    color="#059669"
                  />
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-green-900 mt-1">
                    Gallery
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Image Crop Modal */}
      <ImageCropModal
        visible={showCropModal}
        imageUri={tempImageUri}
        onCropComplete={onCropComplete}
        onCancel={onCropCancel}
        title="Crop Image"
        quality={0.8}
      />
    </>
  );
}
