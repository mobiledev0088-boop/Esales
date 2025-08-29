// src/components/LogoutModal.tsx
import {TouchableOpacity, View} from 'react-native';
import AppModal from './customs/AppModal';
import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import AppButton from './customs/AppButton';
import { useMutation } from '@tanstack/react-query';
import { handleASINApiCall } from '../utils/handleApiCall';
import { getDeviceId } from 'react-native-device-info';
import { useLoginStore } from '../stores/useLoginStore';
import { showToast } from '../utils/commonFunctios';
import { isIOS } from '../utils/constant';

const LogoutModal = ({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) => {
    const userInfo = useLoginStore(state => state.userInfo);
    const removeAuthData = useLoginStore(state => state.removeAuthData);
    const { mutate } = useMutation({
        mutationFn: async () => {
            const res = await handleASINApiCall('/Auth/UpdateToken',{
                 deviceId: getDeviceId(),
        token: userInfo?.Token,
        employeeCode: userInfo?.EMP_Code,
            })  
            const result  = res.login;
            if(result?.Status){
                removeAuthData()
                onClose();
                showToast('Logged out successfully');
            }else{
                showToast(result?.Message || 'Logout failed');
            }
        }
    })
    const handleLogout = () => mutate();
  return (
    <AppModal isOpen={isVisible} onClose={onClose} modalWidth={'80%'} >
      <View className="items-center justify-center  space-y-5">
        <View className="bg-primary rounded-full p-4 mb-5">
          <AppIcon
            type="materialIcons"
            name="logout"
            size={36}
            color={'white'}
          />
        </View>
        <AppText className="text-xl font-semibold text-gray-900">
          Leaving so soon?
        </AppText>
        <AppText className="text-md text-gray-500 text-center">
          Are you sure you want to log out?
        </AppText>
        <View className="w-full space-y-3 mt-5">
          <AppButton
            onPress={isIOS ? handleLogout : undefined}
            onPressOut={!isIOS ? handleLogout : undefined}
            className="py-3 bg-error"
            weight="bold"
            title="Log out"
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={isIOS? onClose : undefined}
            onPressOut={!isIOS ? onClose : undefined}
            className="bg-gray-100 py-3 rounded-sm items-center mt-2">
            <AppText weight="bold"  color="primary">
              Cancel
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
};

export default LogoutModal;
