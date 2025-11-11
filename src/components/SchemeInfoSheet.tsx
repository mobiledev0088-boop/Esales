import {View, ScrollView, TouchableOpacity, Pressable} from 'react-native';
import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import AppText from './customs/AppText';
import AppIcon from './customs/AppIcon';
import {useThemeStore} from '../stores/useThemeStore';
import {AppColors} from '../config/theme';
import Card from './Card';
import AppButton from './customs/AppButton';
import moment from 'moment';
import {showToast} from '../utils/commonFunctions';
import RNCB from '@react-native-clipboard/clipboard';
import {Linking} from 'react-native';

interface SchemeInfo {
  Model_Info_Ongoing?: any[];
  Model_Info_Historic?: any[];
}

interface Scheme {
  Claim_Code?: string;
  Start_Date?: string;
  End_Date?: string;
  Claim_name?: string;
  Program_Period?: string;
  Uploaded_By?: string;
  Uploaded_On?: string;
  File_Path?: string;
  Partner_Type?: string;
  Scheme_Year?: string;
  Scheme_Category?: string;
  Scheme_YearQtr?: string;
  Scheme_Month?: number;
  ActivatedTillDate?: number;
  ActivatedWithinPeriod?: number;
}

const safeFormatDate = (dateStr?: string, format = 'DD MMM, YYYY') => {
  if (!dateStr) return '—';
  const m = moment(dateStr);
  return m.isValid() ? m.format(format) : '—';
};

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Ending now';
  const totalSec = Math.floor(msRemaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${d}d ${h}h ${m}m ${s.toString().padStart(2, '0')}s`;
}

const InfoRow: React.FC<{
  label: string;
  value: string;
  icon?: {type: any; name: string};
  trailingAction?: () => React.ReactNode;
  valueClassName?: string;
}> = ({label, value, icon, trailingAction, valueClassName}) => (
  <View className="flex-row items-center py-2 border-b border-slate-100 last:border-b-0 dark:border-slate-700">
    <View className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3">
      {icon && (
        <AppIcon
          type={icon.type as any}
          // @ts-ignore
          name={icon.name}
          size={15}
          color="#475569"
        />
      )}
    </View>
    <View className="flex-1 pr-2">
      <AppText size="xs" className="text-slate-400" numberOfLines={1}>
        {label}
      </AppText>
      <AppText
        size="sm"
        weight="medium"
        className={`text-slate-700 dark:text-slate-200 ${valueClassName ?? ''}`}>
        {value}
      </AppText>
    </View>
    {trailingAction && trailingAction()}
  </View>
);

const CountdownBadge: React.FC<{endDate: string}> = ({endDate}) => {
  const endTs = useMemo(() => {
    const t = Date.parse(endDate);
    return isNaN(t) ? null : t;
  }, [endDate]);
  const [now, setNow] = useState(Date.now());
  const isLapsed = endTs ? endTs <= now : false;
  
  useEffect(() => {
    if (!endTs || isLapsed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTs, isLapsed]);
  
  const label = !endTs
    ? '—'
    : isLapsed
      ? 'Event Ended'
      : `Event ends in ${formatCountdown(endTs - now)}`;
      
  return (
    <View className="mt-2 self-start flex-row items-center px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
      <AppIcon
        type="feather"
        name={isLapsed ? 'alert-circle' : 'clock'}
        size={14}
        color={isLapsed ? '#dc2626' : '#b91c1c'}
      />
      <AppText
        size="sm"
        weight="semibold"
        className={`ml-1 ${isLapsed ? 'text-red-600 dark:text-red-300' : 'text-red-700 dark:text-red-300'}`}>
        {label}
      </AppText>
    </View>
  );
};

const PartnersList: React.FC<{partners: string[]; type?: 'odd' | 'even'}> = ({
  partners,
  type,
}) => {
  const filteredPartners = partners.filter((_, index) =>
    type === 'odd' ? index % 2 !== 0 : index % 2 === 0,
  );

  if (filteredPartners.length === 0) return null;

  return (
    <View className="flex-row gap-3">
      {filteredPartners.map((partner, index) => (
        <View
          key={index}
          className="px-2 py-1 mb-1 rounded-md bg-slate-100 dark:bg-slate-700 flex-row items-center max-w-[130px]">
          <AppIcon type="feather" name="user" size={12} color="#64748b" />
          <AppText
            size="xs"
            className="ml-1 text-gray-600 dark:text-gray-200"
            numberOfLines={1}>
            {partner}
          </AppText>
        </View>
      ))}
    </View>
  );
};

const SchemeCard: React.FC<{scheme: Scheme}> = ({scheme}) => {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyClaim = useCallback(() => {
    if (!scheme?.Claim_Code) {
      showToast('No claim code');
      return;
    }
    try {
      RNCB.setString(scheme.Claim_Code);
      setCopied(true);
      showToast('Claim code copied');
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.log('Clipboard error', e);
      showToast('Clipboard not available');
    }
  }, [scheme?.Claim_Code]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const partners = useMemo(() => {
    if (!scheme?.Partner_Type) return [] as string[];
    return scheme.Partner_Type.split(',')
      .map(p => p.trim())
      .filter(Boolean);
  }, [scheme?.Partner_Type]);

  const isActivation = /Activation/i.test(scheme?.Scheme_Category ?? '');
  const period = isActivation
    ? `${safeFormatDate(scheme?.Start_Date)} - ${safeFormatDate(scheme?.End_Date)}`
    : `${safeFormatDate(scheme?.Start_Date)} - Onwards`;

  const activatedValue = useMemo(() => {
    if (!isActivation) return null;
    const raw = scheme.ActivatedTillDate;
    return raw === undefined || raw === null ? '—' : String(raw);
  }, [isActivation, scheme.ActivatedTillDate]);

  const handleDownloadPress = useCallback(async () => {
    const url = scheme?.File_Path || '';
    if (!url) {
      showToast('File not available');
      return;
    }
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        showToast('Invalid download link');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.log('Open URL error', e);
      showToast('Unable to open link');
    }
  }, [scheme?.File_Path]);

  return (
    <Card className="mb-5 p-4 rounded-lg bg-white dark:bg-darkBg-surface">
      <View className="mb-3">
        <AppText
          size="md"
          weight="semibold"
          className="text-heading dark:text-heading-dark"
          numberOfLines={2}>
          {scheme?.Claim_name || 'Untitled Scheme'}
        </AppText>
        {!!scheme?.End_Date && (
          <CountdownBadge endDate={scheme.End_Date} />
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        nestedScrollEnabled>
        <View className="gap-1">
          <PartnersList partners={partners} type="odd" />
          <PartnersList partners={partners} type="even" />
        </View>
      </ScrollView>

      <View className="mt-1">
        <InfoRow
          icon={{type: 'feather', name: 'tag'}}
          label="Claim Code"
          value={scheme?.Claim_Code || '—'}
          trailingAction={() => (
            <Pressable
              onPress={copyClaim}
              className={`ml-2 flex-row items-center px-2.5 py-1 rounded-full border ${copied ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-slate-50 dark:bg-slate-600/60 border-slate-200 dark:border-slate-500'}`}>
              <AppIcon
                type="feather"
                name={copied ? 'check' : 'copy'}
                size={14}
                color={copied ? '#2563eb' : '#475569'}
              />
              <AppText
                size="xs"
                weight="medium"
                className={`ml-1 ${copied ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-200'}`}>
                {copied ? 'Copied' : 'Copy'}
              </AppText>
            </Pressable>
          )}
        />
        <InfoRow
          icon={{type: 'feather', name: 'calendar'}}
          label="Event Period"
          value={period || '—'}
        />
        {activatedValue !== null && (
          <InfoRow
            icon={{type: 'feather', name: 'activity'}}
            label="Activated Till Date"
            value={activatedValue}
          />
        )}
      </View>

      <AppButton
        title={
          <View className="flex-row items-center">
            <AppIcon type="feather" name="download" size={16} color="#fff" />
            <AppText weight="semibold" size="sm" className="text-white ml-2">
              Download Scheme
            </AppText>
          </View>
        }
        onPress={handleDownloadPress}
        className="mt-5 rounded-lg bg-primary"
        size="md"
        weight="semibold"
        noLoading
      />
    </Card>
  );
};

