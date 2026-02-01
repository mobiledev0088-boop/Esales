// DynamicSplash.tsx
import {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useGetSplashImage} from '../hooks/useGetSplashImage';

import AppImage from './customs/AppImage';
import {initializeMMKV} from '../utils/mmkvStorage';
import { useLoginStore } from '../stores/useLoginStore';

export default function DynamicSplash({onFinish}: {onFinish: () => void}) {
  const [startAPICall, setStartAPICall] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');

  const {imageUrl: splashImageUrl, isLoading} = useGetSplashImage(startAPICall, employeeCode);
  const initialize = async () => await initializeMMKV();

  useEffect(() => {
    initialize().then(() => {
      const userInfo = useLoginStore.getState().userInfo;
      const empCode = userInfo?.EMP_Code || '';
      setEmployeeCode(empCode);
      setStartAPICall(true);
    });
  }, []); 

  useEffect(() => {
    if (!isLoading) {
      let timer = splashImageUrl ? 2000 : 1000;
      const timeout = setTimeout(() => {
        onFinish();
      }, timer);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);
  return (
    <View style={styles.container}>
      {splashImageUrl ? (
        <AppImage
          source={{uri: splashImageUrl}}
          style={styles.image}
          resizeMode="cover"
          showSkeleton={false}
        />
      ) : (
        <AppImage
          source={require('../assets/images/logo.png')}
          style={{width: 270, height: 270}}
          showSkeleton={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00539B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
