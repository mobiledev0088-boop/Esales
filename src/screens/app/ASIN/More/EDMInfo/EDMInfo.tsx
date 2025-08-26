import AppLayout from '../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppText from '../../../../../components/customs/AppText';
import {useMemo, useRef, useState} from 'react';
import AppImage from '../../../../../components/customs/AppImage';
import Card from '../../../../../components/Card';
import AppButton from '../../../../../components/customs/AppButton';
import {ASUS, screenWidth} from '../../../../../utils/constant';
import RNFS from 'react-native-fs';
import {
  ensureFolderExists,
  showToast,
} from '../../../../../utils/commonFunctios';
import {useLoaderStore} from '../../../../../stores/useLoaderStore';
import { Platform, TouchableOpacity, View } from 'react-native';
import clsx from 'clsx';
import AppIcon from '../../../../../components/customs/AppIcon';

interface EDMModel {
  label: string;
  value: string;
  path: string;
}

// API fetch function
const fetchEDMModels = async (): Promise<EDMModel[]> => {
  const res = await handleASINApiCall('/Information/GetEDMModelList');
  const result = res?.DashboardData;
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
};

const EDMInfo = () => {
  const [selectedModel, setSelectedModel] = useState<EDMModel | null>(null);
  const setLoading = useLoaderStore(state => state.setLoading);
  const [zIndex, setZIndex] = useState(100);
  const ref = useRef<null>(null);

  const {
    data: edmModels = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['edminfo'],
    queryFn: fetchEDMModels,
  });

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
        zIndex={zIndex}
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
              <TouchableOpacity className='p-1 bg-black/10 rounded'>
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
    </AppLayout>
  );
};

export default EDMInfo;