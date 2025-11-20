import {TouchableOpacity} from 'react-native';
import {getShadowStyle} from '../utils/appStyles';
import AppIcon from './customs/AppIcon';

export default function FAB({onPress}: {onPress: () => void}) {
  return (
    <TouchableOpacity
      className="absolute bottom-8 right-6 w-16 h-16 bg-primary rounded-full shadow-lg items-center justify-center"
      style={getShadowStyle(5)}
      activeOpacity={0.8}
      onPress={onPress}>
      <AppIcon type="ionicons" name="add" size={28} color="white" />
    </TouchableOpacity>
  );
}
