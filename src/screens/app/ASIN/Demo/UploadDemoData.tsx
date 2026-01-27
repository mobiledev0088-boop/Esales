import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppLayout from '../../../../components/layout/AppLayout';
import Card from '../../../../components/Card';
import AppInput from '../../../../components/customs/AppInput';
import {useState} from 'react';
import AppIcon from '../../../../components/customs/AppIcon';
import {useThemeStore} from '../../../../stores/useThemeStore';
import {AppColors} from '../../../../config/theme';
import BarcodeScanner from '../../../../components/BarcodeScanner';
import AppButton from '../../../../components/customs/AppButton';
import {useMutation} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {showToast} from '../../../../utils/commonFunctions';
import AppDatePicker from '../../../../components/customs/AppDatePicker';
import moment from 'moment';
import AppText from '../../../../components/customs/AppText';

const useValidateMutation = () => {
  return useMutation({
    mutationFn: async ({
      serialNo1,
      serialNo2,
    }: {
      serialNo1: string;
      serialNo2: string;
    }) => {
      const res = await handleASINApiCall(
        '/DemoForm/GetDemoSerialNoInfo',
        {
          ALP_SerialNo1: serialNo1,
          ALP_SerialNo2: serialNo2,
        },
        {},
        true,
      );
      const result = res.demoFormData;
      if (result.Status) {
        const ssnInfo = result.Datainfo.Table[0];
        return ssnInfo;
      } else {
        throw new Error('No Product Found as per the search');
      }
    },
    onError: (error: any) => {
      showToast(error.message || 'Validation failed');
    },
    onSuccess: data => {
      showToast('Product validated successfully!');
    },
  });
};


export default function UploadDemoData() {
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');

  const {
    mutate: validateSerialNumbers,
    isPending,
    isError,
    error,
  } = useValidateMutation();

  const [formData, setFormData] = useState({
    serialNumber1: 'T2N0CX096057090',
    serialNumber2: 'T2N0CX096064091',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<
    'serialNumber1' | 'serialNumber2' | null
  >(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);


  const openScanner = (inputName: 'serialNumber1' | 'serialNumber2') => {
    setActiveInput(inputName);
    setIsVisible(true);
  };

  const closeScanner = () => setIsVisible(false);

  const handleBarcodeScanned = (code: string) => {
    if (activeInput) {
      setFormData(prev => ({...prev, [activeInput]: code}));
      console.log(`📱 Barcode scanned for ${activeInput}:`, code);
    }
    setIsVisible(false);
  };

  const handleValidate = () => {
    const {serialNumber1, serialNumber2} = formData;

    if (!serialNumber1.trim() || !serialNumber2.trim()) {
      showToast('Please enter both serial numbers');
      console.log('⚠️ Validation skipped: Missing serial numbers');
      return;
    }

    console.log('🚀 Initiating validation...');
    setValidationResult(null);

    validateSerialNumbers(
      {serialNo1: serialNumber1, serialNo2: serialNumber2},
      {
        onSuccess: data => {
          setValidationResult(data);
        },
      },
    );
  };
  return (
    <AppLayout title="Demo upload" needBack>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-5 px-3 pb-6">
          <Card className="border border-slate-200 dark:border-slate-700 gap-y-5">
            <AppInput
              label="Serial Number.1 (Demo Display Unit)"
              value={formData.serialNumber1}
              setValue={value =>
                setFormData(prev => ({...prev, serialNumber1: value}))
              }
              placeholder="Enter or scan serial number"
              leftIcon="search"
              rightIconTsx={
                <TouchableOpacity
                  onPress={() => openScanner('serialNumber1')}
                  className="mr-3 p-2 rounded-lg"
                  style={{
                    backgroundColor: isDarkTheme
                      ? AppColors.dark.primary
                      : '#EBF4FF',
                  }}
                  activeOpacity={0.7}>
                  <AppIcon
                    type="materialIcons"
                    name="qr-code-scanner"
                    size={20}
                    color="#3B82F6"
                  />
                </TouchableOpacity>
              }
              onClear={() => {
                setFormData(prev => ({...prev, serialNumber1: ''}));
                setValidationResult(null);
              }}
            />

            <AppInput
              label="Serial Number. 2 (Stock Unit)"
              value={formData.serialNumber2}
              setValue={value =>
                setFormData(prev => ({...prev, serialNumber2: value}))
              }
              placeholder="Enter or scan serial number"
              leftIcon="search"
              rightIconTsx={
                <TouchableOpacity
                  onPress={() => openScanner('serialNumber2')}
                  className="mr-3 p-2 rounded-lg"
                  style={{
                    backgroundColor: isDarkTheme
                      ? AppColors.dark.primary
                      : '#EBF4FF',
                  }}
                  activeOpacity={0.7}>
                  <AppIcon
                    type="materialIcons"
                    name="qr-code-scanner"
                    size={20}
                    color="#3B82F6"
                  />
                </TouchableOpacity>
              }
              onClear={() => {
                setFormData(prev => ({...prev, serialNumber2: ''}));
                setValidationResult(null);
              }}
            />

            <View className="flex-row justify-end items-center gap-x-3 mb-2">
              <View style={{minWidth: 120}}>
                <AppButton
                  title={isPending ? 'Validating...' : 'Validate'}
                  onPress={handleValidate}
                  disabled={isPending}
                  className="rounded-md"
                  noLoading
                />
              </View>
            </View>
          </Card>

          {/* Date Selection Card */}
          {validationResult && (
            <Card className="mt-4 p-0">
              <TouchableOpacity
                onPress={() => setIsDatePickerVisible(true)}
                className="p-4"
                activeOpacity={0.7}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-3">
                      <AppIcon
                        name="calendar"
                        type="ionicons"
                        size={20}
                        color="#3B82F6"
                      />
                    </View>
                    <View className="flex-1">
                      <AppText size="xs" className="text-gray-500 dark:text-gray-400 mb-0.5">
                        Demo Date
                      </AppText>
                      <AppText size="sm" weight="semibold" className="text-gray-900 dark:text-white">
                        {moment(selectedDate).format('MMM D, YYYY')}
                      </AppText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          )}

          {/* AppDatePicker Component */}
          <AppDatePicker
            mode="date"
            visible={isDatePickerVisible}
            onClose={() => setIsDatePickerVisible(false)}
            initialDate={selectedDate}
            maximumDate={new Date()}
            onDateSelect={date => {
              setSelectedDate(date);
              setIsDatePickerVisible(false);
            }}
            title="Select Demo Date"
          />

          {/* Error State Card */}
          {isError && !isPending && (
            <Card className="mt-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center mr-3">
                  <AppIcon
                    type="materialIcons"
                    name="error"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-red-800 dark:text-red-200 mb-1">
                    Validation Failed
                  </Text>
                  <Text className="text-sm text-red-700 dark:text-red-300">
                    {error?.message ||
                      'Please check the serial numbers and try again'}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {isVisible && (
        <BarcodeScanner
          onCodeScanned={handleBarcodeScanned}
          scanType="barcode"
          isScannerOpen={isVisible}
          closeScanner={closeScanner}
        />
      )}
    </AppLayout>
  );
}