import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import AppText from './AppText';
import { Animated, TouchableOpacity, View, Easing } from 'react-native';

// Constants for better maintainability
const CHART_DEFAULTS = {
    COMPLETION: {
        SIZE: 80,
        COLOR: '#4CAF50',
        BACKGROUND_COLOR: '#E0E0E0',
        ANIMATION_DURATION: 800,
        FONT_SIZE_RATIO: 0.2,
        INNER_RADIUS_RATIO: 2.5,
    },
    FILLED: {
        SIZE: 100,
        TEXT_SIZE: 15,
        TEXT_COLOR: 'white',
        STROKE_COLOR: 'white',
        STROKE_WIDTH: 2,
    },
    BAR: {
        SIZE: 22,
        COLOR: '#177AD5',
        SECTIONS: 5,
        BORDER_RADIUS: 4,
        MAX_VALUE_PADDING: 10,
    },
} as const;

// Types
interface PieDataItem {
    value: number;
    text: string;
    color: string;
}

interface BarDataItem {
    value: number;
    label: string;
}

interface CompletionPieChartProps {
    variant: 'completion';
    value: number;
    size?: number;
    color?: string;
    onPress?: () => void;
}

interface FilledPieChartProps {
    variant: 'filled';
    data: PieDataItem[];
    focusOnPress?: boolean;
    size?: number;
    textSize?: number;
    textColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
}

interface BarChartProps {
    variant: 'bar';
    data: BarDataItem[];
    size?: number;
    color?: string;
    showMaxValue?: boolean;
}

type AppChartProps = CompletionPieChartProps | FilledPieChartProps | BarChartProps;

// Helper functions
const clampValue = (value: number, min: number = 0, max: number = 100): number =>
    Math.min(Math.max(value, min), max);

const calculateMaxValue = (data: BarDataItem[], padding: number = CHART_DEFAULTS.BAR.MAX_VALUE_PADDING): number => {
    if (!data?.length) return padding;
    return Math.max(...data.map(item => item.value)) + padding;
};

// Chart Components
const CompletionChart: React.FC<CompletionPieChartProps> = ({
    value,
    size = CHART_DEFAULTS.COMPLETION.SIZE,
    color = CHART_DEFAULTS.COMPLETION.COLOR,
    onPress = () => { },
}) => {
    const clampedValue = clampValue(value);

    const pieData = useMemo(() => [
        { value: clampedValue, color },
        { value: 100 - clampedValue, color: CHART_DEFAULTS.COMPLETION.BACKGROUND_COLOR },
    ], [clampedValue, color]);

    const fontSize = useMemo(() =>
        Math.round(size * CHART_DEFAULTS.COMPLETION.FONT_SIZE_RATIO),
        [size]
    );

    const renderCenterLabel = useCallback(() => (
        <AppText
            weight="bold"
            style={{
                fontSize,
                color,
            }}
        >
            {clampedValue}%
        </AppText>
    ), [clampedValue, fontSize, color]);

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <PieChart
                data={pieData}
                donut
                radius={size / 2}
                innerRadius={size / CHART_DEFAULTS.COMPLETION.INNER_RADIUS_RATIO}
                isAnimated
                animationDuration={CHART_DEFAULTS.COMPLETION.ANIMATION_DURATION}
                centerLabelComponent={renderCenterLabel}
            />
        </TouchableOpacity>
    );
};

import Svg, {Circle} from 'react-native-svg';

