import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Platform, View, TouchableOpacity} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import AppIcon from '../../../../../components/customs/AppIcon';
// Using a local modern button to allow outline/filled variants per item
import {
  PERMISSIONS,
  RESULTS,
  Permission,
  check,
  request,
  openSettings,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';

type PermissionKey =
  | 'camera'
  | 'gallery'
  | 'location'
  | 'locationAlways'
  | 'storageSave'
  | 'notifications';

type Status =
  | typeof RESULTS.UNAVAILABLE
  | typeof RESULTS.DENIED
  | typeof RESULTS.LIMITED
  | typeof RESULTS.GRANTED
  | typeof RESULTS.BLOCKED;

type PermissionState = Record<PermissionKey, Status | null>;

type ItemDef = {
  key: PermissionKey;
  title: string;
  desc: string;
  icon: {type: React.ComponentProps<typeof AppIcon>['type']; name: string};
};

function getAndroidVersion() {
  const v = Platform.Version;
  return typeof v === 'number' ? v : parseInt(String(v), 10);
}

function getPermissionConstant(key: PermissionKey): Permission | null {
  const androidVersion = Platform.OS === 'android' ? getAndroidVersion() : 0; // safe only inside render
  switch (key) {
    case 'camera':
      return Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
        default: null,
      }) as Permission | null;
    case 'gallery':
      return Platform.select({
        ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
        android:
          androidVersion >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        default: null,
      }) as Permission | null;
    case 'location':
      return Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        default: null,
      }) as Permission | null;
    case 'locationAlways':
      return Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_ALWAYS,
        android: PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
        default: null,
      }) as Permission | null;
    case 'storageSave':
      return Platform.select({
        ios: PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY,
        android:
          androidVersion >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        default: null,
      }) as Permission | null;
    default:
      return null;
  }
}

const statusColorMap: Record<
  Status,
  {bg: string; text: string; label: string}
> = {
  [RESULTS.GRANTED]: {
    bg: 'bg-green-600/15 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    label: 'Granted',
  },
  [RESULTS.DENIED]: {
    bg: 'bg-yellow-600/10 dark:bg-yellow-500/10',
    text: 'text-yellow-800 dark:text-yellow-300',
    label: 'Denied',
  },
  [RESULTS.BLOCKED]: {
    bg: 'bg-red-600/10 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-300',
    label: 'Blocked',
  },
  [RESULTS.LIMITED]: {
    bg: 'bg-blue-600/10 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Limited',
  },
  [RESULTS.UNAVAILABLE]: {
    bg: 'bg-gray-600/10 dark:bg-gray-500/10',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'Unavailable',
  },
};

const statusIconMap: Record<Status, {name: string; color: string}> = {
  [RESULTS.GRANTED]: {name: 'check-circle', color: '#16a34a'},
  [RESULTS.DENIED]: {name: 'minus-circle', color: '#ca8a04'},
  [RESULTS.BLOCKED]: {name: 'x-circle', color: '#dc2626'},
  [RESULTS.LIMITED]: {name: 'alert-triangle', color: '#2563eb'},
  [RESULTS.UNAVAILABLE]: {name: 'slash', color: '#6b7280'},
};

function StatusBadge({status}: {status: Status}) {
  const cfg = statusColorMap[status];
  const icon = statusIconMap[status];
  return (
    <View
      className={`px-2.5 py-1 rounded-full flex-row items-center ${cfg.bg}`}>
      <AppIcon
        type="feather"
        name={icon.name}
        size={14}
        color={icon.color}
        style={{marginRight: 6}}
      />
      <AppText size="xs" weight="semibold" className={`${cfg.text}`}>
        {cfg.label}
      </AppText>
    </View>
  );
}

