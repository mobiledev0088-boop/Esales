import './global.css';

import CheckInternet from './src/components/CheckInternet';
import useNetworkStatus from './src/hooks/useNetworkStatus';
import RootNavigator from './src/navigation/RootNavigator';

import { useState } from 'react';
import { AppProviders } from './src/stores/providers/AppPrrovider';
import DynamicSplash from './src/components/DynamicSplash';


function App() {
  const isConnected = useNetworkStatus();
  const [isSplashDone, setIsSplashDone] = useState(false);
  if (!isSplashDone) {
    return <DynamicSplash onFinish={() => setIsSplashDone(true)} />;
  };
  return (
    <AppProviders>
      {!isConnected && <CheckInternet />}
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
