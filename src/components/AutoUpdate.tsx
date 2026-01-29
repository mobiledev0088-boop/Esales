import AppText from './customs/AppText';
import AppModal from './customs/AppModal';
import AppImage from './customs/AppImage';
import AppButton from './customs/AppButton';

import {useState} from 'react';
import {Linking, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {useUserStore} from '../stores/useUserStore';
import {isIOS, screenWidth} from '../utils/constant';

const AutoUpdate = () => {
  const {android_version, ios_version} = useUserStore(state => state.empInfo);
  const appVersion = DeviceInfo.getVersion();
  // const isUpdateAvailable = isIOS
  //   ? ios_version !== appVersion
  //   : android_version !== appVersion;
  const isUpdateAvailable = false; // For testing purpose, set to false

  const handlePress = () => {
    if (isIOS) {
      Linking.openURL('itms-apps://apps.apple.com/app/id1597247351');
    } else {
      Linking.openURL('market://details?id=com.asus.esales');
    }
  };

  return (
    <AppModal
      isOpen={isUpdateAvailable}
      onClose={() => {}}
      modalWidth={screenWidth * 0.9}
      //   showCloseButton
      disableOverlayPress>
      <AppText
        weight="semibold"
        size="2xl"
        color="primary"
        className="text-center ">
        Hello, Ashish
      </AppText>
      <View className="justify-center items-center mb-2">
        <AppImage
          source={require('../assets/images/update.png')}
          style={{width: 170, height: 170}}
          resizeMode="contain"
        />
      </View>
      <AppText size="base" weight="medium" className="text-center">
        New updates are available.
      </AppText>
      <AppText size="base" weight="medium" className="text-center mb-6">
        Please update the app to continue.
      </AppText>

      <AppButton
        title="Update Now"
        onPress={handlePress}
        className="w-1/2 self-center  rounded-md"
        noLoading
      />
    </AppModal>
  );
};

export default AutoUpdate;
