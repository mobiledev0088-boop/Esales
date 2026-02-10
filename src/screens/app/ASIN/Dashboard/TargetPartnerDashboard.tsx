import { useRoute } from '@react-navigation/native'
import AppLayout from '../../../../components/layout/AppLayout'
import Dashboard_Partner from './Dashboard_Partner'

export default function TargetPartnerDashboard() {
    const {params}= useRoute();
    const {partner}= params as {partner: any};
    console.log('TargetPartnerDashboard partner',partner);
  return (
    <AppLayout title='Dashboard' needBack>
        <Dashboard_Partner 
        noBanner
        noAnalytics
        DifferentEmployeeCode={partner.AGP_Code || partner.PartnerCode}
        DifferentEmployeeName={partner.AGP_Name || partner.PartnerName}
        />
    </AppLayout>
  )
}