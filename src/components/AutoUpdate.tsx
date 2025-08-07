import AppText from './customs/AppText';
import AppModal from './customs/AppModal';
import AppImage from './customs/AppImage';
import AppButton from './customs/AppButton';

import { useState } from 'react'
import { View } from 'react-native';
import { Button } from 'react-native';

const AutoUpdate = () => {
    const [isOpen, setIsOpen] = useState(true);
    const handleClose = () => {
        setIsOpen(false);
    }
    return (
        <>
            <View>
                <Button title='click me' onPress={() => setIsOpen(true)}></Button>
            </View>
            <AppModal
                isOpen={isOpen}
                onClose={handleClose}
                className="p-5"
                width="85%"
                height="42%"
                needClose
                blurOFF
            >
                <AppText
                    weight="semibold"
                    size="2xl"
                    color="primary"
                    className="text-center "
                >
                    Hello, Ashish
                </AppText>
                <View className='justify-center items-center mb-2'>
                    <AppImage
                        source={require('../assets/images/update.png')}
                        style={{ width: 170, height: 170, }}
                        resizeMode="contain"
                    />
                </View>
                <AppText
                    size="base"
                    weight='medium'
                    className="text-center"
                >
                    New updates are available.
                </AppText>
                <AppText
                    size="base"
                    weight="medium"
                    className="text-center mb-6"
                >
                    Update to latest Version Now.
                </AppText>

                <AppButton
                    title='Update Now'
                    onPress={handleClose}
                    className='w-1/2 self-center '
                />
            </AppModal>
        </>
    );
};

export default AutoUpdate