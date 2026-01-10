import {ScrollView, TouchableOpacity, View} from 'react-native';
import {JSX, memo, useCallback, useEffect, useMemo, useState} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import AppInput from '../../../../../components/customs/AppInput';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import Card from '../../../../../components/Card';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import moment from 'moment';
import {useMutation, useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {convertImageToBase64, formatUnique, showToast} from '../../../../../utils/commonFunctions';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import BarcodeScanner from '../../../../../components/BarcodeScanner';
import {useImagePicker} from '../../../../../hooks/useImagePicker';
import AppImage from '../../../../../components/customs/AppImage';
import clsx from 'clsx';
import AppTabBar from '../../../../../components/CustomTabBar';
import {useNavigation} from '@react-navigation/native';
import {getDeviceId} from 'react-native-device-info';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {queryClient} from '../../../../../stores/providers/QueryProvider';
import { useLoaderStore } from '../../../../../stores/useLoaderStore';

// type ClaimPayload = typeof DemoDataToSend;
type StepId = 1 | 2 | 3;
type ImageKey =
  | 'invoice'
  | 'customerWithUnit'
  | 'boxSerial'
  | 'onlineScreenshot'
  | 'mailConfirmation'
  | 'checkoutPage'
  | 'studentIdCard';

type ClaimImage = {uri?: string; name?: string};

type DropdownValue = AppDropdownItem | null;

type PurchaseMode = 'default' | 'eshopApp' | 'eshopEducation';

interface PurchaseValidationErrors {
  etailer?: string;
  authSeller?: string;
  studentEmail?: string;
  onlineSrp?: string;
  onlineScreenshot?: string;
  educationImages?: string;
}

interface BuildPayloadArgs {
  employeeCode: string;
  formattedToday: string;
  serialNumber: string;
  selectedEtailer: DropdownValue;
  selectedAuthSeller: DropdownValue;
  onlineSrp: string;
  studentEmail: string;
  images: Record<ImageKey, ClaimImage>;
}

interface ValidateSerialStepProps {
  formattedToday: string;
  searchValue: string;
  setSearchValue: (value: string) => void;
  openScanner: () => void;
  clearSearch: () => void;
  onValidate: () => void;
  isDarkTheme: boolean;
  error: string;
}

interface UploadDocumentsStepProps {
  renderUploadCard: (item: {key: ImageKey; label: string}) => JSX.Element;
  handlePrev: () => void;
  handleValidateNext: () => void;
}

interface PurchaseDetailsStepProps {
  formattedToday: string;
  etailerData: AppDropdownItem[];
  etailerLoading: boolean;
  authSellerData: AppDropdownItem[];
  authSellerLoading: boolean;
  selectedEtailer: AppDropdownItem | null;
  setSelectedEtailer: (item: AppDropdownItem | null) => void;
  renderUploadCard: (item: {key: ImageKey; label: string}) => JSX.Element;
  onlineSrp: string;
  setOnlineSrp: (value: string) => void;
  handlePrev: () => void;
  selectedAuthSeller: DropdownValue;
  setSelectedAuthSeller: (item: DropdownValue) => void;
  onChangePurchaseMode: (mode: PurchaseMode) => void;
  studentEmail: string;
  setStudentEmail: (value: string) => void;
  educationUploadsCount: number;
  purchaseErrors: PurchaseValidationErrors;
  submitting: boolean;
  handleSubmit: () => void;
}
interface ValidatePurchaseInput {
  selectedEtailer: DropdownValue;
  selectedAuthSeller: DropdownValue;
  purchaseMode: PurchaseMode;
  studentEmail: string;
  onlineSrp: string;
  images: Record<ImageKey, ClaimImage>;
}

// API Hook

const useGetEtailerList = () => {
  return useQuery({
    queryKey: ['channelFriendlyClaims'],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_ETailerList',
        {},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch data');
      }
      return result?.Datainfo?.ETailerList || [];
    },
    select: data => formatUnique(data, 'AEM_ETailerCode', 'AEM_ETailerName'),
  });
};
const useGetAuthSellerList = (eTailerName: string) => {
  return useQuery({
    queryKey: ['channelFriendlyClaims', eTailerName],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_AuthSellerList',
        {eTailerName},
        {},
        true,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch data');
      }
      return result?.Datainfo?.AuthSellerList || [];
    },
    select: data => formatUnique(data, 'SellerCode', 'SellerName'),
    enabled: Boolean(eTailerName),
  });
};
const useValidateSSNMutation = () => {
  return useMutation({
    mutationFn: async (SSN: string) => {
      const res = await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_ValidateSSN',
        {SSN},
        {},
        true,
      );
      const result = res.DashboardData;
      if (result.Status) {
        return true;
      } else {
        if (result?.Datainfo) {
          const ssnInfo = result.Datainfo.Table[0];
          showToast(ssnInfo.SSN_Status);
        }
        return false;
      }
    },
  });
};

