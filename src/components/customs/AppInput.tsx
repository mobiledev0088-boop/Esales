// components/CustomInput.tsx
import AppText from './AppText';
import Icon from 'react-native-vector-icons/Ionicons';

import { useCallback, useMemo, useState, forwardRef } from 'react';
import { View, TextInput, TextInputProps, Pressable, ViewStyle, StyleSheet } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { useThemeStore } from '../../stores/useThemeStore';
import { AppTextSizeType } from '../../types/customs';


interface CustomInputProps extends TextInputProps {
    label?: string;
    labelSize?: AppTextSizeType;
    isOptional?: boolean;
    isPassword?: boolean;
    textSize?: number;
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
    readOnly?: boolean;
    variant?: 'border' | 'underline' | 'pill';
    size?: 'sm' | 'md' | 'lg';
    inputWapperStyle?: ViewStyle;
}

const AppInput = forwardRef<TextInput, CustomInputProps>(({
    label,
    labelSize = 'md',
    isOptional,
    isPassword = false,
    textSize,
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
    readOnly = false,
    variant = 'border',
    size = 'md',
    inputWapperStyle,
    ...props
}, ref) => {
     const appTheme = useThemeStore(state => state.AppTheme);
    const [hidePassword, setHidePassword] = useState(secureTextEntry ?? isPassword);
    const [isFocused, setIsFocused] = useState(false);

    const isDisabled = readOnly === true;

    const borderColor = useMemo(() => {
        if (error) return '#EF4444';
        if (isDisabled) return '#E5E7EB';
        if (isFocused) return '#3B82F6';
        return '#D1D5DB';
    }, [error, isFocused, isDisabled]);


    const height = size === 'sm' ? 40 : size === 'lg' ? 54 : 45;
    const fontSize = textSize ||  (size === 'sm' ? 13 : size === 'lg' ? 16 : 14);
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
        if (isDisabled) return;
        setValue('');
        onClear?.();
    }, [onClear, setValue, isDisabled]);
    return (
        <View className={twMerge('w-full', containerClassName)}>
            {label && (
                <AppText size={labelSize} weight="semibold" className="mb-1 text-gray-700">
                    {!isOptional && <AppText className="text-red-500" weight="bold">*</AppText>} {label}
                </AppText>
            )}

            <View style={[inputContainerStyle, isDisabled && { opacity: 0.6 }]} >
                {leftIconTsx ?? (leftIcon && <Icon name={leftIcon} size={20} color={appTheme === 'dark' ? "#fff" : "#000"} style={{ marginLeft: 8, marginRight:8 }} />)}

                <TextInput
                    ref={ref}
                    value={value}
                    onChangeText={setValue}
                    placeholderTextColor={isDisabled ? '#D1D5DB' : '#9CA3AF'}
                    secureTextEntry={hidePassword}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={twMerge('flex-1 text-gray-900 dark:text-gray-100 font-manropeMedium ', isDisabled && 'text-gray-400', inputClassName)}
                    style={{fontSize, height: '100%'}}
                    editable={!isDisabled}
                    // for screen readers
                    accessibilityLabel={label}
                    accessibilityHint={helpText}
                    {...props}
                />

                {isPassword && !isDisabled && (
                    <Pressable onPress={() => setHidePassword(!hidePassword)} className="mr-3">
                        <Icon name={hidePassword ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                    </Pressable>
                )}

                {showClearButton && value && !isPassword && !isDisabled && (
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
});

export default AppInput;