const SchemeInfoSheet: React.FC = () => {
  const payload = useSheetPayload('SchemeInfoSheet') as
    | {schemeData?: SchemeInfo}
    | undefined;
  const {schemeData} = payload || {};

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDarkMode = AppTheme === 'dark';

  const handleClose = () => SheetManager.hide('SchemeInfoSheet');

  const renderSchemeSection = (data: any[] | undefined) => {
    if (!data || data.length === 0) return null;

    // Filter out error messages
    const validSchemes = data.filter(
      item => !Object.keys(item).includes('ErrorMessage'),
    );

    if (validSchemes.length === 0) return null;

    return (
      <View className="mb-4">
        {validSchemes.map((scheme, index) => (
          <SchemeCard key={index} scheme={scheme as Scheme} />
        ))}
      </View>
    );
  };

  return (
    <View>
      <ActionSheet
        id="SchemeInfoSheet"
        useBottomSafeAreaPadding
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="bg-primary/10 dark:bg-primary-dark/10 p-2 rounded-lg mr-2">
              <AppIcon
                name="pricetags"
                type="ionicons"
                size={24}
                color={AppColors.primary}
              />
            </View>
            <AppText size="2xl" weight="bold">
              Ongoing Events
            </AppText>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
            activeOpacity={0.7}>
            <AppIcon
              name="close"
              type="ionicons"
              size={24}
              color={isDarkMode ? '#9CA3AF' : '#6B7280'}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="max-h-[70vh]">
          {!schemeData || !schemeData.Model_Info_Ongoing ? (
            <View className="py-8 items-center">
              <AppIcon
                name="information-circle-outline"
                type="ionicons"
                size={48}
                color="#9CA3AF"
              />
              <AppText size="base" color="gray" className="mt-3 text-center">
                No scheme information available
              </AppText>
            </View>
          ) : (
            <>{renderSchemeSection(schemeData.Model_Info_Ongoing)}</>
          )}

          {/* Bottom spacing */}
          <View className="h-4" />
        </ScrollView>
      </ActionSheet>
    </View>
  );
};

export default SchemeInfoSheet;
