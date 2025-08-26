import moment from 'moment';
import CryptoJS from 'react-native-crypto-js';
import Toast from 'react-native-simple-toast';
import RNFS from 'react-native-fs';

export const formatToINR = (amount: number, showDecimals = false) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export const getPastMonths = (count: number, isForward?: boolean): string[] => {
  const months: string[] = [];
  if (isForward) {
    for (let i = 0; i < count; i++) {
      months.push(moment().add(i, 'months').format('MMM YYYY'));
    }
    return months; // No need to reverse for future months
  }
  for (let i = 0; i < count; i++) {
    months.push(moment().subtract(i, 'months').format('MMM YYYY'));
  }
  return months.reverse(); // Reverse to get the most recent month first
};

export const getPastQuarters = (count: number = 5, isForward?: boolean): {label: string, value: string}[] => {
  const quarters: {label: string, value: string}[] = [];
  if (isForward) {
    for (let i = 0; i < count; i++) {
      const date = moment().add(i, "quarters");
      quarters.push({
        label: `Q${date.format("Q")}-${date.format("YYYY")}`,
        value: `${date.format("YYYY")}${date.format("Q")}`
      });
    }
    return quarters; // future quarters stay in order
  }
  for (let i = 0; i < count; i++) {
    const date = moment().subtract(i, "quarters");
    quarters.push({
      label: `Q${date.format("Q")}-${date.format("YYYY")}`,
      value: `${date.format("YYYY")}${date.format("Q")}`
    });
  }
  return quarters.reverse(); // past quarters in chronological order
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
