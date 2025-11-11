import {
  Linking,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useCallback, useMemo} from 'react';
import AppLayout from '../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import AppText from '../../../../components/customs/AppText';
import {ASUS, screenWidth} from '../../../../utils/constant';
import {EmpInfo, UserInfo} from '../../../../types/user';
import Card from '../../../../components/Card';
import AppIcon from '../../../../components/customs/AppIcon';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import Skeleton from '../../../../components/skeleton/skeleton';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';
import {AppColors} from '../../../../config/theme';
import Accordion from '../../../../components/Accordion';

// Types
interface NotificationItem {
  Notification_Type: string;
  Employee_Code: string;
  Highlited_Value: string;
  Msg_Body: string;
  Msg_Send_Date: string;
  Msg_Title: string;
  Token_Id: string;
  Unique_key: string;
}

interface NotificationTabItem {
  title: string;
  id: string;
}

interface NotificationData {
  notificationTypeTabData: NotificationTabItem[];
  groupByNotificationType: Record<string, NotificationItem[]>;
}

const useGetPushNotification = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';

  return useQuery({
    queryKey: ['push-notification', employeeCode],
    queryFn: async (): Promise<NotificationData> => {
      try {
        const res = await handleASINApiCall(
          '/PushNotification/GetPushNotificationInfo',
          {employeeCode},
        );

        // Early return for invalid response structure
        if (
          !res?.claimMasterData?.Status ||
          !res?.claimMasterData?.Datainfo?.Info
        ) {
          return {
            notificationTypeTabData: [],
            groupByNotificationType: {},
          };
        }
        const notificationsData = res.claimMasterData.Datainfo
          .Info as NotificationItem[];

        if (
          !Array.isArray(notificationsData) ||
          notificationsData.length === 0
        ) {
          return {
            notificationTypeTabData: [],
            groupByNotificationType: {},
          };
        }

        // Use Set to track unique notification types (more efficient)
        const uniqueTypes = new Set<string>();
        const notificationTypeTabData: NotificationTabItem[] = [];
        const groupByNotificationType: Record<string, NotificationItem[]> = {};

        // Single loop to process both tab data and grouping
        notificationsData.forEach(notification => {
          const notificationType = notification?.Notification_Type;
          // Add to unique types if not already present
          if (!uniqueTypes.has(notificationType)) {
            uniqueTypes.add(notificationType);
            notificationTypeTabData.push({
              title: notificationType,
              id: notificationType,
            });
          }

          // Group notifications by type
          if (!groupByNotificationType[notificationType]) {
            groupByNotificationType[notificationType] = [];
          }
          groupByNotificationType[notificationType].push(notification);
        });

        return {
          notificationTypeTabData,
          groupByNotificationType,
        };
      } catch (error) {
        // Log error for debugging (optional)
        console.error('Error fetching push notifications:', error);

        // Return empty data structure on error
        return {
          notificationTypeTabData: [],
          groupByNotificationType: {},
        };
      }
    },
    enabled: !!employeeCode, // Don't fetch if no employee code
  });
};

// ====== SKELETON LOADER ======
const NotificationSkeleton = () => (
  <View className="px-3 mt-4">
    {Array.from({length: 5}).map((_, idx) => (
      <Skeleton
        key={idx}
        width={screenWidth - 24}
        height={120}
        borderRadius={12}
      />
    ))}
  </View>
);

// ====== EMPTY STATE ======
const EmptyState = () => (
  <View className="flex-1 items-center justify-center px-6" style={{minHeight: 400}}>
    <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
      <AppIcon name="bell-off" type="feather" size={36} color="#94a3b8" />
    </View>
    <AppText size="lg" weight="semibold" className="text-gray-800 mb-2">
      No Notifications
    </AppText>
    <AppText size="sm" className="text-gray-500 text-center">
      You don't have any notifications at the moment.
    </AppText>
  </View>
);

