import Reanimated from "react-native-reanimated";

import {
    Text as RNText,
    TextProps as RNTextProps,
    StyleProp,
    TextStyle,
    Animated as RNAnimated,
} from "react-native";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppTextColorType, AppTextSizeType, AppTextWeightType } from "../../types/customs";

// Props
interface CustomTextProps extends RNTextProps {
    children: React.ReactNode;
    className?: string;
    style?: StyleProp<TextStyle>;
    weight?: AppTextWeightType;
    size?: AppTextSizeType;
    color?: AppTextColorType;
    isAnimated?: boolean;
    animationLibrary?: "react-native" | "reanimated";
}


// Font weight to Tailwind class
const weightToClass: Record<NonNullable<CustomTextProps["weight"]>, string> = {
    regular: "font-manrope",
    medium: "font-manropeMedium",
    semibold: "font-manropeSemibold",
    bold: "font-manropeBold",
    extraBold: "font-manropeExtraBold",
};

// Size to Tailwind text size class
const sizeToClass: Record<NonNullable<CustomTextProps["size"]>, string> = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    md: "text-md",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
};

// Custom color mapping
const colorToClass: Record<AppTextColorType, string> = {
  primary: "text-primary dark:text-primary-dark",
  secondary: "text-secondary dark:text-secondary-dark",
  background: "text-background dark:text-background-dark",
  gray: "text-gray-700 dark:text-gray-300",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
  text: "text-black dark:text-white",
  white: "text-white",
  black: "text-black",
};

// Main Component
const AppText: React.FC<CustomTextProps> = ({
    children,
    className = "",
    style,
    weight = "regular",
    size = "base",
    color = "text",
    isAnimated = false,
    animationLibrary = "react-native",
    ...props
}) => {
    const fontClass = weightToClass[weight];
    const sizeClass = sizeToClass[size];
    const colorClass = colorToClass[color];

    // Merge all classes
    const mergedClass = twMerge(clsx(fontClass, sizeClass, colorClass, className));

    // Select appropriate Text component
    let TextComponent: typeof RNText | typeof RNAnimated.Text | typeof Reanimated.Text = RNText;

    if (isAnimated) {
        TextComponent =
            animationLibrary === "reanimated" ? Reanimated.Text : RNAnimated.Text;
    }
    return (
        <TextComponent {...props} className={mergedClass} style={style} allowFontScaling={false}>
            {children}
        </TextComponent>
    );
};

export default AppText;