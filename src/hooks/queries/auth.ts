import useEmpStore from '../../stores/useEmpStore';

import {useMutation} from '@tanstack/react-query';
import {useLoginStore} from '../../stores/useLoginStore';
import {handleAPACApiCall, handleASINApiCall} from '../../utils/handleApiCall';
import {showToast} from '../../utils/commonFunctions';
import {useNavigation} from '@react-navigation/native';
import {AuthNavigationProp} from '../../types/navigation';

const loginApi = (data: any) => handleASINApiCall('/Auth/Login_new', data);
const APACloginApi = (data: any) => handleAPACApiCall('/Auth/Login_new', data);
const resetPasswordApi = (data: any) => handleASINApiCall('/Auth/ResetPassword', data);
const getEmpInfoApi = (EMP_Code: string) => handleASINApiCall('/Auth/EmpInfo', {employeeCode: EMP_Code});
const getAPACEmpInfoApi = (EMP_Code: string) => handleAPACApiCall('/Auth/EmpInfo', {employeeCode: EMP_Code});

export const useLoginMutation = () => {
  const setAuthData = useLoginStore(state => state.setAuthData);
  return useMutation({
    mutationFn: (dataToSend: any) => loginApi(dataToSend),
    onSuccess: async (data, variables) => {
      const login = data?.login;
      if (login?.Status) {
        const EMP_Code = login?.Datainfo?.[0]?.EMP_Code;
        if (EMP_Code) {
          const res = await getEmpInfoApi(EMP_Code);
          const empInfo = res?.login?.Datainfo?.[0];
          useEmpStore.getState().setEmpInfo(empInfo);
        }
        setAuthData(login?.Token, login?.Datainfo?.[0]);
        showToast('Login successful');
      } else {
        const result = await APACloginApi(variables);
        const login = result?.login;
        if (login?.Status) {
          const EMP_Code = login?.Datainfo?.[0]?.EMP_Code;
          if (EMP_Code) {
            const res = await getAPACEmpInfoApi(EMP_Code);
            const empInfo = res?.login?.Datainfo?.[0];
            useEmpStore.getState().setEmpInfo(empInfo);
          }
          setAuthData(login?.Datainfo?.[0]?.Token, login?.Datainfo?.[0]);
          showToast('Login successful');
          return;
        } else {
          const message = login?.Message || 'Login failed';
          showToast(message);
        }
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.login?.Message ||
        error.message ||
        'Login failed';
      showToast(message);
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