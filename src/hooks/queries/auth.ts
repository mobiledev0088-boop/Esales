import {useMutation} from '@tanstack/react-query';
import {useLoginStore} from '../../stores/useLoginStore';
import {handleAPACApiCall, handleASINApiCall} from '../../utils/handleApiCall';
import {showToast} from '../../utils/commonFunctions';
import {useNavigation} from '@react-navigation/native';
import {AuthNavigationProp} from '../../types/navigation';
import { useUserStore } from '../../stores/useUserStore';

const loginApi = (data: any) => handleASINApiCall('/Auth/Login_new', data);
const APACloginApi = (data: any) => handleAPACApiCall('/Auth/Login_new', data);
const resetPasswordApi = (data: any) => handleASINApiCall('/Auth/ResetPassword', data);
const getEmpInfoApi = (EMP_Code: string) => handleASINApiCall('/Auth/EmpInfo', {employeeCode: EMP_Code});
const getAPACEmpInfoApi = (EMP_Code: string) => handleAPACApiCall('/Auth/EmpInfo', {employeeCode: EMP_Code});

export const useLoginMutation = () => {
  const setAuthData = useLoginStore(state => state.setAuthData);
  const setEmpInfo = useUserStore(state => state.setEmpInfo);

  return useMutation({
    mutationFn: async (payload: any) => {
      let loginResponse = await loginApi(payload);
      let loginData = loginResponse?.login;
      let isAPAC = false;

      if (!loginData?.Status) {
        const apacResponse = await APACloginApi(payload);
        loginData = apacResponse?.login;
        isAPAC = true;
      }
      
      if (!loginData?.Status) {
        throw new Error(loginData?.Message || 'Login failed');
      }

      const EMP_Code = loginData?.Datainfo?.[0]?.EMP_Code;

      let empInfo = null;
      if (EMP_Code) {
        const empRes = isAPAC
          ? await getAPACEmpInfoApi(EMP_Code)
          : await getEmpInfoApi(EMP_Code);

        empInfo = empRes?.login?.Datainfo?.[0] ?? null;
      }
      return {
        loginData,
        empInfo,
        isAPAC,
      };
    },
    onSuccess: ({loginData, empInfo}) => {
      setAuthData(loginData.Token, loginData.Datainfo?.[0]);
      if (empInfo) {
        setEmpInfo(empInfo);
      }
      showToast('Login successful');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Login failed');
      console.error('Login error:', error);
    },
  });
};

export const useForgotPasswordMutation = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  return useMutation({
    mutationFn: (dataToSend: any) => resetPasswordApi(dataToSend),
    onSuccess: data => {
      const login = data?.login;
      showToast('Password reset email sent');
      console.log('Password reset email sent:', login);
      navigation.navigate('Login');
    },
    onError: (error: any) => {
      const login = error?.response?.data?.login;
      const message =
        login?.Message || error.message || 'Password reset failed';
      showToast(message);
      console.error('Password reset error:', error);
    },
  });
};