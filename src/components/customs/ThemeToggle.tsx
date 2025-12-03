import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolateColor,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeStore } from '../../stores/useThemeStore';
import { scheduleOnRN } from 'react-native-worklets';

interface ThemeToggleProps {
    size?: number;
}

// Animation configuration constants
const ANIMATION_CONFIG = {
    toggle: { damping: 15, stiffness: 150 },
    iconPress: { damping: 15, stiffness: 300 },
};

// Component size ratios
const SIZE_RATIOS = {
    height: 0.5,
    borderRadius: 0.25,
    padding: 0.05,
    switchSize: 0.4,
    iconSize: 0.6,
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({
    size = 60,
}) => {
    const AppTheme = useThemeStore((state) => state.AppTheme);
    const isDark = AppTheme === 'dark';
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const toggleValue = useSharedValue(isDark ? 1 : 0);
    const iconScale = useSharedValue(1);

    React.useEffect(() => {
        toggleValue.value = withSpring(isDark ? 1 : 0, ANIMATION_CONFIG.toggle);
    }, [isDark, toggleValue]);

    const handlePress = () => {
        iconScale.value = withSpring(0.8, ANIMATION_CONFIG.iconPress, () => {
            iconScale.value = withSpring(1, ANIMATION_CONFIG.iconPress);
        });

        scheduleOnRN(toggleTheme);
    };

    const containerAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            toggleValue.value,
            [0, 1],
            ['#E5E7EB', '#374151'] // light gray to dark gray
        );

        return {
            backgroundColor,
        };
    });

    const switchAnimatedStyle = useAnimatedStyle(() => {
        const translateX = toggleValue.value * (size - size * 0.5);

        const backgroundColor = interpolateColor(
            toggleValue.value,
            [0, 1],
            ['#FCD34D', '#F3F4F6'] // yellow to light gray
        );

        return {
            transform: [{ translateX }],
            backgroundColor,
        };
    });

    const iconAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: iconScale.value }],
        };
    });

    const switchSize = size * SIZE_RATIOS.switchSize;
    const padding = size * SIZE_RATIOS.padding;

    const containerStyle = {
        width: size,
        height: size * SIZE_RATIOS.height,
        borderRadius: size * SIZE_RATIOS.borderRadius,
        padding: padding,
    };

    const switchStyle = {
        width: switchSize,
        height: switchSize,
        borderRadius: switchSize / 2,
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <Animated.View
                style={[
                    styles.container,
                    containerStyle,
                    containerAnimatedStyle,
                ]}
            >
                <Animated.View
                    style={[
                        styles.switch,
                        switchStyle,
                        switchAnimatedStyle,
                    ]}
                >
                    <Animated.View style={iconAnimatedStyle}>
                        <Icon
                            name={isDark ? 'moon' : 'sunny'}
                            size={switchSize * SIZE_RATIOS.iconSize}
                            color={isDark ? '#1F2937' : '#F59E0B'}
                        />
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
    },
    switch: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default ThemeToggle;
