import { Text, View } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native';

export default function StoreDetails() {
    const {params} = useRoute();
    const { PartnerCode, StoreType } = params as {PartnerCode: string, StoreType: string};
  return (
    <View>
      <Text>StoreDetails</Text>
    </View>
  )
}