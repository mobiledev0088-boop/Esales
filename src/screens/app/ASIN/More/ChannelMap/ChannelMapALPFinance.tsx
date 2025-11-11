import {useEffect, useState, useMemo, useCallback, memo} from 'react';
import {View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {getDeviceId} from 'react-native-device-info';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import {showConfirmationSheet} from '../../../../../components/ConfirmationSheet';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {AppNavigationParamList, AppNavigationProp} from '../../../../../types/navigation';
import {FinancerData} from './ChannelMapTypes';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {showToast} from '../../../../../utils/commonFunctions';

const FINANCER_CONFIG = {
  codeForBAJAJ: {
    label: 'Bajaj',
    dealerCodeKey: 'BajajDealerCode',
    activationStatusKey: 'BajajActivationStatus',
    activationRemarksKey: 'BajajActivation_Remarks',
    hoAcceptanceStatusKey: 'BajajHOAccpetenceStatus',
    hoAcceptanceRemarkKey: 'BajajHOAccpetenceRemark',
  },
  codeForKotak: {
    label: 'Kotak',
    dealerCodeKey: 'KotakDealerCode',
    activationStatusKey: 'KotakActivationStatus',
    activationRemarksKey: 'KotakActivation_Remarks',
    hoAcceptanceStatusKey: 'KotakHOAccpetenceStatus',
    hoAcceptanceRemarkKey: 'KotakHOAccpetenceRemark',
  },
  codeForShopse: {
    label: 'Shopse',
    dealerCodeKey: 'ShopseDealerCode',
    activationStatusKey: 'SHopseActivationStatus',
    activationRemarksKey: 'SHopseActivation_Remarks',
    hoAcceptanceStatusKey: 'SHopseHOAccpetenceStatus',
    hoAcceptanceRemarkKey: 'SHopseHOAccpetenceRemark',
  },
  codeForPayTM: {
    label: 'PayTM',
    dealerCodeKey: 'PaytmDealerCode',
    activationStatusKey: 'PaytmActivationStatus',
    activationRemarksKey: 'PaytmActivation_Remarks',
    hoAcceptanceStatusKey: 'PaytmHOAccpetenceStatus',
    hoAcceptanceRemarkKey: 'PaytmHOAccpetenceRemark',
  },
  codeForHDB: {
    label: 'HDB',
    dealerCodeKey: 'HDBDealerCode',
    activationStatusKey: 'HDBActivationStatus',
    activationRemarksKey: 'HDBActivation_Remarks',
    hoAcceptanceStatusKey: 'HDBHOAccpetenceStatus',
    hoAcceptanceRemarkKey: 'HDBHOAccpetenceRemark',
  },
  codeForHDFC: {
    label: 'HDFC',
    dealerCodeKey: 'HDFCDealerCode',
    activationStatusKey: 'HDFCActivationStatus',
    activationRemarksKey: 'HDFCActivation_Remarks',
    hoAcceptanceStatusKey: 'HDFCHOAccpetenceStatus',
    hoAcceptanceRemarkKey: 'HDFCHOAccpetenceRemark',
  },
} as const;

type FormKeys = keyof typeof FINANCER_CONFIG;

type FormData = Record<FormKeys, string>;

type ErrorMessages = Record<string, string>;

interface SubmitPayload {
  UserName: string;
  PartnerCode: string;
  BajajDealerCode: string;
  KotakDealerCode: string;
  PinelabsDealerCode: string;
  ShopseDealerCode: string;
  PaytmDealerCode: string;
  HDBDealerCode: string;
  HDFCDealerCode: string;
  MachineName: string;
}

enum FieldStatus {
  REJECTED = 'red',
  APPROVED = 'green',
  IN_PROCESS = 'gray',
}

const INITIAL_FORM_DATA: FormData = {
  codeForBAJAJ: '',
  codeForKotak: '',
  codeForShopse: '',
  codeForPayTM: '',
  codeForHDB: '',
  codeForHDFC: '',
};

const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  RE_ENTER: 'Please re-enter the dealer code',
} as const;


