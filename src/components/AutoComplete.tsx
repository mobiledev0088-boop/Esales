import AppText from './customs/AppText';
import Icon from 'react-native-vector-icons/Ionicons';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Keyboard,
    ViewStyle,
    TextStyle,
    TextInputProps,
    ScrollView,
} from 'react-native';
import { twMerge } from 'tailwind-merge';


// Types
interface AutoCompleteItem {
    [key: string]: any;
}

interface AutoCompleteStyles {
    container?: ViewStyle;
    input?: TextStyle;
    inputContainer?: ViewStyle;
    dropdown?: ViewStyle;
    dropdownItem?: ViewStyle;
    selectedTag?: ViewStyle;
    selectedTagText?: TextStyle;
    noResultsContainer?: ViewStyle;
    noResultsText?: TextStyle;
    tagsContainer?: ViewStyle;
    clearButton?: ViewStyle;
}

interface AutoCompleteProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
    data: AutoCompleteItem[];
    placeholder?: string;
    multiple?: boolean;
    onSelect: (items: AutoCompleteItem | AutoCompleteItem[]) => void;
    selectedItems?: AutoCompleteItem[];
    itemKey: string;
    itemLabel: string;
    maxHeight?: number;
    styles?: AutoCompleteStyles;
    containerClassName?: string;
    inputClassName?: string;
    dropdownClassName?: string;
    clearSelection?: () => void;
    searchKeys?: string[];
    caseSensitive?: boolean;
    minCharacters?: number;
    showClearButton?: boolean;
    disabled?: boolean;
    renderItem?: (item: AutoCompleteItem, isSelected: boolean) => React.ReactNode;
    renderSelectedTag?: (item: AutoCompleteItem, onRemove: () => void) => React.ReactNode;
    onFocus?: () => void;
    onBlur?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

