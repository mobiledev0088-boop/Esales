import { Text, View } from 'react-native'
import AppLayout from '../../../../components/layout/AppLayout'
import Demo_Partner from './Demo_Partner'
import { useRoute } from '@react-navigation/native'

export default function TargetDemoPartner() {
    const {params} = useRoute()
    const {differentEmployeeCode} = params as {differentEmployeeCode: string};
    console.log('Received differentEmployeeCode in TargetDemoPartner:', differentEmployeeCode);
  return (
    <AppLayout title='Demo ASE' needBack  needPadding>
        <Demo_Partner
        DifferentEmployeeCode={differentEmployeeCode}
        />
    </AppLayout>
  )
}