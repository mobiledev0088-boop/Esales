// components/CustomInput.tsx
import AppText from './AppText';
import Icon from 'react-native-vector-icons/Ionicons';

import { useMemo, useState } from 'react';
import { View, TextInput, TextInputProps, Pressable, ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';


interface CustomInputProps extends TextInputProps {
    label?: string;
    isOptional?: boolean;
    isPassword?: boolean;
    containerClassName?: string;
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
    variant?: 'border' | 'underline';
}

const AppInput: React.FC<CustomInputProps> = ({
    label,
    isOptional,
    isPassword = false,
    containerClassName = '',
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
    variant = 'border',
    ...props
}) => {
    const [hidePassword, setHidePassword] = useState(secureTextEntry ?? isPassword);
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = useMemo(() => {
        if (error) return '#EF4444';
        if (isFocused) return '#3B82F6';
        return '#D1D5DB';
    }, [error, isFocused]);

    const inputContainerStyle: ViewStyle = useMemo(() => {
        const baseStyle = {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            borderColor,
        };

        return variant === 'underline'
            ? {
                ...baseStyle,
                borderBottomWidth: 2,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
            }
            : {
                ...baseStyle,
                borderWidth: 1,
                borderBottomWidth: 1.5,
                borderRadius: 8,
            };
    }, [borderColor, variant]);

    return (
        <View className={twMerge('w-full', containerClassName)}>
            {label && (
                <AppText weight="bold" size="base" className="mb-1 text-gray-700">
                    {!isOptional && <AppText className="text-red-500" weight="bold">*</AppText>} {label}
                </AppText>
            )}

            <View style={inputContainerStyle}>
                {leftIconTsx ?? (leftIcon && <Icon name={leftIcon} size={20} color="#000" style={{ marginLeft: 8, marginRight:8 }} />)}

                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={hidePassword}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={twMerge('flex-1 text-gray-900  font-manropeMedium h-14 text-md', inputClassName)}
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
                    <Pressable onPress={() => setValue('')} className="mr-2">
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


