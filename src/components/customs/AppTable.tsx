import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Watermark } from '../Watermark';
import { AppTextSizeType, AppTextWeightType } from '../../types/customs';
import { twMerge } from 'tailwind-merge';
import AppText from './AppText';
import clsx from 'clsx';

type Column<T> = {
    key: keyof T;
    title: string;
    width?: number;
    minWidth?: number;
    render?: (value: any, row: T) => React.ReactNode;
};

type AppTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    headerBgColor?: string;
    headerTextColor?: string;
    cellTextColor?: string;
    tableBgColor?: string;
    zebraRow?: boolean;
    watermarkText?: string;
    watermarkTextOpacity?: number;
    watermarkTextVerticalCount?: number;
    watermarkTextHorizontalCount?: number;
    watermarkTextRotation?: string;
    watermarkTextColor?: string;
    watermarkTextSize?: AppTextSizeType;
    watermarkTextWeight?: AppTextWeightType;
    scrollEnabled?: boolean;
};
export function AppTable<T>({
    columns,
    data,
    headerBgColor = 'bg-gray-200',
    headerTextColor = 'text-black',
    cellTextColor = 'text-black',
    tableBgColor = 'bg-white',
    zebraRow = false,
    watermarkText,
    watermarkTextOpacity = 0.2,
    watermarkTextVerticalCount = 1,
    watermarkTextHorizontalCount = 1,
    watermarkTextRotation = '-30deg',
    watermarkTextColor = 'text-gray',
    watermarkTextSize = 'sm',
    watermarkTextWeight = 'bold',
    scrollEnabled = true
}: AppTableProps<T>) {
    const [columnWidths, setColumnWidths] = useState(() =>
        columns.map((col) => col.width || 100)
    );

    const headerRowClasses = twMerge(
        clsx('flex-row border-b border-gray-300 '+ headerBgColor, 'dark:bg-gray-800')
    );
    const tableWrapperClasses = twMerge(
        clsx('border border-gray-300 rounded-md overflow-hidden', tableBgColor, 'dark:bg-gray-800')
    );

    return (
        <View style={{ width: '100%' }} >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={scrollEnabled}>
                <View className={tableWrapperClasses}>
                    {/* Header */}
                    <View className={headerRowClasses}>
                        {columns.map((col, index) => (
                            <View
                                key={String(col.key)}
                                style={{ width: columnWidths[index] }}
                                className="flex-row items-center justify-between pr-1 border-r border-gray-300"
                            >
                                <AppText weight="bold" className={twMerge(clsx('p-2', headerTextColor))}>
                                    {col.title}
                                </AppText>
                            </View>
                        ))}
                    </View>

                    {/* Watermark */}
                    {watermarkText && (
                        <Watermark
                            text={watermarkText}
                            opacity={watermarkTextOpacity}
                            verticalCount={watermarkTextVerticalCount}
                            horizontalCount={watermarkTextHorizontalCount}
                            rotation={watermarkTextRotation}
                            color={watermarkTextColor}
                            textSize={watermarkTextSize}
                            textWeight={watermarkTextWeight}
                        />
                    )}

                    {/* Rows */}
                    {data.map((item, rowIndex) => {
                        const isZebra = zebraRow && rowIndex % 2 === 1;
                        const rowClasses = twMerge(
                            clsx('flex-row border-b border-gray-200', {
                                'bg-gray-100': isZebra,
                            })
                        );

                        return (
                            <View key={rowIndex} className={rowClasses}>
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={String(col.key)}
                                        style={{ width: columnWidths[colIndex] }}
                                        className="pr-1 border-r border-gray-100"
                                    >
                                        <AppText className={twMerge(clsx('p-2', cellTextColor))}>
                                            {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                                        </AppText>
                                    </View>
                                ))}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

