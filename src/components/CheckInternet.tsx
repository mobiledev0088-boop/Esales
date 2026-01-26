import React from 'react';
import AppText from './customs/AppText';
import AppImage from './customs/AppImage';

import {View} from 'react-native';
import AppModal from './customs/AppModal';
import useNetworkStatus from '../hooks/useNetworkStatus';

export default function CheckInternet() {
  const isConnected = useNetworkStatus();
  return (
    <AppModal isOpen={!isConnected} onClose={() => {}} modalWidth={"70%"}>
      <View className="py-5 items-center">
        <AppImage
          source={require('../assets/images/no-internet.png')}
          style={{width: 100, height: 100, marginBottom: 20}}
          resizeMode="contain"
        />
        <AppText size="xl" weight="bold" className='text-center'>
          No Internet Connection
        </AppText>
        <AppText size="sm" className="text-gray-500">
          Please check your network settings.
        </AppText>
      </View>
    </AppModal>
  );
};