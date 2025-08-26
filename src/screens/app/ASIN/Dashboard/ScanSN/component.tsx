import AppText from '../../../../../components/customs/AppText';
import {Modal, TouchableOpacity, View, FlatList} from 'react-native';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import {formatToINR} from '../../../../../utils/commonFunctios';
import AppButton from '../../../../../components/customs/AppButton';
import Card from '../../../../../components/Card';
import AppInput from '../../../../../components/customs/AppInput';
import {useState} from 'react';
import {screenHeight, screenWidth} from '../../../../../utils/constant';
import Animated, { FadeInUp, FadeOutDown, SlideInDown, SlideOutDown} from 'react-native-reanimated';
import { useThemeStore } from '../../../../../stores/useThemeStore';
import { AppColors } from '../../../../../config/theme';

interface DataType {
  icon: string;
  iconType: IconType;
  label: string;
  value: string;
}

interface RowType {
  icon: string;
  iconType: IconType;
  label: string;
  value: string;
}

interface SearchProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  openScanner: () => void;
  clearSearch: () => void;
  handleSearch: () => void;
  recentSearches?: string[]; // Add this prop for recent searches
  appTheme?: 'light' | 'dark';
}

const InfoRow = ({icon, iconType, label, value}: RowType) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  
  return (
    <View className="flex-row items-center py-2">
      <View className="w-8 items-center mr-3">
        <AppIcon 
          type={iconType} 
          name={icon} 
          size={18} 
          color={AppColors[appTheme].text} 
        />
      </View>
      <View className="flex-1">
        <AppText 
          size="sm" 
          className="text-gray-600 dark:text-gray-400 mb-1"
        >
          {label}
        </AppText>
        <AppText 
          size="base" 
          weight="medium" 
          className="text-gray-900 dark:text-gray-100"
        >
          {value}
        </AppText>
      </View>
    </View>
  );
};

