import Dashboard_ASE from './Dashboard_ASE';
import {useRoute} from '@react-navigation/native';
import AppLayout from '../../../../components/layout/AppLayout';

export default function TargetASEDashboard() {
      const {params} = useRoute();
  const {partner} = params as {partner: any};
  return (
    <AppLayout title="Dashboard" needBack needPadding>
      <Dashboard_ASE
        noBanner
        noPadding
        DifferentEmployeeCode={partner?.IchannelID}
        DifferentEmployeeCodeName={partner?.ASE_Name}
      />
    </AppLayout>
  );
}

