import {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  request,
  check,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import {launchCamera} from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import AppModal from './customs/AppModal';
import {screenHeight, screenWidth} from '../utils/constant';

type ScanType = 'barcode' | 'qr';
type ScannerState = 'idle' | 'checking-permission' | 'ready' | 'capturing' | 'processing' | 'error';

interface BarcodeScannerProps {
  isScannerOpen: boolean;
  closeScanner: () => void;
  onCodeScanned?: (code: string) => void;
  scanType?: ScanType;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isScannerOpen,
  closeScanner,
  onCodeScanned,
  scanType = 'barcode',
}) => {
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const isInitializedRef = useRef(false);
  const cameraLaunchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (cameraLaunchTimeoutRef.current) {
        clearTimeout(cameraLaunchTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isScannerOpen) {
      isInitializedRef.current = false;
      setScannerState('idle');
      setErrorMessage('');
      if (cameraLaunchTimeoutRef.current) {
        clearTimeout(cameraLaunchTimeoutRef.current);
        cameraLaunchTimeoutRef.current = null;
      }
    }
  }, [isScannerOpen]);

  /** ---------------- Check Camera Permission ---------------- */
  const checkAndRequestPermission = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setScannerState('checking-permission');

    const perm = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    });

    if (!perm) {
      setScannerState('error');
      setErrorMessage('Platform not supported');
      return;
    }

    try {
      let status = await check(perm);

      // If not granted, request permission
      if (status !== RESULTS.GRANTED && status !== RESULTS.BLOCKED) {
        status = await request(perm);
      }

      if (!isMountedRef.current) return;

      if (status === RESULTS.GRANTED) {
        setHasPermission(true);
        setScannerState('ready');
      } else {
        setHasPermission(false);
        setScannerState('error');
        setErrorMessage('Camera permission denied');
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      setScannerState('error');
      setErrorMessage('Failed to check camera permission');
    }
  }, []);

  // Initialize permission check when modal opens
  useEffect(() => {
    if (isScannerOpen && !isInitializedRef.current) {
      isInitializedRef.current = true;
      checkAndRequestPermission();
    }
  }, [isScannerOpen, checkAndRequestPermission]);

  /** ---------------- Launch Camera & Process Image ---------------- */
  const launchCameraAndProcess = useCallback(async () => {
    if (!isMountedRef.current || scannerState === 'capturing' || scannerState === 'processing') {
      return;
    }

    setScannerState('capturing');
    setErrorMessage('');

    // Small delay for iOS to ensure modal is fully rendered
    if (Platform.OS === 'ios') {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!isMountedRef.current) return;

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        cameraType: 'back',
      });

      if (!isMountedRef.current) return;

      // User cancelled
      if (result.didCancel) {
        setScannerState('idle');
        return;
      }

      // Camera error
      if (result.errorCode) {
        setScannerState('error');
        setErrorMessage(`Camera error: ${result.errorMessage || 'Unknown error'}`);
        return;
      }

      // No image captured
      if (!result.assets || result.assets.length === 0) {
        setScannerState('error');
        setErrorMessage('No image captured. Please try again.');
        return;
      }

      const uri = result.assets[0].uri;
      if (!uri) {
        setScannerState('error');
        setErrorMessage('Invalid image. Please try again.');
        return;
      }

      // Process image with OCR
      setScannerState('processing');

      const ocrResult = await TextRecognition.recognize(uri);

      if (!isMountedRef.current) return;

      const serialText = findSerialNumber(ocrResult.blocks as any[]);

      if (serialText) {
        // Success - close scanner and return result
        onCodeScanned?.(serialText);
        closeScanner();
      } else {
        // No S/N found - show error and allow retry
        setScannerState('error');
        setErrorMessage('S/N not found. Please ensure the serial number is clearly visible.');
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      setScannerState('error');
      setErrorMessage(error?.message || 'Failed to process image. Please try again.');
    }
  }, [scannerState, onCodeScanned, closeScanner]);

  // Auto-launch camera when ready
  useEffect(() => {
    if (scannerState === 'ready' && isScannerOpen && !cameraLaunchTimeoutRef.current) {
      // Use timeout to ensure modal is fully rendered before launching camera
      cameraLaunchTimeoutRef.current = setTimeout(() => {
        cameraLaunchTimeoutRef.current = null;
        launchCameraAndProcess();
      }, Platform.OS === 'ios' ? 500 : 300);
    }

    return () => {
      if (cameraLaunchTimeoutRef.current) {
        clearTimeout(cameraLaunchTimeoutRef.current);
        cameraLaunchTimeoutRef.current = null;
      }
    };
  }, [scannerState, isScannerOpen, launchCameraAndProcess]);

  /** ---------------- Handle Retry ---------------- */
  const handleRetry = useCallback(() => {
    setScannerState('ready');
    setErrorMessage('');
  }, []);

  /** ---------------- Handle Close ---------------- */
  const handleClose = useCallback(() => {
    if (scannerState === 'capturing' || scannerState === 'processing') {
      // Don't close while actively capturing or processing
      return;
    }
    closeScanner();
  }, [scannerState, closeScanner]);

  /** ---------------- Render Modal Content ---------------- */
  const renderContent = () => {
    // Checking permission
    if (scannerState === 'checking-permission' || hasPermission === null) {
      return (
        <>
          <ActivityIndicator size="large" color="#007AFF" />
          <AppText className="text-white mt-4 text-base">
            Checking camera permissions...
          </AppText>
        </>
      );
    }

    // Permission denied
    if (hasPermission === false) {
      return (
        <>
          <AppIcon type="feather" name="camera-off" size={64} color="#FF6B6B" />
          <AppText className="text-white text-center mb-2 text-xl font-semibold mt-6">
            Camera Access Required
          </AppText>
          <AppText className="text-gray-300 text-center mb-6 text-base px-4">
            Please enable camera access in Settings to scan serial numbers.
          </AppText>
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg"
            onPress={() => openSettings()}
            activeOpacity={0.8}>
            <AppText className="text-white text-base font-semibold">
              Open Settings
            </AppText>
          </TouchableOpacity>
        </>
      );
    }

    // Capturing photo
    if (scannerState === 'capturing') {
      return (
        <>
          <ActivityIndicator size="large" color="#ffffff" />
          <AppText className="text-white mt-4 text-base">
            Opening camera...
          </AppText>
        </>
      );
    }

    // Processing image
    if (scannerState === 'processing') {
      return (
        <>
          <ActivityIndicator size="large" color="#ffffff" />
          <AppText className="text-white mt-4 text-lg">
            Scanning image...
          </AppText>
          <AppText className="text-gray-300 mt-2 text-sm">
            Recognizing serial number
          </AppText>
        </>
      );
    }

    // Error state
    if (scannerState === 'error') {
      const isPermissionError = errorMessage.includes('permission');
      
      return (
        <>
          <AppIcon type="feather" name="alert-circle" size={64} color="#FF6B6B" />
          <AppText className="text-white text-center mb-2 text-xl font-semibold mt-6">
            {isPermissionError ? 'Permission Denied' : 'Scan Failed'}
          </AppText>
          <AppText className="text-red-400 text-center mb-6 text-base px-6">
            {errorMessage || 'Something went wrong'}
          </AppText>
          {isPermissionError ? (
            <TouchableOpacity
              className="bg-blue-500 px-6 py-3 rounded-lg"
              onPress={() => openSettings()}
              activeOpacity={0.8}>
              <AppText className="text-white text-base font-semibold">
                Open Settings
              </AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-white px-8 py-4 rounded-full"
              onPress={handleRetry}
              activeOpacity={0.8}>
              <AppText className="text-black text-lg font-semibold">
                Retry
              </AppText>
            </TouchableOpacity>
          )}
        </>
      );
    }

    // Idle state with permission (show retake button)
    if (scannerState === 'idle' && hasPermission) {
      return (
        <>
          <AppIcon type="feather" name="camera" size={64} color="#ffffff" />
          <AppText className="text-white text-center mb-2 text-xl font-semibold mt-6">
            Ready to Scan
          </AppText>
          <AppText className="text-gray-300 text-center mb-6 text-base px-6">
            Tap the button below to open the camera and scan the serial number
          </AppText>
          <TouchableOpacity
            className="bg-blue-500 px-8 py-4 rounded-full"
            onPress={launchCameraAndProcess}
            activeOpacity={0.8}>
            <AppText className="text-white text-lg font-semibold">
              Open Camera
            </AppText>
          </TouchableOpacity>
        </>
      );
    }

    // Ready state (should auto-launch camera)
    return (
      <>
        <ActivityIndicator size="large" color="#ffffff" />
        <AppText className="text-white mt-4 text-base">
          Preparing camera...
        </AppText>
      </>
    );
  };

  /** ---------------- Main UI ---------------- */
  return (
    <AppModal isOpen={isScannerOpen} onClose={handleClose} noCard>
      <View
        style={{width: screenWidth, height: screenHeight}}
        className="bg-black items-center justify-center px-6">
        {/* Close Button */}
        <TouchableOpacity
          className="absolute top-12 right-6 bg-black/70 p-3 rounded-full z-50"
          onPress={handleClose}
          disabled={scannerState === 'capturing' || scannerState === 'processing'}
          activeOpacity={0.8}>
          <AppIcon type="feather" name="x" size={28} color="white" />
        </TouchableOpacity>

        {/* Main Content */}
        {renderContent()}

        {/* Bottom Instructions */}
        {hasPermission && scannerState !== 'checking-permission' && scannerState !== 'error' && (
          <View className="absolute bottom-10 self-center bg-black/70 px-6 py-4 rounded-lg max-w-[90%]">
            <AppText className="text-white text-base text-center">
              {scannerState === 'processing'
                ? 'Please wait...'
                : `Position the ${scanType === 'barcode' ? 'barcode' : 'QR code'} clearly in frame`}
            </AppText>
          </View>
        )}
      </View>
    </AppModal>
  );
};

/**
 * Extracts text that starts with S/N# (case insensitive)
 * Looks for patterns like "S/N#12345" or "s/n# 12345"
 */
function findSerialNumber(blocks: any[]): string | null {
  if (!blocks || !Array.isArray(blocks)) return null;

  for (const block of blocks) {
    const text = block.text?.trim();
    if (!text) continue;

    const match = text.match(/(?:s\/n|sn)#\s*([a-z0-9]+)/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

export default BarcodeScanner;
