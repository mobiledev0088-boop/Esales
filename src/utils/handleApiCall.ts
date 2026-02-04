import {apiClientAPAC, apiClientASIN} from '../config/apiConfig';
import {useLoaderStore} from '../stores/useLoaderStore';
import {useLoginStore} from '../stores/useLoginStore';
import {ASUS} from './constant';

export const handleASINApiCall = async <T = any>(
  url: string,
  data: any = {},
  headers?: Record<string, string>,
  showGlobalLoading?: boolean,
  showError: boolean = false,
): Promise<T> => {
  const {token, userInfo} = useLoginStore.getState();
  const setLoading = useLoaderStore.getState().setLoading;
  const setGlobalLoading = useLoaderStore.getState().setGlobalLoading;

  try {
    setLoading(true);
    if (showGlobalLoading) {
      setGlobalLoading(true);
    }
    const response = await apiClientASIN.request<T>({
      method: 'POST',
      url,
      data,
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error: any) {
    if (showError) {
      console.error(
        'Custom API Error:',
        error?.response?.data || error.message,
      );
    }
    throw error;
  } finally {
    setGlobalLoading(false);
    setLoading(false);
    if (token && userInfo?.EMP_Code) {
      void saveApiLog(url, token, userInfo.EMP_Code);
    } else {
      console.log('Token or EMP_Code is missing, skipping API log save', url);
    }
  }
};

export const handleAPACApiCall = async <T = any>(
  url: string,
  data: any = {},
  headers?: Record<string, string>,
  showGlobalLoading?: boolean,
  showError: boolean = false,
): Promise<T> => {
  const {token, userInfo} = useLoginStore.getState();
  const setLoading = useLoaderStore.getState().setLoading;
  const setGlobalLoading = useLoaderStore.getState().setGlobalLoading;

  try {
    setLoading(true);
    if (showGlobalLoading) {
      setGlobalLoading(true);
    }
    const response = await apiClientAPAC.request<T>({
      method: 'POST',
      url,
      data,
      headers: {
        ...headers,
      },
    });
    return response.data;
  } catch (error: any) {
    if (showError) {
      console.error(
        'Custom API Error:',
        error?.response?.data || error.message,
      );
    }
    throw error;
  } finally {
    setGlobalLoading(false);
    setLoading(false);
    if (token && userInfo?.EMP_Code) {
      // void saveApiLogAPAC(url, token, userInfo.EMP_Code);
    } else {
      console.log('Token or EMP_Code is missing, skipping API log save');
    }
  }
};

const saveApiLog = async (
  url: string,
  token: string,
  empCode: string,
): Promise<void> => {
  try {
    await apiClientASIN.post('/Information/SaveAPIRequestInfo', {
      Employee_Code: empCode,
      API_Name: url,
      Token_ID: token,
    });
  } catch {
    console.log('Failed to save API log');
  }
};

export const saveApiLogAPAC = async (
  url: string,
  token: string,
  empCode: string,
): Promise<void> => {
  try {
    await apiClientAPAC.post('/Information/SaveAPIRequestInfo', {
      Employee_Code: empCode,
      API_Name: url,
      Token_ID: token,
    });
  } catch {
    console.log('Failed to save API log');
  }
};

export const LogCacheAPI = async (url: string): Promise<void> => {
  const {EMP_Code, Token, EMP_CountryID} = useLoginStore.getState().userInfo;
  const isASIN = EMP_CountryID === ASUS.COUNTRIES.ASIN;
  if (isASIN) {
    try {
      await apiClientASIN.post('/Information/SaveAPIRequestInfo', {
        Employee_Code: EMP_Code,
        API_Name: url,
        Token_ID: Token,
      });
    } catch {
      console.log('Failed to log cache API');
    }
  } else {
    try {
      await apiClientAPAC.post('/Information/SaveAPIRequestInfo', {
        Employee_Code: EMP_Code,
        API_Name: url,
        Token_ID: Token,
      });
    } catch {
      console.log('Failed to log cache API');
    }
  }
};
