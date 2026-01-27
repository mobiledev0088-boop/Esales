import { Linking, TouchableOpacity, View, Alert } from 'react-native'
import AppLayout from '../../../../../components/layout/AppLayout'
import AppText from '../../../../../components/customs/AppText'
import AppIcon from '../../../../../components/customs/AppIcon'
import Card from '../../../../../components/Card'
import { useThemeStore } from '../../../../../stores/useThemeStore'
import { AppColors } from '../../../../../config/theme'

interface LinkCardProps {
  title: string
  description: string
  url: string
  iconName: string
  iconColor: string
  gradientColors: [string, string]
}

const LinkCard = ({ title, description, url, iconName, iconColor, gradientColors }: LinkCardProps) => {
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark')

  const handlePress = async () => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', 'Unable to open this link')
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while opening the link')
    }
  }

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      className="mb-4"
    >
      <Card className="bg-white dark:bg-gray-800 rounded-2xl p-5">
        <View className="flex-row items-center">
          {/* Icon Container */}
          <View 
            className="w-14 h-14 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <AppIcon 
              name={iconName} 
              type="material-community" 
              size={28} 
              color={iconColor}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <AppText 
              weight="semibold" 
              size="lg" 
              className="mb-1"
              color={isDarkTheme ? 'white' : 'black'}
            >
              {title}
            </AppText>
            <AppText 
              size="sm" 
              color="gray"
              className="mb-2"
            >
              {description}
            </AppText>
            <View className="flex-row items-center">
              <AppText 
                size="xs" 
                weight="medium"
                style={{ color: iconColor }}
              >
                Open Link
              </AppText>
              <AppIcon 
                name="chevron-right" 
                type="material-community" 
                size={16} 
                color={iconColor}
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

export default function MarketingDispatchTracker() {
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark')
  
  const link1 = 'https://docs.google.com/spreadsheets/d/1WTEam1zGOTcs9dXnqSZqsTKtpJU2qoeHPo4ukIVvVcA/edit?gid=1662619808#gid=1662619808'
  const link2 = 'https://asus-my.sharepoint.com/:x:/r/personal/sanjiv_dubey_asus_com/Documents/Work%20files/External%20sharing/PG%20Allocation/Q3-PG.xlsx?d=w22bf688006c549f29e9c773d4aee8f52&csf=1&web=1&e=bE3fAm&isSPOFile=1&xsdata=MDV8MDJ8fDgyMWJkN2QwNzE4YTQ0NmM0YjRkMDhkZTNiYzNkMzVifDMwMWY1OWM0YzI2OTRhNjY4YThjZjVkYWFiMjExZmEzfDB8MHw2MzkwMTM5MDkzODM4Mjk2ODJ8VW5rbm93bnxWR1ZoYlhOVFpXTjFjbWwwZVZObGNuWnBZMlY4ZXlKRFFTSTZJbFJsWVcxelgwRlVVRk5sY25acFkyVmZVMUJQVEU5R0lpd2lWaUk2SWpBdU1DNHdNREF3SWl3aVVDSTZJbGRwYmpNeUlpd2lRVTRpT2lKUGRHaGxjaUlzSWxkVUlqb3hNWDA9fDF8TDJOb1lYUnpMekU1T2pjM09EZ3laV00yTFRrNU1tRXROR1kxTXkwNE1tRXhMV1EyTmpZNE1HVTNOV0V5TWw4NU1EVXlaRFV5WXkxaVpXUTRMVFEwTVdFdE9UWTJOUzA1WlRGaU5qa3hPV0ptT1dKQWRXNXhMbWRpYkM1emNHRmpaWE12YldWemMyRm5aWE12TVRjMk5UYzVOREV6Tnprek5nPT18ZjYxMGE3YzdkZGVlNGIzMWQyZGIwOGRlM2JjM2QzNWF8Y2E1ZjU5MzUzNDVlNDQ0Njg5MGI5ZGU2MTdhYzVmMmY%3D&sdata=V2NRZ2NsL0pGMk8rSnhjR0Rlbi9KeEVaeG9pd3JxaDlldUdqQ3pLZDFmdz0%3D&ovuser=301f59c4-c269-4a66-8a8c-f5daab211fa3%2CAnushka_Chavan%40asus.com'

  return (
    <AppLayout title='Marketing Dispatch Tracker' needBack needPadding>
      <View className="flex-1">
        {/* Header Section */}
        <View className="mb-6">
          <AppText 
            size="2xl" 
            weight="bold" 
            className="mb-2"
            color={isDarkTheme ? 'white' : 'black'}
          >
            Quick Access
          </AppText>
          <AppText 
            size="sm" 
            color="gray"
          >
            Tap on any card below to open the respective link
          </AppText>
        </View>

        {/* Link Cards */}
        <View>
          <LinkCard
            title="Allocation Sheet"
            description="View and manage product allocation details"
            url={link1}
            iconName="file-document-outline"
            iconColor="#10B981"
            gradientColors={['#10B981', '#059669']}
          />

          <LinkCard
            title="Dispatch Tracker"
            description="Track dispatch status and PG allocation"
            url={link2}
            iconName="truck-delivery-outline"
            iconColor="#3B82F6"
            gradientColors={['#3B82F6', '#2563EB']}
          />
        </View>

        {/* Info Section */}
        <View className="mt-6 bg-blue-50 dark:bg-gray-700/50 rounded-xl p-4">
          <View className="flex-row items-start">
            <AppIcon 
              name="information-outline" 
              type="material-community" 
              size={20} 
              color={AppColors.primary}
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <View className="flex-1">
              <AppText 
                size="sm" 
                color="gray"
              >
                These links will open in your default browser. Make sure you have the necessary permissions to access them.
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </AppLayout>
  )
}