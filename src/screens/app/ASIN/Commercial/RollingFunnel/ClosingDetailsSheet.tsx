import {useCallback, useMemo, useState} from 'react';
import {View} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';

import AppText from '../../../../../components/customs/AppText';
import AppButton from '../../../../../components/customs/AppButton';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import AppInput from '../../../../../components/customs/AppInput';
import {DatePickerInput} from '../../../../../components/customs/AppDatePicker';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {formatUnique, showToast} from '../../../../../utils/commonFunctions';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {getDeviceId} from 'react-native-device-info';

const CLOSE_STAGE = {
  TRANSFER_TO_SFDC: 9,
} as const;

const useGetDropDownData = () => {
  return useQuery({
    queryKey: ['rollingFunnelDropdownData'],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_DropdownList_New',
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch closing stages');
      }
      return {
           CloseStageList: result?.Datainfo?.CloseStageList,
           CloseReasonList: result?.Datainfo?.CloseReasonList,
    };
    },
    select: data => ({
          stageList: formatUnique(data.CloseStageList, 'Id', 'Close_Stage'),
          reasonList: formatUnique(data.CloseReasonList, 'Id', 'Close_Reason'),
    }),
  });
};

const useSubmitMutation = (
  Opportunity_Number: string,
  EndCustomer_ID: string,
  isTrensferToSFDC: boolean,
  data: {
    CloseReason?: number;
    CloseStage?: number;
    CloseDescription?: string;
    ClosedDate?: Date | null;
  },
) => {
  const {EMP_Code: Username = ''} = useLoginStore(state => state.userInfo);
  let payload = {};
  let apiEndPoint;
  if (isTrensferToSFDC){
    apiEndPoint ='/RollingFunnel/GetRollingFunnel_TransferOpportunityToSFDC';
    payload= {
    OpportunityNumber:Opportunity_Number,
    EndCustomer_ID: EndCustomer_ID,
    Username,
  } 
  }else{
    apiEndPoint ='/RollingFunnel/GetRollingFunnel_UpdateClosed';
    payload ={
    OpportunityNumber: Opportunity_Number,
    CloseReason: data.CloseReason || 0,
    CloseStage: data.CloseStage || 0,
    CloseDescription: data.CloseDescription || '',
    ClosedDate: data.ClosedDate || null,
    Username,
    Machinename: getDeviceId(),
    SFDCopportunityNumber: '',
  };
  }
  return useMutation({
    mutationFn: async () => {
      const res = await handleASINApiCall(
        apiEndPoint,
        payload,
        {},
        true
      );
      const result = res.DashboardData;
      if (result.Status) {
        return result.Datainfo;
      } else {
        throw new Error(result?.Message || 'Failed to close opportunity');
      }
    },
  });
};

