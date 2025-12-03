import AppLayout from '../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import {handleAPACApiCall, handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppText from '../../../../../components/customs/AppText';
import {useMemo, useState} from 'react';
import AppImage from '../../../../../components/customs/AppImage';
import Card from '../../../../../components/Card';
import AppButton from '../../../../../components/customs/AppButton';
import {ASUS, screenHeight, screenWidth} from '../../../../../utils/constant';
import RNFS from 'react-native-fs';
import {
  ensureFolderExists,
  showToast,
} from '../../../../../utils/commonFunctions';
import {useLoaderStore} from '../../../../../stores/useLoaderStore';
import { Platform, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppModal from '../../../../../components/customs/AppModal';
import { useLoginStore } from '../../../../../stores/useLoginStore';

interface EDMModel {
  label: string;
  value: string;
  path: string;
}

const useGetEDMModels = (isAPAC: boolean,Country: string) => {
  const handleFunction = isAPAC ? handleAPACApiCall : handleASINApiCall;
  const dataToSend = isAPAC ? { Country: Country } : {};
  return useQuery({
    queryKey: ['edminfo'],
    queryFn: async (): Promise<EDMModel[]> => {
      const res = await handleFunction('/Information/GetEDMModelList',dataToSend);
      const result = res?.DashboardData;
      console.log('EDM Model List Response:', result);
      if (!result?.Status) throw new Error('Failed to fetch EDM model list');

      const EDMmodelList = result?.Datainfo?.EDM_Model_List || [];

      // Deduplicate by Model_Name
      return Array.from(
        new Map(
          EDMmodelList.map((item: {Model_Name: string; FilePath: string}) => [
            item.Model_Name,
            {
              label: item.Model_Name.trim(),
              value: item.Model_Name.trim(),
              path: item.FilePath.trim(),
            },
          ]),
        ).values(),
      ) as any;
    },
  });
};

const ImageModal = ({isOpen,onClose,selectedModel}:{isOpen:boolean,onClose:()=>void,selectedModel:EDMModel|null}) => {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} animationType="slide" noCard >
      <View style={{width:screenWidth,height:screenHeight,justifyContent:'center',alignItems:'center'}}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{position: 'absolute', top: 50, right: 20, padding:5,borderRadius:50, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999}}>
            <AppIcon type="feather" name="x" size={24} color="#fff" />
          </View>
        </TouchableWithoutFeedback>
      {selectedModel && (
        <AppImage
        source={{ uri: selectedModel.path }}
        style={{ width: screenWidth * 0.95, height: screenHeight * 0.6 }}
        resizeMode="contain"
        zoomable
        />
      )}
      <View className="absolute bottom-8 self-center bg-black/60 px-4 py-3 rounded-md">
          <AppText className="text-white text-base">
              Double tap to zoom in/out
          </AppText>
        </View>
      </View>
    </AppModal>
  );
};

export default function EDMInfo() {
  const [selectedModel, setSelectedModel] = useState<EDMModel | null>(null);
  const setLoading = useLoaderStore(state => state.setLoading);
  const {EMP_CountryID:Country=""} = useLoginStore(state => state.userInfo);
  const isAPAC =  Country !== ASUS.COUNTRIES.ASIN
  console.log('EDMInfo Country:', Country, 'isAPAC:', isAPAC);
  const [isOpen,setIsOpen] = useState(false);

  const {
    data: edmModels = [],
    isLoading,
    isError,
  } = useGetEDMModels(isAPAC,Country);

  const dropdownPlaceholder = useMemo(() => {
    if (isLoading) return 'Loading...';
    if (isError) return 'Error fetching data';
    return 'Select EDM Model';
  }, [isLoading, isError]);

  const handleDownload = async () => {
    if (!selectedModel) return;
    try {
      setLoading(true);

      const fileName = selectedModel.path.split('/').pop();
      const downloadsDir = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/Downloads/`,
        android: `${RNFS.DownloadDirectoryPath}/${ASUS.APP_NAME}`,
      }) as string;

      await ensureFolderExists(downloadsDir);
      const localPath = `${downloadsDir}/${fileName}`;

      const result = await RNFS.downloadFile({
        fromUrl: selectedModel.path,
        toFile: localPath,
      }).promise;

      if (result.statusCode === 200) {
        showToast('EDM image saved to Esales folder in Downloads.');
      } else {
        console.warn('Failed to download image');
      }
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="EDM Information" needBack needPadding>
       <AppDropdown
        data={edmModels}
        onSelect={(item: any) => setSelectedModel(item)}
        mode="dropdown"
        style={{paddingTop: 16}}
        placeholder={dropdownPlaceholder}
        disabled={isLoading}
        zIndex={100}
      /> 
      {selectedModel ? (
        <View>
          <Card className="mt-5">
            <AppImage
              source={{ uri: selectedModel.path }}
              style={{ width: screenWidth * 0.85, height: 300, }}
              resizeMode="contain"
              />
              <View className='flex-row mt-2'>
              <TouchableOpacity className='p-1 bg-black/10 rounded' onPress={() => setIsOpen(true)}>
                <AppIcon
                type="feather"
                name='zoom-in'
                size={24}
                color="#000"
                />
              </TouchableOpacity>
                </View>
          </Card>
          <AppButton
            iconName="download"
            title="Download EDM Image"
            className={"mt-5 w-2/3 self-center"}
            onPress={handleDownload}
          />
        </View>
      ) : (
        <AppText size="base" weight="bold" className="ml-2 mt-2">
          Note - Please select a model to view its EDM.
        </AppText>
      )}
      <ImageModal selectedModel={selectedModel} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </AppLayout>
  );
};