import {View, ScrollView} from 'react-native';
import {useState, useMemo} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import MaterialTabBar from '../../../../../components/MaterialTabBar';
import SearchableDropdown from '../../../../../components/customs/SearchableDropdown';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {ASUS} from '../../../../../utils/constant';
import {AppDropdownItem} from '../../../../../components/customs/AppDropdown';
import AppTabBar from '../../../../../components/CustomTabBar';
import Dashboard_Partner from '../../Dashboard/Dashboard_Partner';
import AppButton from '../../../../../components/customs/AppButton';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../../types/navigation';
import {
  useGetAGPDetails,
  useGetAGPList,
  useGetALPDetails,
  useGetALPList,
  useGetLFRDetails,
  useGetLFRList,
} from '../../../../../hooks/queries/channelMap';
import {AGPDetails, ALPDetails, LFRDetails} from './ChannelMapTypes';
import {
  AGPBasicInfo,
  AGPCompetitionInfo,
  ALPDetailsLoadingSkeleton,
  ListSkeleton,
  BasicInfo,
  CompetitionInfo,
  EmptySelectionState,
  ErrorState,
  NoDetailsState,
  AGPNoDetailsState,
  AGPEmptySelectionState,
  LFRBasicInfo,
  LFRCompetitionInfo,
  LFRDetailsLoadingSkeleton,
} from './components';

const ALPInfo = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const [selectedItem, setSelectedItem] = useState<AppDropdownItem | null>(
    null,
  );

  const {data: listData, isLoading, error} = useGetALPList();
  const {
    data,
    isLoading: detailsLoading,
    error: detailsError,
  } = useGetALPDetails(selectedItem?.value || null);

  const alpDetails: ALPDetails | null = useMemo(
    () => data?.ALP_Info?.[0] || null,
    [data],
  );
  const tabs = useMemo(() => {
    if (!alpDetails) return [];

    return [
      {
        name: 'Basic Information',
        component: () => <BasicInfo alpDetails={alpDetails} />,
        label: 'Basic Info',
      },
      {
        name: 'Competition Info',
        component: () => <CompetitionInfo alpDetails={alpDetails} />,
        label: 'Competition Info',
      },
      {
        name: 'Results',
        component: () => (
          <Dashboard_Partner
            noBanner
            DifferentEmployeeCode={selectedItem?.value}
            noPadding
          />
        ),
        label: 'Results',
      },
    ];
  }, [alpDetails, selectedItem?.value]);

  if (isLoading) return <ListSkeleton />;

  if (error) {
    return <ErrorState message="Error loading ALP data. Please try again." />;
  }

  const showButton =
    [
      ASUS.ROLE_ID.BSM,
      ASUS.ROLE_ID.TM,
      ASUS.ROLE_ID.SALES_REPS,
      ASUS.ROLE_ID.BPM,
    ].includes(userInfo.EMP_RoleId as any) ||
    ['KN2200052', 'KN1800037', 'KN2500069'].includes(userInfo?.EMP_Code || '');

  return (
    <View className="flex-1 bg-lightBg-base px-1">
      <SearchableDropdown
        data={listData || []}
        placeholder="Select ALP Channel Map Data"
        onSelect={setSelectedItem}
        onClear={() => setSelectedItem(null)}
      />

      {selectedItem?.value ? (
        detailsLoading ? (
          <ALPDetailsLoadingSkeleton />
        ) : detailsError ? (
          <ErrorState message="Error loading ALP details. Please try again." />
        ) : alpDetails ? (
          <View className="flex-1">
            <ScrollView
              className="flex-1 pt-4"
              showsVerticalScrollIndicator={false}>
              <AppTabBar
                tabs={tabs}
                containerStyle={{marginLeft: 0, marginRight: 0}}
                contentContainerStyle={{paddingTop: 16}}
              />
            </ScrollView>
            {/* create button here */}
            {showButton && (
              <AppButton
                title="Add ALP Finance Map"
                iconName="plus-circle"
                className="rounded-lg py-4 mt-2 bg-secondary mb-2"
                noLoading
                onPress={() =>
                  navigation.push('ChannelMapALPFinance', {
                    financerDataALP: data?.Table1[0],
                    ALPpartnerCode: selectedItem.value,
                  })
                }
              />
            )}
          </View>
        ) : (
          <NoDetailsState />
        )
      ) : (
        <EmptySelectionState />
      )}
    </View>
  );
};

