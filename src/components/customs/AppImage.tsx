import FastImage, { FastImageProps, Source } from '@d11/react-native-fast-image';
import { memo, useState, useEffect } from 'react';
import { ImageStyle, StyleProp, ViewStyle, TouchableOpacity, View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import Zoomable from '../Zoomable';
import AppModal from './AppModal';
import AppIcon from './AppIcon';
import AppText from './AppText';
import { screenHeight, screenWidth } from '../../utils/constant';

type AppImageProps = Omit<FastImageProps, 'source'> & {
  source: Source | number;
  zoomable?: boolean;
  enableModalZoom?: boolean;
  showSkeleton?: boolean; // New prop to enable/disable skeleton
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
  style?: StyleProp<ImageStyle>;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
};

const AppImage = memo(
  ({
    source,
    zoomable = false,
    enableModalZoom = false,
    showSkeleton = true,
    containerStyle,
    style,
    resizeMode = FastImage.resizeMode.cover,
    className,
    onLoadStart,
    onLoadEnd,
    onLoad,
    ...restProps
  }: AppImageProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const opacity = useSharedValue(0.3);

    // Animated skeleton shimmer effect
    useEffect(() => {
      if (isLoading && showSkeleton) {
        opacity.value = withRepeat(
          withTiming(0.7, { duration: 1000 }),
          -1,
          true
        );
      } else {
        cancelAnimation(opacity);
        opacity.value = 0.3;
      }
    }, [isLoading, showSkeleton]);

    const skeletonStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const handleLoadStart = () => {
      setIsLoading(true);
      onLoadStart?.();
    };

    const handleLoad = (e: any) => {
      setIsLoading(false);
      onLoad?.(e);
    };

    const handleLoadEnd = () => {
      setIsLoading(false);
      onLoadEnd?.();
    };

    const renderSkeleton = () => {
      if (!showSkeleton || !isLoading) return null;

      return (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#E1E9EE',
              borderRadius: 4,
            },
            skeletonStyle,
          ]}
        />
      );
    };

    const image = (
      <View style={[style, { overflow: 'hidden' }]}>
        {renderSkeleton()}
        <FastImage
          source={source}
          style={[style, isLoading && showSkeleton && { opacity: 0 }]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onLoadEnd={handleLoadEnd}
          {...restProps}
        />
      </View>
    );

    // Render modal zoom view
    const renderModalZoom = () => {
      if (!enableModalZoom) return null;

      return (
        <AppModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          animationType="slide" 
          noCard
        >
          <View style={{
            width: screenWidth,
            height: screenHeight,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}>
            {/* Close Button */}
            <TouchableWithoutFeedback onPress={() => setIsModalOpen(false)}>
              <View style={{
                position: 'absolute',
                top: 50,
                right: 20,
                padding: 8,
                borderRadius: 50,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 9999
              }}>
                <AppIcon type="feather" name="x" size={24} color="#fff" />
              </View>
            </TouchableWithoutFeedback>

            {/* Zoomable Image in Modal */}
            <Zoomable
              minScale={1}
              maxScale={4}
              doubleTapScale={2}
              style={{
                width: screenWidth * 0.95,
                height: screenHeight * 0.7,
              }}
            >
              <View style={{ width: screenWidth * 0.95, height: screenHeight * 0.7, overflow: 'hidden' }}>
                {renderSkeleton()}
                <FastImage
                  source={source}
                  style={[
                    { width: screenWidth * 0.95, height: screenHeight * 0.7 },
                    isLoading && showSkeleton && { opacity: 0 }
                  ]}
                  resizeMode="contain"
                  onLoadStart={handleLoadStart}
                  onLoad={handleLoad}
                  onLoadEnd={handleLoadEnd}
                  {...restProps}
                />
              </View>
            </Zoomable>

            {/* Instruction Text */}
            <View style={{
              position: 'absolute',
              bottom: 40,
              alignSelf: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8
            }}>
              <AppText className="text-white text-base">
                Double tap or pinch to zoom
              </AppText>
            </View>
          </View>
        </AppModal>
      );
    };

    // If enableModalZoom is true, wrap the image with touchable to open modal
    if (enableModalZoom) {
      return (
        <>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setIsModalOpen(true)}
            style={containerStyle}
          >
            {image}
            {/* Zoom Icon Overlay */}
            <View style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              padding: 6,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 6
            }}>
              <AppIcon type="feather" name="zoom-in" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          {renderModalZoom()}
        </>
      );
    }

    if (zoomable) {
      const flattenedStyle = Array.isArray(style)
        ? Object.assign({}, ...style)
        : style || {};

      return (
        <Zoomable
          minScale={1}
          maxScale={3}
          doubleTapScale={2}
          style={[
            {
              width: flattenedStyle.width || '100%',
              height: flattenedStyle.height || 300,
            },
            containerStyle,
          ]}
        >
          {image}
        </Zoomable>
      );
    }

    return image;
  },
);

export default AppImage;