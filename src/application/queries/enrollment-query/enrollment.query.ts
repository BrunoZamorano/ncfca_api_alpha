import { MyEnrollmentRequestItemView } from '@/application/queries/enrollment-query/my-enrollment-request-item.view';

export interface EnrollmentQuery {
  myRequests(userId: string): Promise<MyEnrollmentRequestItemView[]>;
}
