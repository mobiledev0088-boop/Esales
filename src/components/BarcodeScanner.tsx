import { useEffect, useState, useRef } from 'react';
import {
  View,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import {
  request,
  check,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';

type ScanType = 'barcode' | 'qr';

interface BarcodeScannerProps {
  onCodeScanned?: (code: string) => void;
  scanType?: ScanType
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onCodeScanned,
  scanType = 'barcode', // default to barcode
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
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
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
        setHasPermission(false);
      } else {
        const req = await request(perm);
        setHasPermission(req === RESULTS.GRANTED);
      }
    })();
  }, []);

  const onReadCode = (e: any) => {
    if (!scanning) return;
    const { codeFormat, codeStringValue } = e.nativeEvent;

    if (
      (scanType === 'barcode' && codeFormat === 'code-128') ||
      (scanType === 'qr' && codeFormat === 'qr_code')
    ) {
      setScanning(false);
      onCodeScanned?.(codeStringValue);
      Alert.alert('Scanned', codeStringValue, [
        { text: 'OK', onPress: () => setScanning(true) },
      ]);
    }
  };

  const frameSize =
    scanType === 'barcode'
      ? { width: Dimensions.get('window').width * 0.8, height: 80 }
      : { width: 200, height: 200 };

  if (hasPermission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-5">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-white mt-3">Checking camera permissions...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-5">
        <Text className="text-white text-center mb-4">
          Camera access is required to scan codes.
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-5 py-3 rounded-lg"
          onPress={() => openSettings()}
        >
          <Text className="text-white text-base">Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        scanBarcode
        showFrame
        flashMode="on"
        laserColor="red"
        frameColor="white"
        onReadCode={onReadCode}
        barcodeFrameSize={frameSize}
      />
      <View className="absolute bottom-8 self-center bg-black/60 px-4 py-3 rounded-md">
        <Text className="text-white text-base">
          Align the {scanType === 'barcode' ? 'barcode' : 'QR code'} within the frame
        </Text>
      </View>
    </View>
  );
};

export default BarcodeScanner;
