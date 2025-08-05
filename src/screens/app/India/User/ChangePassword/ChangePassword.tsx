import { View } from 'react-native';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import AppLayout from '../../../../../components/layout/AppLayout';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import AppText from '../../../../../components/customs/AppText';

import { useLoginStore } from '../../../../../stores/useLoginStore';
import { handleASINApiCall } from '../../../../../utils/handleApiCall';
import { showToast } from '../../../../../utils/commonFunctios';

const PASSWORD_RULE = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+={}[\]:;"'<>,.?/]).{15,}$/;

const ChangePassword = () => {
  const navigation = useNavigation();
  const userInfo = useLoginStore(state => state.userInfo);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const errors:any = {};
    const { newPassword, confirmPassword } = formData;

    if (!newPassword) errors.newPassword = 'New Password is required';
    if (!confirmPassword) errors.confirmPassword = 'Confirm Password is required';
    else if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (newPassword && !PASSWORD_RULE.test(newPassword)) {
      errors.newPassword =
        'Password must be at least 15 characters long and contain uppercase, lowercase, numeric, and special characters.';
    }

    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const changePassword = useMutation({
    mutationFn: async () => {
      const payload = {
        employeeCode: userInfo?.EMP_Code || '',
        Password: formData.confirmPassword,
        BusinessType: userInfo?.EMP_Btype,
        RoleId: userInfo?.EMP_RoleId || '',
      };

      const res = await handleASINApiCall('/Auth/ChangePassword', payload);
      const result = res.login;

      if (result.Status) {
        showToast('Password changed successfully');
        navigation.goBack();
      } else {
        showToast(result.Message || 'Failed to change password');
      }

      return res;
    },
  });

  const handleSubmit = () => {
    if (validateForm()) {
      changePassword.mutate();
    }
  };

  return (
    <AppLayout needBack title="Change Password">
      <View className="flex-1 p-4">
        <AppInput
          label="New Password"
          placeholder="Enter new password"
          value={formData.newPassword}
          setValue={text => setFormData(prev => ({ ...prev, newPassword: text }))}
          secureTextEntry
          isPassword
          inputClassName="px-4"
          error={error.newPassword}
        />

        <AppInput
          label="Confirm Password"
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          setValue={text => setFormData(prev => ({ ...prev, confirmPassword: text }))}
          secureTextEntry
          isPassword
          inputClassName="px-4"
          containerClassName="mt-4"
          error={error.confirmPassword}
        />

        <AppButton title="Change Password" onPress={handleSubmit} className="mt-6" />

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
