import {useState, useCallback, useRef, useEffect} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {CropView} from 'react-native-image-crop-tools';
import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import { screenHeight, screenWidth } from '../utils/constant';

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onCropComplete: (croppedImageUri: string) => void;
  onCancel: () => void;
  aspectRatio?: {width: number; height: number};
  keepAspectRatio?: boolean;
  quality?: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
  title?: string;
}

interface CropResponse {
  uri: string;
  width: number;
  height: number;
}

function normalizeUri(uri: string): string {
  if (!uri) return uri;
  if (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
  ) {
    return uri;
  } else if (Platform.OS === 'android' && uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
}

export default function ImageCropModal({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
  aspectRatio,
  keepAspectRatio,
  quality = 0.8,
  title,
}: ImageCropModalProps) {
  const cropViewRef = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize the image URI for consistent handling across platforms
  const normalizedImageUri = imageUri ? normalizeUri(imageUri) : null;

  /**
   * Handles the image crop callback from CropView
   */
  const handleImageCrop = useCallback(
    (response: CropResponse) => {
      if (response && response.uri) {
        setIsProcessing(false);
        // Normalize the URI before passing it back
        const normalizedUri = normalizeUri(response.uri);
        onCropComplete(normalizedUri);
      } else {
        setIsProcessing(false);
        Alert.alert('Error', 'Failed to crop image');
      }
    },
    [onCropComplete],
  );

  /**
   * Triggers the save operation on the CropView
   */
  const handleSave = useCallback(() => {
    if (cropViewRef.current) {
      setIsProcessing(true);
      try {
        // Convert quality from 0-1 to 0-100
        const qualityPercent = Math.round(quality * 100);
        cropViewRef.current.saveImage(false, qualityPercent);
      } catch (error) {
        console.error('Save error:', error);
        setIsProcessing(false);
        Alert.alert('Error', 'Failed to save cropped image');
      }
    }
  }, [quality]);

  /**
   * Rotates the image clockwise
   */
  const handleRotate = useCallback(() => {
    if (cropViewRef.current && !isProcessing) {
      cropViewRef.current.rotateImage(true);
    }
  }, [isProcessing]);

  /**
   * Handles the cancel operation
   */
  const handleCancel = useCallback(() => {
    if (!isProcessing) {
      onCancel();
    }
  }, [isProcessing, onCancel]);

  // Reset processing state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsProcessing(false);
    }
  }, [visible]);

  if (!visible || !normalizedImageUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCancel}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="pt-12 px-5 pb-4 bg-black border-b border-gray-800">
          <View className="flex-row justify-between items-center">
            <AppText className="text-white text-lg font-semibold">
              {title}
            </AppText>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-lg ${
                isProcessing ? 'bg-gray-600' : 'bg-red-500'
              }`}
              activeOpacity={0.7}>
              <AppText className="text-white font-semibold">Cancel</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Crop View */}
        <View className="flex-1 justify-center items-center">
          <CropView
            ref={cropViewRef}
            sourceUrl={normalizedImageUri || ''}
            style={{
              width: screenWidth,
              height: screenHeight - 200,
            }}
            onImageCrop={handleImageCrop}
            keepAspectRatio={keepAspectRatio}
            aspectRatio={aspectRatio}
          />
        </View>

        {/* Bottom Controls */}
        <View className="px-5 pb-8 bg-black border-t border-gray-800">
          {/* Instructions */}
          <View className="mb-4 pt-3">
            <AppText className="text-gray-400 text-center text-sm">
              Pinch to zoom • Drag to reposition • Adjust the crop area
            </AppText>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            {/* Rotate Button */}
            <TouchableOpacity
              onPress={handleRotate}
              disabled={isProcessing}
              className={`flex-1 py-4 rounded-xl items-center justify-center border-2 ${
                isProcessing
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-900 border-gray-700'
              }`}
              activeOpacity={0.7}>
              <View className="flex-row items-center gap-2">
                <AppIcon
                  type="materialIcons"
                  name="rotate-right"
                  size={20}
                  color="white"
                />
                <AppText className="text-white text-base font-semibold">
                  Rotate
                </AppText>
              </View>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isProcessing}
              className={`flex-[2] py-4 rounded-xl items-center justify-center ${
                isProcessing ? 'bg-blue-600' : 'bg-blue-500'
              }`}
              activeOpacity={0.8}>
              <View className="flex-row items-center gap-2">
                {isProcessing ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <AppText className="text-white text-base font-semibold">
                      Processing...
                    </AppText>
                  </>
                ) : (
                  <>
                    <AppIcon
                      type="materialIcons"
                      name="check"
                      size={20}
                      color="white"
                    />
                    <AppText className="text-white text-base font-semibold">
                      Confirm Crop
                    </AppText>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};