export interface CreateSalesActivityDTO {
  userId: string;
  activityDate: string;
  callsMade: number;
  contactsReached: number;
  appointmentsSet: number;
  testDrives: number;
  proposalsSent: number;
  salesClosed: number;
  notes?: string;
}

export interface SalesActivityResponseDTO {
  id: string;
  activityDate: string;
  callsMade: number;
  contactsReached: number;
  appointmentsSet: number;
  testDrives: number;
  proposalsSent: number;
  salesClosed: number;
  notes: string | null;
  totalActivities: number;
}

export interface SalesGoalDTO {
  metric: string;
  targetValue: number;
  currentValue: number;
  progressPercent: number;
  status: 'below' | 'on_target' | 'above';
}