export const InfoGrid = ({data}: {data: DataType[]}) => {
  return (
    <View className="flex-1 p-4 bg-white dark:bg-darkBg-surface">
      <View className="flex-row flex-wrap justify-between">
        {data.map((item, index) => (
          <View key={index} className="w-[48%] mb-4">
            <InfoRow
              icon={item.icon}
              iconType={item.iconType}
              label={item.label}
              value={item.value || 'N/A'}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export const AmountItem = ({
  label,
  amount,
  isFinal = false,
}: {
  label: string;
  amount: number;
  isFinal?: boolean;
}) => (
  <View className="flex-1">
    <AppText 
      size="sm" 
      className="text-gray-500 dark:text-gray-400 mb-1" 
      weight="medium"
    >
      {label}
    </AppText>
    <AppText
      size="lg"
      weight="bold"
      className={
        isFinal ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
      }>
      {formatToINR(amount)}
    </AppText>
  </View>
);

export const InfoItem = ({
  label,
  value,
  isStatus = false,
}: {
  label: string;
  value: string | number;
  isStatus?: boolean;
}) => (
  <View className="mb-3">
    <AppText 
      size="sm" 
      className="text-gray-500 dark:text-gray-400 mb-1" 
      weight="medium"
    >
      {label}
    </AppText>
    <AppText
      size="base"
      weight="medium"
      className={
        isStatus 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-gray-900 dark:text-gray-100'
      }>
      {value}
    </AppText>
  </View>
);

export const Header = ({name, icon}: {name: string; icon: string}) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  
  return (
    <View className="border-b border-gray-200 dark:border-gray-700 p-4">
      <View className="flex-row items-center ">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: isDarkTheme ? AppColors.dark.primary : '#DBEAFE'
          }}
        >
          <AppIcon 
            type="materialIcons" 
            name={icon} 
            size={20} 
            color="#3B82F6" 
          />
        </View>
        <View className="flex-1">
          <AppText
            size="lg"
            weight="bold"
            className="text-gray-900 dark:text-gray-100">
            {name}
          </AppText>
        </View>
      </View>
    </View>
  );
};

export const RecentSearchModal = ({
  isVisible,
  onClose,
  recentSearches,
  onSelectSearch,
}: {
  isVisible: boolean;
  onClose: () => void;
  recentSearches: string[];
  onSelectSearch: (searchNumber: string) => void;
}) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  
  const renderRecentItem = ({item}: {item: string}) => (
    <TouchableOpacity
      onPress={() => {
        onSelectSearch(item);
        onClose();
      }}
      className="flex-row items-center justify-between py-4 px-4 border-b border-gray-100 dark:border-gray-700"
      activeOpacity={0.7}>
      <View className="flex-row items-center flex-1">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: isDarkTheme ? AppColors.dark.primary : '#EBF4FF'
          }}
        >
          <AppIcon
            type="materialIcons"
            name="history"
            size={18}
            color="#3B82F6"
          />
        </View>
        <View className="flex-1">
          <AppText 
            size="base" 
            weight="medium" 
            className="text-gray-900 dark:text-gray-100"
          >
            {item}
          </AppText>
        </View>
      </View>
      <AppIcon
        type="materialIcons"
        name="chevron-right"
        size={20}
        color={AppColors[appTheme].text}
      />
    </TouchableOpacity>
  );
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      >
      <View className="bg-black/50">
        <Animated.View
          entering={FadeInUp.duration(300)} // Slide in speed
          exiting={FadeOutDown.duration(300)} // Slide out speed
          style={{
            width: screenWidth,
            height: screenHeight,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999999
          }}>
          <View className="w-[85%]">
            <View className="bg-white dark:bg-darkBg-surface rounded-xl shadow-lg overflow-hidden">
              <View 
                className="flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"
                style={{
                  backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : '#F9FAFB'
                }}
              >
                <View className="flex-row items-center">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: isDarkTheme ? AppColors.dark.primary : '#DBEAFE'
                    }}
                  >
                    <AppIcon
                      type="materialIcons"
                      name="history"
                      size={18}
                      color="#3B82F6"
                    />
                  </View>
                  <AppText 
                    size="lg" 
                    weight="bold" 
                    className="text-gray-900 dark:text-gray-100"
                  >
                    Recent Searches
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDarkTheme ? AppColors.dark.bgBase : '#E5E7EB'
                  }}
                  activeOpacity={0.7}>
                  <AppIcon
                    type="materialIcons"
                    name="close"
                    size={18}
                    color={AppColors[appTheme].text}
                  />
                </TouchableOpacity>
              </View>
              {/* Content */}
              {recentSearches.length > 0 ? (
                <FlatList
                  data={recentSearches}
                  renderItem={renderRecentItem}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  showsVerticalScrollIndicator={false}
                  style={{maxHeight: screenHeight * 0.5}}
                />
              ) : (
                <View className="items-center py-12 px-6">
                  <View 
                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                    style={{
                      backgroundColor: isDarkTheme ? AppColors.dark.bgBase : '#F3F4F6'
                    }}
                  >
                    <AppIcon
                      type="materialIcons"
                      name="search-off"
                      size={32}
                      color={AppColors[appTheme].text}
                    />
                  </View>
                  <AppText
                    size="lg"
                    weight="medium"
                    className="text-gray-500 dark:text-gray-400 text-center mb-2">
                    No Recent Searches
                  </AppText>
                  <AppText 
                    size="sm" 
                    className="text-gray-400 dark:text-gray-500 text-center"
                  >
                    Your recent searches will appear here
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const SearchCard = ({
  searchValue,
  setSearchValue,
  openScanner,
  clearSearch,
  handleSearch,
  recentSearches = [],
  appTheme,
}: SearchProps) => {
  const currentTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = (appTheme || currentTheme) === 'dark';
  const [showRecentModal, setShowRecentModal] = useState(false);

  const handleRecentSearch = (selectedSearch: string) => {
    setSearchValue(selectedSearch);
  };

  return (
    <>
      <Card className="mb-6 mt-4">
        <View className="flex-row items-center justify-between mb-4">
          <AppText 
            size="lg" 
            weight="bold" 
            className="text-gray-800 dark:text-gray-100"
          >
            Search by Serial Number
          </AppText>
          {recentSearches.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowRecentModal(true)}
              className="flex-row items-center px-3 py-2 rounded-lg"
              style={{
                backgroundColor: isDarkTheme ? AppColors.dark.bgBase : '#F3F4F6'
              }}
              activeOpacity={0.7}>
              <AppIcon
                type="materialIcons"
                name="history"
                size={16}
                color={AppColors[isDarkTheme ? 'dark' : 'light'].text}
              />
              <AppText 
                size="sm" 
                className="text-gray-600 dark:text-gray-300 ml-2"
              >
                Recent
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        <AppInput
          label="Serial Number"
          value={searchValue}
          setValue={setSearchValue}
          placeholder="Enter or scan serial number"
          leftIcon="search"
          rightIconTsx={
            <TouchableOpacity
              onPress={openScanner}
              className="mr-3 p-2 rounded-lg"
              style={{
                backgroundColor: isDarkTheme ? AppColors.dark.primary : '#EBF4FF'
              }}
              activeOpacity={0.7}>
              <AppIcon
                type="materialIcons"
                name="qr-code-scanner"
                size={20}
                color="#3B82F6"
              />
            </TouchableOpacity>
          }
          onClear={clearSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <View className="flex-row gap-3 mt-4">
          <AppButton
            onPress={handleSearch}
            className="flex-1 py-3 rounded-lg"
            title="Search"
            noLoading
          />
          <AppButton
            onPress={clearSearch}
            className={`flex-1 py-3 rounded-lg ${
              isDarkTheme ? 'bg-gray-800' : 'bg-gray-200'
            }`}
            title="Clear"
            color={isDarkTheme ? 'white' : 'black'}
            noLoading
          />
        </View>
      </Card>

      <RecentSearchModal
        isVisible={showRecentModal}
        onClose={() => setShowRecentModal(false)}
        recentSearches={recentSearches}
        onSelectSearch={handleRecentSearch}
      />
    </>
  );
};

export const NoResultsMessage = () => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  
  return (
    <Card className="items-center py-8 mt-5">
      <AppIcon 
        type="feather" 
        name="search" 
        size={48} 
        color={AppColors[appTheme].text} 
      />
      <AppText
        size="lg"
        weight="medium"
        className="text-gray-500 dark:text-gray-400 mt-4 text-center">
        No device found
      </AppText>
      <AppText 
        size="base" 
        className="text-gray-400 dark:text-gray-500 mt-2 text-center"
      >
        Try scanning the barcode or check the serial number
      </AppText>
    </Card>
  );
};

export const CautionModal = () => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => setIsOpen(false);
  
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen">
      <View style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <Animated.View
          entering={SlideInDown.duration(300)} // Slide in speed
          exiting={SlideOutDown.duration(300)} // Slide out speed
          style={{
            width: screenWidth,
            height: screenHeight,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View 
            className="rounded-xl p-5 items-center w-[85%] shadow-lg"
            style={{
              backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : 'white'
            }}
          >
            <View className="flex-row items-center mb-4">
              <AppText 
                size="xl" 
                weight="bold" 
                className="text-gray-800 dark:text-gray-100 mr-3"
              >
                Caution
              </AppText>
              <AppIcon
                type="ionicons"
                name="warning-outline"
                size={26}
                color="#F59E0B"
              />
            </View>

            <View className="mb-5">
              <AppText className="text-center text-gray-600 dark:text-gray-300 leading-6 mb-3">
                The Activation Date is only to be used for checking rebate
                eligibility under ASUS eSalesIndia system.
              </AppText>
              <AppText className="text-center text-gray-600 dark:text-gray-300 leading-6">
                Any other use and sharing the Activation Date with other staff
                or with third parties is prohibited.
              </AppText>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              className="items-center justify-center bg-primary rounded-lg py-3 px-6 min-w-[120px] shadow-sm">
              <AppText color="white" weight="medium">
                Continue
              </AppText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
