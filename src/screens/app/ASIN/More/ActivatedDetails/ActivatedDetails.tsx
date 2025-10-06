import {useMutation, useQuery} from '@tanstack/react-query';

import AppLayout from '../../../../../components/layout/AppLayout';
import {AppDropdownItem} from '../../../../../components/customs/AppDropdown';

import {
  ActivationDetailCard,
  CautionModal,
  Disclaimer,
  NoDataFound,
  SearchCard,
} from './component';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import useEmpStore from '../../../../../stores/useEmpStore';
import moment from 'moment';
import {EmpInfo, UserInfo} from '../../../../../types/user';
import {DatePickerState} from '../../../../../components/customs/AppDatePicker';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {ASUS} from '../../../../../utils/constant';
import {useLoaderStore} from '../../../../../stores/useLoaderStore';

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

const usePartnerListQuery = (
  userInfo: UserInfo | null,
  empInfo: EmpInfo | null,
) => {
  const enabled = Boolean(
    userInfo?.EMP_Code && userInfo?.EMP_RoleId && empInfo?.Year_Qtr,
  );
  return useQuery({
    queryKey: [
      'partnerList',
      userInfo?.EMP_Code,
      userInfo?.EMP_RoleId,
      empInfo?.Year_Qtr,
    ],
    queryFn: async () => {
      try {
        const response: ApiResponse = await handleASINApiCall(
          '/Information/GetActivationReport_List',
          {
            employeeCode: userInfo?.EMP_Code,
            RoleId: userInfo?.EMP_RoleId,
            YearQtr: empInfo?.Year_Qtr,
          },
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
    enabled,
  });
};

const useSSNInfoMutation = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await handleASINApiCall(
        '/Information/GetActivationReport_Info',
        data,
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
              AGP_Name: data.isAWP
                ? item.AGP_Name || 'N/A'
                : ASUS.PARTNER_TYPE.END_CUSTOMER,
            },
          ]),
        ).values(),
      );

      return [groupedByDate, flat];
    },
  });
};

export default function ActivatedDetails() {
  //store state
  const userInfo = useLoginStore(state => state.userInfo);
  const empInfo = useEmpStore(state => state.empInfo);
  const setGlobalLoading = useLoaderStore(state => state.setGlobalLoading);

  // custom hooks
  const {data: partnerList, isLoading} = usePartnerListQuery(userInfo, empInfo);
  const {mutate, data: SSNINFO, reset} = useSSNInfoMutation();

  // State
  const [selectedStore, setSelectedStore] = useState<AppDropdownItem | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<DatePickerState>({
    start: undefined,
    end: undefined,
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

      mutate({
        StartDate,
        EndDate,
        PartnerCode,
        employeeCode: userInfo?.EMP_Code || '',
        RoleID: userInfo?.EMP_RoleId || '',
        isAWP:
          (userInfo?.EMP_RoleId === ASUS.ROLE_ID.PARTNERS
            ? userInfo?.EMP_Type
            : '') === ASUS.PARTNER_TYPE.T2.AWP,
      });
    },
    [mutate, userInfo],
  );

  // memo values
  const maximumDate = useMemo(() => new Date(), []);
  const minimumDate = useMemo(() => moment().subtract(5, 'years').toDate(), []);
  const serialNumbersData = useMemo(() => SSNINFO?.[0] || {}, [SSNINFO]);

  useEffect(() => setGlobalLoading(isLoading), [isLoading]);

  const handleReset = useCallback(() => {
      setSelectedStore(null);
      setDateRange({start: undefined, end: undefined});
      reset();
  }, [reset]);

  return (
    <AppLayout title="Activation Details" needBack needPadding needScroll>
      <Disclaimer />
      <SearchCard
        dateRange={dateRange}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        partnerList={partnerList || []}
        handleStoreSelect={handleStoreSelect}
        selectedStore={selectedStore}
        setDateRange={setDateRange}
        handleChange={handleChange}
        handleReset={handleReset}
      />
      {Object.keys(serialNumbersData).length > 0 && (
        <ActivationDetailCard serialNumbersData={serialNumbersData as any} />
      )}
      {/* <NoDataFound/> */}
      <CautionModal />
    </AppLayout>
  );
}
