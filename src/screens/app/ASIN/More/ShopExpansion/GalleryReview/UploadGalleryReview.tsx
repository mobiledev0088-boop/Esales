import {ScrollView, TouchableOpacity, View} from 'react-native';
import AppLayout from '../../../../../../components/layout/AppLayout';
import AppButton from '../../../../../../components/customs/AppButton';
import Card from '../../../../../../components/Card';
import AppText from '../../../../../../components/customs/AppText';
import AppIcon from '../../../../../../components/customs/AppIcon';
import {useNavigation, useRoute} from '@react-navigation/native';
import AppImage from '../../../../../../components/customs/AppImage';
import {useEffect, useState} from 'react';
import {useImagePicker} from '../../../../../../hooks/useImagePicker';
import moment from 'moment';
import {useLoginStore} from '../../../../../../stores/useLoginStore';
import ImageCropModal from '../../../../../../components/ImageCropModal';
import {screenHeight, screenWidth} from '../../../../../../utils/constant';
import {showSourceOptionSheet} from '../../../../../../components/SourceOptionSheet';
import {convertImageToBase64, convertSnakeCaseToSentence, showToast} from '../../../../../../utils/commonFunctions';
import AppModal from '../../../../../../components/customs/AppModal';
import {useMutation} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../../utils/handleApiCall';
import {getDeviceId} from 'react-native-device-info';
import { queryClient } from '../../../../../../stores/providers/QueryProvider';
import { SheetManager } from 'react-native-actions-sheet';

interface ImageTypeData {
  ImageType: string;
  Image_Links: string[];
}
interface RouteParams {
  data: ImageTypeData[];
  storeCode: string;
  referenceImages: {
    Image_Link: string;
    StandType: string;
  }[];
}
// API Hook

const useUploadImagesMutation = () => {
  const {EMP_Code} = useLoginStore(state => state.userInfo);
  return useMutation({
    mutationKey: ['StoreDetails_Insert'],
    mutationFn: async ({
      storeCode,
      formatedData,
    }: {
      storeCode: string;
      formatedData: any;
    }) => {
      const payload = {
        ImageDetails: formatedData,
        PartnerCode: storeCode || '',
        UserName: EMP_Code || '',
        MachineName: getDeviceId() || '',
      };
      const response = await handleASINApiCall(
        '/Partner/ShopExpansionGalleryImages_Insert',
        payload,
        {},
        true
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to upload gallery review images.');
      }
      console.log('Upload response', result);
    },
  });
};

const buildPayload = async (formData: ImageTypeData[]) => {
  const payload = await Promise.all(
    formData.flatMap(item =>
      item.Image_Links.map(async link => {
        const ImageLink = link.includes('https://')
          ? link
          : await convertImageToBase64(link);

        return {
          ImageType: item.ImageType.replace(/ /g, '_').toLowerCase(),
          ImageLink,
        };
      })
    )
  );
  return payload;
};

const ReferenceImageModal = ({
  isModalOpen,
  setIsModalOpen,
  url,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  url: string;
}) => {
  return (
    <AppModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      animationType="slide"
      noCard>
      <AppImage
        source={{uri: url}}
        style={{
          width: screenWidth * 0.9,
          height: screenHeight * 0.7,
          alignSelf: 'center',
        }}
        resizeMode="contain"
        enableModalZoom
      />
    </AppModal>
  );
};

