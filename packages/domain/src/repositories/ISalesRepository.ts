import { SalesActivity } from '../entities/SalesActivity';

export interface CreateSalesActivityData {
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

export interface ISalesRepository {
  findByUserAndDate(userId: string, date: string): Promise<SalesActivity | null>;
  findByUserAndPeriod(userId: string, startDate: string, endDate: string): Promise<SalesActivity[]>;
  upsert(data: CreateSalesActivityData): Promise<SalesActivity>;
}
