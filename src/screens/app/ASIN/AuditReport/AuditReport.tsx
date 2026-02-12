import AppLayout from '../../../../components/layout/AppLayout';
import AppButton from '../../../../components/customs/AppButton';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';

import {View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useLoaderStore} from '../../../../stores/useLoaderStore';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {formatUnique} from '../../../../utils/commonFunctions';
import { downloadFile } from '../../../../utils/services';
import useQuarterHook from '../../../../hooks/useQuarterHook';

const useGetAuditReportData = (yearQtrSelected: string) => {
  const {EMP_Code = ''} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['auditReport', EMP_Code, yearQtrSelected],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/Download/GetEmployee_PerformanceLink',
        {
          employeeCode: EMP_Code || '',
          YearQtr: yearQtrSelected,
        },
      );
      const result = res?.DashboardData;
      if (!result?.Status) throw new Error('Failed to fetch Audit Report data');
      return result?.Datainfo?.Employee_PerformanceLink || [];
    },
    select: (EmployeePerformanceLink: any[]) => {
      if (!EmployeePerformanceLink) return [];
      return formatUnique(
        EmployeePerformanceLink,
        'PerformanceLink',
        'PartnerName',
      );
    },
    enabled: !!EMP_Code && !!yearQtrSelected,
  });
};

export default function AuditReport() {
  const setLoading = useLoaderStore(state => state.setLoading);
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const [selectedPartner, setSelectedPartner] = useState<AppDropdownItem | null>(null);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const {data, isLoading, error} = useGetAuditReportData(selectedQuarter?.value || '');

  const resetStates = () => {
    setSelectedPartner(null);
    setDownloadLink(null);
  };

  useFocusEffect(
    useCallback(() => {
      return resetStates;
    }, []),
  );

  const handleDownload = async () => {
    if (!selectedPartner) return;
    try {
      setLoading(true);
      const fileName = 'report.pdf';
      await downloadFile({
          url: selectedPartner.value,
          fileName,
          autoOpen: false,
        }
      )
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleQuarterChange = (obj: AppDropdownItem | null) => {
    if (!obj) return;
    setSelectedQuarter(obj);
    resetStates();
  };

  return (
    <AppLayout title="Audit Report" needPadding>
      <View className="self-end">
        <AppDropdown
          placeholder="Choose quarter"
          data={quarters}
          selectedValue={selectedQuarter?.value || null}
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
}
