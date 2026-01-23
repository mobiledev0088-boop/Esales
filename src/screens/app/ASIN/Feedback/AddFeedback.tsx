import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useMemo, use } from 'react';
import AppLayout from '../../../../components/layout/AppLayout';
import AppDropdown, { AppDropdownItem } from '../../../../components/customs/AppDropdown';
import { useMutation, useQuery } from '@tanstack/react-query';
import { handleASINApiCall } from '../../../../utils/handleApiCall';
import AppInput from '../../../../components/customs/AppInput';
import { screenHeight } from '../../../../utils/constant';
import Card from '../../../../components/Card';
import AppIcon from '../../../../components/customs/AppIcon';
import { AppExperience } from './component';
import AppButton from '../../../../components/customs/AppButton';
import AppText from '../../../../components/customs/AppText';
import { getDeviceId } from 'react-native-device-info';
import { useLoginStore } from '../../../../stores/useLoginStore';
import { showToast } from '../../../../utils/commonFunctions';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../../types/navigation';
import { queryClient } from '../../../../stores/providers/QueryProvider';
import useEmpStore from '../../../../stores/useEmpStore';
import { EXPERIENCE_OPTIONS } from './constants';
import clsx from 'clsx';
import { useThemeStore } from '../../../../stores/useThemeStore';


// Feedback module type definitions
interface QueryType {
  AFQ_QueryType: string;
  AFQ_QueryTypeID: string;
}

interface Category {
  AFC_Category: string;
  AFC_CategoryId: string;
}

interface DropdownData {
  queries: AppDropdownItem[];
  categories: AppDropdownItem[];
}

// API function with proper typing and error handling
const getDropdownData = async (): Promise<DropdownData> => {
  try {
    const response = await handleASINApiCall('/Feedback/GetFeedback_Form_DropdownList');
    console.log({response})
    if (!response?.DashboardData?.Status) {
      throw new Error('Failed to fetch feedback dropdown data');
    }
    const data = response.DashboardData.Datainfo;
    const queries: AppDropdownItem[] = data.QueryTypeList?.map((item: QueryType) => ({
      label: item.AFQ_QueryType,
      value: item.AFQ_QueryTypeID,
    })) ?? [];
    
    const categories: AppDropdownItem[] = data.CategoryList?.map((item: Category) => ({
      label: item.AFC_Category,
      value: item.AFC_CategoryId,
    })) ?? [];
    
    return { queries, categories };
  } catch (error) {
    console.error('Error fetching feedback dropdown data:', error);
    throw new Error('Failed to load feedback form data. Please try again.');
  }
};

const AddFeedback: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [appExperience, setAppExperience] = useState<string | null>(null);

  const userInfo = useLoginStore((state) => state.userInfo);
  const empInfo = useEmpStore(state => state.empInfo);
  const empCode = empInfo?.EMP_Code ?? '';
  const AppTheme = useThemeStore(state => state.AppTheme);

  const navigation = useNavigation<AppNavigationProp>();

  // App experience rating options
  const experienceOptions = EXPERIENCE_OPTIONS;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['feedbackForm'],
    queryFn: getDropdownData,
  });

  const { mutate } = useMutation({
    mutationFn: async () => {
      const dataToSend = {
          QueryTypeID: selectedQuery,
          CategoryId: selectedCategory,
          Feedback: feedbackText,
          Experience: appExperience,
          username: userInfo?.EMP_Code || '',
          Machinename: getDeviceId(),
        };
        // Call the API to submit feedback
        const res = await handleASINApiCall('/Feedback/GetFeedback_Form_Insert', dataToSend);
        if (!res?.DashboardData?.Status) {
          throw new Error('Failed to submit feedback');
        }
        showToast('Feedback submitted successfully');
        queryClient.invalidateQueries({ queryKey: ['feedback', empCode] });
        navigation.goBack();
      },
  });


  // Memoized loading state for better performance
  const isDropdownsDisabled = useMemo(() => isLoading || isError, [isLoading, isError]);
  const isSubmitDisabled = useMemo(() => !selectedQuery || !selectedCategory || !feedbackText || !appExperience, [selectedQuery, selectedCategory, feedbackText, appExperience]);

  // Safe data access with fallbacks
  const dropdownData = useMemo(() => ({
    queries: data?.queries ?? [],
    categories: data?.categories ?? [],
  }), [data]);

  // Error display component
  const ErrorMessage = useMemo(() => {
    if (!isError) return null;
    
    return (
      <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <AppText className="text-red-700 dark:text-red-400 text-sm">
          {error instanceof Error ? error.message : 'Failed to load feedback form data'}
        </AppText>
      </View>
    );
  }, [isError, error]);



  return (
    <AppLayout title="Add Feedback" needBack needPadding needScroll >
      <View className="gap-5 mt-4 mb-10">
        {ErrorMessage}
        <AppDropdown
          label='Query Type'
          required
          placeholder={isLoading ? "Loading..." : "Select Query Type"}
          data={dropdownData.queries}
          selectedValue={selectedQuery}
          onSelect={(item) => setSelectedQuery(item?.value ?? null)}
          mode="dropdown"
          disabled={isDropdownsDisabled}
          zIndex={3000}
        />
        
        <AppDropdown
          label='Category'
          required
          placeholder={isLoading ? "Loading..." : "Select Category"}
          data={dropdownData.categories}
          selectedValue={selectedCategory}
          onSelect={(item) => setSelectedCategory(item?.value ?? null)}
          mode="dropdown"
          disabled={isDropdownsDisabled}
          zIndex={2000}
        />

        <AppInput
          value={feedbackText}
          setValue={setFeedbackText}
          placeholder="Enter your feedback"
          multiline
          inputWrapperStyle={{backgroundColor: AppTheme === 'dark' ? '#1E293B' : '#FFFFFF', height:100,alignItems:'flex-start'}}
          className='p-2 text-lg w-full text-gray-900 dark:text-gray-100'
          textSize={16}
          showClearButton={false}
          label='Feedback'
        />

        <AppExperience 
          appExperience={appExperience} 
          onPress={setAppExperience} 
          experienceOptions={experienceOptions}
          AppTheme={AppTheme}
        />

        <AppButton
          title="Submit Feedback"
          className='mt-5'
          onPress={() =>  mutate()}
          disabled={isSubmitDisabled}
        />

        <AppText size='xs' weight='semibold' className='text-center text-gray-500 dark:text-gray-400'>
          Our team will review your feedback and get back to you within {'\n'} 3-5 business days.
        </AppText>
      </View>
    </AppLayout>
  );
};

export default AddFeedback;
