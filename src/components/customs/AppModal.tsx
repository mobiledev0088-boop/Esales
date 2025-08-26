import clsx from 'clsx';
import React, { useRef } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';

import {
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {twMerge} from 'tailwind-merge';
import { screenWidth } from '../../utils/constant';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  width?: string | number;
  backgroundOpacity?: number;
  needClose?: boolean;
  needScroll?: boolean;
  blurOFF?: boolean;
}

const AppModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  className,
  width = '90',
  needClose = false,
  needScroll = false,
  blurOFF = false,
  children,
}) => {
  const calculatedWidth = typeof width === 'number' ? width : screenWidth * (parseFloat(width) / 100);

  const mergedClass = twMerge(clsx('bg-white rounded-xl p-4 ', className ?? ''));
  const ModalContent = (
    <View
      className={mergedClass}
      style={{width: calculatedWidth}}>
      {needScroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{flexGrow: 1}}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );

  const logoutActionRef = useRef(() => {});


  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={blurOFF ? undefined : onClose}
      coverScreen={true}
      backdropOpacity={0.5}
      backdropColor="black"
      useNativeDriver={true}
      useNativeDriverForBackdrop={true} 
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
      >
      {needClose && (
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          className="relative top-5 w-11 h-11 rounded-full bg-primary justify-center items-center z-10 self-end">
          <Icon name="close" size={28} color="#fff" />
        </TouchableOpacity>
      )}
        {ModalContent}
    </Modal>
  );
};

export default AppModal;
