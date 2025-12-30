import './global.css';

import CheckInternet from './src/components/CheckInternet';
import useNetworkStatus from './src/hooks/useNetworkStatus';
import RootNavigator from './src/navigation/RootNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';

import {AppProviders} from './src/stores/providers/AppProvider';

export default function App() {
  const isConnected = useNetworkStatus();
  return (
    <AnimatedSplash>
      <AppProviders>
        {!isConnected && <CheckInternet />}
        <RootNavigator />
      </AppProviders>
    </AnimatedSplash>
  );
}