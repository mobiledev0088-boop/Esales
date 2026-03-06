import Home from './Home/Home';
import Reports from './Reports/Reports';
import Account from './User/Account/Account';
import AuditReport from './AuditReport/AuditReport';
import CustomDrawerContent from '../../../components/drawer/CustomDrawerContent';

import {createDrawerNavigator} from '@react-navigation/drawer';
import { useMemo } from 'react';
import { useUserStore } from '../../../stores/useUserStore';
import { useQuery } from '@tanstack/react-query';
import { handleASINApiCall } from '../../../utils/handleApiCall';

const Drawer = createDrawerNavigator();

const fetchReportsData = async (
  RoleId: number,
  employeeCode: string,
  YearQtr: string,
) => {
  const res = await handleASINApiCall('/Download/GetDownloadData', {
    YearQtr,
    RoleId,
    employeeCode,
  });

  const result = res?.DownloadData;
  if (!result?.Status) throw new Error('Failed to fetch Audit Report data');
  const announcementData = result?.Datainfo?.Table || [];

  const unqueTitles = Array.from(new Set(announcementData.map((item: any) => item.Announcement_Type)));
  return unqueTitles;
};

export default function Index() {
  const {RoleId,EMP_Code:employeeCode,Year_Qtr:YearQtr} = useUserStore(state => state.empInfo);
  const {data, isLoading, isError, error, refetch} = useQuery({
    queryKey: ['reports', {RoleId, employeeCode, YearQtr}],
    queryFn: () => fetchReportsData(RoleId, employeeCode, YearQtr),
  });

  const drawerScreens = useMemo(() => {
    let screen = [
    {name: 'Home', component: Home},
    {name: 'Account', component: Account},
    {name: 'AuditReport', component: AuditReport},
    ]
    if(data && Array.isArray(data)){
      screen.push(...(data as string[]).map((item) => ({name: item, component: Reports})))
    }
    return screen;
  },[data]);

  console.log('Drawer Screens:', drawerScreens);

  return (
    <>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {width: 300},
        }}>
        {drawerScreens.map(screen => (
          <Drawer.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
          />
        ))}
      </Drawer.Navigator>
    </>
  );
};
