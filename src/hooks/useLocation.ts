import {useEffect, useState} from 'react';
import {getCurrentLocation} from '../utils/services';
import {InteractionManager} from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState<null | {lat: number; lon: number}>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const fetchLocation = () => {
    getCurrentLocation()
      .then(pos => {
        if (pos) {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        }
      })
      .catch(err => console.error('Location Error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      // This runs AFTER the screen transition animation is done
      fetchLocation();
    });

    return () => task.cancel();
  }, []);

  return {location, loading};
};