const useCliamInsertMutation = () => {
  return useMutation({
    mutationFn: async (claimData: any) => {
      const res = await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_Insert',
        claimData,
      );
      const result = res.DashboardData;
      if (result.Status) {
        return true;
      } else {
        throw new Error(result?.Message || 'Failed to submit claim');
      }
    },
  });
};

const useSendNotificationMutation = () => {
  return useMutation({
    mutationFn: async ({
      serialNo,
      EMP_Name,
      EMP_Code,
    }: {
      serialNo: string;
      EMP_Name: string;
      EMP_Code: string;
    }) => {
      const res = await handleASINApiCall(
        '/PushNotification/SendChannelFriendlyClaimNotification',
        {
          MsgTitle: `Channel friendly Claim Uploaded by ${EMP_Name}(${EMP_Code})`,
          MsgBody: `Channel Friendly Claim uploaded for SN - ${serialNo} by ${EMP_Name}(${EMP_Code}).\nClick to Check, Verify & Proceed for further process.`,
          EmployeeCode: EMP_Code || '',
          NotificationReceiver: [
            'KN1500008', // EmpCode - Bijal
            'KN1800045', // EmpCode - Neha
            'KN2300021', // EmpCode - Bhavesh
            'KN2200052', // EmpCode - Meet
            'KN2500069', // EmpCode - Ashish
          ],
          NotificationName: 'Channel_Friendly_Claim_Upload',
          NotificationType: 'CHannel_Friendly_Claim',
          HighlitedValue: serialNo,
          MachineName: getDeviceId(),
        },
      );
      const result = res.DashboardData;
      if (result.Status) {
        return true;
      } else {
        throw new Error(result?.Message || 'Failed to send notification');
      }
    },
  });
};

// UTILITY / HELPER FUNCTIONS
const validateSerialNumber = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Serial number is required';
  }
  if (trimmed.length < 15) {
    return 'Serial number must be at least 15 characters';
  }
  return null;
};

const validateDocumentsStep = (
  images: Record<ImageKey, ClaimImage>,
): string | null => {
  const requiredKeys: ImageKey[] = ['invoice', 'customerWithUnit', 'boxSerial'];
  const missing = requiredKeys.filter(key => !images[key]?.uri);

  if (missing.length > 0) {
    return 'Please upload all required images before proceeding';
  }

  return null;
};

