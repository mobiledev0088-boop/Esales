import { View, FlatList, TouchableOpacity, ScrollView } from 'react-native'
import React, { useMemo, useState, useCallback } from 'react'
import AppLayout from '../../../../components/layout/AppLayout'
import AppDropdown, { AppDropdownItem } from '../../../../components/customs/AppDropdown'
import AppText from '../../../../components/customs/AppText'
import AppIcon from '../../../../components/customs/AppIcon'
import Card from '../../../../components/Card'
import Accordion from '../../../../components/Accordion'
import { CircularProgressBar } from '../../../../components/customs/AppChart'
import { getPastQuarters, convertToASINUnits } from '../../../../utils/commonFunctions'
import { AppColors } from '../../../../config/theme'
import { useQuery } from '@tanstack/react-query'
import { handleASINApiCall } from '../../../../utils/handleApiCall'

const demoData = [
  {
    Sequence_No: 1,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "NB",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "NR",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "ASHIRBAD COMPUTER & SERVICES",
    Product_Category: "ACCY",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "NB",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "NR",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "ASUS INDIA PVT LTD",
    Product_Category: "ACCY",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "AYRTECH",
    Product_Category: "NB",
    Achieved_Qty: 633,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "AYRTECH",
    Product_Category: "NR",
    Achieved_Qty: 302,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "AYRTECH",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "AYRTECH",
    Product_Category: "AIO",
    Achieved_Qty: 7,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "AYRTECH",
    Product_Category: "DT",
    Achieved_Qty: 23,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "AYRTECH",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "AYRTECH",
    Product_Category: "LM",
    Achieved_Qty: 1,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "AYRTECH",
    Product_Category: "WEP",
    Achieved_Qty: 7,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "AYRTECH",
    Product_Category: "ACCY",
    Achieved_Qty: 579,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "Digital Equipment",
    Product_Category: "NB",
    Achieved_Qty: 1067,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "Digital Equipment",
    Product_Category: "NR",
    Achieved_Qty: 255,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "Digital Equipment",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "Digital Equipment",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "Digital Equipment",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "Digital Equipment",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "Digital Equipment",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "Digital Equipment",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "Digital Equipment",
    Product_Category: "ACCY",
    Achieved_Qty: 1247,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "NB",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "NR",
    Achieved_Qty: 354,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "EXACT MARKETING &DISTRIBUTION PVT.LT",
    Product_Category: "ACCY",
    Achieved_Qty: 369,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "NB",
    Achieved_Qty: 8642,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "NR",
    Achieved_Qty: 3977,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "AIO",
    Achieved_Qty: 6,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "DT",
    Achieved_Qty: 205,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "NX",
    Achieved_Qty: 1949,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "LM",
    Achieved_Qty: 137,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "WEP",
    Achieved_Qty: 1936,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "INGRAM MICRO INDIA PRIVATE LIMITED",
    Product_Category: "ACCY",
    Achieved_Qty: 11780,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "NB",
    Achieved_Qty: 313,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "NR",
    Achieved_Qty: 506,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "MS DATAMATION SERVICES",
    Product_Category: "ACCY",
    Achieved_Qty: 386,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "NB",
    Achieved_Qty: 67615,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "NR",
    Achieved_Qty: 27156,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "GDT",
    Achieved_Qty: 7,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "AIO",
    Achieved_Qty: 3176,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "DT",
    Achieved_Qty: 1059,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "LM",
    Achieved_Qty: 514,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "WEP",
    Achieved_Qty: 26790,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "RASHI PERIPHERALS PVT LTD",
    Product_Category: "ACCY",
    Achieved_Qty: 102724,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "NB",
    Achieved_Qty: 16087,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "NR",
    Achieved_Qty: 6159,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "AIO",
    Achieved_Qty: 82,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "DT",
    Achieved_Qty: 205,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "NX",
    Achieved_Qty: 2002,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "LM",
    Achieved_Qty: 23,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "WEP",
    Achieved_Qty: 1915,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "REDINGTON INDIA LIMITED",
    Product_Category: "ACCY",
    Achieved_Qty: 17733,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "SAVEX",
    Product_Category: "NB",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "SAVEX",
    Product_Category: "NR",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "SAVEX",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "SAVEX",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "SAVEX",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "SAVEX",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "SAVEX",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "SAVEX",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "SAVEX",
    Product_Category: "ACCY",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "NB",
    Achieved_Qty: 957,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "NR",
    Achieved_Qty: 753,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "SKYLINE SYSTEMS",
    Product_Category: "ACCY",
    Achieved_Qty: 1305,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 1,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "NB",
    Achieved_Qty: 20516,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 2,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "NR",
    Achieved_Qty: 2955,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 3,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "GDT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 4,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "AIO",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 5,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "DT",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 6,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "NX",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 7,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "LM",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 8,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "WEP",
    Achieved_Qty: 0,
    Target_Qty: 0,
    Percent: 0
  },
  {
    Sequence_No: 9,
    Loc_Branch: "VRP TELEMATICS PVT LTD",
    Product_Category: "ACCY",
    Achieved_Qty: 7668,
    Target_Qty: 0,
    Percent: 0
  }
]

