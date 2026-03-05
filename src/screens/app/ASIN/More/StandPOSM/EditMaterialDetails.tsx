import {View, TouchableOpacity} from 'react-native';
import {useState, useCallback} from 'react';
import {useMutation} from '@tanstack/react-query';
import {useNavigation, useRoute} from '@react-navigation/native';
import {getDeviceId} from 'react-native-device-info';
import {SheetManager} from 'react-native-actions-sheet';

import AppLayout from '../../../../../components/layout/AppLayout';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import AppImage from '../../../../../components/customs/AppImage';
import AppIcon from '../../../../../components/customs/AppIcon';

import {useImagePicker} from '../../../../../hooks/useImagePicker';
import {showSourceOptionSheet} from '../../../../../components/SourceOptionSheet';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {
  showToast,
  convertImageToBase64,
} from '../../../../../utils/commonFunctions';

// Delivery Status Options
const DELIVERY_STATUS_OPTIONS: AppDropdownItem[] = [
  {label: 'Installed', value: 'Installed'},
  {label: 'Damaged / Missing', value: 'Damaged_Missing'},
];

// API Hook
const useUpdateMaterialMutation = () => {
  const {EMP_Code} = useLoginStore(state => state.userInfo);
  const navigation = useNavigation();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        SubRequestID: data.Sub_Request_Id,
        Imagetype: data.deliveryStatus,
        ItemRemark: data.remarks,
        UploadImageurl: data.image,
        UserName: EMP_Code || '',
      };

      console.log('Update Material Payload:', payload);

      const response = await handleASINApiCall(
        '/StandPOSM/StandPOSMAllocation_UpdateDeliveryStatus',
        payload,
        {},
        true,
      );

      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to update material details');
      }

      return result;
    },
    onSuccess: () => {
      showToast('Material details updated successfully!');
      navigation.goBack();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update material details');
    },
  });
};

export default function EditMaterialDetails() {
  const {params} = useRoute();
  const item = (params as any)?.item;
  const [deliveryStatus, setDeliveryStatus] = useState<AppDropdownItem | null>(
    null,
  );
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({status: '', remarks: '', image: ''});

  const {mutate: updateMaterial, isPending} = useUpdateMaterialMutation();

  // Image picker hook
  const {
    imageUris,
    pickImage,
    reset: resetImage,
  } = useImagePicker({
    enableCrop: false,
    quality: 0.8,
  });
  const imageUri = imageUris[0];

  // Handle image source selection
  const handleSelectImageSource = useCallback(() => {
    showSourceOptionSheet({
      title: 'Select Delivery Image',
      onSelect: async source => {
        await pickImage(source);
        SheetManager.hide('SourceOptionSheet');
      },
    });
  }, [pickImage]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {status: '', remarks: '', image: ''};
    let isValid = true;

    if (!deliveryStatus) {
      newErrors.status = 'Please select delivery status';
      isValid = false;
    }

    if (!remarks.trim()) {
      newErrors.remarks = 'Please enter delivery remarks';
      isValid = false;
    }

    if (!imageUri) {
      newErrors.image = 'Please upload delivery image';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [deliveryStatus, remarks, imageUri]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showToast('Please fill all required fields');
      return;
    }
    try {
      const imageBase64 = await convertImageToBase64(imageUri!);
      updateMaterial({
        deliveryStatus: deliveryStatus?.value,
        remarks: remarks.trim(),
        image: imageBase64,
        item: item
      });
    } catch (error) {
      showToast('Failed to process image');
    }
  }, [validateForm, imageUri, deliveryStatus, remarks, updateMaterial, item ]);

  return (
    <AppLayout title="Edit Material Details" needBack needPadding>
      <View className="flex-1">
        {/* Delivery Status and Remarks */}
        <Card className="p-4 mb-4">
          <AppText size="lg" weight="semibold" className="mb-3">
            Delivery Information
          </AppText>
          <AppDropdown
            data={DELIVERY_STATUS_OPTIONS}
            selectedValue={deliveryStatus?.value || null}
            onSelect={setDeliveryStatus}
            mode="dropdown"
            placeholder="Select delivery status"
            label="Delivery Status"
            required
            error={errors.status}
            zIndex={3000}
          />
          <View className="mt-4">
            <AppInput
              label="Remarks"
              value={remarks}
              setValue={setRemarks}
              placeholder="Enter delivery remarks"
              error={errors.remarks}
            />
          </View>
        </Card>

        {/* Delivery Image */}
        <Card className="p-4 mb-4">
          <AppText size="lg" weight="semibold" className="mb-3">
            Delivery Image
          </AppText>

          {imageUri ? (
            <View className="relative">
              <AppImage
                source={{uri: imageUri}}
                style={{width: '100%', height: 256, borderRadius: 8}}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={resetImage}
                className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
                activeOpacity={0.7}>
                <AppIcon type="feather" name="trash-2" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSelectImageSource}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-12 items-center justify-center bg-gray-50 dark:bg-gray-800"
              activeOpacity={0.7}>
              <AppIcon type="feather" name="camera" size={40} color="#9CA3AF" />
              <AppText size="base" className="text-gray-500 mt-2">
                Tap to upload delivery image
              </AppText>
            </TouchableOpacity>
          )}

          {errors.image && (
            <AppText className="text-red-500 text-xs mt-1">
              {errors.image}
            </AppText>
          )}
        </Card>

        {/* Save Button */}
        <View className="mt-4">
          <AppButton
            title="Save"
            onPress={handleSave}
            className="py-4"
            weight="semibold"
            size="lg"
            disabled={isPending}
          />
        </View>
      </View>
    </AppLayout>
  );
}
