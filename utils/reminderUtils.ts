import type { Customer, Reminder, AppSettings } from '../types';
import { PaymentStatus } from '../types';
import { MONTHS, MONTHS_HI } from '../constants';

const generateReminderMessages = (
    customerName: string,
    monthsList: string,
    monthsListHi: string,
    totalAmountDue: number,
    paymentLink: string,
    reminderType: 'Overdue' | 'Monthly'
) => {
    // If there are any overdue payments, the message is always urgent.
    if (reminderType === 'Overdue') {
        return {
            message: `URGENT: Dear ${customerName}, our records show an outstanding balance on your RO service account. Payments for the following months are overdue: ${monthsList}. The total amount due is ₹${totalAmountDue}. To avoid service interruption, please clear this balance immediately. Pay securely here: ${paymentLink}. Thank you for your prompt attention.`,
            messageHi: `अत्यावश्यक: प्रिय ${customerName}, हमारे रिकॉर्ड आपके आरओ सेवा खाते पर एक बकाया राशि दिखा रहे हैं। निम्नलिखित महीनों के लिए भुगतान अतिदेय हैं: ${monthsListHi}। कुल देय राशि ₹${totalAmountDue} है। सेवा में रुकावट से बचने के लिए, कृपया इस शेष राशि का तुरंत भुगतान करें। यहां सुरक्षित रूप से भुगतान करें: ${paymentLink}। आपके तत्काल ध्यान के लिए धन्यवाद।`
        };
    } 
    
    // This block only runs if there are NO overdue payments, so it's a pure monthly reminder for the current month.
    else { 
        return {
            message: `Dear ${customerName}, this is a friendly reminder for your RO service payment. The rent for ${monthsList}, amounting to ₹${totalAmountDue}, is now due. To ensure uninterrupted service, please complete the payment at your earliest convenience. Pay securely here: ${paymentLink}. Thank you!`,
            messageHi: `प्रिय ${customerName}, यह आपके आरओ सेवा भुगतान के लिए एक विनम्र अनुस्मारक है। ${monthsListHi} का किराया, ₹${totalAmountDue} की राशि, अब देय है। निर्बाध सेवा सुनिश्चित करने के लिए, कृपया जल्द से जल्द भुगतान पूरा करें। यहां सुरक्षित रूप से भुगतान करें: ${paymentLink}। धन्यवाद!`
        };
    }
};


/**
 * Generates daily payment reminders for all customers.
 * It consolidates overdue and current month payments into a single reminder per customer.
 * @param customers - The array of all customers.
 * @param appSettings - The application settings containing the payment link.
 * @returns An array of Reminder objects for the current day.
 */
export const generateDailyReminders = (customers: Customer[], appSettings: AppSettings): Reminder[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const paymentLink = appSettings.paymentLink || '[Your Payment Link - Please configure in Settings]';
    const dailyReminders: Reminder[] = [];

    for (const customer of customers) {
        if (!customer.payments || customer.payments.length === 0) {
            continue;
        }
        
        // --- Find all payments that need a reminder ---
        
        // 1. Find all truly overdue payments (from previous months)
        const overduePayments = customer.payments.filter(payment => {
            if (payment.status === PaymentStatus.Paid) return false;
            const endOfMonth = new Date(payment.year, payment.month + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            return endOfMonth < now;
        });
        
        // 2. Check if a monthly reminder is due today for the current month
        let currentMonthPaymentDue: { year: number; month: number } | null = null;
        if (customer.enableMonthlyReminder) {
            const installationDate = new Date(customer.installationDate);
            if (now.getDate() === installationDate.getDate()) {
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                
                const paymentThisMonth = customer.payments.find(p => p.year === currentYear && p.month === currentMonth);
                if (paymentThisMonth && paymentThisMonth.status !== PaymentStatus.Paid) {
                    currentMonthPaymentDue = { year: currentYear, month: currentMonth };
                }
            }
        }
        
        // --- Decide whether to generate a reminder ---
        
        // Combine all months that need reminding into one list
        const monthsToRemind: { year: number; month: number }[] = [...overduePayments];
        if (currentMonthPaymentDue) {
             // Avoid adding the current month if it's already in the overdue list (edge case for running this on the 1st of a new month)
            if (!monthsToRemind.some(m => m.year === currentMonthPaymentDue!.year && m.month === currentMonthPaymentDue!.month)) {
                monthsToRemind.push(currentMonthPaymentDue);
            }
        }
        
        // If there are no months to remind about, skip this customer
        if (monthsToRemind.length === 0) {
            continue;
        }
        
        // --- Generate the consolidated reminder ---
        
        // Sort months chronologically for a clean message
        monthsToRemind.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        const totalAmountDue = monthsToRemind.length * customer.monthlyRent;
        const monthsList = monthsToRemind.map(p => `${MONTHS[p.month]} ${p.year}`).join(', ');
        const monthsListHi = monthsToRemind.map(p => `${MONTHS_HI[p.month]} ${p.year}`).join(', ');

        const reminderType: 'Overdue' | 'Monthly' = overduePayments.length > 0 ? 'Overdue' : 'Monthly';

        const { message, messageHi } = generateReminderMessages(
            customer.name,
            monthsList,
            monthsListHi,
            totalAmountDue,
            paymentLink,
            reminderType
        );

        dailyReminders.push({
            id: `${customer.id}-consolidated-${now.getTime()}`,
            customerId: customer.id,
            customerName: customer.name,
            customerMobile: customer.mobile,
            type: reminderType,
            message,
            messageHi,
        });
    }
    
    return dailyReminders;
};