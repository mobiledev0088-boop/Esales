import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import AppLayout from '../../../../../components/layout/AppLayout'
import Dashboard_Partner from '../../../APAC/ATID/Dashboard/Dashboard_Partner'
import { useRoute } from '@react-navigation/native'

export default function TargetPartnerDashboard() {
    const {params} = useRoute();
    const {partner} = params as {partner: any};

    console.log('Received partner data:', partner);
  return (
   <AppLayout title='Partner Dashboard' needBack>
        <Dashboard_Partner
        DifferentEmployeeCode={partner?.Partner_Code || partner?.empCode}
        DifferntEmployeeName={partner?.Partner_Name || partner?.partnerName}
        />
   </AppLayout>
  )
}