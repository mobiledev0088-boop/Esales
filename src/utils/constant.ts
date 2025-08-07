import { Dimensions, Platform } from "react-native";

export const isIOS = Platform.OS === 'ios';
export const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
export const utilColorKeys = [
    'utilColor1', 'utilColor2', 'utilColor3', 'utilColor4', 'utilColor5',
    'utilColor6', 'utilColor7', 'utilColor8', 'utilColor9', 'utilColor10',
] as const;



export const ASUS = {
    BUSINESS_TYPES:{
        COMMERCIAL: 4,
    }
}