import {useEffect, useState, useCallback} from 'react';
import {
  View,
  Platform,
  Alert,
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
import { screenHeight, screenWidth } from '../utils/constant';

type ScanType = 'barcode' | 'qr';
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  /** ---------------- Camera Permission ---------------- */
  const askForPermission = useCallback(async () => {
    const perm = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    });
    if (!perm) return;

    const status = await check(perm);

    if (status === RESULTS.GRANTED) {
      setHasPermission(true);
    } else if (status === RESULTS.BLOCKED) {
      Alert.alert(
        'Camera Access Required',
        'Please enable camera access from Settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => openSettings()},
        ],
      );
      setHasPermission(false);
    } else {
      const req = await request(perm);
      setHasPermission(req === RESULTS.GRANTED);
    }
  }, []);

  useEffect(() => {
    askForPermission();
  }, [askForPermission]);

  /** ---------------- Open Camera & OCR ---------------- */
  const openCamera = useCallback(async () => {
    setError(null);

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
    });

    if (result.didCancel || !result.assets?.length) {
      return;
    }

    const uri = result.assets[0].uri;
    if (!uri) {
      return;
    }

    setProcessing(true);

    try {
      const ocrResult = await TextRecognition.recognize(uri);

      const serialText = findSerialNumber(ocrResult.blocks as any[]);

      if (serialText) {
        if (onCodeScanned) {
          onCodeScanned(serialText);
        }
        closeScanner();
      } else {
        setError('S/N not found. Please retake the photo.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to recognize text');
    } finally {
      setProcessing(false);
    }
  }, [closeScanner, onCodeScanned]);

  // Automatically open camera when scanner modal opens and permission is granted
  useEffect(() => {
    // Reset auto-open flag when scanner closes
    if (!isScannerOpen) {
      if (hasAutoOpened) {
        setHasAutoOpened(false);
      }
      return;
    }

    // Auto-open only once per open cycle when permission is granted
    if (isScannerOpen && hasPermission === true && !processing && !hasAutoOpened) {
      setHasAutoOpened(true);
      openCamera();
    }
  }, [isScannerOpen, hasPermission, processing, hasAutoOpened, openCamera]);


  /** ---------------- Loader & Error States ---------------- */
  if (hasPermission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-5">
        <ActivityIndicator size="large" color="#007AFF" />
        <AppText className="text-white mt-3">Checking camera permissions...</AppText>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-5">
        <AppText className="text-white text-center mb-4">
          Camera access is required to scan codes.
        </AppText>
        <TouchableOpacity
          className="bg-blue-500 px-5 py-3 rounded-lg"
          onPress={() => openSettings()}>
          <AppText className="text-white text-base">Open Settings</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  /** ---------------- Main UI ---------------- */
  return (
    <AppModal isOpen={isScannerOpen} onClose={closeScanner} noCard>
      <View
        style={{width: screenWidth, height: screenHeight}}
        className="bg-black items-center justify-center px-6">
        {/* Close Button */}
        <TouchableOpacity
          className="absolute top-10 right-5 bg-black/60 p-3 rounded-full"
          onPress={closeScanner}>
          <AppIcon type="feather" name="x" size={24} color="white" />
        </TouchableOpacity>

        {processing ? (
          <>
            <ActivityIndicator size="large" color="#fff" />
            <AppText className="text-white mt-4 text-lg">
              Scanning image…
            </AppText>
          </>
        ) : (
          <>
            <AppText className="text-white text-xl text-center mb-6">
              Capture the serial number
            </AppText>

            {error ? (
              <AppText className="text-red-400 text-center mb-4">
                {error}
              </AppText>
            ) : null}

            <TouchableOpacity
              onPress={openCamera}
              className="bg-white px-8 py-4 rounded-full">
              <AppText className="text-black text-lg font-semibold">
                Retake Photo
              </AppText>
            </TouchableOpacity>
          </>
        )}

        {/* Instruction */}
        <View className="absolute bottom-8 self-center bg-black/60 px-4 py-3 rounded-md">
          <AppText className="text-white text-base">
            Align the {scanType === 'barcode' ? 'barcode' : 'QR code'} within
            the frame
          </AppText>
        </View>
      </View>
    </AppModal>
  );
};

/**
 * Extracts text that starts with S/N#
 */
function findSerialNumber(blocks: any[]): string | null {
  for (const block of blocks) {
    const text = block.text?.trim();
    if (!text) continue;

    const match = text.match(/^s\/n#\s*(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export default BarcodeScanner;
