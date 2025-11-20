import {View, TouchableOpacity, Keyboard} from 'react-native';
import {useMemo, useState, useCallback, memo, use, useEffect, useRef} from 'react';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import AppIcon from '../../../../../components/customs/AppIcon';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';

type MachineType = 'P500MV' | 'P500SV';

interface RadioButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}
interface ResultValue {
  label: string;
  value: string;
  isTraditional?: boolean;
  highlight?: boolean;
}

interface FormData {
  machineType: MachineType;
  avgUCRate: string;
  usageTimePerDay: string;
  daysPerYear: string;
  yearsOfUse: string;
  P500MVMachinesNum: string;
  computerConfiguration: string;
}

const INITIAL_FORM_DATA: FormData = {
  machineType: 'P500MV',
  avgUCRate: '',
  usageTimePerDay: '',
  daysPerYear: '',
  yearsOfUse: '',
  P500MVMachinesNum: '',
  computerConfiguration: '',
};

const INPUT_FIELDS = [
  {
    key: 'avgUCRate' ,
    label: 'Average UC Rate',
    placeholder: 'Enter average UC rate',
    keyboardType: 'decimal-pad',
  },
  {
    key: 'usageTimePerDay' ,
    label: 'Usage Time Per Day (hours)',
    placeholder: 'Enter usage time per day',
    keyboardType: 'decimal-pad' ,
  },
  {
    key: 'daysPerYear' ,
    label: 'Days Per Year',
    placeholder: 'Enter days per year',
    keyboardType: 'number-pad' ,
  },
  {
    key: 'yearsOfUse' ,
    label: 'Years of Use',
    placeholder: 'Enter years of use',
    keyboardType: 'number-pad' ,
  },
  {
    key: 'P500MVMachinesNum' ,
    label: 'P500MV Machines Number',
    placeholder: 'Enter number of machines',
    keyboardType: 'number-pad' ,
  },
] as const;

