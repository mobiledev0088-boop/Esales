import { Route } from '@react-navigation/native';

import { useThemeStore } from '../../stores/useThemeStore';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '../customs/AppText';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { AppColors } from '../../config/theme';
import { convertCamelCaseToSentence } from '../../utils/commonFunctios';

interface DrawerItemWrapperProps {
    route: Route<string>;
    focused: boolean;
    navigation: DrawerContentComponentProps['navigation'];
    noIcon?: boolean;
    icon?: string;
}

const DrawerItemWrapper: React.FC<DrawerItemWrapperProps> = ({
    route,
    focused,
    navigation,
    icon,
    noIcon = false,
}) => {
    const isDark = useThemeStore((state) => state.AppTheme === 'dark');
    return (
        <TouchableOpacity
            onPress={() => navigation.navigate(route.name)}
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
                {convertCamelCaseToSentence(route.name)}
            </AppText>
        </TouchableOpacity>
    );
};

export default DrawerItemWrapper;
