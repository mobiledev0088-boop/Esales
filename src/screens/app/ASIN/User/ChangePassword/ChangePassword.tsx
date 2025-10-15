import { View } from 'react-native';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import AppLayout from '../../../../../components/layout/AppLayout';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import AppText from '../../../../../components/customs/AppText';

import { useLoginStore } from '../../../../../stores/useLoginStore';
import { handleAPACApiCall, handleASINApiCall } from '../../../../../utils/handleApiCall';
import { showToast } from '../../../../../utils/commonFunctions';

const PASSWORD_RULE = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+={}[\]:;"'<>,.?/]).{15,}$/;

const ChangePassword = () => {
  const navigation = useNavigation();
  const user = useLoginStore(state => state.userInfo);

  const [passwords, setPasswords] = useState({
    new: '',
    confirm: '',
  });

  const [errors, setErrors] = useState({
    new: '',
    confirm: '',
  });

  const validatePasswords = () => {
    const newErrors: any = {};
    const { new: newPassword, confirm: confirmPassword } = passwords;

    if (!newPassword) newErrors.new = 'New Password is required';
    if (!confirmPassword) {
      newErrors.confirm = 'Confirm Password is required';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    if (newPassword && !PASSWORD_RULE.test(newPassword)) {
      newErrors.new =
        'Password must be at least 15 characters long and contain uppercase, lowercase, numeric, and special characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate: changePassword } = useMutation({
    mutationFn: async (isASIN: boolean) => {
      const payload = {
        employeeCode: user?.EMP_Code || '',
        Password: passwords.confirm,
        BusinessType: user?.EMP_Btype,
        RoleId: user?.EMP_RoleId || '',
      };

      const apiCall = isASIN ? handleASINApiCall : handleAPACApiCall;
      const response = await apiCall('/Auth/ChangePassword', payload);
      const result = response?.login;

      if (result?.Status) {
        showToast('Password changed successfully');
        navigation.goBack();
      } else {
        showToast(result?.Message || 'Failed to change password');
      }

      return response;
    },
  });

  const handlePasswordChange = () => {
    if (!validatePasswords()) return;

    const isASIN = user?.EMP_CountryID === 'ASIN';
    changePassword(isASIN);
  };

  return (
    <AppLayout needBack title="Change Password">
      <View className="flex-1 p-4">
        <AppInput
          label="New Password"
          placeholder="Enter new password"
          value={passwords.new}
          setValue={text => setPasswords(prev => ({ ...prev, new: text }))}
          secureTextEntry
          isPassword
          inputClassName="px-4"
          error={errors.new}
        />

        <AppInput
          label="Confirm Password"
          placeholder="Confirm new password"
          value={passwords.confirm}
          setValue={text => setPasswords(prev => ({ ...prev, confirm: text }))}
          secureTextEntry
          isPassword
          inputClassName="px-4"
          containerClassName="mt-4"
          error={errors.confirm}
        />

        <AppButton
          title="Change Password"
          onPress={handlePasswordChange}
          className="mt-6"
        />

        <View className="border border-error rounded p-3 mb-4 mt-5">
          <AppText size="xs" color="text" weight="semibold">
            <AppText color="error" weight="bold" size="xs">
              Disclaimer -
            </AppText>{' '}
            Password must be at least 15 characters long and contain uppercase,
            lowercase, numeric, and special characters.
          </AppText>
        </View>
      </View>
    </AppLayout>
  );
};

export default ChangePassword;