const createSubmitPayload = (
  formData: FormData,
  reCodeFormData: FormData,
  userCode: string,
  partnerCode: string,
  deviceId: string,
): SubmitPayload => ({
  UserName: userCode,
  PartnerCode: partnerCode,
  BajajDealerCode: reCodeFormData.codeForBAJAJ || formData.codeForBAJAJ,
  KotakDealerCode: reCodeFormData.codeForKotak || formData.codeForKotak,
  PinelabsDealerCode: '',
  ShopseDealerCode: reCodeFormData.codeForShopse || formData.codeForShopse,
  PaytmDealerCode: reCodeFormData.codeForPayTM || formData.codeForPayTM,
  HDBDealerCode: reCodeFormData.codeForHDB || formData.codeForHDB,
  HDFCDealerCode: reCodeFormData.codeForHDFC || formData.codeForHDFC,
  MachineName: deviceId,
});

const hasExistingFinancerData = (
  financerDataALP: FinancerData | undefined,
): boolean => {
  if (!financerDataALP) return false;

  return Object.values(FINANCER_CONFIG).some(config => {
    const dealerCode = financerDataALP[config.dealerCodeKey as keyof FinancerData];
    return dealerCode && String(dealerCode).trim().length > 0;
  });
};

const initializeFormData = (financerDataALP: FinancerData): FormData => {
  const updatedFormData = {} as FormData;

  Object.entries(FINANCER_CONFIG).forEach(([key, config]) => {
    const dealerCode = financerDataALP[config.dealerCodeKey as keyof FinancerData];
    updatedFormData[key as FormKeys] = dealerCode ? String(dealerCode) : '';
  });

  return updatedFormData;
};

const useFinancerFields = (financerDataALP: FinancerData | undefined) => {
  const getFinancerField = useCallback(
    (key: FormKeys, fieldType: keyof (typeof FINANCER_CONFIG)[FormKeys]) => {
      if (!financerDataALP) return null;

      const config = FINANCER_CONFIG[key];
      const fieldKey = config[fieldType] as keyof FinancerData;
      return financerDataALP[fieldKey];
    },
    [financerDataALP],
  );
  const getStatusText = useCallback(
    (key: FormKeys): string => {
      const activationRemarks = getFinancerField(key, 'activationRemarksKey') as string;
      const hoRemarks = getFinancerField(key, 'hoAcceptanceRemarkKey') as string;

      if (activationRemarks) return ` - ${activationRemarks}`;
      if (hoRemarks) return ` - ${hoRemarks}`;
      return ' - In Process';
    },
    [getFinancerField],
  );
  const getBackgroundColor = useCallback(
    (key: FormKeys): FieldStatus => {
      const activationStatus = getFinancerField(key, 'activationStatusKey') as boolean;
      const activationRemarks = getFinancerField(key, 'activationRemarksKey') as string;
      const hoStatus = getFinancerField(key, 'hoAcceptanceStatusKey') as boolean;
      const hoRemarks = getFinancerField(key, 'hoAcceptanceRemarkKey') as string;

      // Rejected status
      if (
        (!activationStatus && activationRemarks?.length > 0) ||
        (hoStatus && hoRemarks?.length > 0)
      ) {
        return FieldStatus.REJECTED;
      }

      // Approved status
      if (activationStatus) {
        return FieldStatus.APPROVED;
      }

      // In Process
      return FieldStatus.IN_PROCESS;
    },
    [getFinancerField],
  );
  const isFieldEditable = useCallback(
    (key: FormKeys): boolean => {
      const activationStatus = getFinancerField(key, 'activationStatusKey') as boolean;
      const hoStatus = getFinancerField(key, 'hoAcceptanceStatusKey') as boolean;
      return Boolean(activationStatus) || Boolean(hoStatus);
    },
    [getFinancerField],
  );
  const shouldShowRetypeField = useCallback(
    (key: FormKeys): boolean => {
      const activationStatus = getFinancerField(key, 'activationStatusKey') as boolean;
      const activationRemarks = getFinancerField(key, 'activationRemarksKey') as string;
      return !activationStatus && activationRemarks?.length > 0;
    },
    [getFinancerField],
  );
  return {
    getStatusText,
    getBackgroundColor,
    isFieldEditable,
    shouldShowRetypeField,
  };
};

