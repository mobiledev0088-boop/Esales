import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  BounceIn,
  BounceOut,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import clsx from 'clsx';
import {twMerge} from 'tailwind-merge';

import Card from '../Card';
import AppIcon from './AppIcon';
import {isIOS, screenHeight, screenWidth} from '../../utils/constant';

type AnimationType = 'fade' | 'bounce' | 'slide';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  
  // Animation props
  animationDuration?: number;
  animationType?: AnimationType;
  
  // Behavior props
  scrollEnabled?: boolean;
  disableOverlayPress?: boolean;
  showCloseButton?: boolean;
  noCard?: boolean;
  
  // Size props
  modalWidth?: number | `${number}%`;
  modalHeight?: number | `${number}%`;
  
  // Style props
  overlayClassName?: string;
  modalStyle?: StyleProp<ViewStyle>;
  cardClassName?: string;
}

// Animation configuration constants
const ANIMATION_CONFIG = {
  fade: {entering: FadeIn, exiting: FadeOut},
  bounce: {entering: BounceIn, exiting: BounceOut},
  slide: {entering: SlideInDown, exiting: SlideOutDown},
} as const;

// Default overlay styles
const overlayBaseStyle = {
  width: screenWidth,
  height: screenHeight,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 998,
} as const;

const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  children,
  animationType = 'slide',
  animationDuration = 300,
  scrollEnabled = false,
  disableOverlayPress = true,
  showCloseButton = false,
  modalWidth = '90%',
  modalHeight,
  noCard = false,
  overlayClassName,
  modalStyle,
  cardClassName,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // Memoized animation configuration
  const animations = useMemo(() => {
    const config = ANIMATION_CONFIG[animationType] ?? ANIMATION_CONFIG.slide;
    return {
      entering: config.entering.duration(animationDuration),
      exiting: config.exiting.duration(animationDuration),
    };
  }, [animationType, animationDuration]);

  // Memoized overlay class name
  const overlayClasses = useMemo(() => twMerge(clsx(overlayClassName, isIOS ? 'pb-8' : 'pb-20')),[overlayClassName]);

  // Memoized animated view style
  const animatedViewStyle = useMemo(() => [
    {width: modalWidth, zIndex: 999},
    scrollEnabled && modalHeight ? {height: modalHeight} : {},
    modalStyle,
  ], [modalWidth, modalHeight, scrollEnabled, modalStyle]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    setIsMounted(false);
    
    if (isIOS) {
      setTimeout(onClose, animationDuration);
    } else {
      onClose();
    }
  }, [onClose, animationDuration]);

  // Optimized overlay press handler
  const handleOverlayPress = useCallback(() => {
    if (!disableOverlayPress) {
      handleClose();
    }
  }, [disableOverlayPress, handleClose]);

  // Effect to manage mount state
  useEffect(() => {
    setIsMounted(isOpen);
  }, [isOpen]);

  // Early return if not mounted
  if (!isMounted) return null;

  // Render close button
  const renderCloseButton = () => {
    if (!showCloseButton) return null;
    
    return (
      <TouchableOpacity
        onPressOut={handleClose}
        activeOpacity={0.7}
        className="relative top-5 w-11 h-11 rounded-full bg-primary justify-center items-center z-10 self-end"
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <AppIcon type="ionicons" name="close" size={28} color="#fff" />
      </TouchableOpacity>
    );
  };

  // Render modal content
  const renderContent = () => {
    if (noCard) return children;

    const content = scrollEnabled ? (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{flex: 1}}
        contentContainerStyle={{flexGrow: 1}}
      >
        {children}
      </ScrollView>
    ) : (
      children
    );

    return <Card className={cardClassName}>{content}</Card>;
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          className={overlayClasses}
          style={[
            overlayBaseStyle,
            !noCard && {
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          {!disableOverlayPress && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={isIOS ? handleOverlayPress : undefined}
              onPressOut={!isIOS ? handleOverlayPress : undefined}
              accessibilityRole="button"
              accessibilityLabel="Close modal overlay"
            />
          )}
          
          <Animated.View
            entering={animations.entering}
            exiting={animations.exiting}
            style={animatedViewStyle}
          >
            {renderCloseButton()}
            {renderContent()}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default AppModal;
