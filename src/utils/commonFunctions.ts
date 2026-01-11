import moment from 'moment';
// import CryptoJS from 'react-native-crypto-js';
import Toast from 'react-native-simple-toast';
import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {AppColors} from '../config/theme';
import {useLoginStore} from '../stores/useLoginStore';
import {ASUS} from './constant';
import { Platform } from 'react-native';

export const getPlatformVersion = () => {
  const v = Platform.Version;
  return typeof v === 'number' ? v : parseInt(String(v), 10);
}

const getAPACcurrencySymbol = () => {
  const {EMP_RoleId, EMP_CountryID} = useLoginStore.getState().userInfo;
  if (EMP_RoleId === ASUS.ROLE_ID.PARTNERS) {
    switch (EMP_CountryID) {
      case ASUS.COUNTRIES.ATID:
        return 'Rp'; // Indonesia Rupiah
      case ASUS.COUNTRIES.ACMY:
        return 'RM'; // Malaysian Ringgit
      case ASUS.COUNTRIES.ACSG:
        return 'S$'; // Singapore Dollar
      case ASUS.COUNTRIES.ACJP:
        return '\u00A5'; // Japanese Yen
      case ASUS.COUNTRIES.TW:
        return 'NT$'; // New Taiwan Dollar
      default:
        return '\u0024'; // USD
    }
  } else {
    return '\u0024'; // USD
  }
};

export const convertToASINUnits = (
  amount: number,
  needFull = false,
  needCurrencySymbol = false,
): string => {
  const currencySymbol = needCurrencySymbol ? '\u20B9' : '';

  if (needFull) {
    return `${currencySymbol}${amount.toLocaleString('en-IN')}`;
  }

  let formattedValue: string;
  if (amount >= 1e7) {
    formattedValue = `${(amount / 1e7).toFixed(2).replace(/\.00$/, '')} Cr`;
  } else if (amount >= 1e5) {
    formattedValue = `${(amount / 1e5).toFixed(2).replace(/\.00$/, '')} L`;
  } else {
    formattedValue = amount.toString();
  }
  return `${currencySymbol}${formattedValue}`;
};

export const convertToAPACUnits = (
  amount: number,
  needFull = false,
  needCurrencySymbol = false,
): string => {
  const currencySymbol = needCurrencySymbol ? getAPACcurrencySymbol() : '';
  if (needFull) {
    return `${currencySymbol}${amount.toLocaleString('en-US')}`;
  }
  let formattedValue: string;

  if (amount >= 1e9) {
    // Billion
    formattedValue = `${(amount / 1e9).toFixed(2).replace(/\.00$/, '')}B`;
  } else if (amount >= 1e6) {
    // Million
    formattedValue = `${(amount / 1e6).toFixed(2).replace(/\.00$/, '')}M`;
  } else if (amount >= 1e3) {
    // Thousand
    formattedValue = `${(amount / 1e3).toFixed(2).replace(/\.00$/, '')}K`;
  } else {
    formattedValue = amount.toString();
  }
  return `${currencySymbol}${formattedValue}`;
};

export const convertToCapitalized = (text: string): string => {
  return text
    .split('')
    .map(char => char.toUpperCase())
    .join('');
};

export const getPastMonths = (
  count=6,
  isForward?: boolean,
  startFrom?: string,
): {label: string; value: string}[] => {
  const months: {label: string; value: string}[] = [];
  const baseDate = startFrom ? moment(startFrom, 'YYYYM').subtract(15, 'days') : moment().subtract(15, 'days');
  if (isForward) {
    for (let i = 0; i < count; i++) {
      months.push({
        label: baseDate.clone().add(i, 'months').format('MMM-YYYY'),
        value: baseDate.clone().add(i, 'months').format('YYYYM'),
      });
    }
    return months;
  }
  for (let i = 0; i < count; i++) {
    months.push({
      label: baseDate.clone().subtract(i, 'months').format('MMM-YYYY'),
      value: baseDate.clone().subtract(i, 'months').format('YYYYM'),
    });
  }
  return months;
};

export const getPastQuarters = (
  count = 5,
  isForward?: boolean,
): {label: string; value: string}[] => {
  const quarters: {label: string; value: string}[] = [];
  const baseDate = moment().subtract(15, 'days');
  if (isForward) {
    for (let i = 0; i < count; i++) {
      const date = baseDate.clone().add(i, 'quarters');
      quarters.push({
        label: `Q${date.format('Q')}-${date.format('YYYY')}`,
        value: `${date.format('YYYY')}${date.format('Q')}`,
      });
    }
    return quarters; // future quarters stay in order
  }
  for (let i = 0; i < count; i++) {
    const date = baseDate.clone().subtract(i, 'quarters');
    quarters.push({
      label: `Q${date.format('Q')}-${date.format('YYYY')}`,
      value: `${date.format('YYYY')}${date.format('Q')}`,
    });
  }
  return quarters;
};