const AGPInfo = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const userInfo = useLoginStore(state => state.userInfo);
  const [selectedItem, setSelectedItem] = useState<AppDropdownItem | null>(
    null,
  );

  const {data: listData, isLoading, error} = useGetAGPList();
  const {
    data,
    isLoading: detailsLoading,
    error: detailsError,
  } = useGetAGPDetails(selectedItem?.value || null);

  const agpDetails: AGPDetails | null = useMemo(
    () => data?.AGP_Info?.[0] || null,
    [data],
  );

  const tabs = useMemo(() => {
    if (!agpDetails) return [];

    return [
      {
        name: 'Basic Information',
        component: () => <AGPBasicInfo agpDetails={agpDetails} />,
        label: 'Basic Info',
      },
      {
        name: 'Competition Info',
        component: () => <AGPCompetitionInfo agpDetails={agpDetails} />,
        label: 'Competition Info',
      },
      {
        name: 'Results',
        component: () => (
          <Dashboard_Partner
            noBanner
            DifferentEmployeeCode={selectedItem?.value}
            noPadding
          />
        ),
        label: 'Results',
      },
    ];
  }, [agpDetails, selectedItem?.value]);

  if (isLoading) return <ListSkeleton />;

  if (error)
    return <ErrorState message="Error loading AGP data. Please try again." />;

  const showButton =
    [
      ASUS.ROLE_ID.BSM,
      ASUS.ROLE_ID.TM,
      ASUS.ROLE_ID.SALES_REPS,
      ASUS.ROLE_ID.BPM,
    ].includes(userInfo.EMP_RoleId as any) ||
    ['KN2200052', 'KN1800037', 'KN2500069'].includes(userInfo?.EMP_Code || '');
    // console.log("Finance data", data?.Table1[0]);
    console.log("agpDetails", agpDetails);
    return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-1">
      <SearchableDropdown
        data={listData || []}
        placeholder="Select AGP Channel Map Data"
        onSelect={setSelectedItem}
        onClear={() => setSelectedItem(null)}
      />
      {selectedItem?.value ? (
        detailsLoading ? (
          <ALPDetailsLoadingSkeleton />
        ) : detailsError ? (
          <ErrorState message="Error loading AGP details. Please try again." />
        ) : agpDetails ? (
          <ScrollView
            className="flex-1 pt-4"
            showsVerticalScrollIndicator={false}>
            <AppTabBar
              tabs={tabs}
              containerStyle={{marginLeft: 0, marginRight: 0}}
              contentContainerStyle={{paddingTop: 16}}
            />
          </ScrollView>
        ) : (
          <AGPNoDetailsState />
        )
      ) : (
        <AGPEmptySelectionState />
      )}
      {showButton && selectedItem?.value ? (
        <View className="flex-row justify-between items-center pt-3">
          <AppButton
            title="Edit Partner"
            iconName="edit"
            className="rounded-lg py-4  bg-secondary mb-2"
            onPress={()=> navigation.push('ChannelMapEditAGP',{
              // AGPpartnerCode: selectedItem.value,
              initialData: selectedItem?.value,
            })}
          />
          <AppButton
            title="Add Partner"
            iconName="plus-circle"
            className="rounded-lg py-4 bg-secondary mb-2"
            onPress={() => navigation.push('ChannelMapAddAGP')}
          />
        </View>
      ) : (
        <AppButton
          title="Add New Partner"
          iconName="plus-circle"
          size="lg"
          className="rounded-lg py-4 mt-2 bg-secondary mb-2"
          onPress={() => navigation.push('ChannelMapAddAGP')}
        />
      )}
    </View>
  );
};

const LFRInfo = () => {
  const [selectedItem, setSelectedItem] = useState<AppDropdownItem | null>(
    null,
  );
  const {data: listData, isLoading, error} = useGetLFRList();
  const {
    data,
    isLoading: detailsLoading,
    error: detailsError,
  } = useGetLFRDetails(selectedItem?.value || null);

  const lfrDetails: LFRDetails | null = useMemo(
    () => data?.LFR_Info?.[0] || null,
    [data],
  );

  const tabs = useMemo(() => {
    if (!lfrDetails) return [];

    return [
      {
        name: 'Basic Information',
        component: () => <LFRBasicInfo lfrDetails={lfrDetails} />,
        label: 'Basic Info',
      },
      {
        name: 'Competition Info',
        component: () => <LFRCompetitionInfo lfrDetails={lfrDetails} />,
        label: 'Competition Info',
      },
    ];
  }, [lfrDetails]);

  if (isLoading) return <ListSkeleton />;

  if (error) {
    return <ErrorState message="Error loading LFR data. Please try again." />;
  }

  return (
    <View className="flex-1 bg-lightBg-base px-1">
      <SearchableDropdown
        data={listData || []}
        placeholder="Select LFR Channel Map Data"
        onSelect={setSelectedItem}
        onClear={() => setSelectedItem(null)}
      />

      {selectedItem?.value ? (
        detailsLoading ? (
          <LFRDetailsLoadingSkeleton />
        ) : detailsError ? (
          <ErrorState message="Error loading LFR details. Please try again." />
        ) : lfrDetails ? (
          <ScrollView
            className="flex-1 pt-4"
            showsVerticalScrollIndicator={false}>
            <AppTabBar
              tabs={tabs}
              containerStyle={{marginLeft: 0, marginRight: 0}}
              contentContainerStyle={{paddingTop: 16}}
            />
          </ScrollView>
        ) : (
          <NoDetailsState />
        )
      ) : (
        <EmptySelectionState />
      )}
    </View>
  );
};

export default function ChannelMap() {
  return (
    <AppLayout title="Channel Map" needBack needPadding>
      <MaterialTabBar
        tabs={[
          {
            name: 'ALP',
            component: ALPInfo,
            label: 'ALP',
          },
          {
            name: 'AGP',
            component: AGPInfo,
            label: 'AGP',
          },
          {
            name: 'LFR',
            component: LFRInfo,
            label: 'LFR',
          },
        ]}
        tabPadding={10}
      />
    </AppLayout>
  );
}