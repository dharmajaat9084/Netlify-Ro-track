
import type { Payment } from '../types';
import { PaymentStatus } from '../types';

/**
 * Generates an array of payment objects for a customer based on their installation date.
 * @param installDate The date the RO unit was installed.
 * @param yearsAhead The number of future years to generate payment records for. Defaults to 5.
 * @returns An array of Payment objects.
 */
export const generatePaymentsForCustomer = (installDate: Date, yearsAhead: number = 5): Payment[] => {
    const payments: Payment[] = [];
    const endYear = new Date().getFullYear() + yearsAhead;

    for (let year = installDate.getFullYear(); year <= endYear; year++) {
        const startMonth = (year === installDate.getFullYear()) ? installDate.getMonth() : 0;
        for (let month = startMonth; month < 12; month++) {
            payments.push({
                year,
                month,
                status: PaymentStatus.Pending,
            });
        }
    }
    return payments;
};
