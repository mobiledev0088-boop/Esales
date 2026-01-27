import {useMutation, useQuery} from '@tanstack/react-query';

import AppLayout from '../../../../../components/layout/AppLayout';
import AppDropdown, {AppDropdownItem} from '../../../../../components/customs/AppDropdown';
import {
  ActivationDetailCard,
  CautionModal,
  Disclaimer,
} from './component';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useUserStore} from '../../../../../stores/useUserStore';
import moment from 'moment';
import {DatePickerInput, DatePickerState} from '../../../../../components/customs/AppDatePicker';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {ASUS} from '../../../../../utils/constant';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import Card from '../../../../../components/Card';
import { View } from 'react-native';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import AppButton from '../../../../../components/customs/AppButton';

interface ApiResponse {
  DashboardData?: {
    Status: boolean;
    Datainfo?: {
      Partner_List?: {
        Partner_Name: string;
        PartnerType: string;
        Partner_Code: string;
      }[];
    };
  };
}

const usePartnerListQuery = (YearQtr: string) => {
  const {EMP_Code: employeeCode, EMP_RoleId: RoleId} = useLoginStore(state => state.userInfo);
  const isPartner = RoleId === ASUS.ROLE_ID.PARTNERS;
  return useQuery({
    queryKey: ['partnerList', employeeCode, RoleId, YearQtr],
    queryFn: async () => {
      try {
        const response: ApiResponse = await handleASINApiCall(
          '/Information/GetActivationReport_List',
          {
            employeeCode,
            RoleId,
            YearQtr,
          },
          {},
          true
          );
        const result = response?.DashboardData;
        if (!result?.Status) {
          console.error('API returned status false:', result);
          throw new Error('Failed to fetch partner list');
        }
        const partnerList = result.Datainfo?.Partner_List ?? [];
        const formattedList = Array.from(
          new Map(
            partnerList.map(item => [
              item.Partner_Name,
              {
                label: `${item.Partner_Name.trim()} - ${item.PartnerType.trim()}`,
                value: item.Partner_Code.trim(),
                partnerType: item.PartnerType.trim(),
              },
            ]),
          ).values(),
        );
        return formattedList;
      } catch (error) {
        console.error('Error in getPartnerList:', error);
        throw error;
      }
    },
    enabled: !isPartner
  });
};

const useSSNInfoMutation = () => {
  const {
    EMP_Code: employeeCode,
    EMP_RoleId: RoleId,
    EMP_Type: employeeType,
  } = useLoginStore(state => state.userInfo);
  return useMutation({
    mutationFn: async ({
      StartDate,
      EndDate,
      PartnerCode,
    }: {
      StartDate: string;
      EndDate: string;
      PartnerCode?: string;
    }) => {
      const dataToSend = {
        StartDate,
        EndDate,
        PartnerCode : PartnerCode || employeeCode,
        employeeCode,
        RoleId,
        isAWP: employeeType === ASUS.PARTNER_TYPE.T2.AWP,
      };
      console.log('SSN Info Request Data:', dataToSend);
      const response = await handleASINApiCall(
        '/Information/GetActivationReport_Info',
        dataToSend,
        {},
        true
      );
      const result = response?.DashboardData;
      if (!result?.Status)
        throw new Error('Failed to fetch activation details');
      const SSNInfo = result?.Datainfo?.SSN_Info || [];
      const groupedByDate: Record<string, typeof SSNInfo> = SSNInfo.reduce(
        (acc: Record<string, typeof SSNInfo>, item: any) => {
          const date = item.Activate_Date
            ? moment(item.Activate_Date).format('DD-MM-YYYY')
            : 'Unknown';
          item.AGP_Name = dataToSend.isAWP
            ? item.AGP_Name || 'N/A'
            : ASUS.PARTNER_TYPE.END_CUSTOMER;
          if (!acc[date]) acc[date] = [];
          acc[date].push(item);
          return acc;
        },
        {},
      );

      const flat = Array.from(
        new Map(
          SSNInfo.map((item: any) => [
            item.Serial_No,
            {
              Serial_No: item.Serial_No,
              Model_Name: item.Model_Name,
              AGP_Name: dataToSend.isAWP
                ? item.AGP_Name || 'N/A'
                : ASUS.PARTNER_TYPE.END_CUSTOMER,
            },
          ]),
        ).values(),
      );
      console.log('SSN Info Response Data:', {groupedByDate, flat});
      return [groupedByDate, flat];
    },
  });
};

