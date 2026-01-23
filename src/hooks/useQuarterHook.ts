import {useMemo, useState} from 'react';
import {getPastMonths, getPastQuarters} from '../utils/commonFunctions';
import {AppDropdownItem} from '../components/customs/AppDropdown';

export default function useQuarterHook(initialQuarter?: string) {
  // Memoized quarters array
  const quarters = useMemo(() => getPastQuarters(), []);
  const foundQuarter = initialQuarter
    ? quarters.find(q => q.value === initialQuarter) || null
    : null;
  // Selected quarter: ensure correct type + safe fallback
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(
      foundQuarter || (quarters.length > 0 ? quarters[0] : null),
    );

  return {quarters, selectedQuarter, setSelectedQuarter};
}

export function useMonthHook() {
  // Memoized months array
  const months = useMemo(() => getPastMonths(6), []);

  // Selected month: ensure correct type + safe fallback
  const [selectedMonth, setSelectedMonth] = useState<AppDropdownItem | null>(
    months.length > 0 ? months[0] : null,
  );

  return {months, selectedMonth, setSelectedMonth};
}
