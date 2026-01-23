import {View} from 'react-native';
import AppDropdown, {AppDropdownItem} from '../../../../components/customs/AppDropdown';
import {useMutation, useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import React from 'react';
import SearchableDropdown from '../../../../components/customs/SearchableDropdown';

interface RawModel {
  Model_Name?: string | null;
}

// Shape of each scheme returned when searching by model name (based on GetModelInfo Datainfo keys)
interface ModelInfoResponse {
  Model_Info_Historic?: any[];
  Model_Info_Ongoing?: any[];
}

interface ModelSchemesByCategory {
  ongoing: any[];
  lapsed: any[];
}

interface SchemeSearchProps {
  selectedModelName: string;
  onModelLoading?: (loading: boolean) => void;
  onModelSchemes?: (schemesByCategory: ModelSchemesByCategory, modelName: string) => void;
  onClearSearch?: () => void;
}

export default function SchemeSearch({
  selectedModelName,
  onModelLoading,
  onModelSchemes,
  onClearSearch,
}: SchemeSearchProps) {
  const userInfo = useLoginStore(state => state.userInfo);
  // API call to fetch model list
  const {data: modelOptions, isLoading: isLoadingModels, isError} = useQuery<AppDropdownItem[], Error>({
    queryKey: ['getModelList', userInfo?.EMP_Code, userInfo?.EMP_RoleId],
    enabled: Boolean(userInfo?.EMP_Code && userInfo?.EMP_RoleId),
    queryFn: async () => {
      const res = await handleASINApiCall('/Information/GetModelList', {
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
  const {mutate,isPending: isSelectingModel,data}= useMutation({
    mutationKey: ['selectedModel'],
    mutationFn: async (selectedModel: AppDropdownItem) => {
      const res = await handleASINApiCall('/Information/GetModelInfo', {
        employeeCode: userInfo?.EMP_Code,
        RoleId: userInfo?.EMP_RoleId,
        ModelName: selectedModel?.value,
      });
      const result = res.DashboardData;
      if (!result.Status) {
        throw new Error('Failed to fetch model info');
      }
      return result.Datainfo as ModelInfoResponse;
    },
    onSuccess: (data) => {
      // Separate historic (lapsed) and ongoing schemes for model search
      const lapsed = Array.isArray(data?.Model_Info_Historic)
        ? data.Model_Info_Historic
        : [];
      const ongoing = Array.isArray(data?.Model_Info_Ongoing)
        ? data.Model_Info_Ongoing
        : [];

      if (onModelSchemes && currentModelNameRef.current) {
        onModelSchemes({ongoing, lapsed}, currentModelNameRef.current);
      }
    },
    onSettled: () => {
      onModelLoading?.(false);
    },
    onMutate: (variables) => {
      currentModelNameRef.current = variables?.value as string;
      onModelLoading?.(true);
    }
  })
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
  // Debug logs can be retained or removed as needed
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
        // label="Model Number"
        // labelIcon="search"
        // allowClear
        // needIndicator
        // listHeight={250}
      />
    </View>
  );
}
