import { useRoute } from '@react-navigation/native'
import AppLayout from '../../../../components/layout/AppLayout'
import Dashboard_Partner from './Dashboard_Partner'

export default function TargetPartnerDashboard() {
    const {params}= useRoute();
    const {partner}= params as {partner: any};
  return (
    <AppLayout title='Dashboard' needBack>
        <Dashboard_Partner 
        noBanner
        noAnalytics
        DifferentEmployeeCode={partner.AGP_Code}
        />
    </AppLayout>
  )
}