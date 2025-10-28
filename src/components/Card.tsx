// components/common/Card.tsx
import {StyleSheet, TouchableOpacity, View, ViewProps} from 'react-native';
import {twMerge} from 'tailwind-merge';
import {getShadowStyle} from '../utils/appStyles';
import {Watermark} from './Watermark';
import {AppTextSizeType, AppTextWeightType} from '../types/customs';
import {useState} from 'react';
import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import { AppColors } from '../config/theme';

type CardProps = {
  children?: React.ReactNode;
  className?: string;
  needSeeMore?: boolean;
  seeMoreText?: string;
  seeMoreOnPress?: () => void;
  needSeeMoreIcon?: boolean;
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
  needSeeMore = false,
  needSeeMoreIcon = false,
  seeMoreText = 'See More',
  seeMoreOnPress = () => {},
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
  ...rest
}) => {
  const [size, setSize] = useState({width: 0, height: 0});
  const mergedClassName = twMerge(
    'bg-lightBg-surface dark:bg-darkBg-surface p-4 rounded-xl',
    className,
  );
  return (
    <View>
      <View
        className={mergedClassName}
        {...rest}
        onLayout={event => {
          const {width, height} = event.nativeEvent.layout;
          setSize({width, height});
        }}>
        {watermark && (
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
            containerClassName={'top-8'}
            // containerClassName={''}
          />
        )}
        {children}
        <View
          className={twMerge(mergedClassName, 'absolute top-0 ')}
          style={{width: size.width, height: size.height, ...getShadowStyle(1), zIndex: -1}}
        />
      </View>
      {needSeeMore && (
        <TouchableOpacity
          onPress={seeMoreOnPress}
          activeOpacity={0.6}
          className="bg-secondary dark:bg-secondary-dark py-2.5 flex-row items-center justify-center w-[91%] self-center rounded-xl rounded-t-none -mt-1 -z-10"
          style={getShadowStyle(1)}>
          <AppText size="base" weight="medium" className="mr-1 text-white dark:text-slate-200">
            {seeMoreText}
          </AppText>
          {needSeeMoreIcon && (
            <AppIcon
              name="chevron-right"
              size={18}
              color={AppColors.bgBase}
              type="feather"
              style={{marginTop: 2}}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Card;
