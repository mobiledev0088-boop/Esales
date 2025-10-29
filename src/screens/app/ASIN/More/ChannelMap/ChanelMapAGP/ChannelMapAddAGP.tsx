import {View} from 'react-native';
import {useState, useCallback, useMemo} from 'react';
import AppLayout from '../../../../../../components/layout/AppLayout';
import FormSection, {FormField} from './FormSection';
import AppButton from '../../../../../../components/customs/AppButton';
import AppIcon from '../../../../../../components/customs/AppIcon';
import AppText from '../../../../../../components/customs/AppText';
import {validateSection, ValidationErrors} from './formValidation';
import {showToast} from '../../../../../../utils/commonFunctions';

const initialShopInfo = {
  // CompanyName: '1',
  // ShopName: '1',
  // ShopAddress: '1',
  // ShopLandLine: '9988776655',
  // OwnerName: '1',
  // OwnerNumber: '9988776655',
  // OwnerMailID: 'a@gmail.com',
  // GSTNo: '1',
  CompanyName: '',
  ShopName: '',
  ShopAddress: '',
  ShopLandLine: '',
  OwnerName: '',
  OwnerNumber: '',
  OwnerMailID: '',
  GSTNo: '',
  KeyPersonName: '',
  KeyPersonDesig: '',
  KeyPersonNo: '',
  KeyPersonMail: '',
};
const initialAsusInfo = {
  PinCode: '',
  TaskOwner: '',
  CustomisedBranding: '',
  BusinessType: '',
  chainStore: '',
  BANNED: '',
  IsLoginCreated: '',
};
const intialBrandCom = {
  AsusType: '',
  AsusMonthNo: '',
  HPType: '',
  HPMonthNo: '',
  DellType: '',
  DellMonthNo: '',
  LenovoType: '',
  LenovoMonthNo: '',
  AcerType: '',
  AcerMonthNo: '',
  MSIType: '',
  MSIMonthNo: '',
  SamsungType: '',
  SamsungMonthNo: '',
};
const initialConsumerDTCom = {
  CDTBusinessType: '',
  CDTModeOfBusiness: '',
  CDTMonthlyNumber: '',
  CDTMonthlyCommNo: '',
  CDTWhiteBrand: '',
  CDTDealRatio: '',
  CDTAsusType: '',
  CDTAsusMonthNo: '',
  CDTHPType: '',
  CDTHPMonthNo: '',
  CDTDellType: '',
  CDTDellMonthNo: '',
  CDTLenovoType: '',
  CDTLenovoMonthNo: '',
  CDTAcerType: '',
  CDTAcerMonthNo: '',
};
const initialGamingDTCom = {
  GDTMonthlyNumber: '',
  GDTMonthlyDIY: '',
  GDTAsusType: '',
  GDTAsusMonthNo: '',
  GDTHPType: '',
  GDTHPMonthNo: '',
  GDTDellType: '',
  GDTDellMonthNo: '',
  GDTLenovoType: '',
  GDTLenovoMonthNo: '',
  GDTAcerType: '',
  GDTAcerMonthNo: '',
};
const initialAIOCompetition = {
  AIOBusinessType: '',
  AIOModeOfBusiness: '',
  AIOMonthlyNumber: '',
  AIOMonthlyCommNo: '',
  AIOAsusType: '',
  AIOAsusMonthNo: '',
  AIOHPType: '',
  AIOHPMonthNo: '',
  AIODellType: '',
  AIODellMonthNo: '',
  AIOLenovoType: '',
  AIOLenovoMonthNo: '',
  AIOAcerType: '',
  AIOAcerMonthNo: '',
  AIODealRatio: '',
};
const initialMonthlyData = {
  MonthlyNBSales: '',
  MonthlyDTAIOSales: '',
  DisplayNB: '',
};

