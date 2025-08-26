import {View, FlatList, Touchable, Pressable} from 'react-native';
import React, {useState} from 'react';
import AppLayout from '../../../../components/layout/AppLayout';
import {useRoute} from '@react-navigation/native';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../../../stores/useLoginStore';
import useEmpStore from '../../../../stores/useEmpStore';
import AppModal from '../../../../components/customs/AppModal';
import Pdf from 'react-native-pdf';
import { screenHeight } from '../../../../utils/constant';
import AppButton from '../../../../components/customs/AppButton';

// Fetch reports data from API or other sources
const fetchReportsData = async (
  RoleId: number,
  employeeCode: string,
  YearQtr: string,
) => {
  const res = await handleASINApiCall('/Download/GetDownloadData', {
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
  const empInfo = useEmpStore(state => state.empInfo);

  const [RoleId = 0, employeeCode = '', YearQtr = ''] = [
    userInfo?.EMP_RoleId,
    empInfo?.EMP_Code,
    empInfo?.Year_Qtr,
  ];

  const {data} = useQuery({
    queryKey: ['reports', {RoleId, employeeCode, YearQtr}],
    queryFn: () => fetchReportsData(RoleId, employeeCode, YearQtr),
  });

  const handleOpenModal = (item: any) => {
    setIsOpen(true);
    setPdfUrl(item?.File_Path);
  };

  const renderAnnouncementData = ({item}: any) => (
    <View className="flex-row justify-between items-center w-[100%] rounded mb-2 bg-lightBg-surface dark:bg-darkBg-surface py-2 px-2">
      <View>
        <AppText size="md" weight="semibold">
          {item?.Display_Name || 'Unknown Title'}
        </AppText>
      </View>
      <Pressable
        onPress={() => handleOpenModal(item)}
        className="p-2 bg-gray-200 rounded-full">
        <AppIcon type="feather" name="eye" size={23} color="black" />
      </Pressable>
    </View>
  );

  return (
    <>
      <AppLayout title={name} needPadding>
        <FlatList
          data={getData(data, name) || []}
          renderItem={renderAnnouncementData}
          keyExtractor={(item, index) => index.toString()}
          style={{marginTop: 20}}
          showsVerticalScrollIndicator={false}
        />
      </AppLayout>
      <AppModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        blurOFF
        needClose
        >
        <View style={{height: screenHeight * 0.7}} >
          <AppText weight='semibold' className='mb-2 ml-2'>Pdf Preview</AppText>
          <Pdf
            source={{cache: true,uri: pdfUrl}}
            style={{flex: 1,borderWidth:0.5,borderColor:'#ccc'}}
            onLoadComplete={pages => {
              console.log(`PDF loaded with ${pages} pages`);
            }}
            onPageChanged={(page, total) => {
              console.log(`Current page: ${page} / ${total}`);
            }}
            onError={error => {
              console.log(error);
            }}
          />
          <AppButton
            title='Download'
            iconName='download'
            onPress={()=>{}}
            className='mt-2'
          />
        </View>
      </AppModal>
    </>
  );
}

const getData = (data: any, name: string) => {
  switch (name) {
    case 'SchemePPACT':
      return data?.['SCHEME PPACT'] || [];
    case 'PriceList':
      return data?.['PRICE LIST'] || [];
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
