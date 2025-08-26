import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View ,Animated} from "react-native";
import AppText from "../../../../../components/customs/AppText";
import Card from "../../../../../components/Card";
import { Header, InfoGrid } from "./component";
import moment from "moment";
import { IconType } from "../../../../../components/customs/AppIcon";
import { useThemeStore } from "../../../../../stores/useThemeStore";
import { AppColors } from "../../../../../config/theme";

interface DataType {
  icon: string;
  iconType: IconType;
  label: string;
  value: string;
}

const Product = ({ values }: { values: any }) => {
  const data: DataType[] = [
    { icon: "hash", iconType: "feather", label: "Serial Number", value: values.Serial_Number },
    { icon: "monitor", iconType: "feather", label: "Model Name", value: values.Model_Name },
    { icon: "package", iconType: "feather", label: "Part Number", value: values.Part_Number },
    { icon: "laptop", iconType: "fontAwesome", label: "Product Type", value: values.Product_Type },
    { icon: "laptop", iconType: "antdesign", label: "Model Type", value: values.Model_Type },
    { icon: "shield", iconType: "feather", label: "Operating System", value: values.Operating_System },
    { icon: "target", iconType: "feather", label: "Segment", value: values.Segment },
    { icon: "list", iconType: "feather", label: "Specifications", value: values.Specifications },
    { icon: "grid", iconType: "feather", label: "Product Category", value: values.Product_Category },
    { icon: "calendar", iconType: "feather", label: "Activation Date", value: moment(values.Activation_Date).format("YYYY-MM-DD") },
    { icon: "check-circle", iconType: "feather", label: "Activation Status", value: values.Activation_Status },
    { icon: "message-square", iconType: "feather", label: "ASUS Remark", value: values.ASUS_Remark },
  ];
  return <InfoGrid data={data} />;
};

const T1 = ({ values }: { values: any }) => {
  const data: DataType[] = [
    { icon: "code", iconType: "feather", label: "Distiributor Code", value: values.Distributor_Code },
    { icon: "building-o", iconType: "fontAwesome", label: "Distiributor", value: values.Distributor },
    { icon: "calendar", iconType: "feather", label: "Disti Invoice Date", value: moment(values.Disti_Invoice_Date).format("YYYY-MM-DD") },
    { icon: "file-text", iconType: "feather", label: "Disti Invoice Number", value: values.Disti_Invoice_Number },
    { icon: "map", iconType: "feather", label: "State", value: values.State },
    { icon: "map-pin", iconType: "feather", label: "City", value: values.City },
    { icon: "user-check", iconType: "feather", label: "T2 Partner Code", value: values.T2_Partner_Code },
    { icon: "users", iconType: "feather", label: "T2 Partner name", value: values.T2_Partner_Name },
    { icon: "truck", iconType: "feather", label: "Ship Number", value: values.Ship_Number },
    { icon: "shopping-cart", iconType: "feather", label: "SO Number", value: values.SO_Number },
    { icon: "list", iconType: "feather", label: "SO Line", value: values.SO_Line },
  ];
  return <InfoGrid data={data} />;
};

const T2 = ({ values }: { values: any }) => {
  const data: DataType[] = [
    { icon: "git-branch", iconType: "feather", label: "Branch", value: values.Branch },
    { icon: "map", iconType: "feather", label: "State", value: values.State },
    { icon: "compass", iconType: "feather", label: "Territory", value: values.Territory },
    { icon: "map-pin", iconType: "feather", label: "City", value: values.City },
    { icon: "user-check", iconType: "feather", label: "T2 Partner Code", value: values.T2_Partner_Code },
    { icon: "users", iconType: "feather", label: "T2 Partner name", value: values.T2_Partner_Name },
    { icon: "briefcase", iconType: "feather", label: "T2 Partner Type", value: values.T2_Partner_Type },
    { icon: "calendar", iconType: "feather", label: "T2 Invoice Date", value: values.T2_Invoice_Date },
    { icon: "file-text", iconType: "feather", label: "T2 Invoice Number", value: values.T2_Invoice_Number },
    { icon: "key", iconType: "feather", label: "T3 AGP Partner Code", value: values.T3_AGP_Partner_Code },
    { icon: "user", iconType: "feather", label: "T3 AGP Partner Name", value: values.T3_AGP_Partner_Name },
  ];
  return <InfoGrid data={data} />;
};

