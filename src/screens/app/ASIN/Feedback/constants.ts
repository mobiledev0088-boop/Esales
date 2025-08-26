// Feedback module constants and configurations

export const EXPERIENCE_OPTIONS = [
  { label: 'Very Bad', value: '1', color: '#ef4444' },
  { label: 'Poor', value: '2', color: '#f97316' },
  { label: 'Average', value: '3', color: '#eab308' },
  { label: 'Good', value: '4', color: '#22c55e' },
  { label: 'Excellent', value: '5', color: '#10b981' },
] as const;

export const STATUS_CONFIG = {
  CLOSED: {
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: '#dc2626',
    iconName: 'close-circle',
  },
  OPEN: {
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: '#059669',
    iconName: 'checkmark-circle',
  },
} as const;

export const ICON_COLORS = {
  email: '#3B82F6',
  customer: '#8B5CF6',
  employee: '#F59E0B',
  queryType: '#06B6D4',
  category: '#10B981',
  experience: '#F59E0B',
  description: '#EF4444',
} as const;

export type FeedbackStatus = keyof typeof STATUS_CONFIG;
export type ExperienceValue = typeof EXPERIENCE_OPTIONS[number]['value'];

export interface FeedbackItem {
  Feedback_ID: string;
  UniqueId: string;
  Uploded_On: string;
  QueryType: string;
  Employee_Name: string;
  Employee_EmailID: string;
  Employee_Code: string;
  Qry_Status: 'OPEN' | 'CLOSED';

  Category?: string;
  Feedback?: string;
  AFF_App_Experience?: string;
  Status_Updated_By?: string;
  Status_Updated_On?: string;
  Remarks?: string;
}

export interface CloseFeedbackResponse {
  DashboardData?: {
    Status?: boolean;
  };
}
export interface FeedbackApiResponse {
  DashboardData?: {
    Status?: boolean;
    Datainfo?: {
      FeedbackForm_Data?: FeedbackItem[];
    };
  };
}


