import { TouchableOpacity, View } from "react-native";
import AppText from "../../../../components/customs/AppText";
import { useState } from "react";
import Card from "../../../../components/Card";
import { AmountItem, Header, InfoItem } from "./component";
import moment from "moment";
import { useThemeStore } from "../../../../stores/useThemeStore";

export const EachClaim = ({values, needBorder}: any) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  
  return (
    <View
      className={`px-4 pt-3 ${needBorder ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}>
      {/* Claim Code */}
      <View className="mb-5">
        <AppText 
          size="sm" 
          className="text-gray-500 dark:text-gray-400 mb-1" 
          weight="medium"
        >
          Claim Code
        </AppText>
        <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <AppText
            size="base"
            weight="medium"
            className="text-gray-900 dark:text-gray-100">
            {values.ClaimCode}
          </AppText>
        </View>
      </View>
      {/* Main Info Grid */}
      <View className="mb-5">
        <InfoItem label="Scheme Category" value={values.Scheme_Category} />

        <View className="flex-row space-x-4">
          <View className="flex-1">
            <InfoItem label="Start Date" value={moment(values.Start_Date).format('YYYY-MM-DD')} />
          </View>
          <View className="flex-1">
            <InfoItem label="End Date" value={moment(values.End_Date).format('YYYY-MM-DD')} />
          </View>
        </View>

        <View className="flex-row space-x-4">
          <View className="flex-1">
           <InfoItem label="Distributor" value={values.Distributor} />
          </View>
          <View className="flex-1">
              <InfoItem label="Disti CN No." value={values.DistiCN_No} />
          </View>
        </View>

        <View className="flex-row space-x-4">
          <View className="flex-1">
            <InfoItem label="Disti CN Date" value={moment(values.Disti_CN_Date).format('YYYY-MM-DD')} />
          </View>
          <View className="flex-1">
            <InfoItem label="Status" value={values.IndiaStatus} isStatus={true} />
          </View>
        </View>
      </View>
      {/* Amount Section */}
      <View className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
        <View className="flex-row space-x-4">
          {values.Tax_Amt && <AmountItem label="Pre Tax Amt" amount={values.Tax_Amt} />}
          {values.FinalAmt && <AmountItem
            label="Final Amt"
            amount={values.FinalAmt}
            isFinal={true}
          />}
        </View>
      </View>
    </View>
  );
};

export function ClaimSchemeInfo({data}: {data: any[]}) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className={'p-0 overflow-hidden border border-slate-200 dark:border-slate-700'}>
      <Header name="Claim/Scheme Related Info" icon="receipt-long" />
      <View>
        {data.length === 0 || data[0].ErrorMessage ? (
          <AppText className="text-gray-500 dark:text-gray-400 text-center py-4">
            No Claim/Scheme Related Info Available
          </AppText>
        ) : (
          <>
            {expanded ? (
              data.map((item, index) => (
                <EachClaim key={index} values={item} needBorder={index !== 0} />
              ))
            ) : (
              <EachClaim values={data[0]} />
            )}
            {data.length > 1 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(!expanded)}
                className="w-full border-t border-gray-200 dark:border-gray-700 py-4">
                <AppText className="text-blue-500 dark:text-blue-400 text-center">
                  {expanded ? 'Show Less' : 'Show More'}
                </AppText>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Card>
  );
}