export default function UploadGalleryReview() {
  const navigation = useNavigation();
  const {params} = useRoute();
  const {data, storeCode, referenceImages} = params as RouteParams;
  console.log('UploadGalleryReview params', params);

  const {EMP_Name, EMP_Code} = useLoginStore(state => state.userInfo);
  const {mutate} = useUploadImagesMutation();
  
  const [formData, setFormData] = useState(data);
  const [activeImageTypeIndex, setActiveImageTypeIndex] = useState<number | null>(null);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [referenceModalUrl, setReferenceModalUrl] = useState('');

  const watermarkText = `${moment().format('ddd, MMM D, YYYY h:mm A')} \n Uploaded by ${EMP_Name} (${EMP_Code})`;
  const {
    pickImage,
    handleCropComplete,
    imageUri,
    showCropModal,
    tempImageUri,
    handleCropCancel,
    reset,
  } = useImagePicker({
    quality: 0.8,
    enableCrop: true,
    watermarkText,
  });

  const openSourceModal = (index: number) => {
    console.log({index})
    setActiveImageTypeIndex(index);
    showSourceOptionSheet({
      onSelect: source => handleSelectSource(source),
    });
  };
  const handleSelectSource = async (source: 'camera' | 'gallery') => {
    // console.log('handleSelectSource called with:', source);
    // if (activeImageTypeIndex === null) {
    //   return;
    // }
    console.log('Selected source:', source);
    await pickImage(source);
    SheetManager.hide('SourceOptionSheet');
  };
  const handleReferenceImagePress = (url: string) => {
    setReferenceModalUrl(url);
    setIsReferenceModalOpen(true);
  };
  const handleRemoveImage = (itemIndex: number, imageIndex: number) => {
    setFormData(prev => {
      const updated = [...prev];
      const target = updated[itemIndex];
      if (!target) {
        return prev;
      }
      const newLinks = target.Image_Links.filter(
        (_, idx) => idx !== imageIndex,
      );
      updated[itemIndex] = {
        ...target,
        Image_Links: newLinks,
      };
      return updated;
    });
  };
  const handleUpload = async () => {
    const payload = await buildPayload(formData);
    console.log('payload', payload);
    // mutate({
    //   storeCode,
    //   formatedData: payload,
    // },{
    //   onSuccess: () => {
    //     showToast('Images uploaded successfully.');
    //     // queryClient.invalidateQueries({ queryKey: ['StoreDetails'] });
    //     // navigation.goBack();
    //   },
    //   onError: (error: any) => {
    //     showToast(error.message || 'Failed to upload images.');
    //   },
    // });
  };

  useEffect(() => {
    if (!imageUri || activeImageTypeIndex === null) return;
    const index = activeImageTypeIndex;
    setFormData(prev => {
      const updated = [...prev];
      const target = updated[index];
      if (!target) {
        return prev;
      }
      if (target.Image_Links.length >= 5) {
        return prev;
      }
      updated[index] = {
        ...target,
        Image_Links: [...target.Image_Links, imageUri],
      };
      return updated;
    });
    reset();
  }, [imageUri, activeImageTypeIndex, reset]);

  return (
    <AppLayout title="Upload Gallery Review" needBack>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-3 pt-3"
        showsVerticalScrollIndicator={false}>
        {formData.map((item, index) => {
          const foundReference = referenceImages.find(ref => ref.StandType === convertSnakeCaseToSentence(item.ImageType));
          return (
            <Card key={index} className="w-full mb-3">
              <AppText size="sm" className="text-center" weight="bold">
                {item.ImageType}
              </AppText>
              <View className="py-2 flex-row flex-wrap gap-2">
                {item.Image_Links.map((link, idx) => (
                  <View key={idx}>
                    <AppImage
                      source={{uri: link}}
                      style={{
                        width: screenWidth / 3 - 23,
                        height: 96,
                        borderRadius: 8,
                      }}
                      className="rounded-lg"
                      enableModalZoom
                    />
                    <TouchableOpacity
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      className="absolute top-1 right-1 bg-red-400/80 rounded-full p-1"
                      onPress={() => handleRemoveImage(index, idx)}>
                      <AppIcon
                        name="trash-2"
                        type="feather"
                        size={20}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                {item.Image_Links.length !== 5 && (
                  <TouchableOpacity
                    onPress={() => openSourceModal(index)}
                    className="w-32 h-[96] bg-lightBg-base dark:bg-darkBg-base border border-dashed rounded-lg border-gray-300 dark:border-gray-700 justify-center items-center">
                    <AppIcon
                      name="plus"
                      type="feather"
                      size={24}
                      color="#111"
                    />
                    <AppText size="xs" weight="medium" color="primary">
                      Add Image
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
              {!!foundReference && (
                <TouchableOpacity
                  onPress={() =>handleReferenceImagePress(foundReference.Image_Link)}>
                  <AppText
                    size="xs"
                    className="mt-1 underline"
                    color="primary"
                    weight="medium">
                    Referenace image
                  </AppText>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}
      </ScrollView>
      <AppButton
        title="Upload"
        onPress={handleUpload}
        size="lg"
        className="mx-3 rounded-lg mb-2"
      />
      <ImageCropModal
        visible={showCropModal}
        imageUri={tempImageUri}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        quality={0.9}
      />
      <ReferenceImageModal
        isModalOpen={isReferenceModalOpen}
        setIsModalOpen={() => setIsReferenceModalOpen(false)}
        url={referenceModalUrl}
      />
    </AppLayout>
  );
}
