import { useMemo, useState } from 'react'
import { getPastQuarters } from '../utils/commonFunctions';
import { AppDropdownItem } from '../components/customs/AppDropdown';

export default function useQuarterHook() {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem | null>(quarters[0]);
  return {quarters, selectedQuarter, setSelectedQuarter};
}