const useFormValidation = (
  isFirstTime: boolean,
  formData: FormData,
  reCodeFormData: FormData,
  shouldShowRetypeField: (key: FormKeys) => boolean,
) => {
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});

  const clearError = useCallback((key: string) => {
    setErrorMessages(prev => ({...prev, [key]: ''}));
  }, []);

  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newErrorMessages: ErrorMessages = {};

    if (isFirstTime) {
      // Validate all fields are filled on first time
      Object.entries(formData).forEach(([key, value]) => {
        if (!value?.trim()) {
          isValid = false;
          newErrorMessages[key] = VALIDATION_MESSAGES.REQUIRED;
        }
      });
    } else {
      // Validate only retype fields that are visible
      Object.keys(formData).forEach(key => {
        const formKey = key as FormKeys;
        if (shouldShowRetypeField(formKey) && !reCodeFormData[formKey]?.trim()) {
          isValid = false;
          newErrorMessages[key] = VALIDATION_MESSAGES.RE_ENTER;
        }
      });
    }

    setErrorMessages(newErrorMessages);
    return isValid;
  }, [isFirstTime, formData, reCodeFormData, shouldShowRetypeField]);

  return {
    errorMessages,
    validateForm,
    clearError,
  };
};

const FinancerFirstTimeInput: React.FC<{
  formKey: FormKeys;
  value: string;
  label: string;
  error?: string;
  onChangeText: (text: string) => void;
}> = memo(({formKey, value, label, error, onChangeText}) => (
  <AppInput
    value={value}
    size="sm"
    label={label}
    setValue={onChangeText}
    placeholder="Type Dealer Code"
    isOptional
    error={error}
  />
));

FinancerFirstTimeInput.displayName = 'FinancerFirstTimeInput';

const FinancerExistingInput: React.FC<{
  formValue: string;
  label: string;
  statusText: string;
  backgroundColor: FieldStatus;
  isEditable: boolean;
  showRetypeField: boolean;
  reTypeValue: string;
  error?: string;
  onChangeReType: (text: string) => void;
}> = memo(
  ({
    formValue,
    label,
    statusText,
    backgroundColor,
    isEditable,
    showRetypeField,
    reTypeValue,
    error,
    onChangeReType,
  }) => (
    <View>
      <AppInput
        value={`${formValue}${statusText}`}
        size="sm"
        label={label}
        setValue={() => {}}
        placeholder="Type Dealer Code"
        inputClassName='ml-3'
        inputWapperStyle={{backgroundColor}}
        isOptional
        readOnly={!isEditable}
        showClearButton={false}
      />
      {showRetypeField && (
        <AppInput
          value={reTypeValue}
          size="sm"
          setValue={onChangeReType}
          placeholder="Re-Type Dealer Code"
          isOptional
          error={error}
        />
      )}
    </View>
  ),
);

const FinancerFieldRenderer: React.FC<{
  formKey: FormKeys;
  config: typeof FINANCER_CONFIG[FormKeys];
  isFirstTime: boolean;
  formValue: string;
  reCodeValue: string;
  error?: string;
  statusText: string;
  backgroundColor: FieldStatus;
  isEditable: boolean;
  showRetypeField: boolean;
  onUpdateFormField: (value: string) => void;
  onUpdateReCodeField: (value: string) => void;
}> = memo(
  ({
    formKey,
    config,
    isFirstTime,
    formValue,
    reCodeValue,
    error,
    statusText,
    backgroundColor,
    isEditable,
    showRetypeField,
    onUpdateFormField,
    onUpdateReCodeField,
  }) => (
    <View key={formKey}>
      {isFirstTime ? (
        <FinancerFirstTimeInput
          formKey={formKey}
          value={formValue}
          label={config.label}
          error={error}
          onChangeText={onUpdateFormField}
        />
      ) : (
        <FinancerExistingInput
          formValue={formValue}
          label={config.label}
          statusText={statusText}
          backgroundColor={backgroundColor}
          isEditable={isEditable}
          showRetypeField={showRetypeField}
          reTypeValue={reCodeValue}
          error={error}
          onChangeReType={onUpdateReCodeField}
        />
      )}
    </View>
  ),
);

