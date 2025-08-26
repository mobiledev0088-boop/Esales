import {apiClientAPAC,apiClientASIN} from "../config/apiConfig";
import { useLoaderStore } from "../stores/useLoaderStore";
import { useLoginStore } from "../stores/useLoginStore";

export const handleASINApiCall = async <T = any>(
    url: string,
    data?: any,
    headers?: Record<string, string>,
    showGlobalLoading?: boolean,
    showError: boolean = false
): Promise<T> => {
    const { token, userInfo } = useLoginStore.getState();
    const setLoading = useLoaderStore.getState().setLoading;
    const setGlobalLoading = useLoaderStore.getState().setGlobalLoading;

    try {
        setLoading(true);
        if (showGlobalLoading) {
            setGlobalLoading(true);
        }
        console.time('API Call Timing');
        const response = await apiClientASIN.request<T>({
            method: 'POST',
            url,
            data,
            headers: {
                ...headers,
            },
        });
        console.timeEnd('API Call Timing');
        return response.data;
    } catch (error: any) {
        if (showError) {
            console.error('Custom API Error:', error?.response?.data || error.message);
        }
        throw error;
    } finally {
        setGlobalLoading(false);
        setLoading(false);
        if (token && userInfo?.EMP_Code) {
            void saveApiLog(url, token, userInfo.EMP_Code);
        } else {
            console.log('Token or EMP_Code is missing, skipping API log save');
        }
    }
};


export const handleAPACApiCall = async <T = any>(
    url: string,
    data?: any,
    headers?: Record<string, string>,
    showError: boolean = false
): Promise<T> => {
    const setLoading = useLoaderStore.getState().setLoading;
    try {
        console.log('Making API call to:', apiClientAPAC.getUri());
        setLoading(true);
        console.time('API Call Timing');
        const response = await apiClientAPAC.request<T>({
            method: 'POST',
            url,
            data,
            headers: {
                ...headers,
            },
        });
        console.timeEnd('API Call Timing');
        return response.data;
    } catch (error: any) {
        if (showError) {
            console.error('Custom API Error:', error?.response?.data || error.message);
        }
        throw error;
    } finally {
        setLoading(false);
    }
};

const saveApiLog = async (
    url: string,
    token: string,
    empCode: string,
): Promise<void> => {
    try {
        console.log('Saving API log:', url);
        await apiClientASIN.post('/Information/SaveAPIRequestInfo', {
            Employee_Code: empCode,
            API_Name: url,
            Token_ID: token,
        });
    } catch {
        console.log('Failed to save API log');
    }
};
