import type { Customer } from '../types';

/**
 * Converts an array of customer data into a CSV formatted string.
 * @param customers The array of customer objects.
 * @returns A string in CSV format.
 */
const convertToCSV = (customers: Customer[]): string => {
  const headers = [
    'serialNumber',
    'name',
    'address',
    'mobile',
    'roModel',
    'installationDate',
    'monthlyRent',
    'enableMonthlyReminder'
  ];
  
  const csvRows = [headers.join(',')];

  for (const customer of customers) {
    const values = headers.map(header => {
      const key = header as keyof Customer;
      let value = customer[key] as any;

      // Handle specific formatting
      if (key === 'installationDate') {
        value = new Date(value).toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }

      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Triggers a browser download for the provided CSV data.
 * @param customers The array of customer objects to export.
 */
export const exportCustomersToCSV = (customers: Customer[]) => {
  if (customers.length === 0) {
    alert('No customer data to export.');
    return;
  }

  const csvString = convertToCSV(customers);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ro-track-customers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