export default function ChannelMapALPFinance() {
  // ========== navigation & Route & Store ==========
  const navigation = useNavigation<AppNavigationProp>();
  const {params} = useRoute<RouteProp<AppNavigationParamList, 'ChannelMapALPFinance'>>();
  const {financerDataALP, ALPpartnerCode} = params;
  const userInfo = useLoginStore(state => state.userInfo);
  const queryClient = useQueryClient();

  // ========== State ==========
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [reCodeFormData, setReCodeFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // ========== Custom Hooks ==========
  const {getStatusText, getBackgroundColor, isFieldEditable, shouldShowRetypeField} =
    useFinancerFields(financerDataALP);

  const {errorMessages, validateForm, clearError} = useFormValidation(
    isFirstTime,
    formData,
    reCodeFormData,
    shouldShowRetypeField,
  );

  // ========== API Mutation ==========
  const {mutate: submitFinanceMapping, isPending} = useMutation({
    mutationFn: async (data: SubmitPayload) => {
      const response = await handleASINApiCall(
        '/ALPFinanceMapping/GetFinanceMapping_Insert',
        data,
      );
      const result = response?.DashboardData;

      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to submit dealer codes');
      }

      return result;
    },
    onSuccess: () => {
      showToast('Dealer codes submitted successfully!');
      // Invalidate the ALP details query to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['ALPDetails', userInfo?.EMP_Code, userInfo?.EMP_RoleId, ALPpartnerCode],
      });
      navigation.goBack();
    },
    onError: (error: Error) => {
      showToast(`Error: ${error.message}`);
    },
  });

  // ========== Memoized Values ==========
  const hasEditableFields = useMemo((): boolean => {
    if (isFirstTime) return true;

    return Object.keys(formData).some(key => {
      const formKey = key as FormKeys;
      return isFieldEditable(formKey) || shouldShowRetypeField(formKey);
    });
  }, [isFirstTime, formData, isFieldEditable, shouldShowRetypeField]);

  // ========== Callbacks ==========
  const updateFormField = useCallback(
    (key: FormKeys, value: string) => {
      setFormData(prev => ({...prev, [key]: value}));
      clearError(key);
    },
    [clearError],
  );

  const updateReCodeField = useCallback(
    (key: FormKeys, value: string) => {
      setReCodeFormData(prev => ({...prev, [key]: value}));
      clearError(key);
    },
    [clearError],
  );

  const handleSubmit = useCallback(() => {
    const payload = createSubmitPayload(
      formData,
      reCodeFormData,
      userInfo?.EMP_Code || '',
      ALPpartnerCode || '',
      getDeviceId(),
    );

    submitFinanceMapping(payload);
  }, [formData, reCodeFormData, userInfo, ALPpartnerCode, submitFinanceMapping]);

  const handleConfirmation = useCallback(() => {
    if (!validateForm()) return;

    showConfirmationSheet({
      title: 'Submit Dealer Codes',
      message: 'Are you sure you want to submit the dealer codes?',
      confirmText: 'Yes, Submit',
      cancelText: 'Cancel',
      onConfirm: handleSubmit,
    });
  }, [validateForm, handleSubmit]);

  // ========== Effects ==========
  useEffect(() => {
    if (!financerDataALP) return;

    const hasExistingData = hasExistingFinancerData(financerDataALP);

    if (hasExistingData) {
      setIsFirstTime(false);
      const initializedData = initializeFormData(financerDataALP);
      setFormData(initializedData);
    }
  }, [financerDataALP]);

  // ========== Render ==========
  return (
    <AppLayout title="ALP Finance Map" needBack needPadding>
      <View className="mt-4 gap-3">
        {(Object.keys(formData) as FormKeys[]).map(formKey => {
          const config = FINANCER_CONFIG[formKey];

          return (
            <FinancerFieldRenderer
              key={formKey}
              formKey={formKey}
              config={config}
              isFirstTime={isFirstTime}
              formValue={formData[formKey]}
              reCodeValue={reCodeFormData[formKey]}
              error={errorMessages[formKey]}
              statusText={getStatusText(formKey)}
              backgroundColor={getBackgroundColor(formKey)}
              isEditable={isFieldEditable(formKey)}
              showRetypeField={shouldShowRetypeField(formKey)}
              onUpdateFormField={text => updateFormField(formKey, text)}
              onUpdateReCodeField={text => updateReCodeField(formKey, text)}
            />
          );
        })}

        {hasEditableFields && (
          <AppButton
            className="mt-4 my-4 rounded"
            title={isPending ? 'Submitting...' : 'Submit'}
            onPress={handleConfirmation}
            disabled={isPending}
          />
        )}
      </View>
    </AppLayout>
  );
}