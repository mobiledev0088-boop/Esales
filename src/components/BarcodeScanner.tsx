import {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Platform,
  Alert,
  Text,
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
import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import {ReactNativeScannerView} from '@pushpendersingh/react-native-scanner';
import AppModal from './customs/AppModal';
import { screenHeight, screenWidth } from '../utils/constant';

type ScanType = 'barcode' | 'qr';
interface BarcodeScannerProps {
  isScannerOpen: boolean;
  closeScanner: () => void;
  onCodeScanned?: (code: string) => void;
  scanType?: ScanType;
}

interface BarcodeScannerProps {
  isScannerOpen: boolean;
  closeScanner: () => void;
  onCodeScanned?: (code: string) => void;
  scanType?: 'barcode' | 'qr';
}
const normalizeCodeType = (type: string) => {
  switch (type) {
    case 'org.iso.Code128':
    case 'CODE_128':
      return 'CODE_128';

    case 'org.iso.QRCode':
    case 'QR_CODE':
      return 'QR_CODE';

    default:
      return type;
  }
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isScannerOpen,
  closeScanner,
  onCodeScanned,
  scanType = 'barcode',
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const scannerRef = useRef<any>(null);

  /** ---------------- useEffect ---------------- */
  useEffect(() => {
    askForPermission();
  }, []);

  // Force remount scanner on iOS when opening
  useEffect(() => {
    if (isScannerOpen && Platform.OS === 'ios') {
      setScannerKey(prev => prev + 1);
    }
  }, [isScannerOpen]);

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

  /** ---------------- Barcode Handling ---------------- */
  const handleBarcodeScanned = useCallback(
    (event: any) => {
      const {data, type}: {data: string; type: string} =
        event?.nativeEvent || {};
      const normalizedType = normalizeCodeType(type);
      const isValidType =
        (scanType === 'barcode' && normalizedType === 'CODE_128') ||
        (scanType === 'qr' && normalizedType === 'QR_CODE');
      const isValidRegex = /^[a-zA-Z0-9][a-zA-Z0-9][A-Z].{9,12}$/.test(data);
      if (isValidType && isValidRegex) {
        onCodeScanned?.(data);
      }
    },
    [scanType, onCodeScanned],
  );

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
      <View style={{width:screenWidth,height:screenHeight}}>
        <ReactNativeScannerView
          key={scannerKey}
          ref={scannerRef}
          style={{flex: 1}}
          onQrScanned={handleBarcodeScanned}
          pauseAfterCapture={false}
          showBox
        />

        {/* Close Button */}
        <TouchableOpacity
          className="absolute top-10 right-5 bg-black/60 p-3 rounded-full"
          onPress={closeScanner}>
          <AppIcon type="feather" name="x" size={24} color="white" />
        </TouchableOpacity>

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

export default BarcodeScanner;
