import AppText from './AppText';

import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { AppTextColorType, AppTextSizeType, AppTextWeightType } from '../../types/customs';
import { useLoaderStore } from '../../stores/useLoaderStore';

interface AppButtonProps {
    title: string | React.ReactNode; // Allow string or React node for title
    onPress: () => void;
    className?: string;        // Tailwind classes for the button
    color?: AppTextColorType;
    size?: AppTextSizeType;
    weight?: AppTextWeightType;
}

const AppButton = ({
    title,
    onPress,
    className = '',
    color = 'white',
    size = 'base',
    weight = 'medium',
}: AppButtonProps) => {
    const isLoading = useLoaderStore(state => state.isLoading);
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`bg-[#2d7abc] p-3 rounded-sm items-center ${className}`}
            activeOpacity={0.7}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
        >
            {!isLoading ?
                <AppText
                    className="text-center"
                    color={color}
                    size={size}
                    weight={weight}
                >{title}</AppText>
                :
                <ActivityIndicator size="small" color="#fff" />
            }
        </TouchableOpacity>
    );
};

export default AppButton;