const ClosingDetailsSheet: React.FC = () => {
  const payload = useSheetPayload('ClosingDetailsSheet');
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    CloseReason?: number | null;
    CloseStage?: number | null;
    CloseDescription: string;
    ClosedDate?: Date | undefined;
  }>({
    CloseReason: null,
    CloseStage: null,
    CloseDescription: '',
    ClosedDate: undefined,
  });
  const {item, onSubmit} = payload || {item: null, onSubmit: () => {}};

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDarkMode = AppTheme === 'dark';

  const {data: closingStages = {stageList: [], reasonList: []}, isLoading: isLoadingStages} =
    useGetDropDownData();
  
  const submissionData = useMemo(() => ({
    CloseReason: formData.CloseReason || undefined,
    CloseStage: formData.CloseStage || undefined,
    CloseDescription: formData.CloseDescription,
    ClosedDate: formData.ClosedDate || null,
  }), [formData]);
  
  const isTrensferToSFDC = formData.CloseStage === CLOSE_STAGE.TRANSFER_TO_SFDC;
  
  const {mutate, isPending} = useSubmitMutation(
    item?.Opportunity_Number || '',
    item?.End_Customer_CompanyID || '',
    isTrensferToSFDC,
    submissionData
  );

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = useCallback(() => {
    SheetManager.hide('ClosingDetailsSheet');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.CloseStage) {
      showToast('Please select a closing stage');
      return;
    }
    
    if (formData.CloseStage !== CLOSE_STAGE.TRANSFER_TO_SFDC) {
      if (!formData.CloseReason) {
        showToast('Please select a close reason');
        return;
      }
      if (!formData.ClosedDate) {
        showToast('Please select a closed date');
        return;
      }
    }
    
    mutate(undefined, {
      onSuccess: () => {
        showToast('Opportunity closed successfully');
        queryClient.invalidateQueries({queryKey: ['rollingFunnelData']});
        onSubmit?.();
        SheetManager.hide('ClosingDetailsSheet');
      },
      onError: (error: any) => {
        showToast(error?.message || 'Failed to close opportunity');
      },
    });
  }, [formData, mutate, onSubmit, queryClient]);

  return (
    <View>
      <ActionSheet
        id="ClosingDetailsSheet"
        useBottomSafeAreaPadding
        gestureEnabled
        containerStyle={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        }}
        indicatorStyle={{
          backgroundColor: isDarkMode ? '#6b7280' : '#d1d5db',
          width: 50,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View className="px-5 py-4 pb-6">
          {/* Header */}
          <View className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <AppText
              size="xl"
              weight="bold"
              className="text-gray-900 dark:text-white">
              Enter Closing Details
            </AppText>
            {item && (
              <AppText
                size="sm"
                className="text-gray-600 dark:text-gray-400 mt-2">
                {item.End_Customer}
              </AppText>
            )}
          </View>

          {/* Form Fields */}
          <View className="mb-6">
            {/* Stage of Closing */}
            <View className="mb-5">
              {isLoadingStages ? (
                <View>
                  <Skeleton width={120} height={20} borderRadius={4} />
                  <View className="mt-1">
                    <Skeleton width={300} height={50} borderRadius={6} />
                  </View>
                </View>
              ) : (
                <AppDropdown
                  data={closingStages.stageList}
                  selectedValue={formData?.CloseStage as any}
                  onSelect={item => handleChange('CloseStage', item?.value)}
                  mode="dropdown"
                  placeholder="Select closing stage"
                  label="Stage of Closing"
                  required
                  allowClear
                  onClear={() => handleChange('CloseStage', null)}
                />
              )}
            </View>
            {/* Close Reason - Show when CloseStage is not 9 */}
            {formData?.CloseStage && formData.CloseStage !== CLOSE_STAGE.TRANSFER_TO_SFDC && (
              <View className="mb-5">
                {isLoadingStages ? (
                  <View>
                    <Skeleton width={120} height={20} borderRadius={4} />
                    <View className="mt-1">
                      <Skeleton width={300} height={50} borderRadius={6} />
                    </View>
                  </View>
                ) : (
                  <AppDropdown
                    data={closingStages.reasonList}
                    selectedValue={formData.CloseReason as any}
                    onSelect={item => handleChange('CloseReason', item?.value)}
                    mode="dropdown"
                    placeholder="Select close reason"
                    label="Close Reason"
                    required
                    allowClear
                    onClear={() => handleChange('CloseReason', null)}
                  />
                )}
              </View>
            )}

            {/* Close Description - Show when CloseStage is not 9 */}
            {formData?.CloseStage && formData.CloseStage !== CLOSE_STAGE.TRANSFER_TO_SFDC && (
              <View className="mb-5">
                <AppInput
                  value={formData.CloseDescription}
                  setValue={value => handleChange('CloseDescription', value)}
                  label="Close Description"
                  placeholder="Enter closing description"
                  multiline
                  numberOfLines={4}
                  variant="border"
                  size="md"
                  containerClassName="bg-white dark:bg-gray-800"
                  inputWapperStyle={{height: 100, alignItems: 'flex-start'}}
                  style={{textAlignVertical: 'top'}}
                />
              </View>
            )}

            {/* Closed Date */}
            {formData.CloseStage !== CLOSE_STAGE.TRANSFER_TO_SFDC && (
              <View className="mb-2">
                <DatePickerInput
                  mode="date"
                  onDateSelect={date => handleChange('ClosedDate', date)}
                  initialDate={formData.ClosedDate}
                  label="Closed Date"
                  placeholder="Select closing date"
                  required
                  maximumDate={new Date()}
                />
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <AppButton
                title="Cancel"
                onPress={handleClose}
                className="bg-gray-200 dark:bg-gray-700"
                color="black"
              />
            </View>
            <View className="flex-1">
              <AppButton
                title="Submit"
                onPress={handleSubmit}
                disabled={isPending}
                noLoading={!isPending}
                className="bg-primary"
                color="white"
              />
            </View>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

export default ClosingDetailsSheet;
