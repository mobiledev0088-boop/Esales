import './global.css';

import CheckInternet from './src/components/CheckInternet';
import RootNavigator from './src/navigation/RootNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';

import {AppProviders} from './src/stores/providers/AppProvider';

export default function App() {
  return (
    <AnimatedSplash>
      <AppProviders>
        <CheckInternet />
        <RootNavigator />
      </AppProviders>
    </AnimatedSplash>
  );
}