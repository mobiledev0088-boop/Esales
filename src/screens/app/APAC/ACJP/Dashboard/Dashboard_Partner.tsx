import { View } from 'react-native'
import AppLayout from '../../../../../components/layout/AppLayout'
import { useLoginStore } from '../../../../../stores/useLoginStore';
import { useQuery } from '@tanstack/react-query';
import { handleAPACApiCall } from '../../../../../utils/handleApiCall';
import { useRoute } from '@react-navigation/native';
import useQuarterHook from '../../../../../hooks/useQuarterHook';

interface Dashboard_PartnerParams {
  Year_Qtr: string;
  ALP: string;
  Partner_Code: string;
}

const useGetDashboardData = (
  YearQtr: string,
  employeeCode:string,
) => {
  return useQuery({
    queryKey: [
      'Dashboard_Partner',
      employeeCode,
      YearQtr,
    ],
    queryFn: async () => {
      const response = await handleAPACApiCall(
        '/Dashboard/GetDashboardData',
        {
          employeeCode,
          YearQtr,
          masterTab:"Total",
        },
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch dealer information');
      }
      return result.Datainfo;
    },
  });
};

export default function Dashboard_Partner() {
    const {params} = useRoute();
    const {Year_Qtr, ALP, Partner_Code} = params as Dashboard_PartnerParams;
    const {quarters,selectedQuarter,setSelectedQuarter} = useQuarterHook(Year_Qtr);
    const {data, isLoading, error} = useGetDashboardData(selectedQuarter?.value||'', Partner_Code);

    const targetAchvt_AGPSellIn = data?.TrgtAchvt_AGPSellIn;
    const targetSummary = data?.TRGTSummaryPartner;
    
    const partnerInventory = data?.PartnerInventory;

    const shopInfo = data?.shopinfo;
    const shopImage = data?.shopImage;
    const VivoBook = data?.VivoBook;
    const zenbook = data?.zenbook;
    const ChromeBook = data?.ChromeBook;

    const ROG = data?.ROG;
    const AIO = data?.AIO;
    const TUF = data?.TUF;

    const shopInfo2 = data?.shopinfo;
    
  return (
   <AppLayout title='Partner Dashboard' needBack needPadding>
    <View>

    </View>
   </AppLayout>
  )
}