const RadioButton = memo<RadioButtonProps>(({label, selected, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`flex-1 flex-row items-center px-4 py-3 rounded-lg border ${
      selected
        ? 'border-primary bg-primary/5'
        : 'border-slate-400 dark:border-darkBorder'
    }`}>
    <View
      className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
        selected ? 'border-primary' : 'border-slate-400 dark:border-slate-500'
      }`}>
      {selected && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
    </View>
    <AppText
      size="sm"
      weight="medium"
      className={
        selected
          ? 'text-primary'
          : 'text-lightText-text dark:text-darkText-text'
      }>
      {label}
    </AppText>
  </TouchableOpacity>
));

const Results = ({formData}: {formData: FormData}) => {
  const [calcResults, setCalcResults] = useState({
    perHourTraditionalDT: 0,
    perHourMachineType: 0,
    dailyUsageTraditionalDT: 0,
    dailyUsageMachineType: 0,
    yearlyUsageTraditionalDT: 0,
    yearlyUsageMachineType: 0,
    yearlyCostTraditionalDT: 0,
    yearlyCostMachineType: 0,
    yearlySavings: 0,
    totalSavingsForMachines: 0,
    savingsPercent: 0,
    traditionalDTName: '',
  });
  const {
    machineType,
    computerConfiguration,
    avgUCRate,
    usageTimePerDay,
    daysPerYear,
    yearsOfUse,
    P500MVMachinesNum,
  } = formData;

  // Power configuration lookup table for better performance and maintainability
  const POWER_CONFIG = useMemo(() => {
    const configs: Record<
      string,
      {traditional: number; p500mv: number; p500sv: number; name: string}
    > = {
      '1': {traditional: 39.1, p500mv: 25.76, p500sv: 25.2, name: 'Intel Core i7-14700'},
      '1b': {traditional: 38.7, p500mv: 25.76, p500sv: 25.2, name: 'Intel Core i7-13700'},
      '2': {traditional: 28.8, p500mv: 23.26, p500sv: 20.7, name: 'Intel Core i5-14400'},
      '2b': {traditional: 28.0, p500mv: 23.26, p500sv: 20.7, name: 'Intel Core i5-13400'},
      '3': {traditional: 26.5, p500mv: 20.41, p500sv: 16.7, name: 'Intel Core i3-13100'},
    };
    return configs;
  }, []);

  const calculatePower = useCallback(() => {
    Keyboard.dismiss();

    // Input validation and parsing
    const unitRate = parseFloat(avgUCRate) || 0;
    const usageTime = parseFloat(usageTimePerDay) || 0;
    const daysPerYearNum = parseInt(daysPerYear) || 0;
    const yearsOfUseNum = parseInt(yearsOfUse) || 0;
    const numMachines = parseInt(P500MVMachinesNum) || 0;

    // Early return if invalid inputs
    if (!unitRate || !usageTime || !daysPerYearNum || !yearsOfUseNum || !numMachines) {
      return;
    }

    // Get power values from configuration
    const config = POWER_CONFIG[computerConfiguration];
    if (!config) return;

    const traditionalDTPower = config.traditional;
    const machineTypePower = machineType === 'P500MV' ? config.p500mv : config.p500sv;
    const traditionalDTName = config.name;

    // Convert Watts to kWh (divide by 1000)
    const WATTS_TO_KWH = 0.001;
    const perHourTraditionalDT = traditionalDTPower * WATTS_TO_KWH;
    const perHourMachineType = machineTypePower * WATTS_TO_KWH;

    // Calculate consumption hierarchy: hour → day → year
    const dailyUsageTraditionalDT = perHourTraditionalDT * usageTime;
    const dailyUsageMachineType = perHourMachineType * usageTime;

    const yearlyUsageTraditionalDT = dailyUsageTraditionalDT * daysPerYearNum;
    const yearlyUsageMachineType = dailyUsageMachineType * daysPerYearNum;

    // Calculate costs
    const yearlyCostTraditionalDT = yearlyUsageTraditionalDT * unitRate;
    const yearlyCostMachineType = yearlyUsageMachineType * unitRate;

    // Calculate savings
    const yearlySavings = yearlyCostTraditionalDT - yearlyCostMachineType;
    const totalSavingsForMachines = yearlySavings * numMachines * yearsOfUseNum;

    // Calculate savings percentage
    const savingsPercent = yearlyCostTraditionalDT > 0
      ? (yearlySavings / yearlyCostTraditionalDT) * 100
      : 0;

    // Update state with calculated results
    setCalcResults({
      perHourTraditionalDT,
      perHourMachineType,
      dailyUsageTraditionalDT,
      dailyUsageMachineType,
      yearlyUsageTraditionalDT,
      yearlyUsageMachineType,
      yearlyCostTraditionalDT,
      yearlyCostMachineType,
      yearlySavings,
      totalSavingsForMachines,
      savingsPercent,
      traditionalDTName,
    });
  }, [
    avgUCRate,
    usageTimePerDay,
    daysPerYear,
    yearsOfUse,
    P500MVMachinesNum,
    computerConfiguration,
    machineType,
    POWER_CONFIG,
  ]);

  // Auto-calculate when all required fields are filled
  useEffect(() => {
    if (
      avgUCRate &&
      usageTimePerDay &&
      daysPerYear &&
      yearsOfUse &&
      P500MVMachinesNum &&
      computerConfiguration
    ) {
      calculatePower();
    }
  }, [calculatePower]);

  const resultsData: Array<{
    title: string;
    icon: string;
    iconType: 'ionicons';
    iconBg: string;
    iconColor: string;
    values: ResultValue[];
  }> = [
    {
      title: 'Per-hour Power Consumption (kWh)',
      icon: 'flash',
      iconType: 'ionicons' as const,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: '#3B82F6',
      values: [
        {
          label: calcResults?.traditionalDTName || 'Traditional Computer',
          value: `${calcResults?.perHourTraditionalDT.toFixed(2)} kWh/hour`,
          isTraditional: true,
        },
        {
          label: `${machineType} Computer`,
          value: `${calcResults?.perHourMachineType.toFixed(2)} kWh/hour`,
          isTraditional: false,
        },
      ],
    },
    {
      title: 'Daily Power Consumption (kWh)',
      icon: 'sunny',
      iconType: 'ionicons' as const,
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: '#F97316',
      values: [
        {
          label: calcResults?.traditionalDTName || 'Traditional Computer',
          value: `${calcResults?.dailyUsageTraditionalDT.toFixed(2)} kWh/day`,
          isTraditional: true,
        },
        {
          label: `${machineType} Computer`,
          value: `${calcResults?.dailyUsageMachineType.toFixed(2)} kWh/day`,
          isTraditional: false,
        },
      ],
    },
    {
      title: 'Yearly Power Consumption (kWh)',
      icon: 'calendar',
      iconType: 'ionicons' as const,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: '#A855F7',
      values: [
        {
          label: calcResults?.traditionalDTName || 'Traditional Computer',
          value: `${calcResults?.yearlyUsageTraditionalDT.toFixed(2)} kWh/year`,
          isTraditional: true,
        },
        {
          label: `${machineType} Computer`,
          value: `${calcResults?.yearlyUsageMachineType.toFixed(2)} kWh/year`,
          isTraditional: false,
        },
      ],
    },
    {
      title: 'Power Cost (INR) for 1 Year',
      icon: 'cash',
      iconType: 'ionicons' as const,
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: '#10B981',
      values: [
        {
          label: calcResults?.traditionalDTName || 'Traditional Computer',
          value: `₹${calcResults?.yearlyCostTraditionalDT.toFixed(2)}`,
          isTraditional: true,
        },
        {
          label: `${machineType} Computer`,
          value: `₹${calcResults?.yearlyCostMachineType.toFixed(2)}`,
          isTraditional: false,
        },
      ],
    },
    {
      title: 'Power Cost Savings Difference',
      icon: 'trending-down',
      iconType: 'ionicons' as const,
      iconBg: 'bg-teal-100 dark:bg-teal-900/30',
      iconColor: '#14B8A6',
      values: [
        {
          label: `Total Savings (${yearsOfUse} ${parseInt(yearsOfUse) > 1 ? 'years' : 'year'})`,
          value: `₹${(calcResults?.yearlySavings * parseInt(yearsOfUse || '1')).toFixed(2)}`,
          highlight: true,
        },
        {
          label: 'Savings Per Year',
          value: `${calcResults?.savingsPercent.toFixed(1)}%`,
          highlight: true,
        },
      ],
    },
    {
      title: `Power Cost Savings for ${P500MVMachinesNum} Machines`,
      icon: 'stats-chart',
      iconType: 'ionicons' as const,
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: '#EC4899',
      values: [
        {
          label: `Total Savings (${yearsOfUse} ${parseInt(yearsOfUse) > 1 ? 'years' : 'year'})`,
          value: `₹${calcResults?.totalSavingsForMachines.toFixed(2)}`,
          highlight: true,
        },
        {
          label: 'Annual Savings Rate',
          value: `${calcResults?.savingsPercent.toFixed(1)}%`,
          highlight: true,
        },
      ],
    },
  ];

  if (calcResults.perHourTraditionalDT === 0) {
    return null;
  }

  return (
    <View className="mt-6 gap-4">
      {/* Results Header */}
      <View className="flex-row items-center gap-3 mb-2">
        <View className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
          <AppIcon
            type="ionicons"
            name="checkmark-circle"
            size={24}
            color="#10B981"
          />
        </View>
        <AppText
          size="lg"
          weight="bold"
          className="text-heading dark:text-darkText-heading flex-1">
          Calculation Results
        </AppText>
      </View>

      {/* Results Cards */}
      {resultsData.map((section, index) => (
        <Card key={index} className="p-4">
          <View className="gap-3">
            {/* Section Header */}
            <View className="flex-row items-center gap-3 mb-1">
              <View className={`p-2.5 rounded-lg ${section.iconBg}`}>
                <AppIcon
                  type={section.iconType}
                  name={section.icon}
                  size={20}
                  color={section.iconColor}
                />
              </View>
              <AppText
                size="md"
                weight="semibold"
                className="text-lightText-heading dark:text-darkText-heading flex-1">
                {section.title}
              </AppText>
            </View>

            {/* Values */}
            <View className="gap-2.5 pl-1">
              {section.values.map((item, idx) => (
                <View
                  key={idx}
                  className={`flex-row justify-between items-center py-2.5 px-3 rounded-lg ${
                    item.highlight
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}>
                  <View className="flex-1 mr-3">
                    <AppText
                      size="sm"
                      weight="medium"
                      className={`${
                        item.highlight
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}>
                      {item.label}
                    </AppText>
                  </View>
                  <View
                    className={`px-3 py-1.5 rounded-md ${
                      item.highlight
                        ? 'bg-green-100 dark:bg-green-900/40'
                        : item.isTraditional
                        ? 'bg-red-100 dark:bg-red-900/40'
                        : 'bg-blue-100 dark:bg-blue-900/40'
                    }`}>
                    <AppText
                      size="sm"
                      weight="bold"
                      className={`${
                        item.highlight
                          ? 'text-green-700 dark:text-green-300'
                          : item.isTraditional
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>
                      {item.value}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Card>
      ))}

      {/* Summary Card */}
      <Card>
        <View className="items-center gap-2">
          <AppIcon
            type="ionicons"
            name="leaf"
            size={32}
            color="#10B981"
          />
          <AppText
            size="sm"
            weight="semibold"
            className="text-green-700 dark:text-green-300 text-center">
            You're saving the environment by reducing power consumption!
          </AppText>
          <AppText
            size="xs"
            className="text-green-600 dark:text-green-400 text-center mt-1">
            Lower energy usage means reduced carbon footprint and cost savings.
          </AppText>
        </View>
      </Card>
    </View>
  );
};

