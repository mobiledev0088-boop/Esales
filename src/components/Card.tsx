// components/common/Card.tsx
import { View, ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { getShadowStyle } from '../utils/appStyles';
import { Watermark } from './Watermark';
import { AppTextSizeType, AppTextWeightType } from '../types/customs';

type CardProps = {
    children?: React.ReactNode;
    className?: string;
    watermark?: boolean;
    watermarkText?: string;
    watermarkTextOpacity?: number;
    watermarkTextVerticalCount?: number;
    watermarkTextHorizontalCount?: number;
    watermarkTextRotation?: string;
    watermarkTextColor?: string;
    watermarkTextSize?: AppTextSizeType;
    watermarkTextWeight?: AppTextWeightType;
    watermarkRowGap?: number;
    watermarkColumnGap?: number;
} & ViewProps;

const Card: React.FC<CardProps> = ({
    children,
    className,
    watermark,
    watermarkText,
    watermarkTextOpacity,
    watermarkTextVerticalCount,
    watermarkTextHorizontalCount,
    watermarkTextRotation,
    watermarkTextColor,
    watermarkTextSize = 'sm',
    watermarkTextWeight = 'bold',
    watermarkRowGap = 0,
    watermarkColumnGap = 0,
    ...rest }) => {
    const mergedClassName = twMerge(
        'bg-white p-4 rounded-xl ',
        className
    );
    return (
        <View className={mergedClassName} {...rest} style={getShadowStyle()}>
            {
                watermark && (
                    <Watermark
                        text={watermarkText}
                        verticalCount={watermarkTextVerticalCount}
                        horizontalCount={watermarkTextHorizontalCount}
                        rotation={watermarkTextRotation}
                        opacity={watermarkTextOpacity}
                        color={watermarkTextColor}
                        textSize={watermarkTextSize}
                        textWeight={watermarkTextWeight}
                        rowGap={watermarkRowGap}
                        columnGap={watermarkColumnGap}
                    />
                )
            }
            {children}
        </View>
    );
};

export default Card;