const validatePurchaseStep = ({
  selectedEtailer,
  selectedAuthSeller,
  purchaseMode,
  studentEmail,
  onlineSrp,
  images,
}: ValidatePurchaseInput): {
  isValid: boolean;
  errors: PurchaseValidationErrors;
} => {
  const errors: PurchaseValidationErrors = {};

  if (!selectedEtailer) {
    errors.etailer = 'eTailer is required';
  }

  const srp = onlineSrp.trim();
  if (!srp) {
    errors.onlineSrp = 'Online SRP is required';
  } else if (Number.isNaN(Number(srp))) {
    errors.onlineSrp = 'Online SRP must be a valid number';
  }

  if (!images.onlineScreenshot?.uri) {
    errors.onlineScreenshot = 'Online screenshot is required';
  }

  if (selectedEtailer?.value === 'AE') {
    if (purchaseMode === 'eshopEducation') {
      const email = studentEmail.trim();
      if (!email) {
        errors.studentEmail = 'Student email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.studentEmail = 'Enter a valid email address';
      }

      const eduKeys: ImageKey[] = [
        'mailConfirmation',
        'checkoutPage',
        'studentIdCard',
      ];
      const missingEdu = eduKeys.filter(key => !images[key]?.uri);
      if (missingEdu.length > 0) {
        errors.educationImages =
          'All education program screenshots are required';
      }
    } else {
      if (!selectedAuthSeller) {
        errors.authSeller = 'Authorized seller is required';
      }
    }
  } else if (!selectedAuthSeller) {
    errors.authSeller = 'Authorized seller is required';
  }

  const isValid = Object.keys(errors).length === 0;
  return {isValid, errors};
};

const buildClaimPayload = async ({
  employeeCode,
  formattedToday,
  serialNumber,
  selectedEtailer,
  selectedAuthSeller,
  onlineSrp,
  studentEmail,
  images,
}: BuildPayloadArgs) => {
  return {
    PartnerCode: employeeCode, // These values should be filled from login/user store where available.
    UserName: employeeCode,
    MachineName: getDeviceId(),
    EndCustomerInvoiceDate: moment(formattedToday, "DD-MMM-YYYY").format("DD-MM-YYYY"),
    SSN: serialNumber.trim(),
    eTailerDate: moment(formattedToday, "DD-MMM-YYYY").format("DD-MM-YYYY"),
    eTailerName: selectedEtailer?.label ?? '',
    eTailerSellerName: selectedAuthSeller?.label ?? '',
    eTailerSRP: Number(onlineSrp.trim()),
    T2InvoiceCopy: await convertImageToBase64(images.invoice?.uri ?? ''),
    ALPT3InvoiceCopy: await convertImageToBase64(images.customerWithUnit?.uri ?? ''),
    ALPUploadPhotoCopy: await convertImageToBase64(images.customerWithUnit?.uri ?? ''),
    BoxSrNoCopy: await convertImageToBase64(images.boxSerial?.uri ?? ''),
    eTailerUploadScreenshotCopy: await convertImageToBase64(images.onlineScreenshot?.uri ?? ''),
    stdEmail: studentEmail.trim(),
    stdEmailCopy: await convertImageToBase64(images.mailConfirmation?.uri ?? ''),
    couponcodeCopy: await convertImageToBase64(images.checkoutPage?.uri ?? ''),
    stdIdCardCopy: await convertImageToBase64(images.studentIdCard?.uri ?? ''),
  };
};

const countUploadedImages = (
  images: Record<ImageKey, ClaimImage>,
  keys: ImageKey[],
): number =>
  keys.reduce((count, key) => (images[key]?.uri ? count + 1 : count), 0);

const ValidateSerialStep = memo(
  ({
    formattedToday,
    searchValue,
    setSearchValue,
    openScanner,
    clearSearch,
    onValidate,
    isDarkTheme,
    error,
  }: ValidateSerialStepProps) => {
    const scanButtonBg = isDarkTheme ? AppColors.dark.primary : '#EBF4FF';
    return (
      <View className="gap-6">
        <View className="gap-1">
          <AppText
            size="xs"
            weight="semibold"
            className="uppercase tracking-[1px] text-gray-500 dark:text-gray-400">
            T2 Invoice Date
          </AppText>
          <AppText
            size="xl"
            weight="bold"
            className="text-gray-900 dark:text-white">
            {formattedToday}
          </AppText>
          <AppText size="xs" color="gray" className="mt-0.5">
            Date is automatically set to today and cannot be edited.
          </AppText>
        </View>

        <View className="gap-2">
          <AppInput
            label="Serial Number"
            value={searchValue}
            setValue={setSearchValue}
            placeholder="Enter or scan serial number"
            leftIcon="search"
            autoCapitalize="characters"
            autoCorrect={false}
            onClear={clearSearch}
            onSubmitEditing={onValidate}
            error={error}
            returnKeyType="search"
            rightIconTsx={
              <TouchableOpacity
                onPress={openScanner}
                className="mr-3 rounded-lg p-2"
                style={{backgroundColor: scanButtonBg}}
                activeOpacity={0.85}>
                <AppIcon
                  type="materialIcons"
                  name="qr-code-scanner"
                  size={20}
                  color={'#3B82F6'}
                />
              </TouchableOpacity>
            }
          />
          <AppText size="xs" color="gray">
            Scan the QR code on the device or type the serial number manually.
          </AppText>
        </View>
        <TouchableOpacity
          onPress={onValidate}
          activeOpacity={0.9}
          className="rounded-xl bg-blue-600 py-3.5"
          style={{opacity: searchValue ? 1 : 0.85}}
          disabled={!searchValue}>
          <AppText
            weight="semibold"
            className="text-center text-base text-white">
            Validate & Next
          </AppText>
        </TouchableOpacity>
      </View>
    );
  },
);

