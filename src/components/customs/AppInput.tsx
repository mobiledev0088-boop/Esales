// components/CustomInput.tsx
import AppText from './AppText';
import Icon from 'react-native-vector-icons/Ionicons';

import { useCallback, useMemo, useState } from 'react';
import { View, TextInput, TextInputProps, Pressable, ViewStyle, StyleSheet } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useThemeStore } from '../../stores/useThemeStore';


interface CustomInputProps extends TextInputProps {
    label?: string;
    isOptional?: boolean;
    isPassword?: boolean;
    containerClassName?: string;
    inputContainerClassName?: string;
    inputClassName?: string;
    value: string;
    setValue: (text: string) => void;
    leftIcon?: string;
    leftIconTsx?: React.ReactNode;
    rightIcon?: string;
    rightIconTsx?: React.ReactNode;
    error?: string;
    helpText?: string;
    showClearButton?: boolean;
    onClear?: () => void;
    variant?: 'border' | 'underline' | 'pill';
    size?: 'sm' | 'md' | 'lg';
    inputWapperStyle?: ViewStyle;
}

const AppInput: React.FC<CustomInputProps> = ({
    label,
    isOptional,
    isPassword = false,
    containerClassName = '',
    inputContainerClassName = '',
    inputClassName = '',
    secureTextEntry,
    value,
    setValue,
    leftIcon,
    leftIconTsx,
    rightIcon,
    rightIconTsx,
    error,
    helpText,
    showClearButton = true,
    onClear,
    variant = 'border',
    size = 'md',
    inputWapperStyle,
    ...props
}) => {
     const appTheme = useThemeStore(state => state.AppTheme);
    const [hidePassword, setHidePassword] = useState(secureTextEntry ?? isPassword);
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = useMemo(() => {
        if (error) return '#EF4444';
        if (isFocused) return '#3B82F6';
        return '#D1D5DB';
    }, [error, isFocused]);

    const height = size === 'sm' ? 40 : size === 'lg' ? 54 : 48;
    const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;
    const inputContainerStyle: ViewStyle = useMemo(() => {
        const baseStyle = {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            borderColor,
            height,
            paddingHorizontal: variant === 'pill' ? 14 : 0,
            backgroundColor: variant === 'pill' ? '#F1F5F9' : 'transparent'
        };
        const flattenedStyle = StyleSheet.flatten(inputWapperStyle) as ViewStyle;

        return variant === 'underline'
            ? {
                ...baseStyle,
                ...flattenedStyle,
                borderBottomWidth: 2,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
            }
            : variant === 'pill'
            ? {
                ...baseStyle,
                ...flattenedStyle,
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 999,
            }
            : {
                ...baseStyle,
                ...flattenedStyle,
                borderWidth: 1,
                borderBottomWidth: 1.5,
                borderRadius: 8,
            };
    }, [borderColor, variant, inputWapperStyle, height]);

    const handleClear = useCallback(() => {
        setValue('');
        onClear?.();
    }, [onClear]);

    return (
        <View className={twMerge('w-full', containerClassName)}>
            {label && (
                <AppText weight="semibold" size="md" className="mb-1 text-gray-700">
                    {!isOptional && <AppText className="text-red-500" weight="bold">*</AppText>} {label}
                </AppText>
            )}

            <View style={inputContainerStyle} className={inputContainerClassName} >
                {leftIconTsx ?? (leftIcon && <Icon name={leftIcon} size={20} color={appTheme === 'dark' ? "#fff" : "#000"} style={{ marginLeft: 8, marginRight:8 }} />)}

                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={hidePassword}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={twMerge('flex-1 text-gray-900 dark:text-gray-100 font-manropeMedium ', inputClassName)}
                    style={{fontSize, height: '100%'}}
                    // for screen readers
                    accessibilityLabel={label}
                    accessibilityHint={helpText}
                    {...props}
                />

                {isPassword && (
                    <Pressable onPress={() => setHidePassword(!hidePassword)} className="mr-3">
                        <Icon name={hidePassword ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                    </Pressable>
                )}

                {showClearButton && value && !isPassword && (
                    <Pressable onPress={handleClear} className="mr-2">
                        <Icon name="close-circle-outline" size={20} color="#9CA3AF" />
                    </Pressable>
                )}

                {rightIconTsx ?? (rightIcon && <Icon name={rightIcon} size={20} color="#6B7280" style={{ marginRight: 8 }} />)}
            </View>

            {error ? (
                <AppText className="mt-1 text-xs text-red-500">{error}</AppText>
            ) : helpText ? (
                <AppText className="mt-1 text-xs text-gray-500">{helpText}</AppText>
            ) : null}
        </View>
    );
};

export default AppInput;


