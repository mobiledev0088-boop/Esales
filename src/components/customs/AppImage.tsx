import FastImage, { FastImageProps, Source } from '@d11/react-native-fast-image';
import { memo } from 'react';
import { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import Zoomable from '../Zoomable';

type AppImageProps = Omit<FastImageProps, 'source'> & {
  source: Source | number;
  zoomable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
  style?: StyleProp<ImageStyle>; // Better typing for image style
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
};

const AppImage = memo(
  ({
    source,
    zoomable = false,
    containerStyle,
    style,
    resizeMode = FastImage.resizeMode.cover,
    className,
    ...restProps
  }: AppImageProps) => {
    const image = (
      <FastImage
        source={source}
        style={style}
        resizeMode={resizeMode}
        {...restProps}
      />
    );

    if (zoomable) {
      const flattenedStyle = Array.isArray(style)
        ? Object.assign({}, ...style)
        : style || {};

      return (
        <Zoomable
          minScale={1}
          maxScale={3}
          doubleTapScale={3}
          style={{
            width: flattenedStyle.width,
            height: flattenedStyle.height,
          }}
        >
          {image}
        </Zoomable>
      );
    }

    return image;
  },
);

export default AppImage;
