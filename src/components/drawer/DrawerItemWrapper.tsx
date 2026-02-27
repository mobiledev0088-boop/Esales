import { Route } from '@react-navigation/native';

import { useThemeStore } from '../../stores/useThemeStore';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '../customs/AppText';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { AppColors } from '../../config/theme';
import { convertCamelCaseToSentence } from '../../utils/commonFunctions';

// Custom display names for specific routes
const ROUTE_DISPLAY_NAMES: Record<string, string> = {
    'SchemePPACT': 'Scheme / PP / Activation Support',
    'SelloutSupportEPPNCEMI': 'Sellout Support EPP/NC/EMI',
    // Add more custom names here if needed
};

interface DrawerItemWrapperProps {
    route: Route<string>;
    focused: boolean;
    navigation?: DrawerContentComponentProps['navigation'];
    noIcon?: boolean;
    icon?: string;
    onPress?: () => void;
}

const DrawerItemWrapper: React.FC<DrawerItemWrapperProps> = ({
    route,
    focused,
    navigation,
    icon,
    noIcon = false,
    onPress,
}) => {
    const isDark = useThemeStore((state) => state.AppTheme === 'dark');
    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation?.navigate(route.name);
        }
    }
    return (
        <TouchableOpacity
            onPress={handlePress}
            className={`flex-row items-center mx-1 py-4 mb-1 pl-5 gap-8 rounded ${focused ? isDark ? 'bg-lightBg-base' : 'bg-tab-background' : ''}`}
        >
            {!noIcon && (
                <Icon
                    name={`${focused ? icon : `${icon}-outline`}`}
                    size={22}
                    color={focused ? AppColors.primary : isDark ? '#fff' : 'grey'}
                />
            )}
            <AppText size='md' color={focused ? 'primary' : 'text'} >
                {ROUTE_DISPLAY_NAMES[route.name] || convertCamelCaseToSentence(route.name)}
            </AppText>
        </TouchableOpacity>
    );
};

export default DrawerItemWrapper;
