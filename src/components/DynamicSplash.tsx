// DynamicSplash.tsx
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AppImage from './customs/AppImage';
import { initializeMMKV } from '../utils/mmkvStorage';

const DynamicSplash = ({ onFinish }: { onFinish: () => void }) => {
    useEffect(() => {
        setTimeout(initialize, 1000);
    }, []);
    const initialize = async () => {
        await initializeMMKV();
        onFinish();
    };

    return (
        <View style={styles.container}>
            {/* <AppImage source={require('../assets/images/new.gif')} style={styles.image} resizeMode="cover" /> */}
            <AppImage
                source={require('../assets/images/logo.png')}
                style={{ width: 270, height: 270 }}
                // resizeMode="cover"
            />
        </View>
    );
};

export default DynamicSplash;

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