export default function ChannelMapAddAGP() {
  // State management
  const [shopInfo, setShopInfo] = useState(initialShopInfo);
  const [asusInfo, setAsusInfo] = useState(initialAsusInfo);
  const [brandCompetition, setBrandCompetition] = useState(intialBrandCom);
  const [consumerDTCompetition, setConsumerDTCompetition] =
    useState(initialConsumerDTCom);
  const [gamingDTCompetition, setGamingDTCompetition] =
    useState(initialGamingDTCom);
  const [AIOCompetition, setAIOCompetition] = useState(initialAIOCompetition);
  const [monthlyData, setMonthlyData] = useState(initialMonthlyData);

  // Accordion state management - only one can be open at a time
  const [openAccordion, setOpenAccordion] = useState<string>('shopInfo');

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    shopInfo: ValidationErrors;
    asusInfo: ValidationErrors;
    brandCompetition: ValidationErrors;
    consumerDTCompetition: ValidationErrors;
    gamingDTCompetition: ValidationErrors;
    AIOCompetition: ValidationErrors;
    monthlyData: ValidationErrors;
  }>({
    shopInfo: {},
    asusInfo: {},
    brandCompetition: {},
    consumerDTCompetition: {},
    gamingDTCompetition: {},
    AIOCompetition: {},
    monthlyData: {},
  });

  // make it Array for easy checking
  const [unlockedSections, setUnlockedSections] = useState<Array<string>>(['shopInfo']);

  // Optimized update handlers with real-time validation clearing
  const updateShopInfo = useCallback((key: string, value: string) => {
    setShopInfo(prev => ({...prev, [key]: value}));
    // Clear validation error for this field when user types
    setValidationErrors(prev => ({
      ...prev,
      shopInfo: {...prev.shopInfo, [key]: ''},
    }));
  }, []);

  const updateAsusInfo = useCallback((key: string, value: string) => {
    setAsusInfo(prev => ({...prev, [key]: value}));
    setValidationErrors(prev => ({
      ...prev,
      asusInfo: {...prev.asusInfo, [key]: ''},
    }));
  }, []);

  const updateBrandCompetition = useCallback((key: string, value: string) => {
    setBrandCompetition(prev => ({...prev, [key]: value}));
    setValidationErrors(prev => ({
      ...prev,
      brandCompetition: {...prev.brandCompetition, [key]: ''},
    }));
  }, []);

  const updateConsumerDTCompetition = useCallback(
    (key: string, value: string) => {
      setConsumerDTCompetition(prev => ({...prev, [key]: value}));
      setValidationErrors(prev => ({
        ...prev,
        consumerDTCompetition: {...prev.consumerDTCompetition, [key]: ''},
      }));
    },
    [],
  );

  const updateGamingDTCompetition = useCallback(
    (key: string, value: string) => {
      setGamingDTCompetition(prev => ({...prev, [key]: value}));
      setValidationErrors(prev => ({
        ...prev,
        gamingDTCompetition: {...prev.gamingDTCompetition, [key]: ''},
      }));
    },
    [],
  );

  const updateAIOCompetition = useCallback((key: string, value: string) => {
    setAIOCompetition(prev => ({...prev, [key]: value}));
    setValidationErrors(prev => ({
      ...prev,
      AIOCompetition: {...prev.AIOCompetition, [key]: ''},
    }));
  }, []);

  const updateMonthlyData = useCallback((key: string, value: string) => {
    setMonthlyData(prev => ({...prev, [key]: value}));
    setValidationErrors(prev => ({
      ...prev,
      monthlyData: {...prev.monthlyData, [key]: ''},
    }));
  }, []);

  // Section configuration for cleaner code
  const sections = useMemo(
    () => [
      {
        id: 'shopInfo',
        title: 'Shop Information',
        icon: 'shopping-bag',
        values: shopInfo,
        updateValues: updateShopInfo,
      },
      {
        id: 'asusInfo',
        title: 'ASUS Information',
        icon: 'info',
        values: asusInfo,
        updateValues: updateAsusInfo,
      },
      {
        id: 'brandCompetition',
        title: 'Brand Competition',
        icon: 'award',
        values: brandCompetition,
        updateValues: updateBrandCompetition,
      },
      {
        id: 'consumerDTCompetition',
        title: 'Consumer DT Competition',
        icon: 'monitor',
        values: consumerDTCompetition,
        updateValues: updateConsumerDTCompetition,
      },
      {
        id: 'gamingDTCompetition',
        title: 'Gaming DT Competition',
        icon: 'cpu',
        values: gamingDTCompetition,
        updateValues: updateGamingDTCompetition,
      },
      {
        id: 'AIOCompetition',
        title: 'AIO Competition',
        icon: 'tablet',
        values: AIOCompetition,
        updateValues: updateAIOCompetition,
      },
      {
        id: 'monthlyData',
        title: 'Monthly Sales Data',
        icon: 'bar-chart-2',
        values: monthlyData,
        updateValues: updateMonthlyData,
      },
    ],
    [
      shopInfo,
      asusInfo,
      brandCompetition,
      consumerDTCompetition,
      gamingDTCompetition,
      AIOCompetition,
      monthlyData,
      updateShopInfo,
      updateAsusInfo,
      updateBrandCompetition,
      updateConsumerDTCompetition,
      updateGamingDTCompetition,
      updateAIOCompetition,
      updateMonthlyData,
    ],
  );

  // Helper function to get fields for a section (defined before handleAccordionToggle)
  const getSectionFields = useCallback((sectionId: string): FormField[] => {
    switch (sectionId) {
      case 'shopInfo':
        return shopFields;
      case 'asusInfo':
        return asusFields;
      case 'brandCompetition':
        return brandCompFields;
      case 'consumerDTCompetition':
        return consumerDTFields;
      case 'gamingDTCompetition':
        return gamingDTFields;
      case 'AIOCompetition':
        return aioFields;
      case 'monthlyData':
        return monthlyFields;
      default:
        return [];
    }
  }, []);

  const handleAccordionToggle = useCallback(
    (sectionId: string) => {
      if (sectionId === openAccordion) {
        return;
      }
      const currentSection = sections.find(s => s.id === openAccordion);
      if (currentSection) {
        const sectionFields = getSectionFields(openAccordion);
        const validation = validateSection(
          sectionFields,
          currentSection.values,
        );

        if (!validation.isValid) {
          // Set validation errors for current section and BLOCK the switch
          setValidationErrors(prev => ({
            ...prev,
            [openAccordion]: validation.errors,
          }));

          // Show user-friendly toast message
          const errorCount = Object.keys(validation.errors).length;
          showToast(
            `Please complete all required fields in ${currentSection.title} (${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount > 1 ? '' : 's'} attention)`,
          );

          // Do NOT allow switching - current section must be valid first
          return;
        }

        // Clear validation errors for validated section
        setValidationErrors(prev => ({
          ...prev,
          [openAccordion]: {},
        }));

        // Unlock next section in sequence after successful validation
        const currentIndex = sections.findIndex(s => s.id === openAccordion);
        if (currentIndex < sections.length - 1) {
          const nextSection = sections[currentIndex + 1];
          if (!unlockedSections.includes(nextSection.id)) {
            setUnlockedSections(prev => [...prev, nextSection.id]);
          }
        }
      }
      setOpenAccordion(sectionId);
    },
    [openAccordion, sections, unlockedSections, getSectionFields],
  );

  // Submit handler with full validation
  const handleSubmit = useCallback(() => {
    // Validate all sections
    let allValid = true;
    const newErrors = {
      shopInfo: {},
      asusInfo: {},
      brandCompetition: {},
      consumerDTCompetition: {},
      gamingDTCompetition: {},
      AIOCompetition: {},
      monthlyData: {},
    };

    sections.forEach(section => {
      const sectionFields = getSectionFields(section.id);
      const validation = validateSection(sectionFields, section.values);
      if (!validation.isValid) {
        allValid = false;
        newErrors[section.id as keyof typeof newErrors] = validation.errors;
      }
    });

    if (!allValid) {
      setValidationErrors(newErrors);
      // Open first section with errors
      const firstErrorSection = sections.find(
        s => Object.keys(newErrors[s.id as keyof typeof newErrors]).length > 0,
      );
      if (firstErrorSection) {
        setOpenAccordion(firstErrorSection.id);
      }
      return;
    }

    // All valid - proceed with submission
    const formData = {
      shopInfo,
      asusInfo,
      brandCompetition,
      consumerDTCompetition,
      gamingDTCompetition,
      AIOCompetition,
      monthlyData,
    };
    console.log('Form Data:', formData);
    // Example: API call, navigation, etc.
  }, [
    sections,
    getSectionFields,
    shopInfo,
    asusInfo,
    brandCompetition,
    consumerDTCompetition,
    gamingDTCompetition,
    AIOCompetition,
    monthlyData,
  ]);

  // data - Memoized for performance
  const dropdownOptions = useMemo(
    () => ({
      yesNo: [
        {label: 'Yes', value: 'Yes'},
        {label: 'No', value: 'No'},
      ],
      businessType: [
        {label: 'Retail', value: 'Retail'},
        {label: 'Wholesale', value: 'Wholesale'},
        {label: 'Both', value: 'Both'},
      ],
      brandType: [
        {label: 'Premium', value: 'Premium'},
        {label: 'Standard', value: 'Standard'},
        {label: 'Budget', value: 'Budget'},
        {label: 'None', value: 'None'},
      ],
      modeOfBusiness: [
        {label: 'Online', value: 'Online'},
        {label: 'Offline', value: 'Offline'},
        {label: 'Hybrid', value: 'Hybrid'},
      ],
      salesRange: [
        {label: '0-10', value: '0-10'},
        {label: '10-25', value: '10-25'},
        {label: '25-50', value: '25-50'},
        {label: '50-100', value: '50-100'},
        {label: '100+', value: '100+'},
      ],
      displayRange: [
        {label: '0-5', value: '0-5'},
        {label: '5-10', value: '5-10'},
        {label: '10-20', value: '10-20'},
        {label: '20+', value: '20+'},
      ],
    }),
    [],
  );

  // Field configurations for better maintainability
  const shopFields: FormField[] = [
    {
      key: 'CompanyName',
      type: 'input',
      label: 'Company Name',
      leftIcon: 'briefcase',
      placeholder: 'Enter company name',
      required: true,
      width: 'full',
    },
    {
      key: 'ShopName',
      type: 'input',
      label: 'Shop Name',
      leftIcon: 'shopping-bag',
      placeholder: 'Enter shop name',
      required: true,
      width: 'full',
    },
    {
      key: 'ShopAddress',
      type: 'input',
      label: 'Shop Address',
      leftIcon: 'map-pin',
      placeholder: 'Enter shop address',
      required: true,
      width: 'full',
    },
    {
      key: 'ShopLandLine',
      type: 'input',
      label: 'Shop Landline',
      leftIcon: 'phone',
      keyboardType: 'phone-pad',
      placeholder: 'Enter landline number',
      required: true,
      width: 'full',
    },
    {
      key: 'GSTNo',
      type: 'input',
      label: 'GST Number',
      leftIcon: 'file-text',
      placeholder: 'Enter GST number',
      required: true,
      width: 'full',
    },
    {
      key: 'OwnerName',
      type: 'input',
      label: 'Owner Name',
      leftIcon: 'user',
      placeholder: 'Enter owner name',
      required: true,
      width: 'full',
    },
    {
      key: 'OwnerMailID',
      type: 'input',
      label: 'Owner Email',
      leftIcon: 'mail',
      keyboardType: 'email-address',
      placeholder: 'Enter owner email',
      required: true,
      width: 'half',
    },
    {
      key: 'OwnerNumber',
      type: 'input',
      label: 'Owner Number',
      leftIcon: 'smartphone',
      keyboardType: 'phone-pad',
      placeholder: 'Enter owner number',
      required: true,
      width: 'half',
    },
    {
      key: 'KeyPersonName',
      type: 'input',
      label: 'Key Person Name',
      leftIcon: 'user-check',
      placeholder: 'Enter key person name',
      required: false,
      width: 'half',
    },
    {
      key: 'KeyPersonNo',
      type: 'input',
      label: 'Key Person Contact',
      leftIcon: 'phone-call',
      keyboardType: 'phone-pad',
      placeholder: 'Enter key person number',
      required: false,
      width: 'half',
    },
    {
      key: 'KeyPersonDesig',
      type: 'input',
      label: 'Key Person Designation',
      leftIcon: 'award',
      placeholder: 'Enter designation',
      required: false,
      width: 'half',
    },
    {
      key: 'KeyPersonMail',
      type: 'input',
      label: 'Key Person Email',
      leftIcon: 'at-sign',
      keyboardType: 'email-address',
      placeholder: 'Enter key person email',
      required: false,
      width: 'half',
    },
  ];

  const asusFields: FormField[] = [
    {
      key: 'PinCode',
      type: 'dropdown',
      label: 'Pin Code',
      placeholder: 'Select Pin Code',
      dropdownData: dropdownOptions.salesRange,
      required: true,
      width: 'full',
    },
    {
      key: 'TaskOwner',
      type: 'dropdown',
      label: 'CSE Name',
      placeholder: 'Select CSE Name',
      dropdownData: dropdownOptions.yesNo,
      required: true,
      width: 'full',
    },
    {
      key: 'CustomisedBranding',
      type: 'dropdown',
      label: 'Customised Branding',
      leftIcon: 'tag',
      placeholder: 'Select Branding',
      dropdownData: dropdownOptions.yesNo,
      required: true,
      width: 'full',
    },
    {
      key: 'BusinessType',
      type: 'dropdown',
      label: 'Business Type',
      leftIcon: 'briefcase',
      placeholder: 'Select Business ',
      dropdownData: dropdownOptions.businessType,
      required: true,
      width: 'half',
    },
    {
      key: 'chainStore',
      type: 'dropdown',
      label: 'Chain Store',
      leftIcon: 'link',
      placeholder: 'Chain Store?',
      dropdownData: dropdownOptions.yesNo,
      required: true,
      width: 'half',
    },
    {
      key: 'BANNED',
      type: 'dropdown',
      label: 'Banned Status',
      leftIcon: 'x-circle',
      placeholder: 'Banned?',
      dropdownData: dropdownOptions.yesNo,
      required: true,
      width: 'half',
    },
    {
      key: 'IsLoginCreated',
      type: 'dropdown',
      label: 'Login Created',
      leftIcon: 'log-in',
      placeholder: 'Login Created?',
      dropdownData: dropdownOptions.yesNo,
      required: true,
      width: 'half',
    },
  ];

  const brandCompFields: FormField[] = [
    {
      key: 'AsusType',
      type: 'dropdown',
      label: 'Asus ',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AsusMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'HPType',
      type: 'dropdown',
      label: 'HP',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'HPMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'DellType',
      type: 'dropdown',
      label: 'Dell ',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'DellMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'LenovoType',
      type: 'dropdown',
      label: 'Lenovo ',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'LenovoMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'AcerType',
      type: 'dropdown',
      label: 'Acer ',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AcerMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'MSIType',
      type: 'dropdown',
      label: 'MSI ',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'MSIMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'SamsungType',
      type: 'dropdown',
      label: 'Samsung ',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'SamsungMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
  ];

  const consumerDTFields: FormField[] = [
    {
      key: 'CDTBusinessType',
      type: 'dropdown',
      label: 'Business Type',
      leftIcon: 'briefcase',
      dropdownData: dropdownOptions.businessType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTModeOfBusiness',
      type: 'dropdown',
      label: 'Mode of Business',
      leftIcon: 'shopping-cart',
      dropdownData: dropdownOptions.modeOfBusiness,
      placeholder: 'Select Mode',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTMonthlyNumber',
      type: 'input',
      label: 'Monthly No',
      leftIcon: 'trending-up',
      keyboardType: 'numeric',
      placeholder: 'Monthly Number',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTMonthlyCommNo',
      type: 'input',
      label: 'Stk Commercial No.',
      leftIcon: 'bar-chart',
      keyboardType: 'numeric',
      placeholder: 'Stk Commercial No.',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTWhiteBrand',
      type: 'input',
      label: 'White Brand Monthly No.',
      leftIcon: 'box',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTDealRatio',
      type: 'input',
      label: 'Deal Ratio in Overall DT Business',
      leftIcon: 'percent',
      placeholder: 'Deal Ratio',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTAsusType',
      type: 'dropdown',
      label: 'Asus',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTAsusMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTHPType',
      type: 'dropdown',
      label: 'HP ',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTHPMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTDellType',
      type: 'dropdown',
      label: 'Dell',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTDellMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTLenovoType',
      type: 'dropdown',
      label: 'Lenovo',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTLenovoMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTAcerType',
      type: 'dropdown',
      label: 'Acer',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'CDTAcerMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
  ];

  const gamingDTFields: FormField[] = [
    {
      key: 'GDTMonthlyNumber',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'trending-up',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTMonthlyDIY',
      type: 'input',
      label: 'DIY Monthly No.',
      leftIcon: 'tool',
      keyboardType: 'numeric',
      placeholder: 'DIY Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTAsusType',
      type: 'dropdown',
      label: 'Asus',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTAsusMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTHPType',
      type: 'dropdown',
      label: 'HP',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTHPMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTDellType',
      type: 'dropdown',
      label: 'Dell',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTDellMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTLenovoType',
      type: 'dropdown',
      label: 'Lenovo',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTLenovoMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTAcerType',
      type: 'dropdown',
      label: 'Acer',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'GDTAcerMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
  ];

  const aioFields: FormField[] = [
    {
      key: 'AIOBusinessType',
      type: 'dropdown',
      label: 'Business Type',
      leftIcon: 'briefcase',
      dropdownData: dropdownOptions.businessType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOModeOfBusiness',
      type: 'dropdown',
      label: 'Mode of Business',
      leftIcon: 'shopping-cart',
      dropdownData: dropdownOptions.modeOfBusiness,
      placeholder: 'Select Mode',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOMonthlyNumber',
      type: 'input',
      label: 'Monthly Number',
      leftIcon: 'trending-up',
      keyboardType: 'numeric',
      placeholder: 'Monthly Number',
      required: false,
      width: 'half',
    },
    {
      key: 'AIOMonthlyCommNo',
      type: 'input',
      label: 'Stk Monthly No.',
      leftIcon: 'bar-chart',
      keyboardType: 'numeric',
      placeholder: 'Stk Monthly No.',
      required: false,
      width: 'half',
    },
    {
      key: 'AIOAsusType',
      type: 'dropdown',
      label: 'Asus',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOAsusMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOHPType',
      type: 'dropdown',
      label: 'HP',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOHPMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'AIODellType',
      type: 'dropdown',
      label: 'Dell',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AIODellMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOLenovoType',
      type: 'dropdown',
      label: 'Lenovo',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOLenovoMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOAcerType',
      type: 'dropdown',
      label: 'Acer',
      leftIcon: 'layers',
      dropdownData: dropdownOptions.brandType,
      placeholder: 'Select Type',
      required: true,
      width: 'half',
    },
    {
      key: 'AIOAcerMonthNo',
      type: 'input',
      label: 'Monthly No.',
      leftIcon: 'hash',
      keyboardType: 'numeric',
      placeholder: 'Monthly No.',
      required: true,
      width: 'half',
    },
    {
      key: 'AIODealRatio',
      type: 'input',
      label: 'Deal Ratio',
      leftIcon: 'percent',
      placeholder: 'Enter Percentage',
      keyboardType: 'numeric',
      required: true,
      width: 'full',
    },
  ];

  const monthlyFields: FormField[] = [
    {
      key: 'MonthlyNBSales',
      type: 'dropdown',
      label: 'NB Sales',
      leftIcon: 'shopping-bag',
      dropdownData: dropdownOptions.salesRange,
      placeholder: 'Select NB Sales',
      required: true,
      width: 'full',
    },
    {
      key: 'MonthlyDTAIOSales',
      type: 'dropdown',
      label: 'DT/AIO Sales',
      leftIcon: 'monitor',
      dropdownData: dropdownOptions.salesRange,
      placeholder: 'Select DT/AIO Sales',
      required: true,
      width: 'full',
    },
    {
      key: 'DisplayNB',
      type: 'dropdown',
      label: 'NB Display Unit',
      leftIcon: 'eye',
      dropdownData: dropdownOptions.displayRange,
      placeholder: 'Select NB Display Unit',
      required: true,
      width: 'full',
    },
  ];

  return (
    <AppLayout title="Add New AGP" needBack needPadding needScroll>
      <View className="mt-2 pb-6">
        {/* Required Fields Notice */}
        <View
          className={`flex-row items-start bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 border rounded-xl px-4 py-3.5 mb-4`}>
          <View className="mt-0.5 mr-3">
            <AppIcon
              type="feather"
              name="alert-circle"
              size={18}
              color={'#DC2626'}
            />
          </View>
          <View className="flex-1">
            <AppText
              size="sm"
              className="text-gray-700 dark:text-gray-300 leading-5">
              Fields marked with * are mandatory and must be filled before
              submission.
            </AppText>
          </View>
        </View>

        {/* Shop Information Section */}
        <FormSection
          title="Shop Information"
          icon="shopping-bag"
          iconType="feather"
          fields={shopFields}
          values={shopInfo}
          onValueChange={updateShopInfo}
          validationErrors={validationErrors.shopInfo}
          isOpen={openAccordion === 'shopInfo'}
          onToggle={() => handleAccordionToggle('shopInfo')}
        />

        {/* ASUS Information Section */}
        <FormSection
          title="ASUS Information"
          icon="info"
          iconType="feather"
          fields={asusFields}
          values={asusInfo}
          onValueChange={updateAsusInfo}
          validationErrors={validationErrors.asusInfo}
          isOpen={openAccordion === 'asusInfo'}
          onToggle={() => handleAccordionToggle('asusInfo')}
        />

        {/* Brand Competition Section */}
        <FormSection
          title="Brand Competition"
          icon="award"
          iconType="feather"
          fields={brandCompFields}
          values={brandCompetition}
          onValueChange={updateBrandCompetition}
          validationErrors={validationErrors.brandCompetition}
          isOpen={openAccordion === 'brandCompetition'}
          onToggle={() => handleAccordionToggle('brandCompetition')}
        />

        {/* Consumer DT Competition Section */}
        <FormSection
          title="Consumer DT Competition"
          icon="monitor"
          iconType="feather"
          fields={consumerDTFields}
          values={consumerDTCompetition}
          onValueChange={updateConsumerDTCompetition}
          validationErrors={validationErrors.consumerDTCompetition}
          isOpen={openAccordion === 'consumerDTCompetition'}
          onToggle={() => handleAccordionToggle('consumerDTCompetition')}
        />

        {/* Gaming DT Competition Section */}
        <FormSection
          title="Gaming DT Competition"
          icon="cpu"
          iconType="feather"
          fields={gamingDTFields}
          values={gamingDTCompetition}
          onValueChange={updateGamingDTCompetition}
          validationErrors={validationErrors.gamingDTCompetition}
          isOpen={openAccordion === 'gamingDTCompetition'}
          onToggle={() => handleAccordionToggle('gamingDTCompetition')}
        />

        {/* AIO Competition Section */}
        <FormSection
          title="AIO Competition"
          icon="tablet"
          iconType="feather"
          fields={aioFields}
          values={AIOCompetition}
          onValueChange={updateAIOCompetition}
          validationErrors={validationErrors.AIOCompetition}
          isOpen={openAccordion === 'AIOCompetition'}
          onToggle={() => handleAccordionToggle('AIOCompetition')}
        />

        {/* Monthly Data Section */}
        <FormSection
          title="Monthly Sales Data"
          icon="bar-chart-2"
          iconType="feather"
          fields={monthlyFields}
          values={monthlyData}
          onValueChange={updateMonthlyData}
          validationErrors={validationErrors.monthlyData}
          isOpen={openAccordion === 'monthlyData'}
          onToggle={() => handleAccordionToggle('monthlyData')}
        />

        {/* Submit Button */}
        <View className="mt-6">
          <AppButton
            title="Submit"
            onPress={handleSubmit}
            iconName="check-circle"
            className="bg-green-500 rounded-xl py-4 shadow-lg"
            size="lg"
            weight="bold"
          />
        </View>
      </View>
    </AppLayout>
  );
}
