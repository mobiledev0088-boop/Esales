import DrawerItemWrapper from './DrawerItemWrapper';

import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Route } from '@react-navigation/native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import AppText from '../customs/AppText';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeStore } from '../../stores/useThemeStore';
import { AppColors } from '../../config/theme';

interface DrawerSectionProps {
    routes: Route<string>[];
    navigation: DrawerContentComponentProps['navigation'];
    state: DrawerContentComponentProps['state'];
    isAccordion?: boolean;
    title?: string;
    initiallyOpen?: boolean;
    noIcon?: boolean;
}

const iconMap: Record<string, string> = {
    "Home": 'home',
    "Account": 'person',
    "AuditReport": 'document-text',
    "Downloads": 'download',
};

const DrawerSection: React.FC<DrawerSectionProps> = ({
    routes,
    navigation,
    state,
    isAccordion = false,
    title = '',
    initiallyOpen = false,
    noIcon = false
}) => {
    const [open, setOpen] = useState(initiallyOpen);
    const isDark = useThemeStore((state) => state.AppTheme === 'dark');
    if (!routes.length) return null;
    if (isAccordion) {
        return (
            <View className="mt-2">
                <Pressable
                    onPress={() => setOpen(prev => !prev)}
                    className={`flex-row items-center justify-between mx-1 py-4 mb-1 px-5 gap-8 rounded ${open ? isDark ? 'bg-white/80' : 'bg-gray-200' : ''}`}>
                    <View className='flex-row items-center gap-8'>
                        <Icon
                            name={'download-outline'}
                            size={22}
                            color={open ? AppColors.primary : isDark ? '#fff' : 'grey'}
                        />
                        <AppText size='md' color={open ? 'primary' : 'text'} >{title}</AppText>
                    </View>
                    <Icon
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="gray"
                    />
                </Pressable>
                {open && (
                    <View className="pl-4">
                        {routes.map((route) => {
                            const focused = state.index === state.routes.findIndex(r => r.name === route.name);
                            return (
                                <DrawerItemWrapper
                                    icon={iconMap[route.name]}
                                    key={route.key}
                                    route={route}
                                    focused={focused}
                                    navigation={navigation}
                                    noIcon={noIcon}
                                />
                            );
                        })}
                    </View>
                )}
            </View>
        );
    }
    return (
        <View>
            {routes.map((route) => {
                const focused = state.index === state.routes.findIndex(r => r.name === route.name);
                return (
                    <DrawerItemWrapper
                        icon={iconMap[route.name]}
                        key={route.key}
                        route={route}
                        focused={focused}
                        navigation={navigation}
                    />
                );
            })}
        </View>
    );
};

export default DrawerSection;
