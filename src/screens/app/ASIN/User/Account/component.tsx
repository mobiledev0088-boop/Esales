import {View} from 'react-native';
import Card from '../../../../../components/Card';
import AppImage from '../../../../../components/customs/AppImage';
import AppText from '../../../../../components/customs/AppText';
import {
  convertSnakeCaseToSentence,
  showToast,
} from '../../../../../utils/commonFunctions';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import {EmpInfo, UserInfo} from '../../../../../types/user';
import AppInput from '../../../../../components/customs/AppInput';
import AppButton from '../../../../../components/customs/AppButton';
import {useMemo, useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {getDeviceId} from 'react-native-device-info';
import {
  handleAPACApiCall,
  handleASINApiCall,
} from '../../../../../utils/handleApiCall';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../../types/navigation';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {TouchableOpacity} from 'react-native';
import {AppTable} from '../../../../../components/customs/AppTable';
import {ASUS, screenWidth} from '../../../../../utils/constant';
import Accordion from '../../../../../components/Accordion';
import clsx from 'clsx';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {AppColors} from '../../../../../config/theme';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';

// --- types ---
export interface SpecialFunctionsAccess {
  loginAsAllowed: boolean;
  changeCountryAllowed: boolean;
  multipleBusinessTypeAllowed: boolean;
}
// --- API Hooks ---
const useGetBusinessTypes = (enabled: boolean) => {
  const {EMP_Code: employeeCode} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['businessTypes', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall('/Auth/BusinessTypeInfo', {
        employeeCode,
      });
      const result = response.login;
      if (!result?.Status) return [];
      return result.Datainfo;
    },
    select: data =>
      data.map((item: any) => ({
        label: item.BT_Name,
        value: item.BEI_BusinessType,
      })) as AppDropdownItem[],
    enabled,
  });
};

const useGetCountries = (enabled: boolean) => {
  const {EMP_Code: employeeCode} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['countries', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall('/Auth/CountryInfo', {
        employeeCode,
      });
      const result = response.login;
      if (!result?.Status) return [];
      return result.Datainfo;
    },
    select: data =>
      data.map((item: any) => ({
        label: item.CN_Name,
        value: item.CN_Code,
      })) as AppDropdownItem[],
    enabled,
  });
};

const useChangeCountryMutation = () => {
  return useMutation({
    mutationFn: async (Country: string) => {
      const {EMP_Code: employeeCode} = useLoginStore(state => state.userInfo);
      const payload = {employeeCode, Country};
      const res = await handleASINApiCall('/Auth/UpdateUserInfo', payload);
      const result = res?.login;
      if (!result?.Status)
        throw new Error(result?.Message || 'Failed to change country');
      console.log('India Data Updated');
      const res2 = await handleAPACApiCall('/Auth/UpdateUserInfo', payload);
      const result2 = res2?.login;
      if (!result2?.Status)
        throw new Error(result2?.Message || 'Failed to change country');
      console.log('APAC Data Updated');
      const res3 = await handleAPACApiCall('/Auth/UserInfo', {employeeCode});
      const result3 = res3?.login;
      if (!result3?.Status)
        throw new Error(result3?.Message || 'Failed to fetch user info');
      const userDetails = result3.Datainfo[0];
      const Token = result3.Token;
      return {userDetails, Token};
    },
  });
};

const useChangeBusinessTypeMutation = () => {
  return useMutation({
    mutationFn: async (BusinessType: string) => {
      const {EMP_Code: employeeCode} = useLoginStore(state => state.userInfo);
      const payload = {employeeCode, BusinessType};
      const res = await handleASINApiCall('/Auth/UpdateUserInfo', payload);
      const result = res?.login;
    },
  });
};
// --- Helper Functions ---
const renderCardRow = (
  iconType: IconType,
  iconName: string,
  label: string,
  navigationTarget: () => void,
  AppTheme?: 'light' | 'dark',
) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={navigationTarget}
    className="flex-row items-center justify-between px-3 border-b border-gray-300 pb-2">
    <View className="flex-row items-center gap-2">
      <AppIcon
        type={iconType}
        name={iconName}
        size={24}
        color={AppColors[AppTheme || 'light'].text}
      />
      <AppText weight="bold">{label}</AppText>
    </View>
    <AppIcon
      type="feather"
      name="chevron-right"
      size={24}
      color={AppColors[AppTheme || 'light'].text}
    />
  </TouchableOpacity>
);

