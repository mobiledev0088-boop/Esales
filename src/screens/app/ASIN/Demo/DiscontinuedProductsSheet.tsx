import ActionSheet, { SheetManager, useSheetPayload } from "react-native-actions-sheet";
import { useUserStore } from "../../../../stores/useUserStore";
import { useThemeStore } from "../../../../stores/useThemeStore";
import moment from "moment";
import { ScrollView, View } from "react-native";
import SheetIndicator from "../../../../components/SheetIndicator";
import AppIcon from "../../../../components/customs/AppIcon";
import AppText from "../../../../components/customs/AppText";
import AppButton from "../../../../components/customs/AppButton";

export default function DiscontinuedProductsSheet() {
  const payload = useSheetPayload() as {data: any[]};
  console.log('📦 DiscontinuedProductsSheet payload:', payload);
  const {data = []} = payload || {};
  const {Year_Qtr} = useUserStore(state => state.empInfo);
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');
  const quaterYear = moment(Year_Qtr || undefined, 'YYYY-[Q]Q').format('[Q]Q YYYY');
  const headerLabels = ['Category', 'Series', 'Model'];

  const handleClose = () => {
    SheetManager.hide('DiscontinuedProductsSheet');
  };

  return (
    <View>
      <ActionSheet
        id="DiscontinuedProductsSheet"
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
        }}>
        <SheetIndicator />
        <View className="px-6 pt-4 pb-6 ">
          {/* Header Section */}
          <View className="flex-row items-start mb-6 gap-x-3">
            <View className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900 items-center justify-center mb-4">
              <AppIcon
                type="materialIcons"
                name="warning"
                size={32}
                color="#F59E0B"
              />
            </View>
            <View>
              <AppText className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Important Notice
              </AppText>
              <View className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950 rounded-full">
                <AppText className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Discontinued Products - {quaterYear}
                </AppText>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View className="bg-amber-50 dark:bg-amber-950 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
            <AppText className="text-sm leading-6 text-gray-700 dark:text-gray-300 text-center">
              Effective immediately, the following demo models are discontinued
              from the <AppText className="font-bold">{quaterYear}</AppText>{' '}
              demo program and will no longer receive demo support. Kindly
              prioritize liquidating these SKUs as they will not be included in
              future allocations.
            </AppText>
          </View>

          {/* Empty State */}
          {data.length === 0 && (
            <View className="items-center py-12">
              <View className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mb-3">
                <AppIcon
                  type="materialIcons"
                  name="check-circle"
                  size={40}
                  color="#10B981"
                />
              </View>
              <AppText className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                All Clear!
              </AppText>
              <AppText className="text-sm text-gray-500 dark:text-gray-400">
                No discontinued products at this time.
              </AppText>
            </View>
          )}

          {/* Products Table */}
          {data.length > 0 && (
            <View className="mb-4">
              {/* Table Header */}
              <View className="bg-gray-50 dark:bg-gray-800 rounded-t-xl px-4 py-3 border-b-2 border-gray-200 dark:border-gray-700">
                <View className="flex-row">
                  {headerLabels.map((label, idx) => (
                    <View
                      key={label}
                      className="flex-1"
                      style={{
                        marginRight: idx < headerLabels.length - 1 ? 8 : 0,
                      }}>
                      <AppText className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        {label}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Table Body */}
              <ScrollView className="bg-white dark:bg-gray-900 rounded-b-xl border-l border-r border-gray-200 dark:border-gray-700 h-72">
                {data.map((item, index) => (
                  <View
                    key={index}
                    className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800"
                    style={{
                      backgroundColor:
                        index % 2 === 0
                          ? isDarkTheme
                            ? '#1F2937'
                            : '#FFFFFF'
                          : isDarkTheme
                            ? '#111827'
                            : '#F9FAFB',
                    }}>
                    <View className="flex-row">
                      <View className="flex-1 mr-2">
                        <AppText className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {item.Category || '-'}
                        </AppText>
                      </View>
                      <View className="flex-1 mr-2">
                        <AppText className="text-sm text-gray-700 dark:text-gray-300">
                          {item.Series || '-'}
                        </AppText>
                      </View>
                      <View className="flex-1">
                        <AppText className="text-sm text-gray-700 dark:text-gray-300">
                          {item.DemoUnitModel || '-'}
                        </AppText>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Count Badge */}
              <View className="bg-amber-100 dark:bg-amber-900 rounded-b-xl px-4 py-2.5 border border-amber-200 dark:border-amber-800">
                <AppText className="text-xs text-center text-amber-800 dark:text-amber-200 font-semibold">
                  {data.length} Product{data.length !== 1 ? 's' : ''}{' '}
                  Discontinued
                </AppText>
              </View>
            </View>
          )}

          <AppButton title="I Understand" onPress={handleClose} />
        </View>
      </ActionSheet>
    </View>
  );
};

export const showDiscontinuedProductsSheet = (data: any[]) => {
  SheetManager.show('DiscontinuedProductsSheet', {payload: {data}});
};