import React from 'react'
import AppText from './customs/AppText'
import AppImage from './customs/AppImage'

import { View, Modal, StyleSheet } from 'react-native'

const CheckInternet = () => {
    return (
        <Modal visible={true} animationType="slide">
            <View className='flex-1 justify-center items-center bg-black/50'>
                <View className='bg-white p-5 rounded-lg items-center'>
                    <AppImage
                        source={require('../assets/images/no-internet.png')}
                        style={{ width: 100, height: 100, marginBottom: 20 }}
                        resizeMode='contain'
                    />
                    <AppText size='xl' weight='bold' >No Internet Connection</AppText>
                    <AppText size='sm' className='text-gray-500'>Please check your network settings.</AppText>
                </View>
            </View>
        </Modal>
    )
}

export default CheckInternet

const styles = StyleSheet.create({
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subText: {
        fontSize: 14,
        color: 'gray',
    },
});