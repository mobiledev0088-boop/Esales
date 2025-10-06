import { Alert } from 'react-native';
import { ActivationData, TabConfig, TableColumn } from '../../../../types/dashboard';

// Error handling utilities for Dashboard
export const handleApiError = (error: Error | null, componentName: string = 'Component') => {
  if (!error) return null;
  
  console.error(`${componentName} Error:`, error.message);
  return {
    title: 'Something went wrong',
    message: `Unable to load ${componentName.toLowerCase()} data. Please try again.`,
    retry: true
  };
};

export const calculatePercentage = (achieved: string | number, target: string | number): number => {
  const achievedNum = Number(achieved) || 0;
  const targetNum = Number(target) || 0;
  
  if (targetNum === 0) return 0;
  return Math.round((achievedNum / targetNum) * 100);
};

export const getPerformanceColor = (percentage: number): {
  bgColor: string;
  textColor: 'success' | 'warning' | 'error';
} => {
  if (percentage >= 90) {
    return { bgColor: 'bg-green-100', textColor: 'success' };
  } else if (percentage >= 70) {
    return { bgColor: 'bg-orange-100', textColor: 'warning' };
  } else {
    return { bgColor: 'bg-red-100', textColor: 'error' };
  }
};

export const formatDisplayValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === '') return '0';
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);
  return numValue.toLocaleString('en-IN');
};

export const showErrorAlert = (title: string, message: string, onRetry?: () => void) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      ...(onRetry ? [{
        text: 'Retry',
        onPress: onRetry,
      }] : []),
    ]
  );
};

const NAME_COLUMN: TableColumn[] = [
  {
    key: 'name',
    label: 'Name',
    width: 'flex-1',
    dataKey: 'name',
    colorType: 'text',
  },
];
const COMMON_COLUMNS: TableColumn[] = [
  {
    key: 'act',
    label: 'ACT',
    width: 'w-16',
    dataKey: 'Act_Cnt',
    colorType: 'success',
  },
  {
    key: 'nAct',
    label: 'N-ACT',
    width: 'w-20',
    dataKey: 'NonAct_Cnt',
    colorType: 'error',
  },
];

export const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'branch',
    label: 'Branch',
    columns: [
      ...NAME_COLUMN,
      {
        key: 'pod',
        label: 'POD',
        width: 'w-16',
        dataKey: 'POD_Cnt',
        colorType: 'text',
      },
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'alp',
    label: 'ALP',
    columns: [
      ...NAME_COLUMN,
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'model',
    label: 'Model',
    columns: [
      ...NAME_COLUMN,
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'agp',
    label: 'AGP',
    columns: [
      ...NAME_COLUMN,
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'asp',
    label: 'ASP',
    columns: [
      ...NAME_COLUMN,
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'disti',
    label: 'Disti',
    columns: [
      ...NAME_COLUMN,
      {
        key: 'pod',
        label: 'POD',
        width: 'w-16',
        dataKey: 'POD_Cnt',
        colorType: 'text',
      },
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      ...COMMON_COLUMNS,
    ],
  },
];

export const getCurrentTabConfig = (tabId: string): TabConfig => {
  return TAB_CONFIGS.find(config => config.id === tabId) || TAB_CONFIGS[0];
};

// ---------------------------------------------
// Activation Performance Utilities (hoisted)
// ---------------------------------------------
export const DEFAULT_ACTIVATION_TABS = ['Branch', 'ALP', 'Model', 'AGP', 'ASP', 'Disti'] as const;

export const TAB_LABEL_TO_ID: Record<string, string> = {
  Branch: 'branch',
  ALP: 'alp',
  Model: 'model',
  AGP: 'agp',
  ASP: 'asp',
  Disti: 'disti',
};

export const ACTIVATION_ID_TO_DATA_KEY: Record<string, string> = {
  branch: 'Top5Branch',
  alp: 'Top5ALP',
  model: 'Top5Model',
  agp: 'Top5AGP',
  asp: 'Top5ASP',
  disti: 'Top5Disti',
};

export const deriveInitialActiveId = (labels: string[]): string => {
  if (!labels || labels.length === 0) return TAB_CONFIGS[0].id;
  const first = labels[0];
  return TAB_LABEL_TO_ID[first] || TAB_CONFIGS[0].id;
};

export const getActivationTabData = (baseData: any, tabId: string): ActivationData[] => {
  if (!baseData) return [];
  const key = ACTIVATION_ID_TO_DATA_KEY[tabId];
  // Fallback if mapping missing
  if (!key) return [];
  return (baseData as any)[key] || [];
};