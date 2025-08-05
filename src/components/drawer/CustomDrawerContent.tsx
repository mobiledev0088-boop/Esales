import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import AppImage from "../customs/AppImage";
import AppText from "../customs/AppText";
import ThemeToggle from "../customs/ThemeToggle";
import Icon from "react-native-vector-icons/Ionicons";
import { useThemeStore } from "../../stores/useThemeStore";
import DrawerSection from "./DrawerSection";
import { AppColors } from "../../config/theme";

const iconMap: Record<string, string> = {
    "Home": 'home',
    "Account": 'person',
    "Audit Report": 'document-text',
    "Downloads": 'download',
    "Log Out": 'log-out',
};

const DOWNLOAD_ROUTES = [
    'SchemePPACT',
    'PriceList',
    'DemoProgramLetter',
    'EndCustomerRelated',
    'MarketingMaterial',
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = ({
    state,
    navigation,
}) => {
    const AppTheme = useThemeStore((state) => state.AppTheme);
    const focusedRouteName = state.routes[state.index].name;
    const isDownloadFocused = DOWNLOAD_ROUTES.includes(focusedRouteName);
    const mainRoutes = state.routes.filter(r => !DOWNLOAD_ROUTES.includes(r.name));
    const downloadRoutes = state.routes.filter(r => DOWNLOAD_ROUTES.includes(r.name));

    const handleContactUs = async () => {
        const phoneNumber = '9076040460'
        // userInfo?.EMP_Btype === 4 ? '9076040460' : '919076090948'; //Meet - ASUS Whatsapp Bot number
        const message = 'Hi, I am here from the ASUS eSales App.';
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
            message,
        )}`;
        const webUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        if (await Linking.canOpenURL(url)) {
            await Linking.openURL(url)
        } else {
            await Linking.openURL(webUrl);
        }
    }

    return (
        <DrawerContentScrollView contentContainerStyle={[styles.drawerContentContainer, { backgroundColor: AppColors[AppTheme].bgBase }]}>
            {/* Header */}
            <View className='px-5 py-5 bg-lightBg-surface dark:bg-darkBg-surface flex-row  justify-between'>
                <View>
                    <AppImage
                        source={require('../../assets/images/dp.png')}
                        style={styles.avatar}
                    />
                    <AppText weight="bold" size="md">
                        John Doe
                    </AppText>
                    <AppText size="base">0wHtP@example.com</AppText>
                </View>
                <ThemeToggle size={60} />
            </View>

            {/* Navigation Items */}
            <ScrollView className='flex-1 pt-2' contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                {/* First 3 routes */}
                <DrawerSection
                    routes={mainRoutes.slice(0, 3)}
                    navigation={navigation}
                    state={state}
                />

                {/* Downloads accordion */}
                <DrawerSection
                    routes={downloadRoutes}
                    navigation={navigation}
                    state={state}
                    isAccordion
                    title="Downloads"
                    initiallyOpen={isDownloadFocused}
                    noIcon
                />

                {/* Remaining routes */}
                <DrawerSection
                    routes={mainRoutes.slice(3)}
                    navigation={navigation}
                    state={state}
                />
            </ScrollView>

            {/* Footer */}
            <TouchableOpacity activeOpacity={0.7} className="border-t py-4 flex-row items-center pl-5 border-gray-300 gap-4" onPress={handleContactUs} >
                <Icon name="logo-whatsapp" color={'green'} size={25} />
                <AppText size="md" >
                    Contact Us
                </AppText>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} className="border-t py-4 flex-row items-center pl-5 border-gray-300 gap-4"  >
                <Icon name="code-working" color={'red'} size={25} />
                <AppText size="md" >
                    Testing Screen
                </AppText>
            </TouchableOpacity>
        </DrawerContentScrollView >
    );
};

export default CustomDrawerContent;


const styles = StyleSheet.create({
    drawerContentContainer: {
        flex: 1,
        paddingTop: 0,
        paddingBottom: 0,
        paddingStart: 0,
        paddingEnd: 0,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 40,
        marginBottom: 5,
    },
});


// {
//     state.routes.map((route, i) => {
//         const focused = state.index === i;
//         if (DOWNLOAD_ROUTES.includes(route.name)) return null;
//         return (
//             <EachDrawerItem
//                 key={route.key}
//                 title={route.name}
//                 icon={iconMap[route.name]}
//                 focused={focused}
//                 onPress={() => navigation.navigate(route.name)}
//             />
//         );
//     })
// }
// <TouchableOpacity
//     onPress={() => setDownloadsOpen(prev => !prev)}
//     activeOpacity={0.7}
//     className={`flex-row items-center justify-between mx-1 py-4 mb-1 px-5  rounded`}
// >
//     <View className="flex-row items-center gap-8">
//         <Icon
//             name={`download-outline`}
//             size={22}
//             color={'grey'}
//         />
//         <AppText size='md' color={'text'} >
//             Downloads
//         </AppText>
//     </View>
//     <Icon
//         name={`chevron-${downloadsOpen ? 'up' : 'down'}-outline`}
//         size={22}
//         color={'grey'}
//     />
// </TouchableOpacity>
// {
//     downloadsOpen && (
//         <View className="pl-4">
//             {DOWNLOAD_ROUTES.map((name) => {
//                 const routeIndex = state.routes.findIndex(r => r.name === name);
//                 const focused = state.index === routeIndex;
//                 return (
//                     <EachDrawerItem
//                         key={name}
//                         title={name}
//                         focused={focused}
//                         onPress={() => navigation.navigate(name)}
//                         noIcon
//                     />
//                 );
//             })}
//         </View>
//     )
// }
