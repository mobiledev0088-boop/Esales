import AppImage from '../customs/AppImage'

import { View } from 'react-native'
import { getShadowStyle } from '../../utils/appStyles'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <View className='flex-1 bg-[#d8e5f6]'>
            <View className='w-full h-1/2 justify-center items-center bg-primary rounded-b-2xl' style={getShadowStyle()}>
                <AppImage
                    source={require('../../assets/images/logo.png')}
                    style={{ width: 300, height: 300 }}
                />
            </View>
            <View className='w-full h-1/2 px-4 mt-10'>
                {children}
            </View>
        </View>
    )
}

export default AuthLayout