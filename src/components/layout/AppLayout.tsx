import useEmpStore from '../../stores/useEmpStore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from '../customs/AppText';

import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '../../types/navigation';
import {useLoginStore} from '../../stores/useLoginStore';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {memo} from 'react';
import {EmpInfo} from '../../types/user';
import clsx from 'clsx';

type AppLayoutProps = {
  children: React.ReactNode;
  isDashboard?: boolean;
  needBack?: boolean;
  title?: string;
  needScroll?: boolean;
  needPadding?: boolean;
};

type HeaderProps = {
  needBack?: boolean;
  title?: string;
  navigation: DrawerNavigationProp;
  name: string;
  empInfo: EmpInfo | null;
  isDashboard?: boolean;
};

const AppLayout = ({
  children,
  isDashboard = false,
  needBack = false,
  title,
  needScroll = true,
  needPadding = false,
}: AppLayoutProps) => {
  const navigation = useNavigation<DrawerNavigationProp>();
  const userInfo = useLoginStore(state => state.userInfo);
  const empInfo = useEmpStore(state => state.empInfo);
  const name = userInfo?.EMP_Name?.split('_')[0] || '----';

  return needScroll ? (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <Header
        needBack={needBack}
        title={title}
        navigation={navigation}
        name={name}
        empInfo={empInfo}
        isDashboard={isDashboard}
      />
      <KeyboardAwareScrollView
        className="flex-1"
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{flexGrow: 1}, needPadding && {paddingHorizontal: 16}]}
      >
        {children}
      </KeyboardAwareScrollView>
    </View>
  ) : (
    <View className={clsx("flex-1 bg-lightBg-base dark:bg-darkBg-base", {"px-4": needPadding})}>
      <Header
        needBack={needBack}
        title={title}
        navigation={navigation}
        name={name}
        empInfo={empInfo}
        isDashboard={isDashboard}
      />
      {children}
    </View>
  );
};

export default memo(AppLayout);

const Header = memo<HeaderProps>(
  ({
    needBack = false,
    title,
    navigation,
    name,
    empInfo,
    isDashboard = false,
  }) => {
    const roleName = empInfo?.RoleName || '----';

    return (
      <View className="flex-row items-center justify-between px-4 py-4 bg-primary dark:bg-primary-dark rounded-b-md">
        {/* Left */}
        <View className="flex-row items-center max-w-[70%]">
          <Icon
            name={needBack ? 'arrow-back' : 'menu'}
            size={25}
            color="#fff"
            onPress={needBack ? navigation.goBack : navigation.openDrawer}
          />

          <View className="ml-4">
            {title ? (
              <AppText size="xl" color="white" weight="bold" className="ml-2">
                {title}
              </AppText>
            ) : (
              <AppText
                size="xl"
                color="white"
                weight="bold"
                className="capitalize">
                Hi{' '}
                <AppText size="xl" color="white" weight="bold">
                  {name}
                </AppText>{' '}
                <AppText size="lg" color="white" weight="bold">
                  ({roleName})
                </AppText>
                {empInfo?.IsParentCode && '*'}
              </AppText>
            )}
          </View>
        </View>

        {/* Right */}
        {isDashboard && (
          <View className="flex-row items-center">
            <View className="relative">
              <Icon name="notifications" size={25} color="#fff" />
              <View className="absolute top-0 right-0 w-3 h-3 bg-success rounded-full" />
            </View>
            <MCIcons
              name="barcode-scan"
              size={25}
              color="#fff"
              style={{marginLeft: 10}}
            />
            <Icon
              name="logout"
              size={25}
              color="#fff"
              style={{marginLeft: 10}}
            />
          </View>
        )}
      </View>
    );
  },
);