const UploadDocumentsStep = ({
  renderUploadCard,
  handlePrev,
  handleValidateNext,
}: UploadDocumentsStepProps) => {
  return (
    <View className="gap-4">
      {[
        {key: 'invoice' as ImageKey, label: 'End Customer Invoice Image'},
        {key: 'customerWithUnit' as ImageKey, label: 'End Customer with Unit'},
        {key: 'boxSerial' as ImageKey, label: 'Box Serial No. Photo Copy'},
      ].map(renderUploadCard)}

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handlePrev}
          activeOpacity={0.9}
          className="flex-1 rounded-xl border border-gray-300 py-3.5 dark:border-gray-600">
          <AppText
            weight="semibold"
            className="text-center text-base text-gray-800 dark:text-white">
            Previous
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleValidateNext}
          activeOpacity={0.9}
          className="flex-1 rounded-xl bg-blue-600 py-3.5">
          <AppText
            weight="semibold"
            className="text-center text-base text-white">
            Validate & Next
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const EshopApp = ({
  data,
  selectedSeller,
  onSelectSeller,
  error,
}: {
  data: AppDropdownItem[];
  selectedSeller: AppDropdownItem | null;
  onSelectSeller: (value: AppDropdownItem | null) => void;
  error?: string;
}) => {
  return (
    <View className="mt-5 rounded-md bg-lightBg-base px-3 py-2">
      <AppDropdown
        mode="dropdown"
        data={data}
        selectedValue={selectedSeller?.value ?? null}
        onSelect={onSelectSeller}
        placeholder="Select Authorized Seller"
        label="Authorized Seller"
        required
        zIndex={2000}
      />
      {error ? (
        <AppText size="xs" className="mt-1 text-red-500">
          {error}
        </AppText>
      ) : null}
    </View>
  );
};

const EshopEducationProgram = ({
  renderUploadCard,
  studentEmail,
  setStudentEmail,
  uploadedCount,
  totalCount,
  error,
  imagesError,
}: {
  renderUploadCard: (arg0: {key: ImageKey; label: string}) => JSX.Element;
  studentEmail: string;
  setStudentEmail: (value: string) => void;
  uploadedCount: number;
  totalCount: number;
  error?: string;
  imagesError?: string;
}) => {
  return (
    <View className="mt-5 rounded-md bg-lightBg-base px-3 py-2">
      <AppInput
        value={studentEmail}
        setValue={setStudentEmail}
        inputWapperStyle={{backgroundColor: 'white'}}
        label="Student Email ID"
        placeholder="Enter Student Email ID"
        keyboardType="email-address"
        error={error}
      />
      <ScrollView
        className="mt-4 h-60 w-full"
        horizontal={true}
        scrollEnabled={true}
        contentContainerStyle={{columnGap: 16}}>
        {[
          {
            key: 'mailConfirmation' as ImageKey,
            label: 'Email Confirmation Screenshot',
          },
          {key: 'checkoutPage' as ImageKey, label: 'Checkout Page Screenshot'},
          {
            key: 'studentIdCard' as ImageKey,
            label: 'Student ID Card Screenshot',
          },
        ].map(renderUploadCard)}
      </ScrollView>
      {imagesError ? (
        <AppText size="xs" className="mt-2 text-red-500">
          {imagesError}
        </AppText>
      ) : null}
      <AppText size="xs" color="gray" className="mt-2">
        Please ensure all screenshots are clear and legible for verification.
      </AppText>
      <AppText
        size="sm"
        weight="semibold"
        color="primary"
        className="mt-2 text-center">
        Images Uploaded {uploadedCount}/{totalCount}
      </AppText>
    </View>
  );
};

