import Swiper from 'react-native-swiper';
import AppImage from './customs/AppImage';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from './customs/AppText';

import { View, TouchableOpacity, Dimensions } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { ResizeMode } from '@d11/react-native-fast-image';


export type SwiperItem = {
    image: string;
    link: string;
    helperText?: string;
};

type CustomSwiperProps = {
    data: SwiperItem[];
    width?: number;
    height?: number;
    onPress: (items: SwiperItem) => void;
    show: boolean;
    onClose?: () => void;
    expandImage?: boolean;
    autoplay?: boolean;
    autoplayTimeout?: number;
    dotColor?: string;
    activeDotColor?: string;
    resizeMode?: ResizeMode;
};

const ImageSlider: React.FC<CustomSwiperProps> = ({
    data,
    width = Dimensions.get('window').width,
    height = 200,
    onPress,
    show,
    onClose,
    expandImage = false,
    autoplay = true,
    autoplayTimeout = 3,
    dotColor = '#ccc',
    activeDotColor = '#000',
    resizeMode = 'stretch',
}) => {
    if (!show) return null;

    return (
        <View
            className={twMerge(
                'rounded-lg overflow-hidden relative',
                expandImage && 'z-50'
            )}
            style={{ width, height }}
        >
            {onClose && (
                <TouchableOpacity
                    onPress={onClose}
                    className="absolute top-2 right-2 z-10 bg-white/70 rounded-full p-2"
                >
                    <Icon name="close" size={20} color="#000" />
                </TouchableOpacity>
            )}

            <Swiper
                autoplay={autoplay}
                autoplayTimeout={autoplayTimeout}
                showsPagination
                dotColor={dotColor}
                activeDotColor={activeDotColor}
                removeClippedSubviews={false}
                style={{ flexGrow: 1 }}
                paginationStyle={{ bottom: 10 }}
            >
                {data.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.85}
                        onPress={() => onPress(item)}
                        className="relative"
                    >
                        <AppImage
                            source={{ uri: item.image }}
                            style={{ width: width, height: height }}
                            resizeMode={resizeMode}
                        />
                        {item.helperText && (
                            <View className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded-md">
                                <AppText size='xs' className="text-white">{item.helperText}</AppText>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </Swiper>
        </View>
    );
};

export default ImageSlider;



