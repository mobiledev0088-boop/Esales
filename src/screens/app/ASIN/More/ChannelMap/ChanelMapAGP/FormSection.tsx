import React from 'react';
import { View } from 'react-native';
import Accordion from '../../../../../../components/Accordion';
import AppText from '../../../../../../components/customs/AppText';
import AppInput from '../../../../../../components/customs/AppInput';
import AppDropdown, { AppDropdownItem } from '../../../../../../components/customs/AppDropdown';
import AppIcon, { IconType } from '../../../../../../components/customs/AppIcon';
import { useThemeStore } from '../../../../../../stores/useThemeStore';
import { AppColors } from '../../../../../../config/theme';
import { ValidationErrors } from './formValidation';

// Field width options
export type FieldWidth = 'full' | 'half';

// Field configuration type
export interface FormField {
  key: string;
  label?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  leftIcon?: string;
  leftIconType?: IconType;
  maxLength?: number;
  required?: boolean;
  type: 'input' | 'dropdown';
  dropdownData?: AppDropdownItem[];
  dropdownMode?: 'dropdown' | 'autocomplete';
  width?: FieldWidth; // New: Field width configuration
}

interface FormSectionProps {
  title: string;
  icon?: string;
  iconType?: IconType;
  fields: FormField[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  validationErrors?: ValidationErrors;
  isOpen?: boolean;
  onToggle?: () => void;
  columns?: 1 | 2; // Deprecated: Use field.width instead
}

export default function FormSection({
  title,
  icon = 'file-text',
  iconType = 'feather',
  fields,
  values,
  onValueChange,
  validationErrors = {},
  isOpen = false,
  onToggle,
  columns = 1,
}: FormSectionProps) {
  const AppTheme = useThemeStore((state) => state.AppTheme);

  const formatLabel = (key: string, customLabel?: string) => {
    if (customLabel) return customLabel;
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Count required fields and filled required fields
  const requiredFields = fields.filter((field) => field.required);
  const filledRequiredFields = requiredFields.filter(
    (field) => values[field.key] && values[field.key].trim() !== ''
  );

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <Accordion
      isOpen={isOpen}
      onToggle={onToggle}
      containerClassName={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border mb-4 overflow-hidden ${
        hasValidationErrors
          ? 'border-red-300 dark:border-red-700'
          : 'border-gray-100 dark:border-gray-700'
      }`}
      headerClassName={`px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800`}
      needBottomBorder={false}
      arrowSize={22}
      header={
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center bg-blue-100 dark:bg-blue-900/30`}>
            <AppIcon
              type={iconType}
              name={icon}
              size={20}
              color={AppColors[AppTheme].primary}
            />
          </View>
          <View className="flex-1">
            <AppText
              weight="bold"
              size="lg"
              className="text-gray-900 dark:text-gray-100">
              {title}
            </AppText>
            <AppText size="xs" className="text-gray-500 dark:text-gray-400 mt-0.5">
              {filledRequiredFields.length}/{requiredFields.length} required fields filled
            </AppText>
          </View>
        </View>
      }>
      <View className="mt-5 px-4 flex-row flex-wrap -mx-1.5 items-end">
        {fields.map((field, index) => {
          const fieldWidth = field.width || (columns === 2 ? 'half' : 'full');
          const widthClass = fieldWidth === 'half' ? 'w-1/2' : 'w-full';

          return (
            <View
              key={field.key}
              className={`${widthClass} px-1.5 mb-4`}
              style={{ zIndex: 9000 - index }}>
              <View>
                {field.type === 'dropdown' ? (
                  <>
                    <AppDropdown
                      data={field.dropdownData || []}
                      selectedValue={values[field.key] || null}
                      onSelect={(item) => onValueChange(field.key, item?.value || '')}
                      mode={'dropdown'}
                      label={formatLabel(field.key, field.label)}
                      required={field.required ?? false}
                      placeholder={
                        field.placeholder || `Select ${formatLabel(field.key, field.label).toLowerCase()}`
                      }
                      allowClear={true}
                      zIndex={9000 - index}
                      error={validationErrors[field.key]}
                    />
                  </>
                ) : (
                  <>
                    <AppInput
                      size="md"
                      variant="border"
                      value={values[field.key] || ''}
                      setValue={(text) => onValueChange(field.key, text)}
                      isOptional={!field.required}
                      label={formatLabel(field.key, field.label)}
                      placeholder={
                        field.placeholder || `Enter ${formatLabel(field.key, field.label).toLowerCase()}`
                      }
                      keyboardType={field.keyboardType}
                      maxLength={field.maxLength}
                      leftIconTsx={
                        field.leftIcon ? (
                          <View className="ml-3 mr-2">
                            <AppIcon
                              type={field.leftIconType || 'feather'}
                              name={field.leftIcon}
                              size={18}
                              color={AppColors[AppTheme].text}
                            />
                          </View>
                        ) : undefined
                      }
                      containerClassName="mb-0"
                      error={validationErrors[field.key] }
                    />
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Accordion>
  );
}
