import AppImage from '../customs/AppImage';

import {View} from 'react-native';
import {getShadowStyle} from '../../utils/appStyles';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

const AuthLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <KeyboardAwareScrollView
      style={{flex: 1}}
      contentContainerStyle={{flexGrow: 1}}
      enableOnAndroid
      showsVerticalScrollIndicator={false}
      extraScrollHeight={10}
      enableAutomaticScroll
      keyboardShouldPersistTaps="handled">
      <View className="min-h-full bg-[#d8e5f6]">
        <View
          className="w-full justify-center items-center bg-primary rounded-b-2xl"
          style={[getShadowStyle(), {minHeight: '50%'}]}>
          <AppImage
            source={require('../../assets/images/logo.png')}
            style={{width: 300, height: 300}}
            showSkeleton={false}
          />
        </View>
        <View className="w-full px-4 mt-10 pb-8">{children}</View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default AuthLayout;
