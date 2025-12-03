import {memo} from 'react';
import {View, TouchableOpacity} from 'react-native';
import moment from 'moment';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import Accordion from '../../../../components/Accordion';
import {AppColors} from '../../../../config/theme';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import Card from '../../../../components/Card';

interface SchemeStatProps {
  label: string;
  value: number;
  color: 'emerald' | 'orange' | 'primary';
  icon: string;
}
interface MonthProductRowProps {
  displayMonth: string;
  productLineName: string;
  productCode: string;
  processed: number;
  underProcess: number;
  onPressProcessed: () => void;
  onPressUnderProcess: () => void;
}

type DataItem = {
  Scheme_Category: string;
  Product_Line: string;
  Product_Line_Name: string;
  [month: string]: string | null;
};

type MonthEntry = {
  MonthYear: string;
  Product_Line: string;
  Product_Line_Name: string;
  total: number;
  processed: number;
  under_Processed: number;
  // precomputed timestamp for faster sorting & to avoid repeated moment parsing cost
  __ts: number;
};

type GroupedData = {
  Scheme_Category: string;
  Months: MonthEntry[];
  Totals: {
    total: number;
    processed: number;
    under_Processed: number;
  };
};
type TransformResult = {
  groupedData: GroupedData[];
  allSchemeCategories: string[];
  allProductLinesName: string[];
};

type GroupedAccordionProps = {
  group: GroupedData;
  onNavigate: (data: any) => void;
};

const variantStyles = {
  emerald: {
    container:
      'px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 flex-1',
    text: 'text-emerald-700 dark:text-emerald-300 text-center',
  },
  orange: {
    container:
      'px-3 py-2 rounded-md bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 flex-1',
    text: 'text-orange-700 dark:text-orange-300 text-center',
  },
};

// ✅ Main function
export const buildGroups = (data: DataItem[]): TransformResult => {
  const schemeSet = new Set<string>();
  const productSet = new Set<string>(); // Product_Line_Name
  const productOrder = new Map<string, number>(); // Preserve natural order
  let productCounter = 0;

  const groupedMap = data.reduce((acc: Record<string, GroupedData>, item) => {
    const {Scheme_Category, Product_Line, Product_Line_Name, ...months} = item;

    // Track unique schemes & products
    schemeSet.add(Scheme_Category);
    productSet.add(Product_Line_Name);
    if (!productOrder.has(Product_Line))
      productOrder.set(Product_Line, productCounter++);

    if (!acc[Scheme_Category]) {
      acc[Scheme_Category] = {
        Scheme_Category,
        Months: [],
        Totals: {total: 0, processed: 0, under_Processed: 0},
      };
    }

    Object.entries(months).forEach(([month, value]) => {
      if (!value) return;
      const [total, processed, underProcessed] = value.split('|').map(Number);
      // pre-parse timestamp ONCE per entry
      const ts = moment(month, 'MMM-YYYY').toDate().getTime();
      acc[Scheme_Category].Months.push({
        MonthYear: month,
        Product_Line,
        Product_Line_Name,
        total,
        processed,
        under_Processed: underProcessed,
        __ts: ts,
      });
      acc[Scheme_Category].Totals.total += total;
      acc[Scheme_Category].Totals.processed += processed;
      acc[Scheme_Category].Totals.under_Processed += underProcessed;
    });

    return acc;
  }, {});

  // ✅ Use moment.js to sort months correctly
  const groupedData = Object.values(groupedMap).map(group => {
    group.Months.sort((a, b) => {
      if (a.__ts !== b.__ts) return a.__ts - b.__ts;
      return (
        (productOrder.get(a.Product_Line) ?? 0) -
        (productOrder.get(b.Product_Line) ?? 0)
      );
    });
    return group;
  });

  // Build arrays for filters
  const allSchemeCategories = Array.from(schemeSet);
  const allProductLinesName = Array.from(productSet);

  return {groupedData, allSchemeCategories, allProductLinesName};
};

const schemeColorMap: Record<
  SchemeStatProps['color'],
  {icon: string; text: string}
> = {
  emerald: {icon: '#059669', text: 'text-emerald-600'},
  orange: {icon: '#ea580c', text: 'text-orange-600'},
  primary: {icon: AppColors.primary, text: 'text-primary'},
};