export const getDaysBetween = (start: string, end: string): number => {
  const startDate = moment(start);
  const endDate = moment(end);
  return endDate.diff(startDate, 'days');
};

// Ensure folder exists
export const ensureFolderExists = async (path: string) => {
  try {
    const folderPath = path.replace(/\/+$/, '');
    const isExists = await RNFS.exists(folderPath);
    if (!isExists) {
      await RNFS.mkdir(folderPath);
      console.log('Folder created:', folderPath);
    } else {
      console.log('Folder already exists:', folderPath);
    }
  } catch (err) {
    console.error('Failed to create folder:', err);
    throw err;
  }
};

export const showToast = (message: string) => {
  Toast.showWithGravity(
    typeof message === 'string' ? message : JSON.stringify(message),
    Toast.BOTTOM,
    Toast.LONG,
    {
      backgroundColor: 'black',
      textColor: 'white',
      tapToDismissEnabled: true,
    },
  );
};

export const convertToTitleCase = (text: string): string => {
  return text
    .toLowerCase() // Convert the entire string to lowercase first
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};

export const convertCamelCaseToSentence = (text: string): string => {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before uppercase letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle acronyms followed by lowercase
    .replace(/([0-9]+)/g, ' $1 ') // Add space around numbers
    .trim(); // Remove leading/trailing spaces
};

export const convertSnakeCaseToSentence = (text: string): string => {
  return text
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before uppercase letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle acronyms followed by lowercase
    .replace(/([0-9]+)/g, ' $1 ') // Add space around numbers
    .trim() // Remove leading/trailing spaces
    .toLowerCase() // Ensure all lowercase before capitalizing
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};

export const convertImageToBase64 = async (
  imageUri: string,
  needPrefix = false,
): Promise<string> => {
  try {
    if (!imageUri || imageUri.length === 0) return '';

    // Normalize URI
    let normalizedUri = imageUri;
    if (imageUri.startsWith('file://')) {
      normalizedUri = imageUri.replace('file://', '');
    }

    // Read file as base64
    const base64String = await ReactNativeBlobUtil.fs.readFile(
      normalizedUri,
      'base64',
    );

    if (!needPrefix) {
      return base64String;
    }
    // Return with data URI prefix
    return `data:image/jpeg;base64,${base64String}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image to base64');
  }
};

export const getProductConfig = (
  index: number,
): {icon: string; color: string} => {
  const configs: {icon: string; color: string}[] = [
    {icon: 'laptop', color: AppColors.utilColor1},
    {icon: 'monitor', color: AppColors.utilColor2},
    {icon: 'monitor-speaker', color: AppColors.utilColor3},
    {icon: 'desktop-tower-monitor', color: AppColors.utilColor4},
    {icon: 'desktop-tower', color: AppColors.utilColor5},
    {icon: 'cube-outline', color: AppColors.utilColor6},
    {icon: 'book-open-variant', color: AppColors.utilColor7},
    {icon: 'wifi', color: AppColors.utilColor8},
    {icon: 'package-variant', color: AppColors.utilColor9},
  ];
  return configs[index] || {icon: 'package', color: AppColors.utilColor1};
};

export const formatUnique = (
  arr: any[],
  valueKey: string,
  labelKey: string = valueKey,
) => {
  if (!Array.isArray(arr)) return [];

  return [
    ...new Map(
      arr.map(item => [
        item[valueKey],
        {label: item[labelKey] ?? item[valueKey], value: item[valueKey]},
      ]),
    ).values(),
  ];
};

export const applyOpacityHex = (hex: string, opacity: number) => {
  const base = hex.replace('#', '');
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${base}${alpha}`;
};

export const convertStringToNumber = (value: string | number): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (!value || value.trim() === '') {
    return null;
  }
  const cleanedValue = value.replace(/[^0-9.-]/g, '');
  const parsedValue = parseFloat(cleanedValue);
  return isNaN(parsedValue) ? null : parsedValue;
}

export const getCurrentQuarter = () => {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return Number(`${year}${quarter}`);
};

export function to12HourFormat(time24:string) {
  const [hour, minute] = time24.split(':').map(Number);

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

export const getMimeTypeFromUrl = (url: string): string => {
  if (!url) return 'application/octet-stream';

  // Remove query params and fragments
  const cleanUrl = url.split('?')[0].split('#')[0];

  // Extract extension
  const extension = cleanUrl.split('.').pop()?.toLowerCase();

  if (!extension) return 'application/octet-stream';

  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',

    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',

    mp3: 'audio/mpeg',
    wav: 'audio/wav',

    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
  };

  return mimeTypes[extension] || 'application/octet-stream';
};



