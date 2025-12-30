/**
 * Attendance notification trigger conditions
 *
 * SHOULD run only when:
 * - User is logged in
 * - Location permission is set to "Always"
 * - Notification permission is granted
 * - User is within the configured geo-fence
 *
 * SHOULD be skipped when:
 * - Platform is iOS (handled separately / not supported)
 * - User is not logged in
 * - Required permissions are missing
 * - User has already checked in AND is still inside the geo-fence
 * - User has already checked out AND is outside the geo-fence
 * - Attendance for today has already been completed
 */

import {
  check,
  Permission,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import {useASEAttendanceStore} from '../stores/useASEAttendanceStore';
import {useLoginStore} from '../stores/useLoginStore';
import {isIOS} from './constant';
import {getCurrentLocation, sendLocalNotificationService} from './services';
import {Platform} from 'react-native';

const OFFICE = {
  lat: 19.137887555544914,
  lon: 72.83872748527693,
  radius: 100,
};

function isInsideGeoFence(
  location: {
    lat: number;
    lon: number;
  },
  centerLat: number,
  centerLon: number,
  radius = 100,
): {inside: boolean; distance: number} {
  const R = 6371000;

  const toRad = (v: number) => (v * Math.PI) / 180;

  const x =
    toRad(location.lon - centerLon) *
    Math.cos(toRad((location.lat + centerLat) / 2));
  const y = toRad(location.lat - centerLat);

  const distance = Math.sqrt(x * x + y * y) * R;

  return {
    inside: distance <= radius,
    distance,
  };
}

async function fetchLocation() {
  try {
    const pos = await getCurrentLocation();

    if (!pos) {
      return {lat: null, lon: null, error: 'Location not available'};
    }

    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      error: null,
    };
  } catch (err) {
    return {
      lat: null,
      lon: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkPermissionsForLocationAndNotification() {
  const androidVersion = Number(Platform.Version);

  const permissionsToCheck = [
    PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
    androidVersion >= 33 && (PERMISSIONS as any).ANDROID.POST_NOTIFICATIONS,
  ].filter(Boolean) as Permission[];

  const results = await Promise.all(
    permissionsToCheck.map(permission => check(permission)),
  );

  const allGranted = results.every(result => result === RESULTS.GRANTED);

  if (!allGranted) {
    console.log('Permissions missing', {
      permissions: permissionsToCheck,
      results,
    });
  }
  return allGranted;
}

export async function checkUserInsideRadius(): Promise<void> {
  if (isIOS) return;

  const {token,userInfo} = useLoginStore.getState();
  const {attendanceToday, lastInside, setLastInside} =
    useASEAttendanceStore.getState();
  if (!token || attendanceToday?.isCompleted) return;

  const hasPermissions = await checkPermissionsForLocationAndNotification();
  if (!hasPermissions) return;

  try {
    const location = await fetchLocation();
    if (!location?.lat || !location?.lon) return;

    const {inside, distance} = isInsideGeoFence(
      {lat: location.lat, lon: location.lon},
      OFFICE.lat,
      OFFICE.lon,
      OFFICE.radius,
    );

    if (inside === null) return;

    // ---------- EDGE DETECTION ----------
    if (lastInside === null) {
      // First run → just store state
      setLastInside(inside);
      return;
    }

    // ENTERING geo-fence → CHECK-IN
    if (!lastInside && inside && !attendanceToday?.checkInDone) {
      await sendLocalNotificationService({
        channelId: 'BG_LOCATION_CHANNEL',
        title: 'Mark Your Attendance',
        body: `You are inside the office area. Tap here to check in now.`,
        screen: 'Attendance',
      });
    }

    // EXITING geo-fence → CHECK-OUT
    if (
      lastInside &&
      !inside &&
      attendanceToday?.checkInDone &&
      !attendanceToday?.checkOutDone
    ) {
      await sendLocalNotificationService({
        channelId: 'BG_LOCATION_CHANNEL',
        title: 'Mark Your Attendance',
        body: `You have left the office area. Tap here to check out now.`,
        screen: 'Attendance',
      });
    }
    // Update last state AFTER handling transition
    setLastInside(inside);
  } catch (error) {
    console.error('[BG] Geo check failed', error);
  }
}