// Type definitions for better type safety
type ProductItem = {
  Sequence_No: number
  Loc_Branch: string
  Product_Category: string
  Achieved_Qty: number
  Target_Qty: number
  Percent: number
}

type GroupedData = {
  branchName: string
  products: ProductItem[]
  totalAchieved: number
  totalTarget: number
}

const useGetTrgtVsAchvDetail = () => {
  return useQuery({
    queryKey: ['getTrgtVsAchvDetail'],
    queryFn: async () => {
      const response = await handleASINApiCall('/TrgtVsAchvDetail/GetTrgtVsAchvDetail_PODWise_Disti');
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo || [];
    },
  });
}

export default function DistiTargetSummaryPOD() {
  const quarter = useMemo(() => getPastQuarters(), [])
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem | null>(quarter[0])

  // Group data by Loc_Branch and calculate totals
  const groupedData = useMemo(() => {
    const groups = demoData.reduce((acc, item) => {
      const branch = item.Loc_Branch
      if (!acc[branch]) {
        acc[branch] = {
          branchName: branch,
          products: [],
          totalAchieved: 0,
          totalTarget: 0,
        }
      }
      acc[branch].products.push(item)
      acc[branch].totalAchieved += item.Achieved_Qty
      acc[branch].totalTarget += item.Target_Qty
      return acc
    }, {} as Record<string, GroupedData>)

    return Object.values(groups)
  }, [])

  // Get product icon and color config based on category
  const getProductConfig = useCallback((category: string): { icon: string; color: string } => {
    const configs: Record<string, { icon: string; color: string }> = {
      NB: { icon: 'laptop', color: AppColors.utilColor1 },
      NR: { icon: 'monitor', color: AppColors.utilColor2 },
      AIO: { icon: 'monitor-speaker', color: AppColors.utilColor3 },
      DT: { icon: 'desktop-tower-monitor', color: AppColors.utilColor4 },
      GDT: { icon: 'desktop-tower', color: AppColors.utilColor5 },
      NX: { icon: 'cube-outline', color: AppColors.utilColor6 },
      LM: { icon: 'book-open-variant', color: AppColors.utilColor7 },
      WEP: { icon: 'wifi', color: AppColors.utilColor8 },
      ACCY: { icon: 'package-variant', color: AppColors.utilColor9 },
    }
    return configs[category] || { icon: 'package', color: AppColors.utilColor1 }
  }, [])

  // Render individual product card within a branch - matches Dashboard's renderProductCard
  const renderProductCard = useCallback((item: ProductItem, index: number) => {
    const config = getProductConfig(item.Product_Category)
    
    return (
      <TouchableOpacity
        disabled
        key={`${item.Loc_Branch}-${item.Product_Category}-${index}`}
        activeOpacity={0.7}
      >
        <Card
          className="min-w-40 rounded-md"
          watermark
          key={`${item.Product_Category}-${index}`}
        >
          <View className="items-center">
            <View className="flex-row items-center gap-2 mb-1">
              <AppIcon
                name={config.icon}
                size={18}
                color={config.color}
                type="material-community"
              />
              <AppText size="base" weight="bold" color="text">
                {item.Product_Category}
              </AppText>
            </View>
            <CircularProgressBar
              progress={item.Percent || 0}
              progressColor={config.color}
              size={70}
              strokeWidth={6}
              duration={1000 + (index * 100)}
            />
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-1 items-start">
                <AppText size="sm" className="text-gray-400">
                  Target
                </AppText>
                <AppText size="sm" weight="semibold">
                  {convertToASINUnits(item.Target_Qty, true)}
                </AppText>
              </View>
              <View className="flex-1 items-end">
                <AppText size="xs" className="text-gray-400">
                  Achieved
                </AppText>
                <AppText size="sm" weight="semibold">
                  {convertToASINUnits(item.Achieved_Qty, true)}
                </AppText>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }, [getProductConfig])

  // Render each branch group as an accordion section
  const renderBranchItem = useCallback(({ item }: { item: GroupedData }) => {

    // Custom accordion header with branch details
    const accordionHeader = (
      <View className="flex-row items-center justify-between flex-1 pr-2 pt-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-2">
            <AppIcon 
              name="office-building" 
              size={20} 
              color={AppColors.primary}
              type="material-community"
            />
            <AppText size="sm" weight="bold" color="text" className="flex-1" numberOfLines={1}>
              {item.branchName}
            </AppText>
          </View>
          
          {/* Branch Summary Stats */}
          <View className="flex-row gap-6 mb-2">
            <View>
              <AppText size="xs" className="text-gray-400 mb-1">Total Target</AppText>
              <AppText size="xs" weight="semibold">
                {convertToASINUnits(item.totalTarget, true)}
              </AppText>
            </View>
            <View>
              <AppText size="xs" className="text-gray-400 mb-1">Total Achieved</AppText>
              <AppText size="xs" weight="semibold">
                {convertToASINUnits(item.totalAchieved, true)}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    )

    return (
      <View className="mb-4">
        <Accordion
          header={accordionHeader}
          initialOpening={false}
          needBottomBorder={false}
          containerClassName="bg-white mb-2 overflow-hidden rounded-lg border border-gray-200"
        //   contentClassName="px-3 pb-3"
        >
          {/* Horizontal ScrollView for Product Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingTop:8, paddingBottom:12, paddingHorizontal: 12 }}
          >
            {item.products.map((product, index) => renderProductCard(product, index))}
          </ScrollView>
        </Accordion>
      </View>
    )
  }, [renderProductCard])

  // Extract key for FlatList optimization
  const keyExtractor = useCallback((item: GroupedData) => item.branchName, [])

  return (
    <AppLayout title="Target / Achievement" needBack needPadding>
      {/* Quarter Dropdown */}
      <View className="w-36 self-end mt-2 mb-4">
        <AppDropdown
          mode="dropdown"
          data={quarter}
          selectedValue={selectedQuarter?.value}
          onSelect={setSelectedQuarter}
        />
      </View>

      {/* Summary Header */}
      <View className="mb-4">
        <AppText size="lg" weight="bold" color="text" className="mb-1">
          Distributor Performance Summary
        </AppText>
        <AppText size="sm" className="text-gray-500">
          {groupedData.length} Distributors • {selectedQuarter?.label || 'All Time'}
        </AppText>
      </View>

      {/* Branch List */}
      <FlatList
        data={groupedData}
        renderItem={renderBranchItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </AppLayout>
  )
}