export default function PowerCalculator() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const scrollRef = useRef<any>(null);

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData(prev => ({...prev, [field]: value}));
    },
    [],
  );

  const isFormValid = useMemo(() => {
    return (
      formData.avgUCRate &&
      formData.usageTimePerDay &&
      formData.daysPerYear &&
      formData.yearsOfUse &&
      formData.P500MVMachinesNum &&
      formData.computerConfiguration
    );
  }, [formData]);

  const handleCalculate = useCallback(() => {
    if (!isFormValid) {
      return;
    }
    setShowResults(true);
    setTimeout(() => {
      scrollRef.current?.scrollToPosition(0, 780, true);
    }, 300);
  }, [isFormValid]);

  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setShowResults(false);
    setIsDropdownOpen(false);
    scrollRef.current?.scrollToPosition(0, 0, true);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const computerConfigOptions = useMemo<AppDropdownItem[]>(
    () => [
      {
        label: `Traditional DT i7 14700 & ${formData.machineType} i7`,
        value: '1',
      },
      {
        label: `Traditional DT i7 13700 & ${formData.machineType} i7`,
        value: '1b',
      },
      {
        label: `Traditional DT i5 14400 & ${formData.machineType} i5`,
        value: '2',
      },
      {
        label: `Traditional DT i5 13400 & ${formData.machineType} i5`,
        value: '2b',
      },
      {
        label: `Traditional DT i3 13100 & ${formData.machineType} i3`,
        value: '3',
      },
    ],
    [formData.machineType],
  );

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <KeyboardAwareScrollView
       ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
          paddingHorizontal: 12,
          paddingTop: 15,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <View className="flex-row items-start gap-3">
          <View className="bg-primary/10 p-3 rounded-lg">
            <AppIcon
              type="ionicons"
              name="calculator"
              size={24}
              color="primary"
            />
          </View>
          <AppText
            size="lg"
            weight="bold"
            className="text-heading dark:text-darkText-heading mb-5 w-[80%]">
            Power Consumption & Savings Calculator
          </AppText>
        </View>

        <Card>
          <View className="gap-4">
            {/* Machine Type Radio Buttons */}
            <View>
              <AppText
                size="md"
                weight="medium"
                className="text-lightText-text dark:text-darkText-text mb-2">
                Machine Type
              </AppText>
              <View className="flex-row gap-3">
                <RadioButton
                  label="P500MV"
                  selected={formData.machineType === 'P500MV'}
                  onPress={() => handleInputChange('machineType', 'P500MV')}
                />
                <RadioButton
                  label="P500SV"
                  selected={formData.machineType === 'P500SV'}
                  onPress={() => handleInputChange('machineType', 'P500SV')}
                />
              </View>
            </View>

            {/* Dynamic Input Fields */}
            {INPUT_FIELDS.map(field => (
              <AppInput
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                value={formData[field.key]}
                setValue={value => handleInputChange(field.key, value)}
                keyboardType={field.keyboardType}
                variant="border"
                size="md"
              />
            ))}

            {/* Computer Configuration Dropdown */}
            <AppDropdown
              mode="dropdown"
              label="Computer Configuration"
              placeholder="Select computer configuration"
              data={computerConfigOptions}
              selectedValue={formData.computerConfiguration}
              onSelect={item =>
                handleInputChange('computerConfiguration', item?.value || '')
              }
              onOpenChange={toggleDropdown}
            />

            {/* Spacer when dropdown is open */}
            {isDropdownOpen && <View className="h-52" />}

            {/* Action Buttons */}
            <View className="mt-2 flex-row gap-3 items-center">
              <TouchableOpacity
                onPress={handleReset}
                activeOpacity={0.7}
                className="bg-slate-500 p-4 rounded-lg items-center justify-center">
                <AppIcon
                  type="ionicons"
                  name="refresh"
                  size={20}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <View className="flex-1">
                <AppButton
                  title="Calculate"
                  onPress={handleCalculate}
                  className={`rounded-lg py-4 ${
                    isFormValid ? 'bg-green-500' : 'bg-slate-400'
                  }`}
                  size="md"
                  weight="semibold"
                  disabled={!isFormValid}
                />
              </View>
            </View>
          </View>
        </Card>
        {showResults && <Results formData={formData} />}
      </KeyboardAwareScrollView>
    </View>
  );
}
