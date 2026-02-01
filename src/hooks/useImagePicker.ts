import {useState, useCallback} from 'react';
import {Alert, Platform} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import ImageMarker, {ImageFormat, Position, TextBackgroundType} from 'react-native-image-marker';
import { isIOS } from '../utils/constant';

type ImageSource = 'camera' | 'gallery';

interface ImagePickerResult {
  uri: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  type?: string;
}

interface UseImagePickerOptions {
  enableCrop?: boolean;
  quality?: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
  watermarkText?: string | null;
  maxWidth?: number;
  maxHeight?: number;
  showSourceSelector?: boolean;
  mediaType?: 'photo' | 'video' | 'mixed';
  aspectRatio?: {width: number; height: number};
  keepAspectRatio?: boolean;
}

interface UseImagePickerReturn {
  imageUri: string | null;
  imageData: ImagePickerResult | null;
  isLoading: boolean;
  showCropModal: boolean;
  tempImageUri: string | null;
  pickImage: (source?: ImageSource) => Promise<void>;
  handleCropComplete: (croppedUri: string) => void;
  handleCropCancel: () => void;
  reset: () => void;
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

async function requestCameraPermission() {
  try {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    });

    if (!permission) return false;
    const result = await check(permission);

    if (result === RESULTS.GRANTED) return true;

    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }

    return false;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

async function requestLibraryPermission() {
  try {
    const androidVersion =
      typeof Platform.Version === 'number'
        ? Platform.Version
        : parseInt(Platform.Version as string, 10);
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
      android:
        androidVersion >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    });

    if (!permission) return false;

    const result = await check(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }

    return false;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

async function addWatermarkIfNeeded(
  uri: string,
  watermarkText?: string | null,
): Promise<string> {
  try {
    if (!watermarkText || watermarkText.trim().length === 0) {
      return uri;
    }
    const filename = 'watermarked_image_' + Date.now();
    const watermarkedImage = await ImageMarker.markText({
      backgroundImage: {
        src: uri,
      },
      watermarkTexts: [
        {
          text: watermarkText,
          position: {
            position: Position.bottomLeft,
          },
          style: {
            textBackgroundStyle: {
              paddingX: 10,
              paddingY: 10,
              color: '#ff000080',
            },
            color: '#FFFFFF',
            fontSize: 42,
            shadowStyle: {
              dx: 2,
              dy: 2,
              radius: 1,
              color: '#000000',
            },
          },
        },
      ],
      filename: filename,
      quality: 100,
      saveFormat: ImageFormat.jpg,
    });

    console.log('Watermarked image path:', watermarkedImage);
    return normalizeUri(watermarkedImage);
  } catch (error) {
    console.error('Error adding watermark:', error);
    return uri;
  }
}

export function useImagePicker(
  options: UseImagePickerOptions = {},
): UseImagePickerReturn {
  const {
    enableCrop = false,
    quality = 0.8,
    watermarkText = null,
    maxWidth = 2000,
    maxHeight = 2000,
    mediaType = 'photo',
  } = options;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImagePickerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Crop modal states
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);

  // Convert Asset to ImagePickerResult
  const convertAssetToResult = (asset: Asset): ImagePickerResult => ({
    uri: normalizeUri(asset.uri || ''),
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
    type: asset.type,
  });

  // Main image picker function
  const pickImageInternal = useCallback(
    async (source: ImageSource = 'gallery') => {
      setIsLoading(true);
      try {
        // Request permissions
        let hasPermission = false;
        if (source === 'camera') {
          hasPermission = await requestCameraPermission();
          if (!hasPermission) {
            Alert.alert(
              'Permission Required',
              'Camera permission is required to take photos.',
            );
            setIsLoading(false);
            return;
          }
        } else {
          if(!isIOS) return;
          hasPermission = await requestLibraryPermission();
          if (!hasPermission) {
            Alert.alert(
              'Permission Required',
              'Photo library permission is required to select images.',
            );
            setIsLoading(false);
            return;
          }
        }

        // Configure image picker options
        const pickerOptions: CameraOptions | ImageLibraryOptions = {
          mediaType: mediaType,
          quality: quality,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          includeBase64: false,
        };

        // Launch appropriate picker
        let response: ImagePickerResponse;
        if (source === 'camera') {
          response = await launchCamera(pickerOptions);
        } else {
          response = await launchImageLibrary({
            ...pickerOptions,
            selectionLimit: 1,
          });
        }

        // Handle response
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error:', response.errorMessage);
          Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const result = convertAssetToResult(asset);

          setImageData(result);

          // If crop is enabled, show crop modal, otherwise set image directly
          if (enableCrop) {
            setTempImageUri(result.uri);
            setShowCropModal(true);
          } else {
            if (watermarkText) {
              const watermarkedUri = await addWatermarkIfNeeded(
                result.uri,
                watermarkText,
              );
              setImageUri(watermarkedUri);
            } else {
              setImageUri(result.uri);
            }
          }
        }
      } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert(
          'Error',
          'An unexpected error occurred while picking the image.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [quality, maxWidth, maxHeight, mediaType],
  );

  const handleCropComplete = useCallback(
    async (croppedUri: string) => {
      // Normalize the cropped URI for Android
      const normalizedUri = normalizeUri(croppedUri);
      if (watermarkText) {
        const watermarkedUri = await addWatermarkIfNeeded(
          normalizedUri,
          watermarkText,
        );
        setImageUri(watermarkedUri);
      } else {
        setImageUri(normalizedUri);
      }
      setShowCropModal(false);
      setTempImageUri(null);
    },
    [watermarkText],
  );

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setTempImageUri(null);
    setImageData(null);
  }, [watermarkText]);

  const reset = useCallback(() => {
    setImageUri(null);
    setImageData(null);
    setIsLoading(false);
    setShowCropModal(false);
    setTempImageUri(null);
  }, []);

  return {
    imageUri,
    imageData,
    isLoading,
    showCropModal,
    tempImageUri,
    pickImage: pickImageInternal,
    handleCropComplete,
    handleCropCancel,
    reset,
  };
}