const renderInfoRow = (
  iconType: IconType,
  iconName: string,
  value?: string,
  AppTheme?: 'light' | 'dark',
) => (
  <View className="flex-row items-center gap-1 mt-2">
    <AppIcon
      type={iconType}
      name={iconName}
      size={16}
      color={AppColors[AppTheme || 'light'].text}
    />
    <AppText size="sm">{value || 'N/A'}</AppText>
  </View>
);

const TabSelector = ({
  TABS,
  handlePress,
  selectedIndex,
}: {
  TABS: AppDropdownItem[] | null;
  handlePress: (index: number) => void;
  selectedIndex: number;
}) => {
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');
  if (!TABS || TABS.length === 0) return null;
  return (
    <View className="flex-row justify-between items-center p-1 py-2 bg-lightBg-base dark:bg-darkBg-base rounded h-16 mb-4">
      {TABS.map((tab, index) => {
        const isSelected = selectedIndex === Number(tab.value);
        return (
          <TouchableOpacity
            key={index}
            className="flex-1 rounded-md py-3 items-center justify-center mx-1"
            style={{
              backgroundColor: isSelected
                ? '#007AFF'
                : AppColors[isDarkTheme ? 'dark' : 'light'].bgSurface,
            }}
            onPress={() => handlePress(Number(tab.value))}
            activeOpacity={0.8}>
            <AppText
              color={isSelected || isDarkTheme ? 'white' : 'black'}
              weight="bold"
              size="sm">
              {tab.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const ProfileCard = ({
  userInfo,
  empInfo,
}: {
  userInfo: UserInfo | null;
  empInfo: EmpInfo | null;
}) => {
  const AppTheme = useThemeStore(state => state.AppTheme);
  return (
    <Card>
      <View className="flex-row items-start gap-6">
        <AppImage
          source={require('../../../../../assets/images/dp.png')}
          resizeMode="contain"
          style={{width: 100, height: 100, borderRadius: 50}}
        />
        <View>
          <AppText size="xl" weight="bold">
            {convertSnakeCaseToSentence(userInfo?.EMP_Name || 'N/A')}
          </AppText>
          {renderInfoRow('ionicons', 'mail', userInfo?.EMP_EmailID, AppTheme)}
          {renderInfoRow(
            'ionicons',
            'person-outline',
            empInfo?.RoleName,
            AppTheme,
          )}
        </View>
      </View>
    </Card>
  );
};

export const PersonalDetails = ({
  userInfo,
  empInfo,
}: {
  userInfo: UserInfo | null;
  empInfo: EmpInfo | null;
}) => {
  return (
    <>
      <AppText className="ml-2 mt-8 mb-2 underline">Personal Details</AppText>
      <Card
        className="rounded-md gap-2"
        watermark
        watermarkTextVerticalCount={2}
        watermarkRowGap={10}>
        <AppText weight="bold">
          Employee Code - {empInfo?.EMP_Code || 'N/A'}
        </AppText>
        <AppText weight="bold">
          Department - {empInfo?.DT_Name || 'N/A'}
        </AppText>
        <AppText weight="bold">
          Branch - {userInfo?.UPD_BRANCH || 'N/A'}
        </AppText>
      </Card>
    </>
  );
};

export const SyncedDate = ({
  userInfo,
  empInfo,
}: {
  userInfo: UserInfo | null;
  empInfo: EmpInfo | null;
}) => {
  const AppTheme = useThemeStore(state => state.AppTheme);

  const data = useMemo(() => {
    const arr = [];
    arr.push(
      {
        last_Updated: 'Activaion',
        date: empInfo?.Activation_Update?.split('T')[0] || 'N/A',
      },
      {
        last_Updated: 'Sellout',
        date: empInfo?.Sellout_Update?.split('T')[0] || 'N/A',
      },
      {
        last_Updated: 'ispsellout',
        date: empInfo?.ISPSellout_Update?.split('T')[0] || 'N/A',
      },
    );
    if (userInfo?.EMP_CountryID === 'ASIN') {
      arr.push(
        {
          last_Updated: 'SellThru',
          date: empInfo?.Sellthru_Update?.split('T')[0] || 'N/A',
        },
        {
          last_Updated: 'POD',
          date: empInfo?.POD_Update?.split('T')[0] || 'N/A',
        },
        {
          last_Updated: 'DemoHub',
          date: empInfo?.DemoHub_Update?.split('T')[0] || 'N/A',
        },
      );
    }
    if (userInfo?.EMP_CountryID === 'ACJP') {
      arr.push({
        last_Updated: 'Inventory_Sync_Date',
        date: empInfo?.Inventory_Sync_Date?.split('T')[0] || 'N/A',
      });
    }

    return arr;
  }, []);

  return (
    <Card className="mt-8 rounded-md mb-4">
      <Accordion
        duration={250}
        initialOpening
        header={
          <View className="flex-row items-center gap-2">
            <AppIcon
              type="ionicons"
              name="sync"
              size={16}
              color={AppColors[AppTheme].text}
            />
            <AppText weight="semibold">Last Synced Dates</AppText>
          </View>
        }>
        <AppTable
          data={data}
          columns={[
            {
              key: 'last_Updated',
              title: 'Last Updated',
              width: screenWidth / 2 - 30,
            },
            {key: 'date', title: 'Date', width: screenWidth / 2 - 30},
          ]}
        />
      </Accordion>
    </Card>
  );
};

export const SpecialAccessUI = ({
  specialFunctionsAccess,
  userInfo,
}: {
  specialFunctionsAccess: SpecialFunctionsAccess;
  userInfo: UserInfo | null;
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const setAuthData = useLoginStore(state => state.setAuthData);
  const {EMP_CountryID,EMP_Btype} = useLoginStore(state => state.userInfo);
  const {data: businessTypes, isLoading: isBusinessTypesLoading} =
    useGetBusinessTypes(specialFunctionsAccess.multipleBusinessTypeAllowed);
  const {data: countries, isLoading} = useGetCountries(
    specialFunctionsAccess.changeCountryAllowed,
  );
  const {mutate: changeCountryMutate, isPending: isChangingCountry} =
    useChangeCountryMutation();

  const [loginAsID, setLoginAsID] = useState<string>('');
  const [loginAsError, setLoginAsError] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(EMP_CountryID);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Mutation Logic ---
  const {mutate} = useMutation({
    mutationFn: async () => {
      const payload = {
        username: userInfo?.EMP_Name,
        password: userInfo?.EMP_Password,
        loginAs: loginAsID,
        deviceId: getDeviceId(),
      };
      const response = await handleASINApiCall('/Auth/Login_As', payload);
      const result = response?.login;

      if (result?.Datainfo?.length) {
        const {Token, ...userDetails} = result.Datainfo[0];
        setAuthData(Token, {
          ...userDetails,
          is_Login_As: true,
        });
        showToast('Login successful');
        navigation.replace('Index');
      } else {
        showToast('Login failed, please try again');
        console.log(result?.Message);
      }
    },
  });

  // --- Validation ---
  const validateLoginAs = () => {
    let error = '';
    if (!loginAsID) error = 'Login As ID is required';
    else if (loginAsID.length < 3)
      error = 'Login As ID must be at least 3 characters';

    setLoginAsError(error);
    return !error;
  };

  // --- Handle Login As ---
  const handleLoginAs = () => {
    if (validateLoginAs()) mutate();
  };

  const handleChangeCountry = (item: AppDropdownItem | null) => {
    if (item && item.value !== selectedCountry) {
      // Additional logic to handle country change can be added here
      changeCountryMutate(item.value, {
        onSuccess: () => {
          showToast(`Country changed to ${item.label}`);
        },
        onError: error => {
          showToast(
            error instanceof Error ? error.message : 'Failed to change country',
          );
        },
      });
    }
  };
  const AppTheme = useThemeStore(state => state.AppTheme);
  return (
    <>
      <AppText className="ml-2 mt-8 mb-2 underline">
        Special Access Functions
      </AppText>
      <Card className="rounded-md gap-5">
        {/* Login As */}
        {specialFunctionsAccess?.loginAsAllowed && (
          <Accordion
            header={
              <View className="flex-row items-center gap-2">
                <AppIcon
                  type="material-community"
                  name="account-supervisor"
                  size={24}
                  color={AppColors[AppTheme].text}
                />
                <AppText weight="bold">Login As</AppText>
              </View>
            }>
            <View className="p-2 flex-row gap-2">
              <AppInput
                value={loginAsID}
                setValue={setLoginAsID}
                placeholder='Enter "Login As" ID'
                containerClassName="w-[87%]"
                inputClassName="ml-2 text-base h-12"
                error={loginAsError}
              />
              <AppButton
                title={
                  <AppIcon type="entypo" name="login" size={20} color="#fff" />
                }
                onPress={handleLoginAs}
                className="justify-center h-12"
              />
            </View>
          </Accordion>
        )}
        {/* Switch Country */}
        {specialFunctionsAccess?.changeCountryAllowed && (
          <Accordion
            header={
              <View className="flex-row items-center gap-2">
                <AppIcon
                  type="ionicons"
                  name="earth-outline"
                  size={24}
                  color={AppColors[AppTheme].text}
                />
                <AppText weight="bold">Switch Country</AppText>
              </View>
            }>
            <View
              className={clsx(
                'pt-2 pb-2',
                isDropdownOpen ? 'min-h-80' : 'h-20',
              )}>
              <AppDropdown
                data={countries || []}
                mode="dropdown"
                placeholder={isLoading ? 'Loading...' : 'Select a Country'}
                onSelect={handleChangeCountry}
                selectedValue={selectedCountry || undefined}
                zIndex={9000}
                onOpenChange={() => setIsDropdownOpen(!isDropdownOpen)}
              />
            </View>
          </Accordion>
        )}
        {/* Switch Business Type */}
        {specialFunctionsAccess?.multipleBusinessTypeAllowed && (
          <Accordion
            header={
              <View className="flex-row items-center gap-2">
                <AppIcon
                  type="ionicons"
                  name="business-outline"
                  size={24}
                  color={AppColors[AppTheme].text}
                />
                <AppText weight="bold">Switch Business Type</AppText>
              </View>
            }>
            <TabSelector 
              TABS={businessTypes || []}
              handlePress={()=>{}}
              selectedIndex={EMP_Btype}  
            />
          </Accordion>
        )}
      </Card>
    </>
  );
};

export const AccountSettings = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const {EMP_RoleId} = useLoginStore(state => state.userInfo);
  const AppTheme = useThemeStore(state => state.AppTheme);
  const {ASE,BSM,HO_EMPLOYEES,AM,TM} = ASUS.ROLE_ID;
  const allowAttendanceRoles = [ASE,BSM,HO_EMPLOYEES,AM,TM];
  const isAttendanceAllowed = allowAttendanceRoles.includes(EMP_RoleId as any);
  const attendanceNavigation  = EMP_RoleId === ASE ? 'Attendance' : 'Attendance_HO';
  return (
    <>
      <AppText className="ml-2 mt-8 mb-2 underline">Account Settings</AppText>
      <Card className="rounded-md gap-5 mb-5">
        {renderCardRow(
          'ionicons',
          'lock-closed-outline',
          'Change Password',
          () => navigation.push('ChangePassword'),
          AppTheme,
        )}
        {isAttendanceAllowed &&
          renderCardRow(
            'ionicons',
            'checkmark-done-circle-outline',
            'Attendance',
            () => navigation.push(attendanceNavigation),
            AppTheme,
          )}
        {renderCardRow(
          'ionicons',
          'settings-outline',
          'App Permissions',
          () => navigation.push('AppPermissions'),
          AppTheme,
        )}
        <AppText size="sm" weight="bold" className="text-center underline">
          App Version - 3.4.5{' '}
        </AppText>
      </Card>
    </>
  );
};
