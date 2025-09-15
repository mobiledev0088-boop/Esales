import { 
  View, 
  TouchableOpacity, 
  Animated, 
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import React, { 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback, 
  memo,
} from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AppText from './customs/AppText';
import { getShadowStyle } from '../utils/appStyles';

const Tab = createMaterialTopTabNavigator();

type TabItem = {
  name: string;
  component: React.ComponentType<any>;
  label: string;
  disabled?: boolean;
  badge?: string | number;
  icon?: React.ReactNode;
};

type AnimationConfig = {
  type?: 'spring' | 'timing';
  tension?: number;
  friction?: number;
  duration?: number;
  useNativeDriver?: boolean;
};

type TabBarTheme = {
  backgroundColor?: string;
  activeIndicatorColor?: string;
  activeTintColor?: string;
  inactiveTintColor?: string;
  shadowColor?: string;
  borderRadius?: number;
};

type AppTabBarsProps = {
  tabs: TabItem[];
  initialRouteName?: string;
  swipeEnabled?: boolean;
  tabBarStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  labelStyle?: TextStyle;
  activeTabStyle?: ViewStyle;
  activeLabelStyle?: TextStyle;
  theme?: TabBarTheme;
  animation?: AnimationConfig;
  tabSpacing?: number;
  tabPadding?: number;
  showShadow?: boolean;
  shadowIntensity?: number;
  onTabPress?: (tabName: string, index: number) => void;
  renderBadge?: (badge: string | number) => React.ReactNode;
  tabBarPosition?: 'top' | 'bottom';
  equalWidth?: boolean;
  minTabWidth?: number;
  maxTabWidth?: number;
  scrollEnabled?: boolean;
  bounces?: boolean;
  pressAnimationEnabled?: boolean;
  hapticFeedback?: boolean;
};

const CustomTabBar = memo(({
  state, 
  descriptors, 
  navigation,
  theme = {},
  animation = {},
  tabSpacing = 32,
  tabPadding = 3,
  showShadow = true,
  shadowIntensity = 2,
  onTabPress,
  renderBadge,
  tabStyle,
  labelStyle,
  activeTabStyle,
  activeLabelStyle,
  equalWidth = true,
  minTabWidth,
  maxTabWidth,
  pressAnimationEnabled = true,
  tabs = [],
}: any) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  
  const tabWidth = useMemo(() => {
    if (equalWidth) {
      const calculatedWidth = (screenWidth - tabSpacing) / state.routes.length;
      if (maxTabWidth && calculatedWidth > maxTabWidth) return maxTabWidth;
      if (minTabWidth && calculatedWidth < minTabWidth) return minTabWidth;
      return calculatedWidth;
    }
    return minTabWidth || 120;
  }, [screenWidth, state.routes.length, tabSpacing, equalWidth, minTabWidth, maxTabWidth]);

  const animationConfig = useMemo(() => ({
    type: 'spring',
    tension: 150,
    friction: 8,
    useNativeDriver: true,
    ...animation,
  }), [animation]);

  const themeConfig = useMemo(() => ({
    backgroundColor: '#FFFFFF',
    activeIndicatorColor: '#3B82F6',
    activeTintColor: '#FFFFFF',
    inactiveTintColor: '#64748B',
    shadowColor: '#3B82F6',
    borderRadius: 6,
    ...theme,
  }), [theme]);

  useEffect(() => {
    if (animationConfig.type === 'spring') {
      Animated.spring(animatedValue, {
        toValue: state.index,
        useNativeDriver: animationConfig.useNativeDriver,
        tension: animationConfig.tension,
        friction: animationConfig.friction,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: state.index,
        duration: animationConfig.duration || 300,
        useNativeDriver: animationConfig.useNativeDriver,
      }).start();
    }
  }, [state.index, animationConfig]);

  const translateX = useMemo(() => {
    return animatedValue.interpolate({
      inputRange: state.routes.map((_: any, index: number) => index),
      outputRange: state.routes.map((_: any, index: number) => 
        6 + index * tabWidth
      ),
    });
  }, [animatedValue, state.routes, tabWidth]);

  const handleTabPress = useCallback((route: any, index: number) => {
    const isFocused = state.index === index;
    const currentTab = tabs.find((tab: TabItem) => tab.name === route.name);
    
    // Check if tab is disabled
    if (currentTab?.disabled) return;
    
    // Custom onTabPress callback
    onTabPress?.(route.name, index);

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }, [state.index, navigation, onTabPress, tabs]);

  return (
    <View
      className="flex-row px-2 mx-3 my-2 rounded-md"
      style={[
        {
          backgroundColor: themeConfig.backgroundColor,
          paddingVertical: tabPadding,
          borderRadius: themeConfig.borderRadius,
        },
        showShadow && getShadowStyle(shadowIntensity),
        tabStyle,
      ]}>
      
      {/* Animated Indicator */}
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            transform: [{ translateX }],
            width: tabWidth - 2,
            backgroundColor: themeConfig.activeIndicatorColor,
            shadowColor: themeConfig.shadowColor,
          },
        ]}
      />
      
      {/* Tab Buttons */}
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const isFocused = state.index === index;
        const currentTab = tabs.find((tab: TabItem) => tab.name === route.name);
        const disabled = currentTab?.disabled;
        const badge = currentTab?.badge;
        const icon = currentTab?.icon;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => handleTabPress(route, index)}
            disabled={disabled}
            className="justify-center items-center py-1.5 rounded-xl h-8 relative"
            style={[
              { width: tabWidth },
              isFocused && activeTabStyle,
              disabled && styles.disabledTab,
            ]}
            activeOpacity={pressAnimationEnabled ? 0.8 : 1}>
            
            {/* Tab Content */}
            <View className="flex-row items-center">
              {icon && (
                <View className="mr-1">
                  {icon}
                </View>
              )}
              
              <AppText
                size="xs"
                weight="semibold"
                className="text-center tracking-wider"
                style={[
                  {
                    color: isFocused 
                      ? themeConfig.activeTintColor 
                      : themeConfig.inactiveTintColor,
                  },
                  labelStyle,
                  isFocused && activeLabelStyle,
                  disabled && styles.disabledText,
                ]}>
                {label}
              </AppText>
            </View>

            {/* Badge */}
            {badge && (
              <View className="absolute -top-1 -right-1">
                {renderBadge ? renderBadge(badge) : (
                  <View className="bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                    <AppText size="xs" color="white" weight="bold">
                      {badge}
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});


const MaterialTabBar: React.FC<AppTabBarsProps> = ({
  tabs,
  initialRouteName,
  swipeEnabled = false,
  tabBarStyle,
  containerStyle,
  tabStyle,
  labelStyle,
  activeTabStyle,
  activeLabelStyle,
  theme,
  animation,
  tabSpacing = 32,
  tabPadding = 3,
  showShadow = true,
  shadowIntensity = 2,
  onTabPress,
  renderBadge,
  tabBarPosition = 'top',
  equalWidth = true,
  minTabWidth,
  maxTabWidth,
  scrollEnabled = false,
  bounces = true,
  pressAnimationEnabled = true,
  hapticFeedback = false,
}) => {
  // Validate tabs
  const validTabs = useMemo(() => 
    tabs.filter(tab => tab.name && tab.component && tab.label),
    [tabs]
  );

  if (!validTabs.length) {
    console.warn('AppTabBars: No valid tabs provided');
    return null;
  }

  const screenOptions = useMemo(() => ({
    swipeEnabled,
    tabBarPosition,
  }), [swipeEnabled, tabBarPosition]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Tab.Navigator
        initialRouteName={initialRouteName || validTabs[0]?.name}
        screenOptions={screenOptions}
        tabBar={props => (
          <CustomTabBar
            {...props}
            theme={theme}
            animation={animation}
            tabSpacing={tabSpacing}
            tabPadding={tabPadding}
            showShadow={showShadow}
            shadowIntensity={shadowIntensity}
            onTabPress={onTabPress}
            renderBadge={renderBadge}
            tabStyle={tabStyle}
            labelStyle={labelStyle}
            activeTabStyle={activeTabStyle}
            activeLabelStyle={activeLabelStyle}
            equalWidth={equalWidth}
            minTabWidth={minTabWidth}
            maxTabWidth={maxTabWidth}
            pressAnimationEnabled={pressAnimationEnabled}
            tabs={validTabs}
          />
        )}>
        {validTabs.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarLabel: tab.label,
            }}
            listeners={{
              tabPress: (e) => {
                if (tab.disabled) {
                  e.preventDefault();
                }
              },
            }}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
};

export default memo(MaterialTabBar);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledTab: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});