import {useState, useEffect} from 'react';
import {getMMKV} from '../utils/mmkvStorage';
import {handleASINApiCall} from '../utils/handleApiCall';
import {getDeviceId} from 'react-native-device-info';
import {useLoginStore} from '../stores/useLoginStore';
import { useUserStore } from '../stores/useUserStore';

interface SplashImageCache {
  imageUrl: string;
  timestamp: number;
}

interface UseGetSplashImageReturn {
  imageUrl: string | null;
  isLoading: boolean;
  isUpdating: boolean;
}

const CACHE_KEY = 'splash-image-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook to fetch and cache splash screen image with smart caching strategy
 * - First load: Fetch and cache image (don't show yet)
 * - Subsequent loads: Show cached image instantly
 * - Stale cache: Show old image while updating in background
 */
export const useGetSplashImage = (
  enabled: boolean = true,
  employeeCode: string = '',
): UseGetSplashImageReturn => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchSplashImage = async (isMounted: boolean) => {
    try {
      const storage = getMMKV();
      const cachedData = storage.getString(CACHE_KEY);

      if (cachedData) {
        // Parse existing cache
        const parsedCache: SplashImageCache = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsedCache.timestamp;

        // Cache is fresh (< 24 hours) - use it and exit
        // if (cacheAge < CACHE_DURATION) {
        //   if (isMounted) {
        //     setImageUrl(parsedCache.imageUrl);
        //     setIsLoading(false);
        //   }
        //   return;
        // }

        // Cache is stale (> 24 hours) - show old image while updating in background
        if (isMounted) {
          setImageUrl(parsedCache.imageUrl);
          setIsLoading(false);
          setIsUpdating(true);
        }

        // Fetch fresh image in background
        await fetchAndCacheImage(employeeCode, storage, isMounted);

        if (isMounted) {
          setIsUpdating(false);
        }
      } else {
        // No cache exists - fetch and cache for next time (don't show yet)
        await fetchAndCacheImage(employeeCode, storage, isMounted);

        if (isMounted) {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error in useGetSplashImage:', error);
      if (isMounted) {
        setIsLoading(false);
        setIsUpdating(false);
      }
    }
  };

  useEffect(() => {
    // Exit early if hook is disabled
    if (!enabled) return;
    let isMounted = true;
    // Only fetch if employeeCode is provided
    if (employeeCode) {
      void fetchSplashImage(isMounted);
    } else {
      setIsLoading(false);
    }
    // Cleanup: Prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [employeeCode, enabled]);

  return {imageUrl, isLoading, isUpdating};
};

/**
 * Fetches splash image from API and stores in cache
 * Note: Does NOT update UI state - image will appear on next app launch
 */
async function fetchAndCacheImage(
  employeeCode: string,
  storage: ReturnType<typeof getMMKV>,
  isMounted: boolean,
): Promise<void> {
  try {
    const deviceId = getDeviceId();
    const response = await handleASINApiCall('/Auth/EmpInfo', {
      employeeCode,
      deviceId,
    });

    const result = response?.login;
    console.log(
      'Fetched splash image data from API:',
      result?.Datainfo?.[0]?.FestiveAnimation,
    );
    // Validate response has splash image
    if (result?.Status) {
      if (result?.Datainfo?.[0]?.FestiveAnimation) {
        const freshImageUrl = result.Datainfo[0].FestiveAnimation;
        // Cache the image with timestamp
        const cacheData: SplashImageCache = {
          imageUrl: freshImageUrl,
          timestamp: Date.now(),
        };
        // Intentionally empty - image will be shown on next app launch
        storage.set(CACHE_KEY, JSON.stringify(cacheData));
      }
      const Latitude = result.Datainfo[0].Latitude;
      const Longitude = result.Datainfo[0].Longitude;
      console.log(
        'Fetched fresh location from splash image  API:',
        Latitude,
        Longitude,
      );
      const empData = result.Datainfo[0].Year_Qtr;
      const setUserInfo = useLoginStore.getState().setUserInfo;
      const setEmpInfo = useUserStore.getState().setEmpInfo;
      setUserInfo({Latitude, Longitude});
      setEmpInfo(empData);
    } else {
      console.log('No splash image found in API response');
    }
  } catch (error) {
    console.error('Error fetching splash image:', error);
  }
}
