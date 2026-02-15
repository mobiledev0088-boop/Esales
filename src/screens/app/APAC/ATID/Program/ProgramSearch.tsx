import {View} from 'react-native';
import {AppDropdownItem} from '../../../../../components/customs/AppDropdown';
import {useMutation, useQuery} from '@tanstack/react-query';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import React from 'react';
import SearchableDropdown from '../../../../../components/customs/SearchableDropdown';
import {showToast} from '../../../../../utils/commonFunctions';

interface RawModel {
  Model_Name?: string | null;
}

// Shape of each scheme returned when searching by model name (based on GetModelInfo Datainfo keys)
interface ModelInfoResponse {
  Model_Info_Historic?: any[];
  Model_Info_Ongoing?: any[];
  Scheme_List?: any[]; // Fallback for different API response structure
}

interface ModelSchemesByCategory {
  ongoing: any[];
  lapsed: any[];
}

interface ProgramSearchProps {
  selectedModelName: string;
  onModelLoading?: (loading: boolean) => void;
  onModelSchemes?: (schemesByCategory: ModelSchemesByCategory, modelName: string) => void;
  onClearSearch?: () => void;
}

export default function ProgramSearch({
  selectedModelName,
  onModelLoading,
  onModelSchemes,
  onClearSearch,
}: ProgramSearchProps) {
  const userInfo = useLoginStore(state => state.userInfo);
  // API call to fetch model list
  const {data: modelOptions, isLoading: isLoadingModels, isError} = useQuery<AppDropdownItem[], Error>({
    queryKey: ['getModelList', userInfo?.EMP_Code, userInfo?.EMP_RoleId],
    enabled: Boolean(userInfo?.EMP_Code && userInfo?.EMP_RoleId),
    queryFn: async () => {
      const res = await handleAPACApiCall('/Information/GetModelList', {
        employeeCode: userInfo?.EMP_Code,
        RoleId: userInfo?.EMP_RoleId,
      });

      const dashboard = res.DashboardData;
      if (!dashboard.Status) {
        return [];
      }

      const list: RawModel[] = dashboard.Datainfo?.Model_List ?? [];
      const unique = Array.from(
        new Set(
          list
            .map(m => m.Model_Name?.trim())
            .filter((name): name is string => !!name),
        ),
      ).map(name => ({label: name, value: name}));
      return unique;
    },
  });
  
  const {mutate, isPending: isSelectingModel} = useMutation({
    mutationKey: ['selectedModel'],
    mutationFn: async (selectedModel: AppDropdownItem) => {
      const res = await handleAPACApiCall('/Information/GetModelInfo', {
        employeeCode: userInfo?.EMP_Code,
        RoleId: userInfo?.EMP_RoleId,
        ModelName: selectedModel?.value,
      });
      const result = res.DashboardData;
      if (!result.Status) {
        throw new Error(result.Message || 'Failed to fetch model info');
      }
      return result.Datainfo as ModelInfoResponse;
    },
    onSuccess: (data) => {
      // Check for different response structures
      // Some APAC APIs return Model_Info_Historic/Model_Info_Ongoing
      // Others return Scheme_List
      let lapsed: any[] = [];
      let ongoing: any[] = [];

      if (data.Model_Info_Historic || data.Model_Info_Ongoing) {
        lapsed = Array.isArray(data?.Model_Info_Historic)
          ? data.Model_Info_Historic
          : [];
        ongoing = Array.isArray(data?.Model_Info_Ongoing)
          ? data.Model_Info_Ongoing
          : [];
      } else if (data.Scheme_List) {
        // If only Scheme_List is returned, treat all as ongoing
        ongoing = Array.isArray(data.Scheme_List) ? data.Scheme_List : [];
      }

      if (onModelSchemes && currentModelNameRef.current) {
        onModelSchemes({ongoing, lapsed}, currentModelNameRef.current);
      }
    },
    onError: (err: any) => {
      console.log('Model info fetch error:', err);
      const errorMessage = err?.message || 'Failed to load model programs';
      showToast(errorMessage);
    },
    onSettled: () => {
      onModelLoading?.(false);
    },
    onMutate: (variables) => {
      currentModelNameRef.current = variables?.value as string;
      onModelLoading?.(true);
    }
  });
  
  const currentModelNameRef = React.useRef<string>('');

  const handleSelect = (item: AppDropdownItem | null) => {
    if (item) {
      mutate(item);
    } else {
      // cleared
      currentModelNameRef.current = '';
      onClearSearch?.();
    }
  };
  
  // Handle error 
  if (isError) {
    console.log('Error fetching model list');
    return null;
  }
  
  console.log('Selected Model Data:', selectedModelName);
  
  return (
    <View className="px-3 pt-4 pb-2 ">
      <SearchableDropdown
        data={modelOptions ?? []}
        placeholder={isLoadingModels ? "Loading..." : "Search Model Number"}
        onSelect={handleSelect}
        onClear={() => {
          currentModelNameRef.current = '';
          onClearSearch?.();
        }}
        defaultValue={selectedModelName}
      />
    </View>
  );
}