export const SchemeStat: React.FC<SchemeStatProps> = memo(
  ({label, value, color, icon}) => {
    const colors = schemeColorMap[color];
    return (
      <View className="flex-1 items-center px-1">
        <AppIcon
          type="feather"
          name={icon as any}
          size={25}
          color={colors.icon}
        />
        <AppText size="sm" weight="medium" className={`${colors.text} mt-1`}>
          {label}
        </AppText>
        <AppText size="lg" weight="semibold" className="text-gray-900 mt-0.5">
          {value}
        </AppText>
      </View>
    );
  },
);

export const MonthRangeCard: React.FC<{
  range: {start?: Date; end?: Date};
  onPress: () => void;
}> = ({range, onPress}) => {
  const hasRange = !!(range.start && range.end);
  const formatted = hasRange
    ? `${moment(range.start).format('MMM YYYY')} - ${moment(range.end).format('MMM YYYY')}`
    : 'Select Months';
  const monthDiff = hasRange
    ? moment(range.end)
        .startOf('month')
        .diff(moment(range.start).startOf('month'), 'months') + 1
    : 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center flex-1 rounded border border-[#d1d5db] dark:border-[#374151] bg-lightBg-surface dark:bg-darkBg-surface px-4 py-3 shadow-sm h-[55px]">
      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
        <AppIcon name="calendar" type="ionicons" size={20} color="#2563eb" />
      </View>
      <View className="flex-1">
        <AppText size="xs" weight="medium" className="text-gray-500 mb-1">
          Month Range
        </AppText>
        <AppText
          size="sm"
          weight="semibold"
          className="text-gray-800"
          numberOfLines={1}>
          {formatted}
        </AppText>
      </View>
      {hasRange && (
        <View className="items-center ml-3">
          <View className="bg-green-100 dark:bg-[#0EA473] px-2 py-1 rounded-full">
            <AppText
              size="xs"
              weight="semibold"
              className="text-green-700 leading-none">
              {monthDiff} M
            </AppText>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const FilterButton: React.FC<{onPress: () => void}> = ({onPress}) => {
  return (
    <View className="">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.4}
        className="flex-row items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-lightBg-surface dark:bg-darkBg-surface px-4 shadow-sm ml-2 h-[56px] w-[55px]">
        <AppIcon
          type="material-community"
          name="tune-variant"
          size={22}
          color={AppColors.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

export const MonthProductRow: React.FC<MonthProductRowProps> = memo(
  ({
    displayMonth,
    productLineName, // reserved for future use if full name required
    productCode,
    processed,
    underProcess,
    onPressProcessed,
    onPressUnderProcess,
  }) => {
    if (processed + underProcess === 0) return null;
    return (
      <View className="flex-row items-center py-2 px-3 rounded-md bg-lightBg-surface dark:bg-darkBg-surface mb-1 border border-gray-100 dark:border-[#374151] shadow-sm">
        <View className="w-1/4 pr-2">
          <AppText size="sm" weight="semibold" className="text-gray-800">
            {displayMonth}
          </AppText>
        </View>
        <View className="w-[30%] pr-3">
          <AppText
            size="sm"
            weight="medium"
            className="text-gray-800"
            numberOfLines={1}>
            {productLineName}
          </AppText>
        </View>
        <View className="flex-row flex-1 gap-2">
          {processed > 0 && (
            <TouchableOpacity
              onPress={onPressProcessed}
              activeOpacity={0.75}
              className={variantStyles.emerald.container}>
              <AppText
                size="sm"
                weight="semibold"
                className={variantStyles.emerald.text}>
                {processed}
              </AppText>
            </TouchableOpacity>
          )}
          {underProcess > 0 && (
            <TouchableOpacity
              onPress={onPressUnderProcess}
              activeOpacity={0.75}
              className={variantStyles.orange.container}>
              <AppText
                size="sm"
                weight="semibold"
                className={variantStyles.orange.text}>
                {underProcess}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  },
);

export const GroupAccordion: React.FC<GroupedAccordionProps> = memo(
  ({group: g, onNavigate}) => {
    return (
      <Card className='p-0 rounded'>
      <Accordion
        key={g.Scheme_Category}
        header={
          <View className="flex-1 pr-2">
            <AppText size="md" weight="semibold" className="text-gray-900 mb-2">
              {g.Scheme_Category}
            </AppText>
            <View className="border-b border-gray-200 mb-2 border-dashed" />
            <View className="flex-row items-center">
              <SchemeStat
                label="Total Claims"
                value={g.Totals.total}
                color="primary"
                icon="layers"
              />
              <SchemeStat
                label="Processed"
                value={g.Totals.processed}
                color="emerald"
                icon="check-circle"
              />
              <SchemeStat
                label="Under Process"
                value={g.Totals.under_Processed}
                color="orange"
                icon="clock"
              />
            </View>
          </View>
        }
        headerClassName="py-2"
        containerClassName="bg-lightBg-surface dark:bg-darkBg-surface rounded border border-gray-200 dark:border-[#374151] "
        contentClassName="px-0"
        needBottomBorder={false}>
        <View className="px-1 pb-3 pt-1">
          <View className="border-b border-gray-200 mt-2 mb-2 border-dashed" />
          <View className="flex-row items-center mb-2 px-2">
            <AppText
              size="sm"
              weight="semibold"
              className="w-[90px] text-gray-500">
              Month
            </AppText>
            <AppText
              size="sm"
              weight="semibold"
              className="flex-1 text-gray-500">
              Product Name
            </AppText>
            <AppText
              size="sm"
              weight="semibold"
              className="text-emerald-600 mr-4">
              Processed
            </AppText>
            <AppText size="sm" weight="semibold" className="text-orange-600">
              Under Process
            </AppText>
          </View>
          {g.Months.map((month, idx) => (
            <MonthProductRow
              // combining month + product line ensures stable uniqueness
              key={month.MonthYear + '_' + month.Product_Line + '_' + idx}
              displayMonth={month.MonthYear}
              productLineName={month.Product_Line_Name}
              productCode={month.Product_Line}
              processed={month.processed}
              underProcess={month.under_Processed}
              onPressProcessed={() =>
                onNavigate({
                  scheme: g.Scheme_Category,
                  month,
                  productLine: month.Product_Line,
                  Product_Line_Name: month.Product_Line_Name,
                  type: 'processed',
                })
              }
              onPressUnderProcess={() =>
                onNavigate({
                  scheme: g.Scheme_Category,
                  month,
                  productLine: month.Product_Line,
                  Product_Line_Name: month.Product_Line_Name,
                  type: 'underProcess',
                })
              }
            />
          ))}
        </View>
      </Accordion>
      </Card>
    );
  },
);

export const EmptyState = ({
  variant,
  onResetFilters,
  onChangeDateRange,
}: {
  variant: 'no-data' | 'no-results';
  onResetFilters?: () => void;
  onChangeDateRange?: () => void;
}) => {
  const isNoData = variant === 'no-data';
  return (
    <View className="mt-14 px-6 items-center">
      <View className="w-20 h-20 mb-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center">
        <AppIcon
          name={isNoData ? 'inbox' : 'filter'}
          type={isNoData ? 'feather' : 'feather'}
          size={42}
          color={isNoData ? '#4f46e5' : '#2563eb'}
        />
      </View>
      <AppText
        weight="semibold"
        size="md"
        className="text-slate-700 dark:text-slate-200 mb-2 text-center">
        {isNoData ? 'No Claim Data Found' : 'No Results Match Your Filters'}
      </AppText>
      <AppText
        size="sm"
        className="text-slate-500 dark:text-slate-400 text-center leading-5 mb-6">
        {isNoData
          ? 'There is no claim information for the selected date range. Try adjusting the months to broaden your search.'
          : 'Try changing or clearing one or more filters to see claim data again.'}
      </AppText>
      <View className="flex-row gap-3">
        {variant === 'no-results' && onResetFilters && (
          <TouchableOpacity
            onPress={onResetFilters}
            activeOpacity={0.8}
            className="px-4 py-2 rounded-full bg-blue-600 dark:bg-blue-500">
            <AppText weight="medium" size="sm" className="text-white">
              Clear Filters
            </AppText>
          </TouchableOpacity>
        )}
        {variant === 'no-data' && onChangeDateRange && (
          <TouchableOpacity
            onPress={onChangeDateRange}
            activeOpacity={0.8}
            className="px-4 py-2 rounded-full bg-indigo-600 dark:bg-indigo-500">
            <AppText weight="medium" size="sm" className="text-white">
              Change Date Range
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const ClaimListSkeleton = () => {
  return (
    <View className="flex-1 ">
      <Skeleton width={screenWidth - 24} height={40} borderRadius={8} />
      <View className="mt-3 space-y-3">
        {Array.from({length: 6}).map((_, index) => (
          <Skeleton
            key={index}
            width={screenWidth - 24}
            height={100}
            borderRadius={8}
          />
        ))}
      </View>
    </View>
  );
};
export const ClaimDataSkeleton = () => {
  return (
    <View className="gap-3">
      <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
      <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
      <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
      <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
    </View>
  );
};
