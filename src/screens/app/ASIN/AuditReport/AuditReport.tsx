import RNFS from 'react-native-fs';
import AppLayout from '../../../../components/layout/AppLayout';
import AppButton from '../../../../components/customs/AppButton';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppDropdown, { AppDropdownItem } from '../../../../components/customs/AppDropdown';

import {Platform, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import { ASUS } from '../../../../utils/constant';
import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import { useLoginStore } from '../../../../stores/useLoginStore';
import { useLoaderStore } from '../../../../stores/useLoaderStore';
import { handleASINApiCall } from '../../../../utils/handleApiCall';
import { ensureFolderExists, getPastQuarters } from '../../../../utils/commonFunctios';


// API fetch function
const fetchAuditReportData = async (
  EMP_Code: string,
  yearQtrSelected: string,
): Promise<AppDropdownItem[]> => {
  const res = await handleASINApiCall('/Download/GetEmployee_PerformanceLink', {
    employeeCode: EMP_Code || '',
    YearQtr: yearQtrSelected,
  });

  const result = res?.DashboardData;
  if (!result?.Status) throw new Error('Failed to fetch Audit Report data');

  const EmployeePerformanceLink =
    result?.Datainfo?.Employee_PerformanceLink || [];

  // Deduplicate by PartnerName
  return Array.from(
    new Map(
      EmployeePerformanceLink.map((item: any) => [
        item.PartnerName,
        {
          label: item.PartnerName.trim(),
          value: item.PerformanceLink.trim(),
        },
      ]),
    ).values(),
  ) as any;
};

export default function AuditReport() {
  const userInfo = useLoginStore(state => state.userInfo);
  const setLoading = useLoaderStore(state => state.setLoading);

  const quarters = useMemo(() => getPastQuarters(), []);

  const defaultQuarter = quarters[0]?.value;
  const [yearQtrSelected, setYearQtrSelected] = useState(defaultQuarter);
  const [selectedPartner, setSelectedPartner] =useState<AppDropdownItem | null>(null);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const resetStates = () => {
    setSelectedPartner(null);
    setDownloadLink(null);
  };

  useFocusEffect(
    useCallback(() => {
      return resetStates;
    }, []),
  );

  const {data, isLoading, isError} = useQuery({
    queryKey: ['auditReport', userInfo?.EMP_Code, yearQtrSelected],
    queryFn: () =>
      fetchAuditReportData(userInfo?.EMP_Code || '', yearQtrSelected),
    enabled: !!userInfo?.EMP_Code && !!yearQtrSelected,
  });

  const handleDownload = async () => {
    if (!selectedPartner) return;

    try {
      setLoading(true);

      const fileName = selectedPartner.value.split('/').pop() || 'report.pdf';
      const downloadsDir = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/Downloads/`,
        android: `${RNFS.DownloadDirectoryPath}/${ASUS.APP_NAME}`,
      }) as string;

      await ensureFolderExists(downloadsDir);

      const localPath = `${downloadsDir}/${fileName}`;
      const result = await RNFS.downloadFile({
        fromUrl: selectedPartner.value,
        toFile: localPath,
      }).promise;

      if (result.statusCode === 200) {
        setDownloadLink(localPath);
      } else {
        console.warn('Download failed with status:', result.statusCode);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleQuarterChange = (obj: AppDropdownItem | null) => {
    if (!obj) return;
    setYearQtrSelected(obj.value);
    resetStates();
  };

  return (
    <AppLayout title="Audit Report" needPadding>
      <View className="self-end">
        <AppDropdown
          placeholder="Choose quarter"
          data={quarters}
          selectedValue={defaultQuarter}
          onSelect={handleQuarterChange}
          mode="dropdown"
          style={{width: '35%', marginTop: 10}}
          zIndex={3000}
        />
      </View>

      <AppDropdown
        placeholder={isLoading ? 'Loading...' : 'Select Partner Name'}
        mode="autocomplete"
        data={data || []}
        selectedValue={selectedPartner?.value || null}
        onSelect={setSelectedPartner}
        style={{width: '100%', marginTop: 15}}
        listHeight={300}
        zIndex={2000}
        needIndicator
        disabled={isLoading}
      />

      <AppButton
        title="Download Report"
        onPress={handleDownload}
        className="mt-4"
        disabled={!selectedPartner?.value}
      />

      {downloadLink && (
        <Card className="mt-5 h-1/4 justify-center items-center">
          <AppText>Report downloaded to:</AppText>
          <AppText>{downloadLink}</AppText>
        </Card>
      )}
    </AppLayout>
  );
};
