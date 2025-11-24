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
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {
  convertCamelCaseToSentence,
  convertToCapitalized,
  formatUnique,
} from '../../../../../utils/commonFunctions';
import {useLoginStore} from '../../../../../stores/useLoginStore';

interface FormData {
  // Page 1
  ownerDivision: string;
  accountName: string;
  indirectAccount: string;
  endCustomer: string;
  endCustomerTam: string;
  category: string;
  mainIndustry: string;
  standardIndustry: string;
  stage: string;
  winRate: string;
  // Page 2
  productLine: string;
  quotedProduct: string;
  product: string;
  qty: string;
  description: string;
  CRADDate: Date | undefined;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  // Page 1
  ownerDivision: '',
  accountName: '',
  indirectAccount: '',
  endCustomer: '',
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
  qty: '',
  description: '',
  CRADDate: undefined,
};

const useGetDropdownData = () => {
  const {EMP_Code: EmpCode = ''} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['rollingFunnelDropdownData', EmpCode],
    enabled: !!EmpCode,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_DropdownList_New',
        {EmpCode},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result?.Datainfo;
    },
    select: (data: any) => {
      const {
        OwnerDivisionList,
        CategoryList,
        StageList,
        WinRateList,
        ProductLine,
        MainIndustryList,
        ProductSeriesNameList,
        EndCustomerList,
      } = data;
      return {
        OwnerDivisionList: formatUnique(
          OwnerDivisionList,
          'Id',
          'Opportunity_Owner_Division',
        ),
        CategoryList: formatUnique(CategoryList, 'Id', 'Sector'),
        StageList: formatUnique(StageList, 'Id', 'Stage'),
        WinRateList: formatUnique(WinRateList, 'Id', 'WinRate_Display'),
        ProductLine: formatUnique(ProductLine, 'PD_HQName'),
        MainIndustryList: formatUnique(MainIndustryList, 'Main_Industry'),
        ProductSeriesNameList: formatUnique(
          ProductSeriesNameList,
          'Series_Name',
        ),
        EndCustomerList: formatUnique(
          EndCustomerList,
          'End_Customer_CompanyID',
          'EndCustomer_Name',
        ),
      };
    },
  });
};

const useGetDependentDropdownList = (MainIndustry: string,ProductSeriesName: string) => {
  return useQuery({
    queryKey: ['standardIndustryList', MainIndustry,ProductSeriesName],
    enabled: !!MainIndustry || !!ProductSeriesName,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_DependentDropdownList',
        {MainIndustry,ProductSeriesName},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch standard industry data');
      }
      return result?.Datainfo;
    },
    select: (data: any) => {
      return {
        StandardIndustryList: formatUnique(
          data.IndustryList,
          'Id',
          'Standard_Industry',
        ),
        ProductSeriesNameList: formatUnique(
          data.ProductSeriesList,
          'Model_Name',
        ),
      };
    },
  });
};

const useGetAccountDropdownList = (BranchName: string) => {
  return useQuery({
    queryKey: ['rollingFunnelDropdownData', BranchName],
    enabled: !!BranchName,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_DirectAccount_List',
        {BranchName},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      const data = formatUnique(
        result?.Datainfo?.DirectAccountList,
        'Id',
        'Partner_Name',
      );
      return data;
    },
  });
};

const useGetIndirectAccountList = (BranchName: string) => {
  return useQuery({
    queryKey: ['rollingFunnelDropdownData', BranchName],
    enabled: !!BranchName,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_IndirectAccount_List',
        {BranchName},
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      const data = formatUnique(
        result?.Datainfo?.IndirectAccount_List,
        'IndirectAccountCode',
        'IndirectAccountName',
      );
      return data;
    },
  });
};