const CLAIM_STEPS: {id: StepId; label: string}[] = [
  {id: 1, label: 'Validate Serial'},
  {id: 2, label: 'Upload Documents'},
  {id: 3, label: 'Review & Submit'},
];

const ProgressSteps = memo(
  ({currentStep, accent}: {currentStep: StepId; accent: string}) => (
    <View className="mb-2 flex-row items-center justify-between">
      {CLAIM_STEPS.map((step, index) => {
        const active = currentStep === step.id;
        const completed = currentStep > step.id;
        const baseColor = completed || active ? accent : '#CBD5E1';
        return (
          <View key={step.id} className="flex-1 items-center">
            <View className="w-full flex-row items-center">
              <View
                className="h-2 rounded-full"
                style={{
                  flex: 1,
                  backgroundColor: index === 0 ? 'transparent' : baseColor,
                  opacity: index === 0 ? 0 : 0.8,
                }}
              />
              <View
                className="mx-2 h-9 w-9 items-center justify-center rounded-full"
                style={{backgroundColor: baseColor}}>
                <AppText weight="semibold" className="text-white">
                  {step.id}
                </AppText>
              </View>
              <View
                className="h-2 rounded-full"
                style={{
                  flex: 1,
                  backgroundColor:
                    index === CLAIM_STEPS.length - 1
                      ? 'transparent'
                      : baseColor,
                  opacity: index === CLAIM_STEPS.length - 1 ? 0 : 0.8,
                }}
              />
            </View>
            <AppText
              size="xs"
              weight={active ? 'semibold' : 'regular'}
              className="mt-2 text-gray-600 dark:text-gray-300">
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  ),
);

const PurchaseDetailsStep = ({
  formattedToday,
  etailerData,
  etailerLoading,
  authSellerData,
  authSellerLoading,
  selectedEtailer,
  setSelectedEtailer,
  renderUploadCard,
  onlineSrp,
  setOnlineSrp,
  handlePrev,
  selectedAuthSeller,
  setSelectedAuthSeller,
  onChangePurchaseMode,
  studentEmail,
  setStudentEmail,
  educationUploadsCount,
  purchaseErrors,
  submitting,
  handleSubmit,
}: PurchaseDetailsStepProps) => {
  return (
    <View className="gap-5">
      <View className="gap-1">
        <AppText
          size="xs"
          weight="semibold"
          className="uppercase tracking-[1px] text-gray-500 dark:text-gray-400">
          eTailer Date
        </AppText>
        <AppText
          size="xl"
          weight="bold"
          className="text-gray-900 dark:text-white">
          {formattedToday}
        </AppText>
      </View>

      <AppDropdown
        data={etailerData}
        mode="dropdown"
        placeholder={etailerLoading ? 'Loading eTailers...' : 'Select eTailer'}
        label="eTailer Name"
        required
        allowClear
        onClear={() => setSelectedEtailer(null)}
        selectedValue={selectedEtailer?.value ?? null}
        onSelect={setSelectedEtailer}
        zIndex={3000}
      />
      {purchaseErrors.etailer ? (
        <AppText size="xs" className="mt-1 text-red-500">
          {purchaseErrors.etailer}
        </AppText>
      ) : null}
      {selectedEtailer ? (
        selectedEtailer.value === 'AE' ? (
          <View>
            <AppTabBar
              tabs={[
                {
                  name: 'eshop app',
                  label: 'EShop App',
                  component: () => (
                    <EshopApp
                      data={authSellerData}
                      selectedSeller={selectedAuthSeller}
                      onSelectSeller={setSelectedAuthSeller}
                      error={purchaseErrors.authSeller}
                    />
                  ),
                },
                {
                  name: 'eshop education program',
                  label: 'EShop Education Program',
                  component: () => (
                    <EshopEducationProgram
                      renderUploadCard={renderUploadCard}
                      studentEmail={studentEmail}
                      setStudentEmail={setStudentEmail}
                      uploadedCount={educationUploadsCount}
                      totalCount={3}
                      error={purchaseErrors.studentEmail}
                      imagesError={purchaseErrors.educationImages}
                    />
                  ),
                },
              ]}
              onTabChange={tab => {
                if (tab.name === 'eshop education program') {
                  onChangePurchaseMode('eshopEducation');
                } else {
                  onChangePurchaseMode('eshopApp');
                }
              }}
            />
          </View>
        ) : (
          <AppDropdown
            data={authSellerData}
            mode="dropdown"
            placeholder={
              authSellerLoading
                ? 'Loading Sellers...'
                : 'Select Authorized Seller'
            }
            label="Authorized Seller"
            required
            selectedValue={selectedAuthSeller?.value ?? null}
            onSelect={setSelectedAuthSeller}
            zIndex={2000}
          />
        )
      ) : (
        false
      )}

      {purchaseErrors.authSeller ? (
        <AppText size="xs" className="mt-1 text-red-500">
          {purchaseErrors.authSeller}
        </AppText>
      ) : null}

      {renderUploadCard({key: 'onlineScreenshot', label: 'Online Screenshot'})}
      {purchaseErrors.onlineScreenshot ? (
        <AppText size="xs" className="mt-1 text-red-500">
          {purchaseErrors.onlineScreenshot}
        </AppText>
      ) : null}

      <AppInput
        label="Online SRP"
        value={onlineSrp}
        setValue={setOnlineSrp}
        placeholder="Enter Online SRP as per screenshot"
        keyboardType="numeric"
        error={purchaseErrors.onlineSrp}
      />

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handlePrev}
          activeOpacity={0.9}
          className="flex-1 rounded-xl border border-gray-300 py-3.5 dark:border-gray-600">
          <AppText
            weight="semibold"
            className="text-center text-base text-gray-800 dark:text-white">
            Previous
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.9}
          disabled={submitting}
          className="flex-1 rounded-xl bg-green-600 py-3.5"
          style={{opacity: submitting ? 0.7 : 1}}>
          <AppText
            weight="semibold"
            className="text-center text-base text-white">
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ChannelFriendlyClaimsUpload() {
  const navigation = useNavigation();
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');
  const setGlobalLoading = useLoaderStore(state => state.setGlobalLoading);
  const {EMP_Code: employeeCode="",EMP_Name=""} = useLoginStore(state => state.userInfo);
  const {data: etailerData, isLoading: etailerLoading} = useGetEtailerList();
  const {mutate: validateSSN} = useValidateSSNMutation();
  const {mutate: submitClaim, isPending: submitting} = useCliamInsertMutation();
  const {mutate: sendNotification, isPending: sendingNotification} =
    useSendNotificationMutation();

  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [images, setImages] = useState<Record<ImageKey, ClaimImage>>({
    invoice: {},
    customerWithUnit: {},
    boxSerial: {},
    onlineScreenshot: {},
    mailConfirmation: {},
    checkoutPage: {},
    studentIdCard: {},
  });
  const [activeImageKey, setActiveImageKey] = useState<ImageKey | null>(null);
  const [selectedEtailer, setSelectedEtailer] = useState<DropdownValue>(null);
  const [selectedAuthSeller, setSelectedAuthSeller] =
    useState<DropdownValue>(null);
  const {data: authSellerData, isLoading: authSellerLoading} = useGetAuthSellerList(selectedEtailer?.value || '');
  const TimeStemp = moment().format('ddd, DD-MM-YYYY hh:mm: A');
  const watermarkText = `${employeeCode} / ${searchValue}\n${TimeStemp}`;
  const {pickImage, imageUri, imageData, reset} = useImagePicker({watermarkText});
  const [onlineSrp, setOnlineSrp] = useState('');
  const [purchaseErrors, setPurchaseErrors] =
    useState<PurchaseValidationErrors>({});
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('default');
  const [studentEmail, setStudentEmail] = useState('');
  const accent = '#3B82F6';
  const formattedToday = useMemo(() => moment().format('DD-MMM-YYYY'), []);
  const handleChange = useCallback((value: string) => {
    setSearchValue(value);
    setError('');
  }, []);
  const handleValidateNext = useCallback(() => {
    if (currentStep === 2) {
      const validationMessage = validateDocumentsStep(images);
      if (validationMessage) {
        showToast(validationMessage);
        return;
      }
    }
    setCurrentStep(prev => (prev < 3 ? ((prev + 1) as StepId) : prev));
  }, [currentStep, images]);

  const handleSerialValidate = useCallback(() => {
    const validationError = validateSerialNumber(searchValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    validateSSN(searchValue, {
      onSuccess: isValid => {
        if (isValid) {
          showToast('Serial Number validated successfully');
          setCurrentStep(prev => (prev < 3 ? ((prev + 1) as StepId) : prev));
        } else {
          setError('Invalid Serial Number');
        }
      },
      onError: () => {
        setError('Unable to validate serial number. Please try again.');
      },
    });
  }, [searchValue, validateSSN]);
  const openScanner = useCallback(() => setIsScannerOpen(true), []);
  const clearSearch = useCallback(() => {
    setSearchValue('');
    setIsScannerOpen(false);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => (prev > 1 ? ((prev - 1) as StepId) : prev));
  }, []);

  const handleUpload = useCallback(
    (key: ImageKey) => {
      reset();
      setActiveImageKey(key);
      pickImage('camera');
    },
    [pickImage, reset],
  );

  useEffect(() => {
    if (!activeImageKey || !imageUri) return;

    const fallbackName = imageUri.split('/').pop() || 'selected-image.jpg';
    const name = imageData?.fileName || fallbackName;

    setImages(prev => ({
      ...prev,
      [activeImageKey]: {
        uri: imageUri,
        name,
      },
    }));

    setActiveImageKey(null);
  }, [activeImageKey, imageData, imageUri]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const handleBarcodeScanned = useCallback((scannedCode: string) => {
    setSearchValue(scannedCode);
    setIsScannerOpen(false);
  }, []);
  const closeScanner = useCallback(() => setIsScannerOpen(false), []);

  const renderUploadCard = useCallback(
    (item: {key: ImageKey; label: string}) => {
      const file = images[item.key];
      const hasImage = Boolean(file?.uri);
      return (
        <TouchableOpacity
          key={item.key}
          onPress={() => handleUpload(item.key)}
          activeOpacity={0.9}
          className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <View className="mb-3 flex-row items-center justify-between">
            <AppText
              weight="semibold"
              className="text-gray-900 dark:text-white">
              {item.label}
            </AppText>
            <AppIcon
              type="materialIcons"
              name="photo-camera"
              size={22}
              color={accent}
            />
          </View>
          <View
            className={clsx(
              'overflow-hidden rounded-xl  dark:bg-gray-700/50',
              !hasImage &&
                'border-2 border-dashed border-gray-300 dark:border-gray-600',
            )}
            style={{height: 160}}>
            {hasImage ? (
              <AppImage
                source={{uri: file?.uri}}
                style={{width: '100%', height: '100%'}}
                className="h-full w-full"
                resizeMode="cover"
                enableModalZoom
              />
            ) : (
              <View className="flex-1 items-center justify-center gap-3">
                <AppIcon
                  type="materialIcons"
                  name="add-a-photo"
                  size={32}
                  color={accent}
                />
                <AppText size="sm" color="gray">
                  Tap to capture image
                </AppText>
              </View>
            )}
          </View>
          {hasImage && (
            <View className="mt-2 flex-row items-center justify-between">
              <AppText size="xs" color="gray" numberOfLines={1}>
                {'Preview ready'}
              </AppText>
              <AppIcon
                type="materialIcons"
                name="check-circle"
                size={18}
                color="#16A34A"
              />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [accent, handleUpload, images],
  );

  const educationUploadsCount = useMemo(
    () =>
      countUploadedImages(images, [
        'mailConfirmation',
        'checkoutPage',
        'studentIdCard',
      ]),
    [images],
  );

  const handleSubmit = useCallback(async () => {
    const {isValid, errors} = validatePurchaseStep({
      selectedEtailer,
      selectedAuthSeller,
      purchaseMode,
      studentEmail,
      onlineSrp,
      images,
    });

    setPurchaseErrors(errors);

    if (!isValid) {
      showToast('Please correct the highlighted fields');
      return;
    }

    setGlobalLoading(true);
    const payload = await buildClaimPayload({
      employeeCode,
      formattedToday,
      serialNumber: searchValue,
      selectedEtailer,
      selectedAuthSeller,
      onlineSrp,
      studentEmail,
      images,
    });
    console.log('Submitting Claim Payload:', payload);

    submitClaim(payload, {
      onSuccess: () => {
        sendNotification({EMP_Code: employeeCode, EMP_Name, serialNo: searchValue});
        queryClient.invalidateQueries({queryKey: ['rollingFunnelData']});
        showToast('Claim submitted successfully');
        navigation.goBack();
      },
      onError: (error) => {
        console.log('Claim Submission Error:', error);
        showToast('Failed to submit claim. Please try again.');
      },
      onSettled:() =>{
        setGlobalLoading(false);
      },
    });
  }, [
    formattedToday,
    images,
    onlineSrp,
    purchaseMode,
    searchValue,
    selectedAuthSeller,
    selectedEtailer,
    studentEmail,
    submitClaim,
  ]);

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <ValidateSerialStep
          formattedToday={formattedToday}
          searchValue={searchValue}
          setSearchValue={handleChange}
          openScanner={openScanner}
          clearSearch={clearSearch}
          onValidate={handleSerialValidate}
          isDarkTheme={isDarkTheme}
          error={error}
        />
      );
    }
    if (currentStep === 2) {
      return (
        <UploadDocumentsStep
          renderUploadCard={renderUploadCard}
          handlePrev={handlePrev}
          handleValidateNext={handleValidateNext}
        />
      );
    }
    return (
      <PurchaseDetailsStep
        formattedToday={formattedToday}
        etailerData={etailerData || []}
        etailerLoading={etailerLoading}
        authSellerData={authSellerData || []}
        authSellerLoading={authSellerLoading}
        selectedEtailer={selectedEtailer}
        setSelectedEtailer={setSelectedEtailer}
        renderUploadCard={renderUploadCard}
        onlineSrp={onlineSrp}
        setOnlineSrp={setOnlineSrp}
        handlePrev={handlePrev}
        selectedAuthSeller={selectedAuthSeller}
        setSelectedAuthSeller={setSelectedAuthSeller}
        onChangePurchaseMode={setPurchaseMode}
        studentEmail={studentEmail}
        setStudentEmail={setStudentEmail}
        educationUploadsCount={educationUploadsCount}
        purchaseErrors={purchaseErrors}
        submitting={submitting}
        handleSubmit={handleSubmit}
      />
    );
  };

  return (
    <AppLayout title="Upload New Claim" needBack needScroll needPadding>
      <View className="mt-4 gap-4">
        <ProgressSteps currentStep={currentStep} accent={accent} />
        <Card
          className="gap-6 border border-slate-200 dark:border-slate-700"
          noshadow>
          {renderStepContent()}
        </Card>
      </View>
      {isScannerOpen && (
        <BarcodeScanner
          onCodeScanned={handleBarcodeScanned}
          scanType="barcode"
          isScannerOpen={isScannerOpen}
          closeScanner={closeScanner}
        />
      )}
    </AppLayout>
  );
}