// ====== NOTIFICATION CARD ======
interface NotificationCardProps {
  item: NotificationItem;
  onNavigate: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = React.memo(
  ({item, onNavigate}) => {

    // Render clickable links in notification body
    const renderNotificationBody = (notificationBody: string) => {
      if (!notificationBody) return null;
      const links = notificationBody.split(/(https?:\/\/[^\s]+)/g);

      return links.map((message, index) => {
        if (message.match(/https?:\/\/[^\s]+/)) {
          return (
            <AppText
              key={index}
              size="xs"
              className="text-blue-600 underline"
              onPress={() => Linking.openURL(message)}>
              {message}
            </AppText>
          );
        } else {
          return (
            <AppText key={index} size="xs" className="text-gray-600 leading-5">
              {message}
            </AppText>
          );
        }
      });
    };

    const formattedDate = item.Msg_Send_Date
      ? moment(item.Msg_Send_Date).format('DD MMM YYYY, hh:mm A')
      : '';

    // Accordion Header
    const accordionHeader = (
      <View className="flex-1 flex-row items-start">
        {/* Icon */}
        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
          <AppIcon
            name="bell"
            type="feather"
            size={18}
            color={AppColors.primary}
          />
        </View>

        {/* Content */}
        <View className="flex-1 mr-2">
          {/* Title */}
          <AppText
            size="sm"
            weight="semibold"
            className="text-gray-900 mb-1">
            {item.Msg_Title || 'Notification'}
          </AppText>

          {/* Date & Type Badge Row */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center flex-1">
              <AppIcon
                name="clock"
                type="feather"
                size={11}
                color="#9ca3af"
                style={{marginRight: 4}}
              />
              <AppText size="xs" className="text-gray-500" numberOfLines={1}>
                {formattedDate}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    );

    // Accordion Content
    const accordionContent = (
      <View className="px-3 pb-3">
        {/* Message Body */}
        {item.Msg_Body && (
          <View className="bg-gray-50 p-3 rounded-lg mb-3">
            <View className="flex-row flex-wrap">
              {renderNotificationBody(item.Msg_Body)}
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          onPress={onNavigate}
          activeOpacity={0.7}
          className="bg-primary px-4 py-2.5 rounded-lg flex-row items-center justify-center">
          <AppText size="sm" weight="semibold" className="text-white mr-2">
            View Details
          </AppText>
          <AppIcon
            name="arrow-right"
            type="feather"
            size={16}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    );

    return (
      <View className="mb-3">
        <Card className="p-0 overflow-hidden">
          <Accordion
            header={accordionHeader}
            headerClassName="py-3 px-3"
            contentClassName="px-0"
            containerClassName="rounded-lg"
            needBottomBorder={false}
            arrowSize={20}
            duration={300}>
            {accordionContent}
          </Accordion>
        </Card>
      </View>
    );
  },
);

// ====== NOTIFICATION LIST COMPONENT ======
interface NotificationListProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onNotificationPress: (item: NotificationItem) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading,
  refreshing,
  onRefresh,
  onNotificationPress,
}) => {
  const renderItem = useCallback(
    ({item}: {item: NotificationItem}) => (
      <NotificationCard item={item} onNavigate={() => onNotificationPress(item)} />
    ),
    [onNotificationPress],
  );

  if (isLoading && !refreshing) {
    return <NotificationSkeleton />;
  }

  return (
    <FlatList
      data={notifications}
      renderItem={renderItem}
      keyExtractor={(_,index)=>index.toString()}
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 20,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[AppColors.primary]}
          tintColor={AppColors.primary}
        />
      }
    />
  );
};

// Navigation route mapping types
type NavigationRoute = string;
type NavigationParams = {Year_Qtr?: string};

const navigateTo = (
  notification_type: string,
  navigation: any,
  userInfo: UserInfo,
  empInfo: EmpInfo,
): void => {
  // Early return for commercial business type
  if (userInfo.EMP_Btype === ASUS.BUSINESS_TYPES.COMMERCIAL) return;

  const roleId = userInfo.EMP_RoleId;
  const empType = userInfo.EMP_Type;

  // Helper function to navigate with optional params
  const navigate = (route: NavigationRoute, params?: NavigationParams) => {
    try {
      navigation.push(route, params);
    } catch (error) {
      console.error(`Navigation failed for route: ${route}`, error);
    }
  };

  // Demo notifications
  if (notification_type.includes('Demo')) {
    const demoRoutes: Record<number, NavigationRoute> = {
      [ASUS.ROLE_ID.LFR_HO]: 'DemoDashboardScreenLFR',
      [ASUS.ROLE_ID.ONLINE_HO]: 'DemoDashboardScreenLFR',
      [ASUS.ROLE_ID.ASE]: 'DemoDashboardScreenISP',
      [ASUS.ROLE_ID.AM]: 'DemoDashboardScreenAM',
    };

    // Check simple role-based routes first
    if (demoRoutes[roleId]) {
      navigate(demoRoutes[roleId]);
      return;
    }

    // Handle Partners with specific types
    if (roleId === ASUS.ROLE_ID.PARTNERS) {
      if (empType === ASUS.PARTNER_TYPE.T2.AWP) {
        navigate('DemoDashboardScreenPartnerAWP');
      } else {
        navigate('DemoDashboardScreenPartner');
      }
      return;
    }

    // Roles that should NOT navigate for Demo
    const excludedDemoRoles: number[] = [
      ASUS.ROLE_ID.DISTRIBUTORS,
      ASUS.ROLE_ID.ESHOP_HO,
      ASUS.ROLE_ID.DISTI_HO,
    ];

    if (!excludedDemoRoles.includes(roleId)) {
      navigate('DemoDashboardScreen');
    }
    return;
  }

  // Claim notifications
  if (notification_type.includes('Claim')) {
    const distiRoles: readonly number[] = [
      ASUS.ROLE_ID.DISTRIBUTORS,
      ASUS.ROLE_ID.DISTI_HO,
    ];
    const excludedClaimRoles: readonly number[] = [
      ASUS.ROLE_ID.ESHOP_HO,
      ASUS.ROLE_ID.AM,
      ASUS.ROLE_ID.ASE,
    ];

    if (distiRoles.includes(roleId)) {
      navigate('DistiClaimScreenDealer');
    } else if (!excludedClaimRoles.includes(roleId)) {
      navigate('ClaimDashboardScreen');
    }
    return;
  }

  // LMS notifications
  if (notification_type.includes('LMS')) {
    const yearQtr = empInfo?.Year_Qtr;

    // Partners - T3
    if (
      roleId === ASUS.ROLE_ID.PARTNERS &&
      empType === ASUS.PARTNER_TYPE.T3.T3
    ) {
      navigate('LMS_Menu', {Year_Qtr: yearQtr});
      return;
    }

    // Partners - AWP
    if (
      roleId === ASUS.ROLE_ID.PARTNERS &&
      empType === ASUS.PARTNER_TYPE.T2.AWP
    ) {
      navigate('LMSListAWP', {Year_Qtr: yearQtr});
      return;
    }

    // HO roles
    const hoRoles: readonly number[] = [
      ASUS.ROLE_ID.DIR_HOD_MAN,
      ASUS.ROLE_ID.HO_EMPLOYEES,
      ASUS.ROLE_ID.BSM,
      ASUS.ROLE_ID.TM,
      ASUS.ROLE_ID.COUNTRY_HEAD,
      ASUS.ROLE_ID.SALES_REPS,
      ASUS.ROLE_ID.BPM,
      ASUS.ROLE_ID.RSM,
      ASUS.ROLE_ID.CHANNEL_MARKETING,
    ];

    if (hoRoles.includes(roleId)) {
      navigate('LMSListHO', {Year_Qtr: yearQtr});
    }
    return;
  }

  // Scheme notifications
  if (notification_type.includes('Scheme')) {
    const excludedSchemeRoles: number[] = [
      ASUS.ROLE_ID.DISTRIBUTORS,
      ASUS.ROLE_ID.DISTI_HO,
    ];

    if (!excludedSchemeRoles.includes(roleId)) navigate('Schemes');
  }
};

