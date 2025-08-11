import FastImage, {FastImageProps, Source} from '@d11/react-native-fast-image';

import {memo, useMemo, useRef, useState} from 'react';
import {View, StyleProp, ViewStyle, Image} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {ResumableZoom, ResumableZoomRefType} from 'react-native-zoom-toolkit';

type AppImageProps = Omit<FastImageProps, 'source'> & {
  source: Source | number;
  zoomable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
};

const AppImage = memo(
  ({
    source,
    zoomable = false,
    containerStyle,
    style,
    resizeMode,
    className,
    onPinchStart,
    onPinchEnd,
    ...restProps
  }: AppImageProps) => {
    const zoomRef = useRef<ResumableZoomRefType>(null);

    const ImageComponent = (
      <FastImage
        source={source}
        style={style}
        resizeMode={resizeMode ?? FastImage.resizeMode.cover}
        {...restProps}
      />
    );
    // when Zoomable is true you need to give width and height in pixel rather than percentage
    if (zoomable) {
      return (
        <ResumableZoom
          ref={zoomRef}
          maxScale={3} // Maximum zoom level (3x)
          minScale={1} // Minimum zoom level (1x - original size)
          onPinchEnd={() => {
            zoomRef.current?.reset();
            onPinchEnd?.();
          }}
          onGestureEnd={() => {
            const {scale} = zoomRef.current?.getState() || {};
            if(scale && scale === 1) {
              onPinchEnd?.();
            }else if (scale && scale > 1) {
              onPinchStart?.();
            }
          }}
          onPinchStart={onPinchStart}>
          {ImageComponent}
        </ResumableZoom>
      );
    }

    // Render standard non-zoomable image
    return <View style={containerStyle}>{ImageComponent}</View>;
  },
);

export default AppImage;
