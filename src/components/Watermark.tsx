import React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import AppText from './customs/AppText';
import { AppTextSizeType, AppTextWeightType } from '../types/customs';
import { useLoginStore } from '../stores/useLoginStore';

interface WatermarkProps {
    text?: string;
    textSize?: AppTextSizeType
    textWeight?: AppTextWeightType
    verticalCount?: number;
    horizontalCount?: number;
    rotation?: string; 
    opacity?: number; 
    color?: string; 
    containerClassName?: string;
    textClassName?: string;
    rowGap?: number; // NEW
    columnGap?: number; // NEW
}

export const Watermark: React.FC<WatermarkProps> = ({
    text,
    textSize = 'sm',
    textWeight = 'bold',
    verticalCount = 1,
    horizontalCount = 1,
    rotation = '-30deg',
    opacity = 0.3,
    color = 'text-primary',
    containerClassName = '',
    textClassName = '',
    rowGap = 0,
    columnGap = 0,
}) => {
    const rows = Array.from({ length: verticalCount });
    const cols = Array.from({ length: horizontalCount });
    const userInfo = useLoginStore((state) => state.userInfo);
    const name = userInfo?.EMP_Name && `${userInfo.EMP_Name.split('_').join(' ')}`;

    const mergedContainer = twMerge(
        'absolute inset-0 justify-center items-center pointer-events-none z-0',
        containerClassName
    );
    const mergedTextClass = twMerge(`${color}`, textClassName);
    return (
        <View className={mergedContainer}>
            {rows.map((_, rowIndex) => (
                <View key={`row-${rowIndex}`} className="flex-row "  style={{ marginBottom: rowIndex < rows.length - 1 ? rowGap : 0 }}>
                    {cols.map((_, colIndex) => (
                        <AppText
                            key={`col-${colIndex}`}
                            size={textSize}
                            weight={textWeight}
                            className={mergedTextClass}
                            style={{ transform: [{ rotate: rotation }], margin: 8, opacity: opacity, marginRight: colIndex < cols.length - 1 ? columnGap : 0, }}
                        >
                            {text || name}
                        </AppText>
                    ))}
                </View>
            ))}
        </View>
    );
};
