import AppLayout from '../../../../../components/layout/AppLayout';
import {View} from 'react-native';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import useEmpStore from '../../../../../stores/useEmpStore';

import {useMemo} from 'react';
import {
  AccountSettings,
  PersonalDetails,
  ProfileCard,
  SpecialAccessUI,
  SyncedDate,
} from './component';
import {ASUS} from '../../../../../utils/constant';


type AccountProps = {
  noHeader?: boolean;
};

import { useRoute } from '@react-navigation/native';

const Account = (props: AccountProps) => {
  const route = useRoute();
  // Prefer prop, fallback to route.params
  const noHeader = props.noHeader ?? (route.params && (route.params as any).noHeader);
  const currentUser = useLoginStore(state => state.userInfo);
  const employeeDetails = useEmpStore(state => state.empInfo);
  console.log('Account Screen - noHeader:', currentUser);

  // Determine special access permissions for the user
  const specialAccessPermissions = useMemo(() => {
    return {
      multipleLoginAllowed: currentUser?.Is_Multiple_Login === 'Yes',
      loginAsAllowed: employeeDetails?.Is_LoginAs === 'Yes',
      multipleBusinessTypeAllowed: currentUser?.Is_Multiple_BusinessType === 'Yes',
    };
  }, [currentUser, employeeDetails]);

  // Render account details content
  const renderAccountContent = () => (
    <View className="flex-1 px-4 pt-4 dark:bg-darkBg-base">
      {/* Profile Card */}
      <ProfileCard userInfo={currentUser} empInfo={employeeDetails} />

      {/* Personal Details */}
      <PersonalDetails userInfo={currentUser} empInfo={employeeDetails} />

      {/* Synced Data Info */}
      {currentUser?.EMP_Btype !== ASUS.BUSINESS_TYPES.COMMERCIAL && (
        <SyncedDate userInfo={currentUser} empInfo={employeeDetails} />
      )}

      {/* Special Access Functions */}
      {Object.values(specialAccessPermissions).some(Boolean) && ( <SpecialAccessUI
        specialFunctionsAccess={specialAccessPermissions}
        userInfo={currentUser}
      />)}

      {/* Account Settings */}
      <AccountSettings />
    </View>
  );

  if (noHeader) {
    return renderAccountContent();
  }
  return (
    <AppLayout title="Account" needScroll>
      {renderAccountContent()}
    </AppLayout>
  );
};

export default Account;
