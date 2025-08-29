import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AppImage from '../customs/AppImage';
import AppText from '../customs/AppText';
import ThemeToggle from '../customs/ThemeToggle';
import {useThemeStore} from '../../stores/useThemeStore';
import DrawerSection from './DrawerSection';
import {AppColors} from '../../config/theme';
import DrawerItemWrapper from './DrawerItemWrapper';
import LogoutModal from '../LogoutModal';
import {useState} from 'react';
import {ASUS} from '../../utils/constant';
import {useLoginStore} from '../../stores/useLoginStore';
import AppIcon from '../customs/AppIcon';

const DOWNLOAD_ROUTES = [
  'SchemePPACT',
  'PriceList',
  'DemoProgramLetter',
  'EndCustomerRelated',
  'MarketingMaterial',
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = ({
  state,
  navigation,
}) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const AppTheme = useThemeStore(state => state.AppTheme);

  const name =
    userInfo?.EMP_Name && `${userInfo.EMP_Name.split('_').join(' ')}`;

  const [isOpen, setIsOpen] = useState(false);

  const focusedRouteName = state.routes[state.index].name;
  const isDownloadFocused = DOWNLOAD_ROUTES.includes(focusedRouteName);
  const mainRoutes = state.routes.filter(
    r => !DOWNLOAD_ROUTES.includes(r.name),
  );

  const downloadRoutes = state.routes.filter(r =>
    DOWNLOAD_ROUTES.includes(r.name),
  );

  const handleContactUs = async () => {
    const phoneNumber =
      userInfo?.EMP_Btype === ASUS.BUSINESS_TYPES.COMMERCIAL
        ? '9076040460'
        : '919076090948';
    const message = 'Hi, I am here from the ASUS eSales App.';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message,
    )}`;
    const webUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(webUrl);
    }
  };

  return (
    <>
      <DrawerContentScrollView
        contentContainerStyle={[
          styles.drawerContentContainer,
          {backgroundColor: AppColors[AppTheme].bgBase},
        ]}>
        {/* Header */}
        <View className="px-5 py-5 bg-lightBg-surface dark:bg-darkBg-surface flex-row  justify-between">
          <View>
            <AppImage
              source={require('../../assets/images/dp.png')}
              style={styles.avatar}
            />
            <AppText weight="bold" size="md" className="capitalize">
              {name}
            </AppText>
            <AppText size="base">{userInfo?.EMP_EmailID}</AppText>
          </View>
          <ThemeToggle size={60} />
        </View>

        {/* Navigation Items */}
        <ScrollView
          className="flex-1 pt-2"
          contentContainerStyle={{paddingBottom: 20, flexGrow: 1}}
          showsVerticalScrollIndicator={false}>
          {/* First 3 routes */}
          <DrawerSection
            routes={mainRoutes.slice(0, 3)}
            navigation={navigation}
            state={state}
          />

          {/* Downloads accordion */}
          <DrawerSection
            routes={downloadRoutes}
            navigation={navigation}
            state={state}
            isAccordion
            title="Downloads"
            initiallyOpen={isDownloadFocused}
            noIcon
          />

          {/* Remaining routes */}
          <DrawerSection
            routes={mainRoutes.slice(3)}
            navigation={navigation}
            state={state}
          />

          <DrawerItemWrapper
            icon={'log-out'}
            route={{name: 'Log Out'} as any}
            focused={false}
            onPress={() => setIsOpen(true)}
          />
        </ScrollView>

        {/* Footer */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="border-t py-4 flex-row items-center pl-5 border-gray-300 gap-4"
          onPress={() => navigation.navigate('Feedback')}>
          <AppIcon type="feather" name="edit" color={AppColors.primary} size={25} />
          <AppText size="md">FeedBack</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          className="border-t py-4 flex-row items-center pl-5 border-gray-300 gap-4"
          onPress={handleContactUs}>
          <AppIcon
            type="ionicons"
            name="logo-whatsapp"
            color={'green'}
            size={25}
          />
          <AppText size="md">Contact Us</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          className="border-t py-4 flex-row items-center pl-5 border-gray-300 gap-4">
          <AppIcon
            type="ionicons"
            name="code-working"
            color={'red'}
            size={25}
          />
          <AppText size="md">Testing Screen</AppText>
        </TouchableOpacity>
      </DrawerContentScrollView>
      <LogoutModal isVisible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default CustomDrawerContent;

const styles = StyleSheet.create({
  drawerContentContainer: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 40,
    marginBottom: 5,
  },
});
