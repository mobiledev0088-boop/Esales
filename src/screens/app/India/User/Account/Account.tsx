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

const Account = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const empInfo = useEmpStore(state => state.empInfo);

  const specialFunctionsAccess = useMemo(() => {
    let obj: any = {};
    if (userInfo?.Is_Multiple_Login === 'Yes') {
      obj.Is_Multiple_Login = true;
    }
    if (empInfo?.Is_LoginAs === 'Yes') {
      obj.Is_LoginAs = true;
    }
    if (userInfo?.Is_Multiple_BusinessType === 'Yes') {
      obj.Is_Multiple_BusinessType = true;
    }
    return obj;
  }, [userInfo, empInfo]);
  return (
    <AppLayout title="Account" needScroll>
      <View className="flex-1 px-4 pt-4">
        {/* Profile Card */}
        <ProfileCard userInfo={userInfo} empInfo={empInfo} />

        {/* Personal Details */}
        <PersonalDetails userInfo={userInfo} empInfo={empInfo} />

        {/* Synced Data Info */}
        {userInfo?.EMP_Btype !== ASUS.BUSINESS_TYPES.COMMERCIAL && (
          <SyncedDate userInfo={userInfo} empInfo={empInfo} />
        )}

        {/* Special Access Functions */}
        <SpecialAccessUI
          specialFunctionsAccess={specialFunctionsAccess}
          userInfo={userInfo}
        />

        {/* Account Settings */}
        <AccountSettings />
      </View>
    </AppLayout>
  );
};

export default Account;
