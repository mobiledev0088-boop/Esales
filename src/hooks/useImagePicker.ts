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
  selectionLimit?: number; // Only applies to gallery, not camera
}

interface UseImagePickerReturn {
  imageUris: string[];
  imageDatas: ImagePickerResult[];
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
    selectionLimit = 1,
  } = options;

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [imageDatas, setImageDatas] = useState<ImagePickerResult[]>([]);
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
          // Gallery permissions
          hasPermission = await requestLibraryPermission();
          if (!hasPermission && isIOS) {
            // Only show alert on iOS, Android may not need explicit permission
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
          // Camera always selects single image
          response = await launchCamera(pickerOptions);
        } else {
          // Gallery can select multiple images based on selectionLimit
          response = await launchImageLibrary({
            ...pickerOptions,
            selectionLimit: selectionLimit,
          });
        }

        // Handle response
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        } else if (response.assets && response.assets.length > 0) {
          // Convert all assets to results
          const results = response.assets.map(asset => convertAssetToResult(asset));
          setImageDatas(results);

          // Crop is only supported for single image selection
          if (enableCrop && results.length === 1) {
            console.log('Setting temp URI and showing crop modal');
            setTempImageUri(results[0].uri);
            // Add delay for iOS to allow native picker to fully dismiss
            if (Platform.OS === 'ios') {
              setTimeout(() => {
                setShowCropModal(true);
              }, 500);
            } else {
              setShowCropModal(true);
            }
          } else {
            // Process all images with watermark if needed
            if (watermarkText) {
              const watermarkedUris = await Promise.all(
                results.map(result => addWatermarkIfNeeded(result.uri, watermarkText))
              );
              setImageUris(watermarkedUris);
            } else {
              setImageUris(results.map(result => result.uri));
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
    [quality, maxWidth, maxHeight, mediaType, enableCrop, watermarkText, selectionLimit],
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
        setImageUris([watermarkedUri]);
      } else {
        setImageUris([normalizedUri]);
      }
      setShowCropModal(false);
      setTempImageUri(null);
    },
    [watermarkText],
  );

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setTempImageUri(null);
    setImageDatas([]);
  }, []);

  const reset = useCallback(() => {
    setImageUris([]);
    setImageDatas([]);
    setIsLoading(false);
    setShowCropModal(false);
    setTempImageUri(null);
  }, []);

  return {
    imageUris,
    imageDatas,
    isLoading,
    showCropModal,
    tempImageUri,
    pickImage: pickImageInternal,
    handleCropComplete,
    handleCropCancel,
    reset,
  };
}