const Demo = ({ values }: { values: any }) => {
  const data: DataType[] = [
    { icon: "play-circle", iconType: "feather", label: "Used In Demo", value: values.Used_In_Demo },
    { icon: "calendar", iconType: "feather", label: "Last Registered Date", value: values.Last_Registered_Date },
    { icon: "calendar", iconType: "feather", label: "Last UnRegistered Date", value: values.Last_UnRegistered_Date },
    { icon: "clock", iconType: "feather", label: "Duration Days", value: values.Duration_Days },
  ];
  return <InfoGrid data={data} />;
};

const CustomTabBar = ({
  tabs,
  activeIndex,
  onTabPress,
}: {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef<Array<{ x: number; width: number }>>([]);

  // Measure tab positions
  const onTabLayout = (index: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };

    // Initialize for first active tab
    if (index === activeIndex) {
      translateX.setValue(x);
      indicatorWidth.setValue(width);
    }
  };

  useEffect(() => {
    const activeTabLayout = tabLayouts.current[activeIndex];
    if (activeTabLayout) {
      Animated.timing(translateX, {
        toValue: activeTabLayout.x,
        duration: 300,
        useNativeDriver: false, // must be false for width
      }).start();

      Animated.timing(indicatorWidth, {
        toValue: activeTabLayout.width,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [activeIndex]);

  return (
    <View 
      style={[
        styles.tabBarContainer,
        { backgroundColor: isDarkTheme ? AppColors.dark.bgBase : '#f3f4f6' }
      ]}
    >
      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.animatedIndicator,
          {
            backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : '#ffffff',
            transform: [{ translateX: Animated.add(translateX, -4) }],
            width: indicatorWidth,
          },
        ]}
      />

      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tabButton}
          onPress={() => onTabPress(index)}
          onLayout={(event) => onTabLayout(index, event)}
          activeOpacity={0.8}>
          <AppText
            weight="bold"
            size="sm"
            style={{
              color: isDarkTheme 
                ? (activeIndex === index ? AppColors.dark.text : AppColors.dark.subheading)
                : '#1e3a8a'
            }}
          >
            {tab}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export function InformationTab({data}: {data: any}) {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDarkTheme = appTheme === 'dark';
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const validTabs = [
    {name: 'Product', component: Product, props: data.Product_Info},
    {name: 'T1', component: T1, props: data.Disti_Invoice_Info},
    {name: 'T2', component: T2, props: data.Partner_Invoice_Info},
    {name: 'Demo', component: Demo, props: data.Demo_Info},
  ];

  const tabNames = validTabs.map(tab => tab.name);
  const ActiveComponent = validTabs[activeTabIndex].component;

  const handleTabPress = (index: number) => {
    setActiveTabIndex(index);
  };

  return (
      <Card className={`p-0 overflow-hidden `}>
        <Header name="Information" icon="info" />
          <CustomTabBar
            tabs={tabNames}
            activeIndex={activeTabIndex}
            onTabPress={handleTabPress}
          />
        <View 
          style={[
            styles.tabContent,
            { backgroundColor: isDarkTheme ? AppColors.dark.bgSurface : 'white' }
          ]}
        >
          <ActiveComponent values={validTabs[activeTabIndex].props[0]} />
        </View>
      </Card>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    margin: 16,
    marginBottom: 0,
  },
  animatedIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    backgroundColor: 'white',
  },
});