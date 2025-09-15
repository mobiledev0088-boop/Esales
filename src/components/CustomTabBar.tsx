import { useEffect, useRef, useState } from "react";
import { useThemeStore } from "../stores/useThemeStore";
import { Animated, TouchableOpacity, View } from "react-native";
import AppText from "./customs/AppText";
import { AppColors } from "../config/theme";

const TabBar = ({
  tabs,
  activeIndex,
  onTabPress,
}: {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef<Array<{ x: number; width: number }>>([]);

  // Measure tab positions
  const onTabLayout = (index: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };

    // Initialize for first active tab
    if (index === activeIndex) {
      translateX.setValue(x);
      indicatorWidth.setValue(width);
    }
  };

  useEffect(() => {
    const activeTabLayout = tabLayouts.current[activeIndex];
    if (activeTabLayout) {
      Animated.timing(translateX, {
        toValue: activeTabLayout.x,
        duration: 300,
        useNativeDriver: false, // must be false for width
      }).start();

      Animated.timing(indicatorWidth, {
        toValue: activeTabLayout.width,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [activeIndex]);

  return (
    <View className={`flex-row rounded-md p-1 mx-4 mb-0`}
      style={{ backgroundColor: isDarkTheme ? AppColors.dark.bgBase : '#f3f4f6' }}
    >
      {/* Animated indicator */}
      <Animated.View
        className="absolute top-1 bottom-1 left-1 rounded-lg"
        style={{
          backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : AppColors.tabSelectedBg,
          transform: [{ translateX: Animated.add(translateX, -4) }],
          width: indicatorWidth,
        }}
      />

      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          className="flex-1 py-3 px-4 rounded-lg items-center justify-center"
          onPress={() => onTabPress(index)}
          onLayout={(event) => onTabLayout(index, event)}
          activeOpacity={0.8}>
          <AppText
            weight="bold"
            size="sm"
            style={{
              color: isDarkTheme 
                ? (activeIndex === index ? AppColors.dark.text : AppColors.dark.subheading)
                : '#1e3a8a'
            }}
          >
            {tab}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const CustomTabBar = ({
  tabs,
  tabComponents,
}: {
  tabs: string[];
  tabComponents?: React.ComponentType<any>[];
}) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleTabPress = (index: number) => {
    setActiveTabIndex(index);
  };

  const ActiveComponent = tabComponents?.[activeTabIndex];

  return (
    <View>
      <TabBar 
        tabs={tabs}
        activeIndex={activeTabIndex}
        onTabPress={handleTabPress}
      />
      <View 
        className={`${isDarkTheme ? '' : 'bg-white'}`}
        style={{ backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : undefined }}
      >
        {ActiveComponent && <ActiveComponent />}
      </View>
    </View>
  );
};

export default CustomTabBar;