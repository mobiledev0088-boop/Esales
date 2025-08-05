
import AppText from './customs/AppText';

import {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { AppColors } from '../config/theme';


const Tab = createMaterialTopTabNavigator();

const TAB_BAR_CONSTANTS = {
  ANIMATION_DURATION: 200,
  TAB_PADDING_VERTICAL: 12,
  INDICATOR_HEIGHT: 2,
  MIN_TAB_WIDTH: 140,
  ACTIVE_COLOR: '#111',
  INACTIVE_COLOR: AppColors.light.text,
  BG_COLOR: AppColors.light.bgSurface,
  INDICATOR_COLOR: AppColors.tabSelected,
} as const;

type TabScreen = {
  name: string;
  component: React.ComponentType<any>;
  options?: object;
};

type CustomTopTabsProps = {
  tabs: TabScreen[];
  tabBarOptions?: {
    labelStyle?: any;
    style?: any;
    indicatorStyle?: any;
    activeTintColor?: string;
    inactiveTintColor?: string;
    scrollEnabled?: boolean;
  };
  screenOptions?: object;
  swipeEnabled?: boolean;
  tabWidth?: number;
};

const CustomTopTabs: React.FC<CustomTopTabsProps> = ({
  tabs,
  tabBarOptions = {},
  screenOptions = {},
  swipeEnabled = false,
  tabWidth = TAB_BAR_CONSTANTS.MIN_TAB_WIDTH,
}) => {
  const validTabs = useMemo(
    () => tabs.filter(tab => tab.name && tab.component),
    [tabs]
  );

  if (!validTabs.length) return null;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: tabBarOptions.scrollEnabled ?? true,
        swipeEnabled,
        ...screenOptions,
      }}
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          tabBarOptions={tabBarOptions}
          tabWidth={tabWidth}
        />
      )}
    >
      {validTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={tab.options}
        />
      ))}
    </Tab.Navigator>
  );
};

const CustomTabBar = ({
  state,
  descriptors,
  navigation,
  position,
  tabBarOptions = {},
  tabWidth,
}: MaterialTopTabBarProps & {
  tabBarOptions?: CustomTopTabsProps['tabBarOptions'];
  tabWidth: number;
}) => {
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;
  const [tabWidths, setTabWidths] = useState<number[]>([]);

  const totalTabWidth = useMemo(() => tabWidths.reduce((sum, w) => sum + w, 0), [tabWidths]);
  const shouldScroll = totalTabWidth > Dimensions.get('window').width;

  const handleLayout = useCallback((e: LayoutChangeEvent, index: number) => {
    const width = e.nativeEvent.layout.width;
    setTabWidths(prev => {
      const updated = [...prev];
      updated[index] = width;
      return updated;
    });
  }, []);

  useEffect(() => {
    if (tabWidths.length === state.routes.length) {
      const translateX = tabWidths.slice(0, state.index).reduce((acc, w) => acc + w, 0);
      Animated.timing(indicatorTranslateX, {
        toValue: translateX,
        duration: TAB_BAR_CONSTANTS.ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [state.index, tabWidths]);

  const handleTabPress = useCallback(
    (routeName: string, routeKey: string, isFocused: boolean) => () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation]
  );

  const containerStyle = [
    styles.tabContainer,
    { backgroundColor: tabBarOptions.style?.backgroundColor ?? TAB_BAR_CONSTANTS.BG_COLOR },
    tabBarOptions.style,
  ];

  const indicatorStyle = {
    backgroundColor: tabBarOptions.indicatorStyle?.backgroundColor ?? TAB_BAR_CONSTANTS.INDICATOR_COLOR,
    ...tabBarOptions.indicatorStyle,
  };

  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        scrollEnabled={shouldScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const color = isFocused
            ? tabBarOptions.activeTintColor ?? TAB_BAR_CONSTANTS.ACTIVE_COLOR
            : tabBarOptions.inactiveTintColor ?? TAB_BAR_CONSTANTS.INACTIVE_COLOR;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={handleTabPress(route.name, route.key, isFocused)}
              onLayout={(e) => handleLayout(e, index)}
              style={[
                styles.tabButton,
                { width: tabWidth },
                isFocused && { backgroundColor: AppColors.tabSelectedBg },
              ]}
            >
              <AppText style={[{ color }, tabBarOptions.labelStyle]}>
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}

        {tabWidths.length === state.routes.length && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidths[state.index] || 0,
                transform: [{ translateX: indicatorTranslateX }],
              },
              indicatorStyle,
            ]}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: TAB_BAR_CONSTANTS.TAB_PADDING_VERTICAL,
    alignItems: 'center',
    paddingHorizontal: 12,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: TAB_BAR_CONSTANTS.INDICATOR_HEIGHT,
  },
});

export default CustomTopTabs;

