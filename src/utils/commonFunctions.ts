import moment from 'moment';
import CryptoJS from 'react-native-crypto-js';
import Toast from 'react-native-simple-toast';
import RNFS from 'react-native-fs';
import React, { useEffect, useRef } from 'react';
import ReactNativeBlobUtil  from 'react-native-blob-util';

export const convertToASINUnits = (
  amount: number,
  needFull = false,
  needCurrencySymbol = false
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


export const convertToCapitalized = (text: string): string => {
  return text.split('').map(char => char.toUpperCase()).join('');
}

export const getPastMonths = (count: number, isForward?: boolean): {label: string, value: string}[] => {
  const months: {label: string, value: string}[]  = [];
  if (isForward) {
    for (let i = 0; i < count; i++) {
      months.push({
      label: moment().subtract(i, 'months').format("MMM-YYYY"),
      value: moment().subtract(i, 'months').format("YYYYM")
      });
    }
    return months;
  }
  for (let i = 0; i < count; i++) {
    months.push({
      label: moment().subtract(i, 'months').format("MMM-YYYY"),
      value: moment().subtract(i, 'months').format("YYYYM")
    });
  }
  return months
};

export const getPastQuarters = (count: number = 5, isForward?: boolean): {label: string, value: string}[] => {
  const quarters: {label: string, value: string}[] = [];
  const baseDate = moment().subtract(15, "days");
  if (isForward) {
    for (let i = 0; i < count; i++) {
      const date = baseDate.clone().add(i, "quarters");
      quarters.push({
        label: `Q${date.format("Q")}-${date.format("YYYY")}`,
        value: `${date.format("YYYY")}${date.format("Q")}`
      });
    }
    return quarters; // future quarters stay in order
  }
  for (let i = 0; i < count; i++) {
    const date = baseDate.clone().subtract(i, "quarters");
    quarters.push({
      label: `Q${date.format("Q")}-${date.format("YYYY")}`,
      value: `${date.format("YYYY")}${date.format("Q")}`
    });
  }
  return quarters 
};

export const getDaysBetween = (start: string, end: string): number => {
  const startDate = moment(start);
  const endDate = moment(end);
  return endDate.diff(startDate, 'days');
};

// Ensure folder exists
export const ensureFolderExists = async (path: string) => {
  if (!(await RNFS.exists(path))) {
    await RNFS.mkdir(path);
  }
};


export const ecrypt = (text: string) => {
  var secureKey = 'MAKV2SPBNI992122';
  var secureIV = 'MobileApp@1A2$US';
  var key = CryptoJS.enc.Utf8.parse(secureKey);
  var iv = CryptoJS.enc.Utf8.parse(secureIV);
  var encText = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key, {
    keySize: 128 / 8,
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
  console.log('Encrypted Text:', encText);
  return encText;
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

export const convertImageToBase64 = async (imageUri: string, needPrefix=false): Promise<string> => {
  try {
    if(!imageUri || imageUri.length === 0) return '';
    
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