interface CircularProgressBarProps {
  progress: number; // 0-100
  progressColor: string;
  size?: number;
  strokeWidth?: number;
  duration?: number;
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  progress,
  progressColor,
  size = 120,
  strokeWidth = 8,
  duration = 800,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);
  const [strokeDashoffset, setStrokeDashoffset] = useState(0);
  
  // Clamp progress to ensure it's between 0 and 100
  const clampedProgress = clampValue(progress, 0, 100);
  
  // Memoized calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  
  // Optimized color function with memoization
  const lighterColor = useMemo(() => {
    if (progressColor.startsWith('#')) {
      const hex = progressColor.slice(1);
      const num = parseInt(hex, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      
      const newR = Math.min(255, Math.round(r + (255 - r) * 0.7));
      const newG = Math.min(255, Math.round(g + (255 - g) * 0.7));
      const newB = Math.min(255, Math.round(b + (255 - b) * 0.7));
      
      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    const colorMap: Record<string, string> = {
      green: '#E6F7FF',
      blue: '#E3F2FD',
      red: '#FFEBEE',
      orange: '#FFF3E0',
      purple: '#F3E5F5',
    };
    
    return colorMap[progressColor] || '#F5F5F5';
  }, [progressColor]);
  
  useEffect(() => {
    // Reset values
    animatedValue.setValue(0);
    setDisplayProgress(0);
    setStrokeDashoffset(circumference);
    
    const animation = Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic), // Smooth easing function
    });
    
    // Use a more efficient listener with throttling
    let lastUpdate = 0;
    const throttleTime = 16; // ~60fps
    
    const listener = animatedValue.addListener(({value}) => {
      const now = Date.now();
      if (now - lastUpdate >= throttleTime) {
        // Calculate the actual progress to display based on the original progress value
        const actualProgress = clampedProgress > 0 ? (value / clampedProgress) * progress : 0;
        setDisplayProgress(Math.round(actualProgress));
        setStrokeDashoffset(circumference - (circumference * value) / 100);
        lastUpdate = now;
      }
    });
    
    animation.start();
    
    return () => {
      animatedValue.removeListener(listener);
    };
  }, [clampedProgress, duration, circumference, progress]);

  return (
    <View style={{width: size, height: size}} className="items-center justify-center">
      <Svg width={size} height={size} style={{position: 'absolute'}}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={lighterColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {/* Center Text */}
      <View className="absolute items-center justify-center">
        <AppText size="md" weight="bold" style={{color: progressColor}}>
          {displayProgress}%
        </AppText>
      </View>
    </View>
  );
};

const FilledChart: React.FC<FilledPieChartProps> = ({
    data,
    focusOnPress = false,
    size = CHART_DEFAULTS.FILLED.SIZE,
    textSize = CHART_DEFAULTS.FILLED.TEXT_SIZE,
    textColor = CHART_DEFAULTS.FILLED.TEXT_COLOR,
    strokeColor = CHART_DEFAULTS.FILLED.STROKE_COLOR,
    strokeWidth = CHART_DEFAULTS.FILLED.STROKE_WIDTH,
}) => (
    <PieChart
        data={data}
        radius={size}
        strokeWidth={strokeWidth}
        strokeColor={strokeColor}
        showText
        textSize={textSize}
        textColor={textColor}
        labelsPosition="outward"
        focusOnPress={focusOnPress}
        fontWeight="bold"
        showTooltip
        showValuesAsLabels
    />
);

const ColumnChart: React.FC<BarChartProps> = ({
    data,
    size = CHART_DEFAULTS.BAR.SIZE,
    color = CHART_DEFAULTS.BAR.COLOR,
    showMaxValue = false,
}) => {
    const maxValue = useMemo(() =>
        calculateMaxValue(data, showMaxValue ? 0 : CHART_DEFAULTS.BAR.MAX_VALUE_PADDING),
        [data, showMaxValue]
    );

    if (!data?.length) {
        return null;
    }

    return (
        <BarChart
            data={data}
            barWidth={size}
            maxValue={maxValue}
            noOfSections={CHART_DEFAULTS.BAR.SECTIONS}
            barBorderRadius={CHART_DEFAULTS.BAR.BORDER_RADIUS}
            frontColor={color}
        />
    );
};

// Main Component
const AppChart: React.FC<AppChartProps> = (props) => {
    const { variant } = props;

    switch (variant) {
        case 'completion':
            return <CompletionChart {...props} />;

        case 'filled':
            return <FilledChart {...props} />;

        case 'bar':
            return <ColumnChart {...props} />;

        default:
            return null;
    }
};

export default AppChart;
