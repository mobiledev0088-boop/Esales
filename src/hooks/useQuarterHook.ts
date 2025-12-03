import { useMemo, useState } from 'react'
import { getPastQuarters } from '../utils/commonFunctions';
import { AppDropdownItem } from '../components/customs/AppDropdown';

export default function useQuarterHook() {
  // Memoized quarters array
  const quarters = useMemo(() => getPastQuarters(), []);

  // Selected quarter: ensure correct type + safe fallback
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem | null>(
    quarters.length > 0 ? quarters[0] : null,
  );

  return { quarters, selectedQuarter, setSelectedQuarter };
}