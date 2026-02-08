import {useRoute} from '@react-navigation/native';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {useCallback, useState} from 'react';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useUserStore} from '../../../../../stores/useUserStore';
import {useQuery} from '@tanstack/react-query';
import {FlatList, View} from 'react-native';
import AppText from '../../../../../components/customs/AppText';
import {Pressable} from 'react-native';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppButton from '../../../../../components/customs/AppButton';
import AppModal from '../../../../../components/customs/AppModal';
import {screenHeight, screenWidth} from '../../../../../utils/constant';
import Pdf from 'react-native-pdf';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {showToast} from '../../../../../utils/commonFunctions';
import {downloadFile} from '../../../../../utils/services';

// Fetch reports data from API or other sources
const fetchReportsData = async (
  RoleId: number,
  employeeCode: string,
  YearQtr: string,
) => {
  const res = await handleAPACApiCall('/Download/GetDownloadData', {
    YearQtr,
    RoleId,
    employeeCode,
  });

  const result = res?.DownloadData;
  if (!result?.Status) throw new Error('Failed to fetch Audit Report data');

  const announcementData = result?.Datainfo?.Table || [];
  const groupedByTitle: any = {};

  for (const item of announcementData) {
    groupedByTitle[item.Announcement_Type] ??= [];
    groupedByTitle[item.Announcement_Type].push(item);
  }
  return groupedByTitle;
};

export default function Reports() {
  const {name} = useRoute();

  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const userInfo = useLoginStore(state => state.userInfo);
  const empInfo = useUserStore(state => state.empInfo);

  const [RoleId = 0, employeeCode = '', YearQtr = ''] = [
    userInfo?.EMP_RoleId,
    empInfo?.EMP_Code,
    empInfo?.Year_Qtr,
  ];

  const {data, isLoading, isError, error, refetch} = useQuery({
    queryKey: ['reports', {RoleId, employeeCode, YearQtr}],
    queryFn: () => fetchReportsData(RoleId, employeeCode, YearQtr),
  });

  const handleDownload = useCallback(async (item: any) => {
    if (!item?.File_Path) {
      showToast('File not available');
      return;
    }
    const fileName = item?.File_Path.split('/').pop() || 'DownloadedFile';
    try {
      showToast('Downloading file...');
      await downloadFile({
        url: item?.File_Path,
        fileName: fileName,
        autoOpen: true,
      });
    } catch (e) {
      console.log('Open URL error', e);
      showToast('Unable to open link');
    }
  }, []);

  const renderAnnouncementData = ({item}: any) => (
    <View className="flex-row justify-between items-center rounded mb-2 bg-lightBg-surface dark:bg-darkBg-surface py-2 px-2 border-slate-200 dark:border-slate-600 border">
      <View className="w-[80%]">
        <AppText size="md" weight="semibold">
          {item?.Display_Name || 'Unknown Title'}
        </AppText>
      </View>
      <Pressable
        onPress={() => handleDownload(item)}
        className="p-2 bg-gray-200 rounded-full">
        <AppIcon type="feather" name="download" size={23} color="black" />
      </Pressable>
    </View>
  );

  console.log('REPORTS DATA:', data);

  return (
    <AppLayout title={name}>
      {isLoading ? (
        <ReportsSkeleton />
      ) : isError ? (
        <View className="flex-1 justify-center items-center mt-20">
          <AppText className="text-red-500 dark:text-red-400 mb-2">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </AppText>
          <AppButton title="Retry" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={getData(data, name) || []}
          renderItem={renderAnnouncementData}
          keyExtractor={(item, index) => index.toString()}
          style={{marginTop: 20, paddingHorizontal: 10}}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <AppText className="text-gray-500 dark:text-gray-400" size="2xl">
                No reports available
              </AppText>
            </View>
          )}
        />
      )}
    </AppLayout>
  );
}

const getData = (data: any, name: string) => {
  switch (name) {
    case 'SchemePPACT':
      return data?.['Scheme / PP / Activation Support'] || [];
    case 'PriceList':
      return data?.['PriceList'] || [];
    case 'DemoProgramLetter':
      return data?.['DEMO PROGRAM LETTER'] || [];
    case 'EndCustomerRelated':
      return data?.['END CUSTOMER RELATED'] || [];
    case 'MarketingMaterial':
      return data?.['MARKETING MATERIAL'] || [];
    default:
      return [];
  }
};

function ReportsSkeleton() {
  return (
    <View className="px-3 pt-5 gap-4">
      {[...Array(15)].map((_, index) => (
        <Skeleton
          key={index}
          width={screenWidth * 0.9}
          height={40}
          borderRadius={6}
        />
      ))}
    </View>
  );
}