const AutoComplete: React.FC<AutoCompleteProps> = ({
    data = [],
    placeholder = 'Search...',
    multiple = false,
    onSelect,
    selectedItems = [],
    itemKey,
    itemLabel,
    maxHeight = 200,
    styles = {},
    containerClassName = '',
    inputClassName = '',
    dropdownClassName = '',
    clearSelection,
    searchKeys = [],
    caseSensitive = false,
    minCharacters = 0,
    showClearButton = true,
    disabled = false,
    renderItem,
    renderSelectedTag,
    onFocus,
    onBlur,
    ...textInputProps
}) => {
    const [searchText, setSearchText] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const inputRef = useRef<TextInput>(null);
    const containerRef = useRef<View>(null);

    // Keyboard event listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Recalculate dropdown position when keyboard height changes
    useEffect(() => {
        if (showDropdown) {
            calculateDropdownPosition();
        }
    }, [keyboardHeight, showDropdown]);

    // Filter data based on search text
    const filteredData = useMemo(() => {
        if (!searchText || searchText.length < minCharacters) {
            return data;
        }

        const searchLower = caseSensitive ? searchText : searchText.toLowerCase();
        const keysToSearch = searchKeys.length > 0 ? searchKeys : [itemLabel];

        return data.filter((item) => {
            return keysToSearch.some((key) => {
                const itemValue = item[key];
                if (typeof itemValue === 'string') {
                    const valueToSearch = caseSensitive ? itemValue : itemValue.toLowerCase();
                    return valueToSearch.includes(searchLower);
                }
                return false;
            });
        });
    }, [searchText, data, searchKeys, itemLabel, caseSensitive, minCharacters]);

    // Handle input focus
    const handleFocus = () => {
        if (disabled) return;
        setShowDropdown(true);
        calculateDropdownPosition();
        onFocus?.();
    };

    // Handle input blur
    const handleBlur = () => {
        // Delay hiding dropdown to allow for item selection
        setTimeout(() => {
            setShowDropdown(false);
            onBlur?.();
        }, 200); // Increased timeout to ensure item selection works
    };

    // Calculate dropdown position
    const calculateDropdownPosition = () => {
        if (containerRef.current) {
            containerRef.current.measure((x, y, width, height, pageX, pageY) => {
                const availableSpaceBelow = screenHeight - (pageY + height) - keyboardHeight;
                const availableSpaceAbove = pageY;

                if (availableSpaceBelow < maxHeight && availableSpaceAbove > availableSpaceBelow) {
                    setDropdownPosition('above');
                } else {
                    setDropdownPosition('below');
                }
            });
        }
    };

    // Handle container press (for input wrapper click)
    const handleContainerPress = () => {
        if (disabled) return;
        inputRef.current?.focus();
        if (!showDropdown) {
            setShowDropdown(true);
            calculateDropdownPosition();
        }
    };

    // Handle chevron press
    const handleChevronPress = () => {
        if (disabled) return;

        if (showDropdown) {
            setShowDropdown(false);
            inputRef.current?.blur(); // Remove focus when closing
        } else {
            setShowDropdown(true);
            calculateDropdownPosition();
            // Don't auto-focus input when chevron is pressed
            // User can manually tap input if they want to type
        }
    };

    // Handle item selection
    const handleItemSelect = (item: AutoCompleteItem) => {
        if (multiple) {
            const isSelected = selectedItems.some(selected => selected[itemKey] === item[itemKey]);
            let newSelectedItems: AutoCompleteItem[];

            if (isSelected) {
                newSelectedItems = selectedItems.filter(selected => selected[itemKey] !== item[itemKey]);
            } else {
                newSelectedItems = [...selectedItems, item];
            }

            onSelect(newSelectedItems);
            // Keep dropdown open for multiple selection
            inputRef.current?.focus();
        } else {
            onSelect(item);
            setSearchText(item[itemLabel]);
            setShowDropdown(false);
            inputRef.current?.blur();
        }
    };

    // Handle search text change
    const handleSearchChange = (text: string) => {
        setSearchText(text);

        // Clear selection when input is cleared for single selection
        if (!multiple && text === '' && selectedItems.length > 0) {
            onSelect({} as AutoCompleteItem);
        }

        if (!showDropdown && text.length >= minCharacters) {
            setShowDropdown(true);
            calculateDropdownPosition();
        }
    };

    // Clear search and selection
    const handleClear = () => {
        setSearchText('');
        if (clearSelection) {
            clearSelection();
        } else {
            onSelect(multiple ? [] : ({} as AutoCompleteItem));
        }
        inputRef.current?.focus();
    };

    // Remove selected item (for multiple selection)
    const removeSelectedItem = (item: AutoCompleteItem) => {
        if (multiple) {
            const newSelectedItems = selectedItems.filter(selected => selected[itemKey] !== item[itemKey]);
            onSelect(newSelectedItems);
        }
    };

    // Check if item is selected
    const isItemSelected = (item: AutoCompleteItem) => {
        return selectedItems.some(selected => selected[itemKey] === item[itemKey]);
    };

    // Render selected tags (for multiple selection)
    const renderSelectedTags = () => {
        if (!multiple || selectedItems.length === 0) return null;

        const firstItem = selectedItems[0];
        const remainingCount = selectedItems.length - 1;

        return (
            <View style={[defaultStyles.tagsContainer, styles.tagsContainer]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: 'center' }}
                >
                    {renderSelectedTag ? (
                        renderSelectedTag(firstItem, () => removeSelectedItem(firstItem))
                    ) : (
                        <View style={[defaultStyles.selectedTag, styles.selectedTag]}>
                            <AppText
                                style={[defaultStyles.selectedTagText, styles.selectedTagText]}
                                numberOfLines={1}
                            >
                                {firstItem[itemLabel]}
                            </AppText>
                            <TouchableOpacity
                                onPress={() => removeSelectedItem(firstItem)}
                                style={defaultStyles.tagRemoveButton}
                                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            >
                                <Icon name="close" size={14} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {remainingCount > 0 && (
                        <View style={[defaultStyles.selectedTag, defaultStyles.countTag, styles.selectedTag]}>
                            <AppText style={[defaultStyles.selectedTagText, styles.selectedTagText]}>
                                +{remainingCount}
                            </AppText>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    // Get dynamic max height based on available space
    const getDynamicMaxHeight = () => {
        if (dropdownPosition === 'above') {
            return Math.min(maxHeight, screenHeight * 0.4);
        } else {
            const availableSpace = screenHeight - keyboardHeight;
            return Math.min(maxHeight, availableSpace * 0.4);
        }
    };

    // Get input display value
    const getInputValue = () => {
        if (multiple) {
            return searchText;
        }
        // Only show selected item if there's no active search
        if (searchText) {
            return searchText;
        }
        return selectedItems.length > 0 ? selectedItems[0][itemLabel] : '';
    };

    return (
        <View
            ref={containerRef}
            style={[defaultStyles.container, styles.container]}
            className={twMerge('relative', containerClassName)}
        >
            {/* Selected Tags */}
            {renderSelectedTags()}

            {/* Input Container */}
            <TouchableOpacity
                onPress={handleContainerPress}
                style={[defaultStyles.inputContainer, styles.inputContainer]}
                activeOpacity={1}
            >
                <TextInput
                    ref={inputRef}
                    style={[defaultStyles.input, styles.input]}
                    className={twMerge('flex-1 text-gray-800', inputClassName)}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={getInputValue()}
                    onChangeText={handleSearchChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    editable={!disabled}
                    {...textInputProps}
                />

                {/* Clear Button */}
                {showClearButton && (searchText || selectedItems.length > 0) && (
                    <TouchableOpacity
                        onPress={handleClear}
                        style={[defaultStyles.clearButton, styles.clearButton]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}

                {/* Dropdown Arrow */}
                <TouchableOpacity
                    onPress={handleChevronPress}
                    style={defaultStyles.dropdownArrow}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon
                        name={showDropdown ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#9CA3AF"
                    />
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Dropdown */}
            {showDropdown && (
                <View
                    style={[
                        defaultStyles.dropdown,
                        styles.dropdown,
                        {
                            maxHeight: getDynamicMaxHeight(),
                            [dropdownPosition === 'above' ? 'bottom' : 'top']: '100%',
                        },
                    ]}
                    className={twMerge('absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl', dropdownClassName)}
                >
                    {filteredData.length > 0 ? (
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                            style={{ maxHeight: getDynamicMaxHeight() }}
                        >
                            {filteredData.map((item) => {
                                const isSelected = isItemSelected(item);

                                if (renderItem) {
                                    return (
                                        <TouchableOpacity
                                            key={item[itemKey]?.toString() || Math.random().toString()}
                                            onPress={() => handleItemSelect(item)}
                                            style={[defaultStyles.dropdownItem, styles.dropdownItem]}
                                            activeOpacity={0.7}
                                        >
                                            {renderItem(item, isSelected)}
                                        </TouchableOpacity>
                                    );
                                }

                                return (
                                    <TouchableOpacity
                                        key={item[itemKey]?.toString() || Math.random().toString()}
                                        onPress={() => handleItemSelect(item)}
                                        style={[
                                            defaultStyles.dropdownItem,
                                            styles.dropdownItem,
                                            isSelected && defaultStyles.selectedDropdownItem,
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        <AppText
                                            className={`flex-1 ${isSelected ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}
                                            numberOfLines={1}
                                        >
                                            {item[itemLabel]}
                                        </AppText>
                                        {isSelected && (
                                            <Icon name="checkmark" size={20} color="#2563EB" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={[defaultStyles.noResultsContainer, styles.noResultsContainer]}>
                            <AppText
                                style={[defaultStyles.noResultsText, styles.noResultsText]}
                                className="text-gray-500 text-center"
                            >
                                {searchText.length < minCharacters
                                    ? `Type at least ${minCharacters} characters to search`
                                    : 'No results found'
                                }
                            </AppText>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

// Default styles
const defaultStyles = {
    container: {
        position: 'relative' as const,
    },
    inputContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        minHeight: 48,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 0,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    dropdownArrow: {
        marginLeft: 8,
        padding: 4,
        borderRadius: 4,
    },
    dropdown: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 9999,
    },
    dropdownItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectedDropdownItem: {
        backgroundColor: '#EFF6FF',
    },
    noResultsContainer: {
        padding: 16,
        alignItems: 'center' as const,
    },
    noResultsText: {
        fontSize: 14,
        color: '#6B7280',
    },
    tagsContainer: {
        marginBottom: 8,
        maxHeight: 40,
        paddingHorizontal: 2, // Add padding to prevent cutoff
    },
    selectedTag: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        maxWidth: 140, // Reduced to accommodate remove button
        overflow: 'hidden' as const,
    },
    countTag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        maxWidth: 50, // Smaller width for count tag
    },
    selectedTagText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '500' as const,
        flex: 1,
        marginRight: 4, // Add margin to separate from remove button
    },
    tagRemoveButton: {
        marginLeft: 4,
        padding: 2,
        borderRadius: 8,
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        width: 18,
        height: 18,
        flexShrink: 0, // Prevent shrinking
    },
};

export default AutoComplete;
