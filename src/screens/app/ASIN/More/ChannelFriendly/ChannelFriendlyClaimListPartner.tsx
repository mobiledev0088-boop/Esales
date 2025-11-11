import {TouchableOpacity, View} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppDropdown, {AppDropdownItem} from '../../../../../components/customs/AppDropdown';
import {getPastQuarters} from '../../../../../utils/commonFunctions';
import {useMemo, useState, useEffect} from 'react';
import {Image} from 'react-native';
import {useImagePicker} from '../../../../../hooks/useImagePicker';
import ImageCropModal from '../../../../../components/ImageCropModal';
import AppText from '../../../../../components/customs/AppText';

export default function ChannelFriendlyClaimListPartner() {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem | null>(quarters[0] || null);
  return (
    <AppLayout title="Channel Friendly Claims" needBack needPadding needScroll>
      <View className="self-end w-36 mt-4">
        <AppDropdown
          data={quarters}
          selectedValue={selectedQuarter?.value}
          mode="dropdown"
          placeholder="Quarter"
          onSelect={setSelectedQuarter}
        />
      </View>
      <DirectSourceExample />
    </AppLayout>
  );
}

export const DirectSourceExample = () => {
  const {
    imageUri,
    showCropModal,
    tempImageUri,
    pickImage,
    handleCropComplete,
    handleCropCancel,
    reset,
  } = useImagePicker({
    enableCrop: true, 
    quality: 0.9,
  });

  useEffect(() => {
    if (imageUri) {
      console.log('Final Image URI:', imageUri);
    }
  }, [imageUri]);

  useEffect(() => {
    if (tempImageUri) {
      console.log('Temp Image URI (for crop):', tempImageUri);
    }
  }, [tempImageUri]);

  return (
    <View className="p-5 items-center">
      <AppText className="text-lg font-bold mb-4 text-center">
        Image Picker with Crop
      </AppText>
      <AppText>{imageUri}</AppText>
      
      {imageUri ? (
        <>
          <Image
            source={{uri: imageUri}}
            className="w-full h-[300px] rounded-lg mb-4 bg-gray-300"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={reset}
            className="bg-[#007AFF] px-6 py-3 rounded-lg mt-2">
            <AppText className="text-white text-base font-semibold">Clear</AppText>
          </TouchableOpacity>
        </>
      ) : (
        <View className="flex-row gap-3 w-full">
          <TouchableOpacity
            onPress={() => pickImage('camera')}
            className="flex-1 bg-[#007AFF] py-3 rounded-lg items-center">
            <AppText className="text-white text-base font-semibold">
              📷 Camera
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickImage('gallery')}
            className="flex-1 bg-[#007AFF] py-3 rounded-lg items-center">
            <AppText className="text-white text-base font-semibold">
              🖼️ Gallery
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      <ImageCropModal
        visible={showCropModal}
        imageUri={tempImageUri}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        quality={0.9}
      />
    </View>
  );
};