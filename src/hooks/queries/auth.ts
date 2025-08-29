import useEmpStore from "../../stores/useEmpStore";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginStore } from "../../stores/useLoginStore";
import { handleASINApiCall } from "../../utils/handleApiCall";
import { showToast } from "../../utils/commonFunctios";
import { useNavigation } from "@react-navigation/native";
import { AuthNavigationProp } from "../../types/navigation";


const loginApi = (data: any) => handleASINApiCall('/Auth/Login_new', data);
const resetPasswordApi = (data: any) => handleASINApiCall('/Auth/ResetPassword', data);
const getEmpInfoApi = (EMP_Code: string) => handleASINApiCall('/Auth/EmpInfo', { employeeCode: EMP_Code });

export const useLoginMutation = () => {
    const setAuthData = useLoginStore((state) => state.setAuthData);
    return useMutation({
        mutationFn: (dataToSend: any) => loginApi(dataToSend),
        onSuccess: async (data) => {
            const login = data?.login;
            if(login?.Status){
                const EMP_Code = login?.Datainfo?.[0]?.EMP_Code;
                if (EMP_Code) {
                    const res = await getEmpInfoApi(EMP_Code);
                    const empInfo = res?.login?.Datainfo?.[0];
                    useEmpStore.getState().setEmpInfo(empInfo);
                }
                setAuthData(login?.Token, login?.Datainfo?.[0]);
                showToast('Login successful');
            }else{
                const message = login?.Message || 'Login failed';
                showToast(message);
                console.log('Login failed:', message);
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.login?.Message || error.message || 'Login failed';
            showToast(message);
            console.error('Login error:', error);
        },
    });
};

export const useForgotPasswordMutation = () => {
    const navigation = useNavigation<AuthNavigationProp>();
    return useMutation({
        mutationFn: (dataToSend: any) => resetPasswordApi(dataToSend),
        onSuccess: (data) => {
            const login = data?.login;
            showToast('Password reset email sent');
            console.log('Password reset email sent:', login);
            navigation.navigate('Login');
        },
        onError: (error: any) => {
            const login = error?.response?.data?.login;
            const message = login?.Message || error.message || 'Password reset failed';
            showToast(message);
            console.error('Password reset error:', error);
        },
    });
};

export const useEmpInfoQuery = () => {
    const { userInfo } = useLoginStore.getState();
    const { empInfo } = useEmpStore.getState();
    const employeeCode = userInfo?.EMP_Code || '';
    console.log('employeeCode:', employeeCode);
    return useQuery({
        queryKey: ['empInfo', employeeCode],
        queryFn: async () => {
            const res = await getEmpInfoApi(employeeCode!);
            const info = res?.login?.Datainfo?.[0];
            useEmpStore.getState().setEmpInfo(info);
            return info;
        },
        enabled: !!employeeCode,
        initialData: empInfo ?? undefined,
    });
};

