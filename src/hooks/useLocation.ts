
import { useEffect, useState } from 'react';
import { getCurrentLocation } from '../utils/services';

export const useLocation = () => {
    const [location, setLocation] = useState<null | { lat: number; lon: number }>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, []);

    return { location, loading };
};