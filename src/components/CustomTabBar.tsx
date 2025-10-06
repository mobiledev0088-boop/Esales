import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, TouchableOpacity, View, ViewStyle, StyleProp } from "react-native";
import { useThemeStore } from "../stores/useThemeStore";
import AppText from "./customs/AppText";
import { AppColors } from "../config/theme";


export interface TabItem {
  label: string;          // What the user sees
  name: string;           // Stable identifier for logic / analytics
  component: React.ReactNode | React.ComponentType<any>; // Rendered content
  disabled?: boolean;     // Optional disabled state
}

interface InternalTabBarProps {
  tabs: TabItem[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  activeTextColor?: string;
  inactiveTextColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  tabBarStyle?: StyleProp<ViewStyle>;
}

const TabBar = React.memo(({
  tabs,
  activeIndex,
  onTabPress,
  activeTextColor,
  inactiveTextColor,
  containerStyle,
  tabBarStyle,
}: InternalTabBarProps) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';

  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef<Array<{ x: number; width: number }>>([]);

  // Dynamic scale values per tab
  const scaleValuesRef = useRef<Animated.Value[]>([]);
  if (scaleValuesRef.current.length !== tabs.length) {
    scaleValuesRef.current = tabs.map((_, i) =>
      scaleValuesRef.current[i] || new Animated.Value(i === activeIndex ? 1.12 : 1)
    );
  }
  const scaleValues = scaleValuesRef.current;

  const AnimatedTouchable = useMemo(
    () => Animated.createAnimatedComponent(TouchableOpacity),
    []
  );

  // Layout measurement
  const onTabLayout = useCallback((index: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };
    // If this is the active tab and indicator not initialized yet
    if (index === activeIndex) {
      // We set directly without animation to avoid flicker on first paint
      translateX.setValue(x);
      indicatorWidth.setValue(width);
    }
  }, [activeIndex, indicatorWidth, translateX]);

  // Animate indicator + scales when active index changes or tabs change
  useEffect(() => {
    const layout = tabLayouts.current[activeIndex];
    if (layout) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: layout.x,
          duration: 280,
          useNativeDriver: false,
        }),
        Animated.timing(indicatorWidth, {
          toValue: layout.width,
          duration: 280,
          useNativeDriver: false,
        }),
      ]).start();
    }
    scaleValues.forEach((val, i) => {
      Animated.timing(val, {
        toValue: i === activeIndex ? 1.12 : 1,
        duration: 140,
        useNativeDriver: true,
      }).start();
    });
  }, [activeIndex, tabs.length, indicatorWidth, translateX, scaleValues]);

  const effectiveActiveColor = activeTextColor || (isDarkTheme ? AppColors.dark.text : '#1e3a8a');
  const effectiveInactiveColor = inactiveTextColor || (isDarkTheme ? AppColors.dark.subheading : '#1e3a8a');

  return (
    <View
    key={tabs.length}
      className="flex-row rounded-md p-1 py-2 mx-4 mb-0"
      style={[{ backgroundColor: isDarkTheme ? AppColors.dark.bgBase : '#f3f4f6' }, containerStyle]}
    >
      <Animated.View
        pointerEvents="none"
        className="absolute top-1.5 bottom-1.5  rounded"
        style={{
          backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : AppColors.tabSelectedBg,
          transform: [{ translateX: Animated.add(translateX, 0) }],
          width: indicatorWidth,
        }}
      />
      {tabs.map((tab, index) => {
        const extraFlex = tabs.length > 5 && tabs.length >= 4 ? 1.1 : 1;
        const disabled = tab.disabled;
        return (
          <AnimatedTouchable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: index === activeIndex, disabled }}
            accessibilityLabel={tab.label}
            disabled={disabled}
            activeOpacity={0.8}
            onLayout={(e) => onTabLayout(index, e)}
            onPress={() => onTabPress(index)}
            className="py-2 rounded items-center justify-center"
            style={[
              { transform: [{ scale: scaleValues[index] }], flex: extraFlex, opacity: disabled ? 0.5 : 1 },
              tabBarStyle,
            ]}
          >
            <AppText
              weight="bold"
              size="sm"
              numberOfLines={1}
              style={{ color: index === activeIndex ? effectiveActiveColor : effectiveInactiveColor }}
            >
              {tab.label}
            </AppText>
          </AnimatedTouchable>
        );
      })}
    </View>
  );
});

export interface AppTabBarProps {
  tabs: TabItem[];
  initialTabName?: string;                 // If provided will set initial active tab
  activeTabName?: string;                  // Controlled mode
  onTabChange?: (tab: TabItem, index: number) => void; // Callback
  // Styling overrides
  containerStyle?: StyleProp<ViewStyle>;
  tabBarStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  activeTextColor?: string;
  inactiveTextColor?: string;
}

const AppTabBar: React.FC<AppTabBarProps> = ({
  tabs,
  initialTabName,
  activeTabName,
  onTabChange,
  containerStyle,
  tabBarStyle,
  contentContainerStyle,
  activeTextColor,
  inactiveTextColor,
}) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';

  // Resolve initial index
  const derivedInitialIndex = useMemo(() => {
    if (activeTabName) {
      const idx = tabs.findIndex(t => t.name === activeTabName);
      return idx >= 0 ? idx : 0;
    }
    if (initialTabName) {
      const idx = tabs.findIndex(t => t.name === initialTabName);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [activeTabName, initialTabName, tabs]);

  const [internalIndex, setInternalIndex] = useState<number>(derivedInitialIndex);

  // If in controlled mode update internal when prop changes
  useEffect(() => {
    if (activeTabName) {
      const idx = tabs.findIndex(t => t.name === activeTabName);
      if (idx >= 0 && idx !== internalIndex) setInternalIndex(idx);
    }
  }, [activeTabName, tabs, internalIndex]);

  // Adjust active index if tabs array changes and active index is out of range
  useEffect(() => {
    if (internalIndex >= tabs.length) {
      setInternalIndex(0);
    }
  }, [tabs.length, internalIndex]);

  const handleTabPress = useCallback((index: number) => {
    if (index === internalIndex) return; // no-op
    if (!activeTabName) {
      setInternalIndex(index);
    }
    onTabChange?.(tabs[index], index);
  }, [internalIndex, activeTabName, onTabChange, tabs]);

  const activeTab = tabs[internalIndex];

  // Render active content
  const ActiveContent = useMemo(() => {
    if (!activeTab) return null;
    const C = activeTab.component as any;
    if (!C) return null;
    // Support passing a component type or an already instantiated node
    if (React.isValidElement(C)) return C;
    return <C />;
  }, [activeTab]);

  return (
    <View>
      <TabBar
        tabs={tabs}
        activeIndex={internalIndex}
        onTabPress={handleTabPress}
        activeTextColor={activeTextColor}
        inactiveTextColor={inactiveTextColor}
        containerStyle={containerStyle}
        tabBarStyle={tabBarStyle}
      />
      <View
        className={`${isDarkTheme ? '' : 'bg-white'}`}
        style={[{ backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : undefined }, contentContainerStyle]}
      >
        {ActiveContent}
      </View>
    </View>
  );
};

export default AppTabBar;