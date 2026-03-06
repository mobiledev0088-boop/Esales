import AppLayout from '../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppText from '../../../../../components/customs/AppText';
import {useMemo, useState} from 'react';

import Card from '../../../../../components/Card';
import AppButton from '../../../../../components/customs/AppButton';
import {screenHeight, screenWidth} from '../../../../../utils/constant';
import {useLoaderStore} from '../../../../../stores/useLoaderStore';
import {TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppModal from '../../../../../components/customs/AppModal';

import {useUserStore} from '../../../../../stores/useUserStore';
import {formatUnique, showToast} from '../../../../../utils/commonFunctions';
import AppImage from '../../../../../components/customs/AppImage';
import { downloadFile } from '../../../../../utils/services';
import { useThemeStore } from '../../../../../stores/useThemeStore';

interface MobileOnePagerModel {
  label: string;
  value: string;
}

const useGetMobileOnePagerModels = () => {
  const {
    Year_Qtr,
    EMP_Code: employeeCode,
    RoleId,
  } = useUserStore(state => state.empInfo);
  return useQuery({
    queryKey: ['mobileonepagers'],
    queryFn: async (): Promise<any> => {
      const res = await handleASINApiCall('/OnePager/Post_OnePager_getList', {
        username: employeeCode,
        Role_ID: RoleId,
        YearQtr: Year_Qtr,
      });
      const result = res?.DashboardData;
      console.log('Mobile One Pager List Response:', result);
      if (!result?.Status) throw new Error('Failed to fetch Mobile One Pager list');
      return result?.Datainfo?.OnePager_List || [];
    },
    select: data => {
      return formatUnique(data, 'Image_Link', 'Series','Series');
    },
  });
};

const ImageModal = ({
  isOpen,
  onClose,
  selectedModel,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: MobileOnePagerModel | null;
}) => {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} animationType="slide" noCard>
      <View
        style={{
          width: screenWidth,
          height: screenHeight,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              padding: 5,
              borderRadius: 50,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
            }}>
            <AppIcon type="feather" name="x" size={24} color="#fff" />
          </View>
        </TouchableWithoutFeedback>
        {selectedModel && (
          <AppImage
            source={{uri: selectedModel.value}}
            style={{width: screenWidth * 0.95, height: screenHeight * 0.6}}
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

export default function MobileOnePagers() {
  const [selectedModel, setSelectedModel] =
    useState<MobileOnePagerModel | null>(null);
  const setLoading = useLoaderStore(state => state.setLoading);
  const [isOpen, setIsOpen] = useState(false);
  
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');

  const {
    data: mobileOnePagerModels = [],
    isLoading,
    isError,
  } = useGetMobileOnePagerModels();

  const dropdownPlaceholder = useMemo(() => {
    if (isLoading) return 'Loading...';
    if (isError) return 'Error fetching data';
    return 'Select Mobile One Pager Series';
  }, [isLoading, isError]);

  const handleDownload = async () => {
    if (!selectedModel) return;
    try {
      setLoading(true);
        const fileName = selectedModel.value.split('/').pop();

        const result = await downloadFile({
          url: selectedModel.value,
          fileName: fileName || 'Mobile_OnePager.jpg',
          autoOpen: true,
        });
      if (result) {
        showToast('Mobile One Pager saved to Esales folder in Downloads.');
      } else {
        showToast('Failed to download image');
      }
    } catch (error) {
      showToast(`Error downloading image: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Mobile One Pagers" needBack needPadding>
      <AppDropdown
        data={mobileOnePagerModels}
        onSelect={(item: any) => setSelectedModel(item)}
        mode="dropdown"
        style={{paddingTop: 16}}
        placeholder={dropdownPlaceholder}
        disabled={isLoading}
        zIndex={100}
        selectedValue={selectedModel?.value}
      />
      {selectedModel ? (
        <View>
          <Card className="mt-5 border border-slate-200 dark:border-slate-700" noshadow>
            <AppImage
              source={{uri: selectedModel.value}}
              style={{width: screenWidth * 0.85, height: 300}}
              resizeMode="contain"
            /> 
            <View className="flex-row mt-2">
              <TouchableOpacity
                className="p-1 bg-black/10 rounded"
                onPress={() => setIsOpen(true)}>
                <AppIcon type="feather" name="zoom-in" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
          </Card>
          <AppButton
            iconName="download"
            title="Download Mobile One Pager"
            className={'mt-5 w-2/3 self-center'}
            onPress={handleDownload}
          />
        </View>
      ) : (
        <AppText size="base" weight="bold" className="ml-2 mt-2">
          Note - Please select a model to view its Mobile One Pager.
        </AppText>
      )}
      <ImageModal
        selectedModel={selectedModel}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </AppLayout>
  );
};