type BtnVariant = 'primary' | 'danger' | 'info';
function ModernActionButton({
  label,
  icon,
  variant = 'primary',
  onPress,
}: {
  label: string;
  icon?: {type: React.ComponentProps<typeof AppIcon>['type']; name: string};
  variant?: BtnVariant;
  onPress: () => void;
}) {
  const styleMap: Record<
    BtnVariant,
    {wrap: string; text: string; icon: string}
  > = {
    primary: {
      wrap: 'bg-primary dark:bg-primary-dark px-4 py-2 rounded-full flex-row items-center',
      text: 'text-white',
      icon: '#ffffff',
    },
    danger: {
      wrap: 'bg-red-600 px-4 py-2 rounded-full flex-row items-center',
      text: 'text-white',
      icon: '#ffffff',
    },
    info: {
      wrap: 'bg-blue-600 px-4 py-2 rounded-full flex-row items-center',
      text: 'text-white',
      icon: '#ffffff',
    },
  };
  const styles = styleMap[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={styles.wrap}>
      {icon && (
        <AppIcon
          type={icon.type}
          name={icon.name}
          size={16}
          color={styles.icon}
          style={{marginRight: 6}}
        />
      )}
      <AppText size="sm" weight="semibold" className={styles.text}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

export default function AppPermissions() {
  const androidVersion = getAndroidVersion();
  const [state, setState] = useState<PermissionState>({
    camera: null,
    gallery: null,
    location: null,
    locationAlways: null,
    storageSave: null,
    notifications: null,
  });

  const refresh = useCallback(async () => {
    const keys: PermissionKey[] = Platform.select({
      ios: ['camera', 'gallery', 'location', 'storageSave'],
      android: [
        'camera',
        'gallery',
        'location',
        'locationAlways',
        'storageSave',
      ],
      default: ['camera', 'gallery', 'location', 'storageSave'],
    }) as PermissionKey[];

    const genericEntries = await Promise.all(
      keys.map(async key => {
        const perm = getPermissionConstant(key);
        if (!perm) return [key, RESULTS.UNAVAILABLE as Status] as const;
        try {
          const res = await check(perm);
          return [key, res as Status] as const;
        } catch (e) {
          return [key, RESULTS.UNAVAILABLE as Status] as const;
        }
      }),
    );

    // Notifications: use dedicated API for better accuracy
    try {
      const {status} = await checkNotifications();
      const notifStatus: Status =
        status === 'granted'
          ? RESULTS.GRANTED
          : status === 'blocked'
            ? RESULTS.BLOCKED
            : RESULTS.DENIED;
      setState(prev => ({
        ...prev,
        ...Object.fromEntries(genericEntries),
        notifications: notifStatus,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        ...Object.fromEntries(genericEntries),
        notifications: RESULTS.UNAVAILABLE,
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPermission = useCallback(
    async (key: PermissionKey) => {
        console.log(`Requesting permission for ${key}`);
      // Notifications: dedicated flow
      if (key === 'notifications') {
        try {
          if (Platform.OS === 'android' && androidVersion >= 33) {
            const POST_NOTIF = (PERMISSIONS as any)?.ANDROID
              ?.POST_NOTIFICATIONS;
            if (POST_NOTIF) {
              const res = await request(POST_NOTIF);
            }
          }
          await requestNotifications(['alert', 'sound', 'badge']);
        } finally {
          await refresh();
        }
        return;
      }

      const perm = getPermissionConstant(key);
      if (!perm) return;

      // Special flows for Always Location on both platforms
      if (key === 'locationAlways') {
        // Ensure foreground permission first
        const whenInUse = getPermissionConstant('location');
        if (whenInUse) {
          const statusFg = await check(whenInUse);
          if (statusFg !== RESULTS.GRANTED) {
            const reqFg = await request(whenInUse);
            if (reqFg !== RESULTS.GRANTED) {
              Alert.alert(
                'Permission Required',
                'Allow location (While Using the App) first to enable Always Allow Location.',
              );
              await refresh();
              return;
            }
          }
        }

        // Now request background/always
        const res = await request(perm);
        if (res === RESULTS.BLOCKED) {
          Alert.alert(
            'Location Always Blocked',
            'Please enable Always Allow Location from Settings.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: () => openSettings()},
            ],
          );
        }
        await refresh();
        return;
      }

      // Regular permission request flow
      const status = await check(perm);
      if (status === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          'Please enable this permission from Settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => openSettings()},
          ],
        );
        return;
      }
      const res = await request(perm);
        console.log(`Permission request for ${key}: ${res}`);
      await refresh();
    },
    [refresh],
  );

  const items = useMemo<ItemDef[]>(() => {
    const base: ItemDef[] = [
      {
        key: 'camera',
        title: 'Camera',
        desc: 'Capture photos and scan barcodes within the app.',
        icon: {type: 'feather', name: 'camera'},
      },
      {
        key: 'notifications',
        title: 'Notifications',
        desc:
          Platform.OS === 'ios'
            ? 'Get alerts for updates and messages.'
            : 'Allow app notifications on your device.',
        icon: {type: 'feather', name: 'bell'},
      },
      {
        key: 'gallery',
        title: Platform.OS === 'ios' ? 'Photos' : 'Gallery',
        desc:
          Platform.OS === 'ios'
            ? 'Pick images from your Photo Library.'
            : androidVersion >= 33
              ? 'Allow reading images from your gallery.'
              : 'Allow access to external storage to choose images.',
        icon: {type: 'feather', name: 'image'},
      },
      {
        key: 'location',
        title: 'Location (While Using)',
        desc: 'Enable accurate location for nearby features.',
        icon: {type: 'ionicons', name: 'location-outline'},
      },
      {
        key: 'storageSave',
        title: Platform.OS === 'ios' ? 'Save to Photos' : 'Save files',
        desc:
          Platform.OS === 'ios'
            ? 'Allow saving images to your Photos.'
            : androidVersion >= 33
              ? 'Allow saving images to media storage.'
              : 'Allow writing files to storage.',
        icon: {type: 'material-community', name: 'content-save-outline'},
      },
    ];
    if (Platform.OS === 'android') {
      base.splice(3, 0, {
        key: 'locationAlways',
        title: 'Always Allow Location',
        desc: 'Enable background location for better experience.',
        icon: {type: 'ionicons', name: 'navigate-outline'},
      });
    }
    return base;
  }, [androidVersion]);

  const renderAction = (key: PermissionKey, status: Status | null) => {
    if (!status) return null;
    if (status === RESULTS.GRANTED) return null; // Hide button when granted

    if (status === RESULTS.BLOCKED) {
      return (
        <ModernActionButton
          label="Open Settings"
          icon={{type: 'feather', name: 'settings'}}
          variant="danger"
          onPress={() => openSettings()}
        />
      );
    }

    // For LIMITED (iOS Photos) suggest Settings to upgrade access
    if (status === RESULTS.LIMITED) {
      return (
        <ModernActionButton
          label="Manage in Settings"
          icon={{type: 'feather', name: 'settings'}}
          variant="info"
          onPress={() => openSettings()}
        />
      );
    }

    // DENIED or UNAVAILABLE -> try request
    return (
      <ModernActionButton
        label={
          key === 'locationAlways'
            ? 'Enable Background Location'
            : 'Grant Access'
        }
        icon={{type: 'feather', name: 'check'}}
        variant="primary"
        onPress={() => requestPermission(key)}
      />
    );
  };

  return (
    <AppLayout title="App Permissions" needScroll needBack needPadding>
      <View className="mt-3 mb-4 px-1">
        <AppText size="lg" weight="bold">
          Control what Esales can access
        </AppText>
        <AppText size="sm" color="gray" className="mt-1">
          Manage permissions directly from here. If a permission is blocked, you
          can open Settings to enable it.
        </AppText>
      </View>

      <View className="gap-3 pb-6">
        {items.map(item => {
          const status = state[item.key];
          const badge = status && <StatusBadge status={status as Status} />;
          return (
            <Card key={item.key} className="p-4">
              <View className="flex-row items-start">
                {/* Left icon */}
                <View
                  className={`w-11 h-11 rounded-full items-center justify-center bg-black/5 dark:bg-white/10`}>
                  <AppIcon
                    type={item.icon.type}
                    name={item.icon.name}
                    size={22}
                    color={'#6b7280'}
                  />
                </View>

                {/* Middle content */}
                <View className="flex-1 ml-3 mr-2">
                  <AppText size="md" weight="semibold">
                    {item.title}
                  </AppText>
                  <AppText size="sm" color="gray" className="mt-0.5">
                    {item.desc}
                  </AppText>
                </View>

                {/* Right status */}
                <View className="items-end">
                  <AppText size="xs" color="gray">
                    Status
                  </AppText>
                  <View className="mt-1">{badge}</View>
                </View>
              </View>
              {/* Action area */}
              <View className="mt-3 items-end">
                {renderAction(item.key, status)}
              </View>
            </Card>
          );
        })}
      </View>
    </AppLayout>
  );
}
