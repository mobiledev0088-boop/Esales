import AppLayout from '../../../../../components/layout/AppLayout';
import {useUserStore} from '../../../../../stores/useUserStore';

import {View} from 'react-native';
import {useMemo} from 'react';
import {useRoute} from '@react-navigation/native';
import {ASUS} from '../../../../../utils/constant';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {
  AccountSettings,
  PersonalDetails,
  ProfileCard,
  SpecialAccessUI,
  SpecialFunctionsAccess,
  SyncedDate,
} from './component';


const Account = (props: {noHeader?: boolean}) => {
  const route = useRoute();
  // Prefer prop, fallback to route.params
  const noHeader =
    props.noHeader ?? (route.params && (route.params as any).noHeader);
  const currentUser = useLoginStore(state => state.userInfo);
  const employeeDetails = useUserStore(state => state.empInfo);

  // Determine special access permissions for the user
  const specialAccessPermissions: SpecialFunctionsAccess = useMemo(() => {
    return {
      loginAsAllowed: employeeDetails?.Is_LoginAs === 'Yes',
      changeCountryAllowed: currentUser?.Is_Multiple_Login === 'Yes',
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
      {Object.values(specialAccessPermissions).some(Boolean) && (
        <SpecialAccessUI
          specialFunctionsAccess={specialAccessPermissions}
          userInfo={currentUser}
        />
      )}

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
