// components/customs/AppIcon.tsx
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const iconMap = {
    feather: Feather,
    entypo: Entypo,
    'material-community': MaterialCommunityIcons,
    antdesign: AntDesign,
    ionicons: Ionicons,
    fontAwesome: FontAwesome,
    materialIcons: MaterialIcons,
}

export type IconType = keyof typeof iconMap

type AppIconProps = {
    name: string
    type: IconType
    size?: number
    color?: string
}

const AppIcon = ({ name, type, size = 24, color = '#000' }: AppIconProps) => {
    const IconComponent = iconMap[type]
    return <IconComponent name={name} size={size} color={color} />
}

export default AppIcon
