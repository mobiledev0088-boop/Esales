import React, { forwardRef, useImperativeHandle } from 'react';
import { LayoutChangeEvent, ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { runOnJS, runOnUI } from 'react-native-worklets';

type ZoomableMethods = {
  reset: (animated?: boolean) => void;
  zoomTo: (opts: { scale: number; x?: number; y?: number; animated?: boolean }) => void;
  getCurrentTransform: () => { scale: number; translateX: number; translateY: number };
};

export type ZoomableProps = ViewProps & {
  minScale?: number;
  maxScale?: number;
  doubleTapScale?: number;
  children: React.ReactNode;
  rubberBandFactor?: number;
};

const DEFAULTS = {
  minScale: 1,
  maxScale: 4,
  doubleTapScale: 2,
  rubberBandFactor: 0.35,
};

// mark clamp as worklet-safe
const clamp = (v: number, a: number, b: number) => {
  'worklet';
  return Math.max(a, Math.min(b, v));
};

const useBounds = (
  containerW: SharedValue<number>,
  containerH: SharedValue<number>,
  scale: SharedValue<number>,
) => {
  const halfWidth = useSharedValue(0);
  const halfHeight = useSharedValue(0);

  const getLimits = () => {
    'worklet';
    const sw = containerW.value * scale.value;
    const sh = containerH.value * scale.value;
    const limitX = Math.max((sw - containerW.value) / 2, 0);
    const limitY = Math.max((sh - containerH.value) / 2, 0);
    halfWidth.value = limitX;
    halfHeight.value = limitY;
    return { limitX, limitY };
  };

  return { getLimits, halfWidth, halfHeight };
};

const Zoomable = forwardRef<ZoomableMethods, ZoomableProps>((props, ref) => {
  const {
    children,
    minScale = DEFAULTS.minScale,
    maxScale = DEFAULTS.maxScale,
    doubleTapScale = DEFAULTS.doubleTapScale,
    rubberBandFactor = DEFAULTS.rubberBandFactor,
    style,
    ...rest
  } = props;

  const containerW = useSharedValue(0);
  const containerH = useSharedValue(0);
  const scale = useSharedValue(minScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const startScale = useSharedValue(1);
  const startTX = useSharedValue(0);
  const startTY = useSharedValue(0);

  const { getLimits } = useBounds(containerW, containerH, scale);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    containerW.value = width;
    containerH.value = height;
  };

  const applyRubber = (value: number, limit: number) => {
    'worklet';
    if (limit <= 0) return 0;
    if (value > limit) {
      return limit + (value - limit) * rubberBandFactor;
    }
    if (value < -limit) {
      return -limit + (value + limit) * rubberBandFactor;
    }
    return value;
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
      startTX.value = translateX.value;
      startTY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newScale = clamp(startScale.value * e.scale, minScale, maxScale);
      const focalX = e.focalX - containerW.value / 2;
      const focalY = e.focalY - containerH.value / 2;
      const ratioFromStart = newScale / (startScale.value || 1);
      const dx = (focalX - startTX.value) * (1 - ratioFromStart);
      const dy = (focalY - startTY.value) * (1 - ratioFromStart);

      scale.value = newScale;
      translateX.value = applyRubber(startTX.value + dx, getLimits().limitX);
      translateY.value = applyRubber(startTY.value + dy, getLimits().limitY);
    })
    .onEnd(() => {
      'worklet';
      if (scale.value < minScale) {
        scale.value = withSpring(minScale);
      } else if (scale.value > maxScale) {
        scale.value = withSpring(maxScale);
      }
      const { limitX, limitY } = getLimits();
      translateX.value = withSpring(clamp(translateX.value, -limitX, limitX));
      translateY.value = withSpring(clamp(translateY.value, -limitY, limitY));
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startTX.value = translateX.value;
      startTY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (scale.value <= minScale + 1e-3) return;
      const nx = startTX.value + e.translationX;
      const ny = startTY.value + e.translationY;
      const { limitX, limitY } = getLimits();
      translateX.value = applyRubber(nx, limitX);
      translateY.value = applyRubber(ny, limitY);
    })
    .onEnd(() => {
      'worklet';
      const { limitX, limitY } = getLimits();
      translateX.value = withSpring(clamp(translateX.value, -limitX, limitX));
      translateY.value = withSpring(clamp(translateY.value, -limitY, limitY));
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((e) => {
      'worklet';
      const tapX = e.x - containerW.value / 2;
      const tapY = e.y - containerH.value / 2;
      if (scale.value <= minScale + 1e-3) {
        const target = clamp(doubleTapScale, minScale, maxScale);
        const ratioFromNow = target / (scale.value || 1);
        const dx = (tapX - translateX.value) * (1 - ratioFromNow);
        const dy = (tapY - translateY.value) * (1 - ratioFromNow);
        scale.value = withTiming(target, { duration: 220 });
        translateX.value = withTiming(translateX.value + dx, { duration: 220 });
        translateY.value = withTiming(translateY.value + dy, { duration: 220 });
      } else {
        scale.value = withTiming(minScale, { duration: 220 });
        translateX.value = withTiming(0, { duration: 220 });
        translateY.value = withTiming(0, { duration: 220 });
      }
    });

  const composed = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, panGesture),
    doubleTap,
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  }, []);

  useImperativeHandle(ref, () => ({
    reset(animated = true) {
      runOnUI(() => {
        'worklet';
        if (animated) {
          scale.value = withTiming(minScale);
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
        } else {
          scale.value = minScale;
          translateX.value = 0;
          translateY.value = 0;
        }
      })();
    },
    zoomTo({ scale: s, x = 0, y = 0, animated = true }) {
      runOnUI(() => {
        'worklet';
        const target = clamp(s, minScale, maxScale);
        const tapX = x - containerW.value / 2;
        const tapY = y - containerH.value / 2;
        const ratioFromNow = target / (scale.value || 1);
        const dx = (tapX - translateX.value) * (1 - ratioFromNow);
        const dy = (tapY - translateY.value) * (1 - ratioFromNow);
        if (animated) {
          scale.value = withTiming(target);
          translateX.value = withTiming(translateX.value + dx);
          translateY.value = withTiming(translateY.value + dy);
        } else {
          scale.value = target;
          translateX.value = translateX.value + dx;
          translateY.value = translateY.value + dy;
        }
      })();
    },
    getCurrentTransform() {
      return {
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      };
    },
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        {...rest}
        onLayout={onContainerLayout}
        style={[style]}
      >
        <Animated.View style={[{ flex: 1}, animatedStyle]}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

export default Zoomable;
