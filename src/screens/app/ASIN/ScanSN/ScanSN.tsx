import {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import AppLayout, {
  AppLayoutRef,
} from '../../../../components/layout/AppLayout';

import BarcodeScanner from '../../../../components/BarcodeScanner';
import {useMutation} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {showToast} from '../../../../utils/commonFunctios';
import {InformationTab} from './InformationCard';
import {ClaimSchemeInfo} from './ClaimSchemeCard';
import {CautionModal, NoResultsMessage, SearchCard} from './component';
import {useScanSNStore} from '../../../../stores/useScanSNStore';
import {useThemeStore} from '../../../../stores/useThemeStore';

const ScanSN = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const recentSearches = useScanSNStore(state => state.recentSearches);
  const addRecentSearch = useScanSNStore(state => state.addRecentSearch);
  const appTheme = useThemeStore(state => state.AppTheme);

  const [searchValue, setSearchValue] = useState('S8N0KD018850325');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const layoutRef = useRef<AppLayoutRef>(null);

  const {mutate, data, error, reset} = useMutation({
    mutationFn: async () => {
      addRecentSearch(searchValue);
      const res = await handleASINApiCall(
        '/Information/GetSerialNoInfo',
        {
          Serial_No: searchValue,
          employeeCode: userInfo?.EMP_Code || '',
          RoleId: userInfo?.EMP_RoleId || '',
        },
        {},
        true,
      );
      const result = res.DashboardData;
      if (result.Status) {
        return result.Datainfo;
      } else {
        throw new Error('No Product Found');
      }
    },
  });

  const handleSearch = () => {
    if (searchValue.trim().length > 10) {
      mutate();
    } else {
      showToast('Please enter a valid serial number');
    }
  };

  const handleBarcodeScanned = (code: string) => {
    setSearchValue(code);
    setIsScannerOpen(false);
  };

  const openScanner = () => setIsScannerOpen(true);
  const closeScanner = () => setIsScannerOpen(false);

  const clearSearch = () => {
    setSearchValue('');
    reset();
  };

  useEffect(() => {
    if (data) {
      layoutRef.current?.scrollTo({x: 0, y: 220, animated: true});
    }
  }, [data]);

  return (
    <AppLayout
      title="Scan Serial Number"
      needBack
      needScroll
      needPadding
      ref={layoutRef}>
        
      {/* Caution Modal */}
      <CautionModal />

      {/* Search Card */}
      <SearchCard
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        openScanner={openScanner}
        clearSearch={clearSearch}
        handleSearch={handleSearch}
        recentSearches={recentSearches}
        appTheme={appTheme}
      />
      {/* Information and Claim Scheme */}
      {data && (
        <View className="gap-8 mb-10">
          <InformationTab data={data} />
          <ClaimSchemeInfo data={data.Claim_Info} />
        </View>
      )}
      {/* No Results Message */}
      {error && <NoResultsMessage />}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        onCodeScanned={handleBarcodeScanned}
        scanType="barcode"
        isScannerOpen={isScannerOpen}
        closeScanner={closeScanner}
      />
    </AppLayout>
  );
};

export default ScanSN;
