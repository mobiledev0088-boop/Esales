import clsx from 'clsx';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import {
    Modal,
    View,
    Dimensions,
    TouchableWithoutFeedback,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { twMerge } from 'tailwind-merge';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    customClass?: string;
    children: React.ReactNode;
    width?: string | number;
    height?: string | number;
    backgroundOpacity?: number;
    needClose?: boolean;
    needScroll?: boolean;
    blurOFF?: boolean;
}

const AppModal: React.FC<CustomModalProps> = ({
    isOpen,
    onClose,
    customClass,
    width = '90',
    height = '40',
    backgroundOpacity = 0.4,
    needClose = false,
    needScroll = false,
    blurOFF = false,
    children,
}) => {
    console.log({ width })
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    const calculatedWidth =
        typeof width === 'number' ? width : windowWidth * (parseFloat(width) / 100);
    const calculatedHeight =
        typeof height === 'number' ? height : windowHeight * (parseFloat(height) / 100);

    const mergedClass = twMerge(clsx('bg-white rounded-xl p-4', customClass ?? ''));
    const ModalContent = (
        <View
            className={mergedClass}
            style={{ width: calculatedWidth, height: calculatedHeight }}
        >
            {needScroll ? <ScrollView
                showsVerticalScrollIndicator={false}
                className='flex-1'
                contentContainerStyle={{ flexGrow: 1 }}>
                {children}
            </ScrollView> : children}

        </View>
    );

    const OverlayContent = (
        <View
            className="flex-1 justify-center items-center"
            style={{ backgroundColor: `rgba(0,0,0,${backgroundOpacity})` }}
        >
            {needClose && (
                <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    className="relative bottom-10 w-11 h-11 rounded-full bg-primary justify-center items-center z-10"
                >
                    <Icon name="close" size={28} color="#fff" />
                </TouchableOpacity>
            )}
            {ModalContent}
        </View>
    );

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            {!blurOFF ? (
                <TouchableWithoutFeedback onPress={onClose}>
                    {OverlayContent}
                </TouchableWithoutFeedback>
            ) : (
                OverlayContent
            )}
        </Modal>
    );
};

export default AppModal;
