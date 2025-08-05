import FastImage, { FastImageProps, Source } from '@d11/react-native-fast-image';

import { memo, useRef } from 'react';
import { View, StyleProp, ViewStyle, Image } from 'react-native';
import { ResumableZoom, ResumableZoomRefType, } from 'react-native-zoom-toolkit';

/**
 * Props interface for the AppImage component
 * Extends FastImageProps but omits the 'source' prop to provide our own type definition
 */
type AppImageProps = Omit<FastImageProps, 'source'> & {
  /** Image source - can be a FastImage Source object or a local require() number */
  source: Source | number;
  /** Whether the image should be zoomable with pinch-to-zoom functionality */
  zoomable?: boolean;
  /** Custom styles for the container View wrapping the image */
  containerStyle?: StyleProp<ViewStyle>;
  /** Custom styles for the FastImage component */
  className?: string;
};

const AppImage = memo(({
  source,
  zoomable = false,
  containerStyle,
  style,
  resizeMode,
  className,
  ...restProps
}: AppImageProps) => {
  // Reference to the ResumableZoom component for programmatic control
  const zoomRef = useRef<ResumableZoomRefType>(null);

  // Core FastImage component with all the image-specific props
  const ImageComponent = (
    <FastImage
      source={source}
      style={style}
      resizeMode={resizeMode ?? FastImage.resizeMode.cover}
      {...restProps}
    />
  );

  // Render zoomable version if zoom functionality is enabled
  if (zoomable) {
    return (
      <View style={containerStyle}>
        <ResumableZoom
          ref={zoomRef}
          maxScale={3} // Maximum zoom level (3x)
          minScale={1} // Minimum zoom level (1x - original size)
        >
          {ImageComponent}
        </ResumableZoom>
      </View>
    );
  }

  // Render standard non-zoomable image
  return (
    <View style={containerStyle}>
      {ImageComponent}
    </View>
  );
});

export default AppImage;