export default function AddRollingFunnel() {
  const {EMP_Name: ownerName} = useLoginStore(state => state.userInfo);

  const [formData, setFormData] = useState(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showAddNewModal, setShowAddNewModal] = useState(false);
  const [newIndirectAccount, setNewIndirectAccount] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const layoutRef = useRef<AppLayoutRef | null>(null);

  const {data: dropdownData, isLoading} = useGetDropdownData();
  const {data: accountDropdownData, isLoading: isAccountLoading} =
    useGetAccountDropdownList(formData.ownerDivision);
  const {
    data: indirectAccountDropdownData,
    isLoading: isIndirectAccountLoading,
  } = useGetIndirectAccountList(formData.ownerDivision);
  const {data: dependentDropdownData, isLoading: isDependentDropdownLoading} = useGetDependentDropdownList(formData.mainIndustry, formData.quotedProduct);

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = {...prev, [field]: value};

      // Reset dependent fields when parent changes
      if (field === 'ownerDivision') {
        updated.accountName = '';
      }
      if (field === 'mainIndustry') {
        updated.standardIndustry = '';
      }
      if (field === 'quotedProduct') {
        updated.product = '';
      }

      return updated;
    });
    if(field==='winRate'){
      setIsOpen(prev=>!prev);
    }
    
    // Clear error for this field and its dependents
    setErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[field];

      // Also clear dependent field errors
      if (field === 'ownerDivision') {
        delete newErrors.accountName;
      }
      if (field === 'mainIndustry') {
        delete newErrors.standardIndustry;
      }
      if (field === 'quotedProduct') {
        delete newErrors.product;
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
      'indirectAccount',
      'endCustomer',
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

    // Additional validation for numeric field
    if (formData.endCustomerTam && isNaN(Number(formData.endCustomerTam))) {
      newErrors.endCustomerTam = 'Please enter a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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
  }, [formData]);

  // Check if page 1 is valid
  const isPage1Valid = useMemo(() => {
    const page1Fields: (keyof FormData)[] = [
      'ownerDivision',
      'accountName',
      'indirectAccount',
      'endCustomer',
      'endCustomerTam',
      'category',
      'mainIndustry',
      'standardIndustry',
      'stage',
      'winRate',
    ];
    return (
      page1Fields.every(field => formData[field] && formData[field] !== '') &&
      !isNaN(Number(formData.endCustomerTam))
    );
  }, [formData]);

  // Check if all fields are valid for submission
  const isFormValid = useMemo(() => {
    return isPage1Valid && validatePage2();
  }, [isPage1Valid, validatePage2]);

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
    if (validatePage2()) {
      console.log('Form submitted:', formData);
      // TODO: Implement API submission
    }
  }, [formData, validatePage2]);

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(initialFormData);
    setCurrentPage(1);
    setErrors({});
    setIsOpen(false);
  }, []);

  // Handle Add New Indirect Account
  const handleAddNewIndirectAccount = useCallback(() => {
    if (newIndirectAccount.trim()) {
      // TODO: Implement API call to add new indirect account
      console.log('Add new indirect account:', newIndirectAccount);
      updateField('indirectAccount', newIndirectAccount.trim());
      setNewIndirectAccount('');
      setShowAddNewModal(false);
    }
  }, [newIndirectAccount, updateField]);

  const handleCancelAddNew = useCallback(() => {
    setNewIndirectAccount('');
    setShowAddNewModal(false);
  }, []);

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
      title="Add Rolling Funnel"
      needBack
      needPadding
      needScroll>
      {/* Page Title */}
      <View className="px-4 pt-4 mb-6">
        <AppText size="xl" weight="bold" className="text-gray-800">
          {currentPage === 1 ? 'Basic Information' : 'Product Details'}
        </AppText>
        <AppText size="sm" className="text-gray-500 mt-1">
          {currentPage === 1
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
                inputWapperStyle={{backgroundColor: '#F3F4F6'}}
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
                  mode="dropdown"
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
                <AppDropdown
                  label="Indirect Account"
                  placeholder={
                    isIndirectAccountLoading
                      ? 'Loading...'
                      : 'Select or Add Indirect Account'
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
                    onPress={() => setShowAddNewModal(true)}
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
              </View>

              <AppDropdown
                label="End Customer"
                placeholder={
                  isLoading ? 'Loading...' : 'Select or Add End Customer'
                }
                data={dropdownData?.EndCustomerList || []}
                selectedValue={formData.endCustomer}
                onSelect={item => updateField('endCustomer', item?.value || '')}
                mode="autocomplete"
                required
                error={errors.endCustomer}
                disabled={isLoading}
                zIndex={2700}
              />

              <AppInput
                label="End Customer TAM"
                placeholder="Enter TAM value"
                value={formData.endCustomerTam}
                setValue={value => updateField('endCustomerTam', value)}
                keyboardType="numeric"
                error={errors.endCustomerTam}
                inputClassName='ml-1'
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
                    isDependentDropdownLoading ? 'Loading...' : 'Select Standard Industry'
                  }
                  data={dependentDropdownData?.StandardIndustryList || []}
                  selectedValue={formData.standardIndustry}
                  onSelect={item =>
                    updateField('standardIndustry', item?.value || '')
                  }
                  mode="dropdown"
                  required
                  error={errors.standardIndustry}
                  disabled={!formData.mainIndustry || isDependentDropdownLoading || isLoading}
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
                onOpenChange={()=>setIsOpen(prev=>!prev)}
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
                  placeholder={isDependentDropdownLoading ? 'Loading...' : 'Select Product'}
                  data={dependentDropdownData?.ProductSeriesNameList || []}
                  selectedValue={formData.product}
                  onSelect={item => updateField('product', item?.value || '')}
                  mode="dropdown"
                  required
                  error={errors.product}
                  disabled={!formData.quotedProduct || isDependentDropdownLoading || isLoading}
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

              <AppInput
                label="Quantity"
                placeholder="Enter quantity"
                value={formData.qty}
                setValue={value => updateField('qty', value)}
                keyboardType="numeric"
                error={errors.qty}
                inputClassName='ml-1'
              />

              <AppInput
                label="Description"
                placeholder="Enter description"
                value={formData.description}
                setValue={value => updateField('description', value)}
                multiline
                numberOfLines={4}
                error={errors.description}
                inputClassName='ml-1'
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
                    title="Submit"
                    onPress={handleSubmit}
                    disabled={!isFormValid}
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
              {currentPage === 1
                ? 'All fields marked with * are required. Please ensure all information is accurate before proceeding to the next step.'
                : 'Review all product details carefully. Once submitted, the rolling funnel entry will be created and can be reviewed in the list view.'}
            </AppText>
          </View>
        </View>
      </Card>
      {isOpen && <View className='h-20'/>}

      {showAddNewModal && (
        <View
          className="absolute inset-0 bg-black/50 items-center justify-center"
          style={{zIndex: 9999}}>
          <Card className="w-11/12 max-w-md">
            <View className="p-5">
              <View className="flex-row items-center justify-between mb-4">
                <AppText size="lg" weight="bold" className="text-gray-800">
                  Add New Indirect Account
                </AppText>
                <TouchableOpacity onPress={handleCancelAddNew}>
                  <AppIcon type="feather" name="x" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <AppInput
                label="Account Name"
                placeholder="Enter indirect account name"
                value={newIndirectAccount}
                setValue={setNewIndirectAccount}
                autoFocus
                inputClassName='ml-1'
              />

              <View className="flex-row gap-3 mt-5">
                <View className="flex-1">
                  <AppButton
                    title="Cancel"
                    onPress={handleCancelAddNew}
                    className="bg-gray-400"
                  />
                </View>
                <View className="flex-1">
                  <AppButton
                    title="Add"
                    onPress={handleAddNewIndirectAccount}
                    disabled={!newIndirectAccount.trim()}
                    iconName="plus"
                  />
                </View>
              </View>
            </View>
          </Card>
        </View>
      )}
    </AppLayout>
  );
}