export default function ActivatedDetails() {
  const {selectedQuarter} = useQuarterHook();
  const {EMP_RoleId} = useLoginStore(state => state.userInfo);
  const empInfo = useUserStore(state => state.empInfo);
  const isPartner =  EMP_RoleId === ASUS.ROLE_ID.PARTNERS;

  // custom hooks
  const {data: partnerList, isLoading} = usePartnerListQuery(empInfo?.Year_Qtr || selectedQuarter?.value || '');
  const {mutate, data: SSNINFO, reset} = useSSNInfoMutation();

  // State
  const [selectedStore, setSelectedStore] = useState<AppDropdownItem | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<DatePickerState>({
    start: moment().subtract(7, 'days').toDate(),
    end: new Date(),
  });

  const handleStoreSelect = useCallback(
    (store: AppDropdownItem | null) => {
      setSelectedStore(store);
    },
    [dateRange],
  );

  // functions
  const handleChange = useCallback(
    (dateRange: any, partner: any) => {
      const StartDate = moment(dateRange?.start).format('DD/MM/YYYY');
      const EndDate = moment(dateRange?.end).format('DD/MM/YYYY');
      const PartnerCode = partner?.value;

      mutate({StartDate, EndDate, PartnerCode});
    },
    [mutate],
  );

  // memo values
  const maximumDate = useMemo(() => new Date(), []);
  const minimumDate = useMemo(() => moment().subtract(5, 'years').toDate(), []);
  const serialNumbersData = useMemo(() => SSNINFO?.[0] || {}, [SSNINFO]);

  const handleReset = useCallback(() => {
    setSelectedStore(null);
    setDateRange({start: undefined, end: undefined});
    reset();
  }, [reset]);

  useEffect(() => {
    if (isPartner && empInfo) {
      const StartDate = moment().subtract(7, 'days').format('DD/MM/YYYY');
      const EndDate = moment().format('DD/MM/YYYY');
      mutate({StartDate, EndDate});
    } 
  }, []);

  return (
    <AppLayout title="Activation Details" needBack needPadding needScroll>
      <Disclaimer />
      <Card className="mb-4 ">
        <View className="flex-row items-center mb-4">
          <AppIcon
            type="ionicons"
            name="search-outline"
            size={20}
            color="#3B82F6"
            style={{marginRight: 8}}
          />
          <AppText
            size="lg"
            weight="semibold"
            className="text-gray-800 dark:text-gray-100">
            Search Activation Details
          </AppText>
        </View>

        <DatePickerInput
          mode="dateRange"
          initialStartDate={dateRange.start}
          initialEndDate={dateRange.end}
          initialDate={maximumDate}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onDateRangeSelect={(startDate, endDate) =>
            setDateRange({start: startDate, end: endDate})
          }
          label="Date Range"
          required
        />
        {!isPartner && (
          <AppDropdown
            data={partnerList || []}
            onSelect={handleStoreSelect}
            selectedValue={selectedStore?.value}
            mode="autocomplete"
            placeholder="Select store"
            label="Store Location"
            required
            listHeight={300}
            zIndex={30000}
            needIndicator
          />
        )}
        <View className="flex-row gap-3 mt-5">
          <AppButton
            title="Reset"
            iconName="refresh-ccw"
            className="flex-1 bg-gray-500"
            onPress={handleReset}
          />
          <AppButton
            title="Search"
            iconName="search"
            className="flex-1"
            onPress={() => handleChange(dateRange, selectedStore)}
          />
        </View>
      </Card>
      {Object.keys(serialNumbersData).length > 0 && (
        <ActivationDetailCard serialNumbersData={serialNumbersData as any} />
      )}
      {/* <NoDataFound/> */}
      <CautionModal />
    </AppLayout>
  );
}
