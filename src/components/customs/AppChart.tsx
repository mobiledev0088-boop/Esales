import React, { useMemo, useCallback } from 'react';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import AppText from './AppText';
import { TouchableOpacity } from 'react-native';

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
