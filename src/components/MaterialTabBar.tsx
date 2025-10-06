/**
 * MaterialTabBar
 * Extended to support three ways of supplying screen content per tab:
 * 1. Simple component type:
 *    { name: 'Home', label: 'Home', component: HomeScreen }
 * 2. Component with injected props via componentProps:
 *    { name: 'Home', label: 'Home', component: HomeScreen, componentProps: { data } }
 * 3. Pre-created element (props already or additionally provided):
 *    { name: 'Home', label: 'Home', component: <HomeScreen data={data} another={x} /> }
 *    (You may still add/override with componentProps which will be merged via cloneElement.)
 */
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
import { useThemeStore } from '../stores/useThemeStore';
import { AppColors } from '../config/theme';

const Tab = createMaterialTopTabNavigator();

type TabItem = {
  name: string;
  component: React.ComponentType<any> | React.ReactElement; // extended to accept element instances
  label: string;
  disabled?: boolean;
  badge?: string | number;
  icon?: React.ReactNode;
  componentProps?: Record<string, any>; // optional props merged/injected when rendering
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
  if(!tabs.length) return null;
  if(tabs.length === 1) return null; // No need for tab bar if only one tab

  const appTheme = useThemeStore(state => state.AppTheme);
  const isDark = appTheme === 'dark';
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

  const themeConfig = useMemo(() => {
    // Base palette derived from AppColors + mode
    const palette = isDark ? AppColors.dark : AppColors.light;
    return {
      backgroundColor: palette.bgSurface,
      activeIndicatorColor: palette.tabSelected,
      activeTintColor: palette.bgBase,
      inactiveTintColor: palette.heading,
      shadowColor: palette.primary,
      borderRadius: 8,
      ...theme, // user overrides last
    } as Required<TabBarTheme> & { inactiveTintColor: string; activeTintColor: string; activeIndicatorColor: string; };
  }, [isDark, theme, appTheme]);

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
      // NativeWind classes for light / dark backgrounds
      className={`flex-row px-2 mx-3 my-2 rounded-md ${isDark ? '' : ''}`}
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
        // Using style due to animated values; tailwind cannot handle animated dynamic translate
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
            className={`justify-center items-center py-1.5 rounded-xl h-8 relative ${isFocused ? '' : ''}`}
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
                className={`text-center tracking-wider ${isFocused ? '' : ''}`}
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
  containerStyle,
  tabStyle,
  labelStyle,
  activeTabStyle,
  activeLabelStyle,
  theme, // still allow overrides; base colors come from zustand
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
  pressAnimationEnabled = true,
}) => {
  // Validate tabs
  const validTabs = useMemo(() => {
    const filtered = tabs.filter(tab => {
      const hasBasics = !!(tab.name && tab.component && tab.label);
      if(!hasBasics) return false;
      return true;
    });
    if (__DEV__ && filtered.length !== tabs.length) {
      console.warn('[MaterialTabBar] Some tabs were excluded because they are missing name/component/label');
    }
    return filtered;
  }, [tabs]);

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
        {validTabs.map((tab) => {
          const useRenderProp = React.isValidElement(tab.component) || !!tab.componentProps;

          if (useRenderProp) {
            return (
              <Tab.Screen
                key={tab.name}
                name={tab.name}
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
              >
                {() => {
                  // If user passed an element instance, clone it to merge componentProps (if any)
                  if (React.isValidElement(tab.component)) {
                    return React.cloneElement(tab.component, tab.componentProps);
                  }
                  // Otherwise it's a component type with extra props
                  const Comp = tab.component as React.ComponentType<any>;
                  return <Comp {...tab.componentProps} />;
                }}
              </Tab.Screen>
            );
          }

            // Legacy path: component is a component type without injected props
            return (
              <Tab.Screen
                key={tab.name}
                name={tab.name}
                component={tab.component as React.ComponentType<any>}
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
            );
        })}
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