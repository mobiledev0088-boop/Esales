// Edit mode support imports
import {useRoute} from '@react-navigation/native';
// Declare edit hook to avoid path-specific import errors
declare function useEditRollingFunnel(arg: any): { mutate: (v: any, opts?: any) => void; isPending?: boolean };
import {View, TouchableOpacity, BackHandler} from 'react-native';
import AppLayout, {
  AppLayoutRef,
} from '../../../../../components/layout/AppLayout';
import {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppInput from '../../../../../components/customs/AppInput';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import {DatePickerInput} from '../../../../../components/customs/AppDatePicker';
import AppButton from '../../../../../components/customs/AppButton';
import AppIcon from '../../../../../components/customs/AppIcon';
import {
  convertToCapitalized,
  showToast,
} from '../../../../../utils/commonFunctions';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {queryClient} from '../../../../../stores/providers/QueryProvider';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../../types/navigation';
import {showConfirmationSheet} from '../../../../../components/ConfirmationSheet';
import {FormData, ValidationErrors} from './types';
import {
  useAddNewRoolingFunnel,
  useEditRoolingFunnel,
  useGetAccountDropdownList,
  useGetDependentDropdownList,
  useGetDropdownData,
  useGetIndirectAccountList,
} from '../../../../../hooks/queries/rollingFunnel';

const OTHERS = 'OTHERS';

const initialFormData: FormData = {
  // Page 1
  ownerDivision: '',
  accountName: '',
  indirectAccount: '',
  newIndirectPartnerName: '',
  newIndirectPartnerGST: '',
  endCustomer: '',
  newEndCustomerName: '',
  endCustomerTam: '',
  category: '',
  mainIndustry: '',
  standardIndustry: '',
  stage: '',
  winRate: '',
  // Page 2
  productLine: '',
  quotedProduct: '',
  product: '',
  newProduct: '',
  qty: '',
  description: '',
  CRADDate: undefined,
};

export default function AddRollingFunnel() {
  const {EMP_Name: ownerName} = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute() as any; // Access navigation route params
  const editData = route?.params?.editData ?? null; // Existing item if editing
  const isEditMode = Boolean(editData); // Flag to toggle add/edit

  const [formData, setFormData] = useState(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isAddingNewIndirect, setIsAddingNewIndirect] = useState(false);
  const [isAddingNewEndCustomer, setIsAddingNewEndCustomer] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNewModel, setIsAddingNewModel] = useState(false);

  const layoutRef = useRef<AppLayoutRef | null>(null);

  const {data: dropdownData, isLoading} = useGetDropdownData();
  const {data: accountDropdownData, isLoading: isAccountLoading} =
    useGetAccountDropdownList(formData.ownerDivision);
  const {
    data: indirectAccountDropdownData,
    isLoading: isIndirectAccountLoading,
  } = useGetIndirectAccountList(formData.ownerDivision);
  const {data: dependentDropdownData, isLoading: isDependentDropdownLoading} =
    useGetDependentDropdownList(formData.mainIndustry, formData.quotedProduct);

  const {mutate, isPending} = useAddNewRoolingFunnel(formData); // Add API hook
  const {mutate: editMutate, isPending: isEditPending} = useEditRoolingFunnel(formData,editData?.Opportunity_Number ?? editData?.id,); // Edit API hook

  // Prefill form when editing
  useEffect(() => {
    if (!isEditMode || !editData) return;
    console.log('Edit mode detected, pre-filling form with:', editData);
    setFormData(prev => ({
      ...prev,
      // Page 1
      ownerDivision: editData.Opportunity_Owner_Division || prev.ownerDivision,
      accountName: editData.Direct_Account || prev.accountName,
      indirectAccount: editData.Indirect_Account || prev.indirectAccount,
      newIndirectPartnerName: '', // Reset for edit mode
      newIndirectPartnerGST: '', // Reset for edit mode
      endCustomer: editData.End_Customer_CompanyID || prev.endCustomer,
      newEndCustomerName: '', // Reset for edit mode
      endCustomerTam:
        editData.End_Customer_TAM?.toString?.() || prev.endCustomerTam,
      category: editData.Category_Id || prev.category,
      mainIndustry: editData.Main_Industry_Id || prev.mainIndustry,
      standardIndustry: editData.Standard_Industry_Id || prev.standardIndustry,
      stage: editData.Stage_Id || prev.stage,
      winRate: editData.Win_Rate_Id  || prev.winRate,
      // Page 2
      productLine: editData.Product_Line || prev.productLine,
      quotedProduct: editData.Quoted_Product || prev.quotedProduct,
      product: editData.Product || prev.product,
      newProduct: '', // Reset for edit mode
      qty: editData.Qty?.toString?.() || prev.qty,
      description: editData.Description || prev.description,
      CRADDate: editData.CRAD_Date ? new Date(editData.CRAD_Date) : prev.CRADDate,
    }));
    // Ensure dependent UI states are consistent in edit mode
    setIsAddingNewIndirect(false);
    setIsAddingNewEndCustomer(false);
    setIsAddingNewModel(editData.Product === OTHERS);
  }, [isEditMode, editData]);

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = {...prev, [field]: value};

      // Reset dependent fields when parent changes
      if (field === 'ownerDivision') {
        updated.accountName = '';
        updated.indirectAccount = '';
        updated.newIndirectPartnerName = '';
        updated.newIndirectPartnerGST = '';
      }
      if (field === 'mainIndustry') {
        updated.standardIndustry = '';
      }
      if (field === 'quotedProduct') {
        updated.product = '';
        updated.newProduct = '';
      }
      if (field === 'product') {
        updated.newProduct = '';
      }

      return updated;
    });
    if (field === 'winRate') {
      setIsOpen(prev => !prev);
    }
    if (field === 'product') {
      const selectedProduct =
        dependentDropdownData?.ProductSeriesNameList?.find(
          (item: any) => item.value === value,
        );
      setIsAddingNewModel(selectedProduct?.label === OTHERS);
    }

    // Clear error for this field and its dependents
    setErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[field];

      // Also clear dependent field errors
      if (field === 'ownerDivision') {
        delete newErrors.accountName;
        delete newErrors.indirectAccount;
        delete newErrors.newIndirectPartnerName;
        delete newErrors.newIndirectPartnerGST;
      }
      if (field === 'mainIndustry') {
        delete newErrors.standardIndustry;
      }
      if (field === 'quotedProduct') {
        delete newErrors.product;
        delete newErrors.newProduct;
      }
      if (field === 'product') {
        delete newErrors.newProduct;
      }
      if (field === 'endCustomer' || field === 'newEndCustomerName') {
        delete newErrors.endCustomer;
        delete newErrors.newEndCustomerName;
      }

      return newErrors;
    });
  }, []);

  // Validation helpers
  const validatePage1 = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    const page1Fields: (keyof FormData)[] = [
      'ownerDivision',
      'accountName',
      'endCustomerTam',
      'category',
      'mainIndustry',
      'standardIndustry',
      'stage',
      'winRate',
    ];

    page1Fields.forEach(field => {
      if (!formData[field] || formData[field] === '') {
        newErrors[field] = 'This field is required';
      }
    });

    // Validate indirect account based on mode
    if (isAddingNewIndirect) {
      if (
        !formData.newIndirectPartnerName ||
        formData.newIndirectPartnerName === ''
      ) {
        newErrors.newIndirectPartnerName = 'Partner name is required';
      }
      if (
        !formData.newIndirectPartnerGST ||
        formData.newIndirectPartnerGST === ''
      ) {
        newErrors.newIndirectPartnerGST = 'GST number is required';
      }
    } else {
      if (!formData.indirectAccount || formData.indirectAccount === '') {
        newErrors.indirectAccount = 'This field is required';
      }
    }

    // Validate end customer based on mode
    if (isAddingNewEndCustomer) {
      if (!formData.newEndCustomerName || formData.newEndCustomerName === '') {
        newErrors.newEndCustomerName = 'End customer name is required';
      }
    } else {
      if (!formData.endCustomer || formData.endCustomer === '') {
        newErrors.endCustomer = 'This field is required';
      }
    }

    // Additional validation for numeric field
    if (formData.endCustomerTam && isNaN(Number(formData.endCustomerTam))) {
      newErrors.endCustomerTam = 'Please enter a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isAddingNewIndirect, isAddingNewEndCustomer]);

  const validatePage2 = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    const page2Fields: (keyof FormData)[] = [
      'productLine',
      'quotedProduct',
      'product',
      'qty',
      'description',
    ];

    page2Fields.forEach(field => {
      if (!formData[field] || formData[field] === '') {
        newErrors[field] = 'This field is required';
      }
    });

    // Validate newProduct if product is OTHERS
    if (isAddingNewModel) {
      if (!formData.newProduct || formData.newProduct === '') {
        newErrors.newProduct = 'New model name is required';
      }
    }

    // Additional validation for qty
    if (formData.qty && isNaN(Number(formData.qty))) {
      newErrors.qty = 'Please enter a valid number';
    }

    // Validate CRAD Date
    if (!formData.CRADDate) {
      newErrors.CRADDate = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isAddingNewModel]);

  // Check if page 1 is valid
  const isPage1Valid = useMemo(() => {
    const page1Fields: (keyof FormData)[] = [
      'ownerDivision',
      'accountName',
      'endCustomerTam',
      'category',
      'mainIndustry',
      'standardIndustry',
      'stage',
      'winRate',
    ];

    const basicFieldsValid =
      page1Fields.every(field => formData[field] && formData[field] !== '') &&
      !isNaN(Number(formData.endCustomerTam));

    // Check indirect account fields based on mode
    const indirectAccountValid = isAddingNewIndirect
      ? formData.newIndirectPartnerName !== '' &&
        formData.newIndirectPartnerGST !== ''
      : formData.indirectAccount !== '';

    // Check end customer fields based on mode
    const endCustomerValid = isAddingNewEndCustomer
      ? formData.newEndCustomerName !== ''
      : formData.endCustomer !== '';

    return basicFieldsValid && indirectAccountValid && endCustomerValid;
  }, [formData, isAddingNewIndirect, isAddingNewEndCustomer]);

  // Check if page 2 fields are filled without validation
  const isPage2Filled = useMemo(() => {
    const page2Fields: (keyof FormData)[] = [
      'productLine',
      'quotedProduct',
      'product',
      'qty',
      'description',
    ];

    const basicFieldsFilled =
      page2Fields.every(field => formData[field] && formData[field] !== '') &&
      !isNaN(Number(formData.qty)) &&
      formData.CRADDate !== undefined;

    // Check if newProduct is filled when product is OTHERS
    const newProductValid = isAddingNewModel
      ? formData.newProduct !== ''
      : true;

    return basicFieldsFilled && newProductValid;
  }, [formData, isAddingNewModel]);

  // Check if all fields are valid for submission
  const isFormValid = useMemo(() => {
    return isPage1Valid && isPage2Filled;
  }, [isPage1Valid, isPage2Filled]);

  // Handle next page
  const handleNext = useCallback(() => {
    if (validatePage1()) {
      setCurrentPage(2);
      // Scroll to top after page change using AppLayout ref
      setTimeout(() => {
        layoutRef.current?.scrollTo({y: 0, animated: true});
      }, 50);
    }
  }, [validatePage1]);

  // Handle previous page
  const handlePrevious = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!validatePage2()) return;

    // Configure confirmation dialog dynamically for add/edit
    const title = isEditMode ? 'Update Rolling Funnel' : 'Add Rolling Funnel';
    const confirmText = isEditMode ? 'Update' : 'Add';
    const message = isEditMode
      ? 'Are you sure you want to update this rolling funnel?'
      : 'Are you sure you want to add this rolling funnel?';

    showConfirmationSheet({
      title,
      confirmText,
      message,
      onConfirm: () => {
        if (isEditMode) {
          // Edit flow
          editMutate(undefined as any, {
            onSuccess: (data: any) => {
              console.log('Form updated:', data);
              queryClient.invalidateQueries({queryKey: ['rollingFunnelData']});
              showToast('Rolling Funnel updated successfully');
              navigation.goBack();
            },
            onError: (error: any) => {
              showToast('Failed to update Rolling Funnel: ' + error.message);
            },
          });
        } else {
          // Add flow
          mutate(undefined, {
            onSuccess: (data: any) => {
              console.log('Form submitted:', data);
              queryClient.invalidateQueries({queryKey: ['rollingFunnelData']});
              showToast('Rolling Funnel added successfully');
              navigation.goBack();
            },
            onError: (error: any) => {
              showToast('Failed to add Rolling Funnel: ' + error.message);
            },
          });
        }
      },
    });
  }, [validatePage2, isEditMode, editMutate, mutate, navigation]);

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(initialFormData);
    setCurrentPage(1);
    setErrors({});
    setIsAddingNewIndirect(false);
    setIsAddingNewEndCustomer(false);
    setIsOpen(false);
    setIsAddingNewModel(false);
  }, []);

  // Handle toggle add new indirect account
  const handleToggleAddNew = useCallback(() => {
    setIsAddingNewIndirect(prev => {
      const newValue = !prev;
      // Clear fields when toggling
      if (newValue) {
        updateField('indirectAccount', '');
      } else {
        updateField('newIndirectPartnerName', '');
        updateField('newIndirectPartnerGST', '');
      }
      return newValue;
    });
  }, [updateField]);

  // Handle toggle add new end customer
  const handleToggleAddNewEndCustomer = useCallback(() => {
    setIsAddingNewEndCustomer(prev => {
      const newValue = !prev;
      // Clear fields when toggling
      if (newValue) {
        updateField('endCustomer', '');
      } else {
        updateField('newEndCustomerName', '');
      }
      return newValue;
    });
  }, [updateField]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (currentPage === 2) {
          setCurrentPage(1);
          return true; // Prevent default behavior
        }
        return false; // Allow default behavior (go back to previous screen)
      },
    );

    return () => backHandler.remove();
  }, [currentPage]);

  return (
    <AppLayout
      ref={layoutRef}
      title={isEditMode ? "Edit Rolling Funnel" : "Add Rolling Funnel"}
      needBack
      needPadding
      needScroll>
      {/* Page Title */}
      <View className="px-4 pt-4 mb-6">
        <AppText size="xl" weight="bold" className="text-gray-800">
          {isEditMode
            ? currentPage === 1
              ? 'Edit: Basic Information'
              : 'Edit: Product Details'
            : currentPage === 1
            ? 'Basic Information'
            : 'Product Details'}
        </AppText>
        <AppText size="sm" className="text-gray-500 mt-1">
          {isEditMode
            ? currentPage === 1
              ? 'Update the basic details of the rolling funnel'
              : 'Update product and description information'
            : currentPage === 1
            ? 'Please fill in the basic details of the rolling funnel'
            : 'Please provide product and description information'}
        </AppText>
      </View>

      <View className="flex-row items-center justify-between  px-4 ">
        <View className="flex-row items-center flex-1">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${currentPage === 1 ? 'bg-blue-500' : 'bg-green-500'}`}>
            <AppText size="sm" weight="bold" color="white">
              1
            </AppText>
          </View>
          <View
            className={`flex-1 h-1 mx-2 ${currentPage === 2 ? 'bg-blue-500' : 'bg-gray-300'}`}
          />
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${currentPage === 2 ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <AppText
              size="sm"
              weight="bold"
              color={currentPage === 2 ? 'white' : undefined}>
              2
            </AppText>
          </View>
        </View>
      </View>

      <Card className="mt-4 mb-6" noshadow>
        <View className="px-4">
          {/* Page 1 - Basic Information */}
          {currentPage === 1 && (
            <View className="gap-4">
              <AppInput
                label="Opportunity Owner"
                placeholder={'Owner (Auto-populated)'}
                value={convertToCapitalized(ownerName)}
                size="md"
                isOptional
                setValue={() => {}}
                editable={false}
                showClearButton={false}
                inputWrapperStyle={{backgroundColor: '#F3F4F6'}}
                inputClassName="text-gray-900 font-manropeBold ml-1"
                textSize={16}
              />

              <AppDropdown
                label="Owner Division"
                placeholder={isLoading ? 'Loading...' : 'Select Owner Division'}
                data={dropdownData?.OwnerDivisionList || []}
                selectedValue={formData.ownerDivision}
                onSelect={item =>
                  updateField('ownerDivision', item?.value || '')
                }
                mode="dropdown"
                required
                error={errors.ownerDivision}
                disabled={isLoading}
                zIndex={3000}
              />

              <View>
                <AppDropdown
                  label="Account Name"
                  placeholder={
                    isAccountLoading ? 'Loading...' : 'Select Account Name'
                  }
                  data={accountDropdownData || []}
                  selectedValue={formData.accountName}
                  onSelect={item =>
                    updateField('accountName', item?.value || '')
                  }
                  mode="autocomplete"
                  required
                  error={errors.accountName}
                  disabled={
                    !formData.ownerDivision || isAccountLoading || isLoading
                  }
                  zIndex={2900}
                />
                {!formData.ownerDivision && (
                  <View className="flex-row items-center mt-1">
                    <AppIcon
                      type="feather"
                      name="lock"
                      size={12}
                      color="#9CA3AF"
                    />
                    <AppText size="xs" className="text-gray-400 ml-1">
                      Please select Owner Division first
                    </AppText>
                  </View>
                )}
              </View>

              <View>
                {!isAddingNewIndirect ? (
                  <>
                    <AppDropdown
                      label="Indirect Account"
                      placeholder={
                        isIndirectAccountLoading
                          ? 'Loading...'
                          : 'Select Indirect Account'
                      }
                      data={indirectAccountDropdownData || []}
                      selectedValue={formData.indirectAccount}
                      onSelect={item =>
                        updateField('indirectAccount', item?.value || '')
                      }
                      mode="autocomplete"
                      required
                      error={errors.indirectAccount}
                      disabled={
                        !formData.ownerDivision ||
                        isIndirectAccountLoading ||
                        isLoading
                      }
                      zIndex={2800}
                    />
                    {formData.ownerDivision ? (
                      <TouchableOpacity
                        onPress={handleToggleAddNew}
                        className="mt-2 flex-row items-center"
                        activeOpacity={0.7}>
                        <AppIcon
                          type="feather"
                          name="plus-circle"
                          size={16}
                          color="#3B82F6"
                        />
                        <AppText
                          size="sm"
                          className="text-blue-500 ml-1 font-medium">
                          Add New Indirect Account
                        </AppText>
                      </TouchableOpacity>
                    ) : (
                      <View className="flex-row items-center mt-1">
                        <AppIcon
                          type="feather"
                          name="lock"
                          size={12}
                          color="#9CA3AF"
                        />
                        <AppText size="xs" className="text-gray-400 ml-1">
                          Please select Owner Division first
                        </AppText>
                      </View>
                    )}
                  </>
                ) : (
                  <View className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                    <View className="flex-row items-center justify-between mb-4">
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-blue-700">
                        Add New Indirect Account
                      </AppText>
                      <TouchableOpacity
                        onPress={handleToggleAddNew}
                        className="flex-row items-center"
                        activeOpacity={0.7}>
                        <AppIcon
                          type="feather"
                          name="x-circle"
                          size={16}
                          color="#EF4444"
                        />
                        <AppText
                          size="sm"
                          className="text-red-500 ml-1 font-medium">
                          Cancel
                        </AppText>
                      </TouchableOpacity>
                    </View>

                    <AppInput
                      label="New Indirect Partner Name"
                      placeholder="Enter partner name"
                      value={formData.newIndirectPartnerName}
                      setValue={value =>
                        updateField('newIndirectPartnerName', value)
                      }
                      error={errors.newIndirectPartnerName}
                      inputClassName="ml-1"
                    />

                    <View className="mt-4">
                      <AppInput
                        label="GST Number"
                        placeholder="Enter GST number"
                        value={formData.newIndirectPartnerGST}
                        setValue={value =>
                          updateField('newIndirectPartnerGST', value)
                        }
                        error={errors.newIndirectPartnerGST}
                        inputClassName="ml-1"
                      />
                    </View>
                  </View>
                )}
              </View>

              <View>
                {!isAddingNewEndCustomer ? (
                  <>
                    <AppDropdown
                      label="End Customer"
                      placeholder={
                        isLoading ? 'Loading...' : 'Select End Customer'
                      }
                      data={dropdownData?.EndCustomerList || []}
                      selectedValue={formData.endCustomer}
                      onSelect={item =>
                        updateField('endCustomer', item?.value || '')
                      }
                      mode="autocomplete"
                      required
                      error={errors.endCustomer}
                      disabled={isLoading}
                      zIndex={2700}
                    />
                    <TouchableOpacity
                      onPress={handleToggleAddNewEndCustomer}
                      className="mt-2 flex-row items-center"
                      activeOpacity={0.7}>
                      <AppIcon
                        type="feather"
                        name="plus-circle"
                        size={16}
                        color="#3B82F6"
                      />
                      <AppText
                        size="sm"
                        className="text-blue-500 ml-1 font-medium">
                        Add New End Customer
                      </AppText>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                    <View className="flex-row items-center justify-between mb-4">
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-blue-700">
                        Add New End Customer
                      </AppText>
                      <TouchableOpacity
                        onPress={handleToggleAddNewEndCustomer}
                        className="flex-row items-center"
                        activeOpacity={0.7}>
                        <AppIcon
                          type="feather"
                          name="x-circle"
                          size={16}
                          color="#EF4444"
                        />
                        <AppText
                          size="sm"
                          className="text-red-500 ml-1 font-medium">
                          Cancel
                        </AppText>
                      </TouchableOpacity>
                    </View>

                    <AppInput
                      label="End Customer Name"
                      placeholder="Enter end customer name"
                      value={formData.newEndCustomerName}
                      setValue={value =>
                        updateField('newEndCustomerName', value)
                      }
                      error={errors.newEndCustomerName}
                      inputClassName="ml-1"
                    />
                  </View>
                )}
              </View>

              <AppInput
                label="End Customer TAM"
                placeholder="Enter TAM value"
                value={formData.endCustomerTam}
                setValue={value => updateField('endCustomerTam', value)}
                keyboardType="numeric"
                error={errors.endCustomerTam}
                inputClassName="ml-1"
              />

              <AppDropdown
                label="Category"
                placeholder={isLoading ? 'Loading...' : 'Select Category'}
                data={dropdownData?.CategoryList || []}
                selectedValue={formData.category}
                onSelect={item => updateField('category', item?.value || '')}
                mode="dropdown"
                required
                error={errors.category}
                disabled={isLoading}
                zIndex={2600}
              />

              <AppDropdown
                label="Main Industry"
                placeholder={isLoading ? 'Loading...' : 'Select Main Industry'}
                data={dropdownData?.MainIndustryList || []}
                selectedValue={formData.mainIndustry}
                onSelect={item =>
                  updateField('mainIndustry', item?.value || '')
                }
                mode="dropdown"
                required
                error={errors.mainIndustry}
                disabled={isLoading}
                zIndex={2500}
              />

              <View>
                <AppDropdown
                  label="Standard Industry"
                  placeholder={
                    isDependentDropdownLoading
                      ? 'Loading...'
                      : 'Select Standard Industry'
                  }
                  data={dependentDropdownData?.StandardIndustryList || []}
                  selectedValue={formData.standardIndustry}
                  onSelect={item =>
                    updateField('standardIndustry', item?.value || '')
                  }
                  mode="dropdown"
                  required
                  error={errors.standardIndustry}
                  disabled={
                    !formData.mainIndustry ||
                    isDependentDropdownLoading ||
                    isLoading
                  }
                  zIndex={2400}
                />
                {!formData.mainIndustry && (
                  <View className="flex-row items-center mt-1">
                    <AppIcon
                      type="feather"
                      name="lock"
                      size={12}
                      color="#9CA3AF"
                    />
                    <AppText size="xs" className="text-gray-400 ml-1">
                      Please select Main Industry first
                    </AppText>
                  </View>
                )}
              </View>

              <AppDropdown
                label="Stage"
                placeholder={isLoading ? 'Loading...' : 'Select Stage'}
                data={dropdownData?.StageList || []}
                selectedValue={formData.stage}
                onSelect={item => updateField('stage', item?.value || '')}
                mode="dropdown"
                required
                error={errors.stage}
                disabled={isLoading}
                zIndex={2300}
              />

              <AppDropdown
                label="Win Rate"
                placeholder={isLoading ? 'Loading...' : 'Select Win Rate'}
                data={dropdownData?.WinRateList || []}
                selectedValue={formData.winRate}
                onSelect={item => updateField('winRate', item?.value || '')}
                mode="dropdown"
                required
                error={errors.winRate}
                disabled={isLoading}
                onOpenChange={() => setIsOpen(prev => !prev)}
                zIndex={2200}
              />
            </View>
          )}
          {/* Page 2 - Product Details */}
          {currentPage === 2 && (
            <View className="gap-4">
              <AppDropdown
                label="Product Line"
                placeholder={isLoading ? 'Loading...' : 'Select Product Line'}
                data={dropdownData?.ProductLine || []}
                selectedValue={formData.productLine}
                onSelect={item => updateField('productLine', item?.value || '')}
                mode="dropdown"
                required
                error={errors.productLine}
                disabled={isLoading}
                zIndex={3000}
              />

              <AppDropdown
                label="Quoted Product"
                placeholder={isLoading ? 'Loading...' : 'Select Quoted Product'}
                data={dropdownData?.ProductSeriesNameList || []}
                selectedValue={formData.quotedProduct}
                onSelect={item =>
                  updateField('quotedProduct', item?.value || '')
                }
                mode="dropdown"
                required
                error={errors.quotedProduct}
                disabled={isLoading}
                zIndex={2900}
              />

              <View>
                <AppDropdown
                  label="Product: Sales Model Name"
                  placeholder={
                    isDependentDropdownLoading ? 'Loading...' : 'Select Product'
                  }
                  data={dependentDropdownData?.ProductSeriesNameList || []}
                  selectedValue={formData.product}
                  onSelect={item => updateField('product', item?.value || '')}
                  mode="dropdown"
                  required
                  error={errors.product}
                  disabled={
                    !formData.quotedProduct ||
                    isDependentDropdownLoading ||
                    isLoading
                  }
                  zIndex={2800}
                />
                {!formData.quotedProduct && (
                  <View className="flex-row items-center mt-1">
                    <AppIcon
                      type="feather"
                      name="lock"
                      size={12}
                      color="#9CA3AF"
                    />
                    <AppText size="xs" className="text-gray-400 ml-1">
                      Please select Quoted Product first
                    </AppText>
                  </View>
                )}
              </View>

              {formData.product === OTHERS && (
                <View className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-blue-700 mb-3">
                    Add New Model
                  </AppText>
                  <AppInput
                    label="New Model Name"
                    placeholder="Enter new model name"
                    value={formData.newProduct}
                    setValue={value => updateField('newProduct', value)}
                    error={errors.newProduct}
                    inputClassName="ml-1"
                  />
                </View>
              )}

              <AppInput
                label="Quantity"
                placeholder="Enter quantity"
                value={formData.qty}
                setValue={value => updateField('qty', value)}
                keyboardType="numeric"
                error={errors.qty}
                inputClassName="ml-1"
              />

              <AppInput
                label="Description"
                placeholder="Enter description"
                value={formData.description}
                setValue={value => updateField('description', value)}
                multiline
                numberOfLines={4}
                error={errors.description}
                inputClassName="ml-1"
              />

              <DatePickerInput
                mode="date"
                label="CRAD Date"
                placeholder="Select CRAD Date"
                onDateSelect={date => updateField('CRADDate', date)}
                initialDate={formData.CRADDate}
                required
                error={errors.CRADDate}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View className="mt-6 gap-3">
            {currentPage === 1 ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <AppButton
                    title="Reset"
                    onPress={handleReset}
                    className="bg-gray-400"
                  />
                </View>
                <View className="flex-1">
                  <AppButton
                    title="Next"
                    onPress={handleNext}
                    disabled={!isPage1Valid}
                    iconName="arrow-right"
                  />
                </View>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <AppButton
                    title="Previous"
                    onPress={handlePrevious}
                    className="bg-gray-500"
                    iconName="arrow-left"
                  />
                </View>
                <View className="flex-1">
                  <AppButton
                    title={isEditMode ? 'Update' : 'Submit'}
                    onPress={handleSubmit}
                    disabled={!isFormValid || isPending || isEditPending}
                    iconName="check"
                    className="bg-green-600"
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Card>

      <Card className="mb-6">
        <View className="flex-row items-start ">
          <AppIcon
            type="feather"
            name="info"
            size={20}
            color="#3B82F6"
            style={{marginRight: 12, marginTop: 2}}
          />
          <View className="flex-1">
            <AppText size="sm" weight="semibold" className="text-gray-800 mb-1">
              Helpful Tips
            </AppText>
            <AppText size="xs" className="text-gray-600 ">
              {isEditMode
                ? currentPage === 1
                  ? 'All fields marked with * are required. Please ensure updated information is accurate before proceeding.'
                  : 'Review all product details carefully. Once updated, the rolling funnel entry will reflect changes in the list view.'
                : currentPage === 1
                ? 'All fields marked with * are required. Please ensure all information is accurate before proceeding to the next step.'
                : 'Review all product details carefully. Once submitted, the rolling funnel entry will be created and can be reviewed in the list view.'}
            </AppText>
          </View>
        </View>
      </Card>
      {isOpen && <View className="h-20" />}
    </AppLayout>
  );
}