export default function Notification() {
  const navigation = useNavigation<any>();
  const userInfo = useLoginStore(state => state.userInfo);
  
  // Create a minimal empInfo - only Year_Qtr is used in navigateTo
  const empInfo = useMemo(
    () => ({Year_Qtr: ''} as EmpInfo),
    [],
  );

  const {data, isLoading, isError, refetch} = useGetPushNotification();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('');

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle notification press - navigate based on type
  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      if (!userInfo) return;
      navigateTo(item.Notification_Type, navigation, userInfo, empInfo);
    },
    [navigation, userInfo, empInfo],
  );

  // Get filtered notifications for current tab
  const currentNotifications = useMemo(() => {
    if (!data?.groupByNotificationType || !selectedTab) return [];
    return data.groupByNotificationType[selectedTab] || [];
  }, [data, selectedTab]);

  // Set initial tab when data loads
  React.useEffect(() => {
    if (
      data?.notificationTypeTabData &&
      data.notificationTypeTabData.length > 0 &&
      !selectedTab
    ) {
      setSelectedTab(data.notificationTypeTabData[0].id);
    }
  }, [data, selectedTab]);

  // Handle tab change
  const handleTabPress = useCallback((tabName: string) => {
    setSelectedTab(tabName);
  }, []);

  // Show skeleton on initial load
  if (isLoading && !data) {
    return (
      <AppLayout title="Notifications" needBack>
        <NotificationSkeleton />
      </AppLayout>
    );
  }

  // Error state
  if (isError) {
    return (
      <AppLayout title="Notifications" needBack>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-4">
            <AppIcon name="alert-circle" type="feather" size={36} color="#ef4444" />
          </View>
          <AppText size="lg" weight="semibold" className="text-gray-800 mb-2">
            Something went wrong
          </AppText>
          <AppText size="sm" className="text-gray-500 text-center mb-4">
            Unable to load notifications. Please try again.
          </AppText>
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-primary px-6 py-3 rounded-lg"
            activeOpacity={0.8}>
            <AppText size="sm" weight="semibold" className="text-white">
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  // No tabs available
  if (!data?.notificationTypeTabData || data.notificationTypeTabData.length === 0) {
    return (
      <AppLayout title="Notifications" needBack>
        <EmptyState />
      </AppLayout>
    );
  }

  // Create tab screens dynamically
  const tabScreens = data.notificationTypeTabData.map(tab => ({
    name: tab.id,
    label: tab.title.replace(/_/g, ' '),
    component: (
      <NotificationList
        notifications={currentNotifications}
        isLoading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onNotificationPress={handleNotificationPress}
      />
    ),
  }));

  return (
    <AppLayout title="Notifications" needBack>
      <MaterialTabBar
        tabs={tabScreens}
        onTabPress={handleTabPress}
        tabPadding={10}
      />
    </AppLayout>
  );
}
