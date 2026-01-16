import useEmpStore from '../../stores/useEmpStore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from '../customs/AppText';
import clsx from 'clsx';

import {Pressable, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp, DrawerNavigationProp} from '../../types/navigation';
import {useLoginStore} from '../../stores/useLoginStore';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {memo, useRef, useImperativeHandle, forwardRef, useState} from 'react';
import {EmpInfo} from '../../types/user';
import LogoutModal from '../LogoutModal';
import {getMMKV} from '../../utils/mmkvStorage';

type ScrollToOptions = {
  x?: number;
  y?: number;
  animated?: boolean;
};

export type AppLayoutRef = {
  scrollTo: (options: ScrollToOptions) => void;
  scrollToEnd: (animated?: boolean) => void;
};

type AppLayoutProps = {
  children: React.ReactNode;
  isDashboard?: boolean;
  needBack?: boolean;
  title?: string;
  needScroll?: boolean;
  needPadding?: boolean;
   onlyHeader?: boolean;
  onScrollToComplete?: () => void;
};

type HeaderProps = {
  needBack?: boolean;
  title?: string;
  navigation: DrawerNavigationProp;
  stackNavigation: AppNavigationProp;
  name: string;
  empInfo: EmpInfo | null;
  isDashboard?: boolean;
  onlyHeader?: boolean;
};

const Header = memo<HeaderProps>(
  ({
    needBack = false,
    title,
    navigation,
    stackNavigation,
    name,
    empInfo,
    isDashboard = false,
    onlyHeader = false,
  }) => {
    const roleName =
      empInfo?.EMP_Type === 'T3Partner' ? '' : empInfo?.RoleName || 'N/AA';
    const empType = empInfo?.EMP_Type ? empInfo.EMP_Type + ' ' : '';
    const [isOpen, setIsOpen] = useState(false);
    return (
      <View className="flex-row items-center justify-between px-4 py-4 bg-primary dark:bg-primary-dark rounded-b-md">
        {/* Left */}
        <View className="flex-row items-center max-w-[70%]">
          {!onlyHeader && (
            <Pressable
              onPress={needBack ? navigation.goBack : navigation.openDrawer}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon
                name={needBack ? 'arrow-back' : 'menu'}
                size={25}
                color="#fff"
              />
            </Pressable>
          )}

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
                  ({`${empType}${roleName}`})
                </AppText>
                {empInfo?.IsParentCode && '*'}
              </AppText>
            )}
          </View>
        </View>

        {/* Right */}
        {isDashboard && (
          <View className="flex-row items-center">
            <Pressable
              hitSlop={20}
              className="relative"
              onPress={() => stackNavigation.push('Notification')}>
              <Icon name="notifications" size={25} color="#fff" />
              <View className="absolute top-0 right-0 w-3 h-3 bg-[#ee4949] rounded-full" />
            </Pressable>
            <Pressable onPress={() => stackNavigation.push('ScanSN')}>
              <MCIcons
                name="barcode-scan"
                size={25}
                color="#fff"
                style={{marginLeft: 10}}
              />
            </Pressable>
            <Pressable onPress={() => setIsOpen(true)}>
              <Icon
                name="logout"
                size={25}
                color="#fff"
                style={{marginLeft: 10}}
              />
            </Pressable>
          </View>
        )}
        {onlyHeader && <Pressable onPress={() => setIsOpen(true)}>
              <Icon
                name="logout"
                size={25}
                color="#fff"
                style={{marginLeft: 10}}
              />
            </Pressable>}
        <LogoutModal isVisible={isOpen} onClose={() => setIsOpen(false)} />
      </View>
    );
  },
);

const AppLayout = forwardRef<AppLayoutRef, AppLayoutProps>(
  (
    {
      children,
      isDashboard = false,
      needBack = false,
      title,
      needScroll = false,
      needPadding = false,
      onScrollToComplete,
      onlyHeader = false,
    },
    ref,
  ) => {
    const navigation = useNavigation<DrawerNavigationProp>();
    const stackNavigation = useNavigation<AppNavigationProp>();
    const userInfo = useLoginStore(state => state.userInfo);
    const empInfo = useEmpStore(state => state.empInfo);
    const name = userInfo?.EMP_Name?.split('_')[0] || '----';

    const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

    // Expose scroll methods via ref
    useImperativeHandle(
      ref,
      () => ({
        scrollTo: ({x = 0, y = 0, animated = true}: ScrollToOptions) => {
          scrollViewRef.current?.scrollToPosition(x, y, animated);
          onScrollToComplete?.();
        },
        scrollToEnd: (animated = true) => {
          scrollViewRef.current?.scrollToEnd(animated);
          onScrollToComplete?.();
        },
      }),
      [onScrollToComplete],
    );

    return needScroll ? (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
        <Header
          needBack={needBack}
          title={title}
          navigation={navigation}
          name={name}
          empInfo={empInfo}
          isDashboard={isDashboard}
          stackNavigation={stackNavigation}
          onlyHeader={onlyHeader}
        />
        <KeyboardAwareScrollView
          ref={scrollViewRef}
          className="flex-1"
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            {flexGrow: 1},
            needPadding && {paddingHorizontal: 8},
          ]}
          showsVerticalScrollIndicator={false}>
          {children}
        </KeyboardAwareScrollView>
      </View>
    ) : (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
        <Header
          needBack={needBack}
          title={title}
          navigation={navigation}
          name={name}
          empInfo={empInfo}
          isDashboard={isDashboard}
          stackNavigation={stackNavigation}
          onlyHeader={onlyHeader}
        />
        <View className={clsx('flex-1', needPadding && 'px-2')}>
          {children}
        </View>
      </View>
    );
  },
);

export default memo(AppLayout);
