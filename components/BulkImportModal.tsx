import React, { useState } from 'react';
import { useAppContext } from '../App';
import type { Customer } from '../types';
import { generatePaymentsForCustomer } from '../utils/paymentUtils';

interface BulkImportModalProps {
  onClose: () => void;
}

interface ImportError {
  lineNumber: number;
  data: string;
  message: string;
}

/**
 * A simple but more robust CSV parser that handles quoted fields.
 * This allows fields like addresses to contain commas.
 * @param line - A single line from a CSV file.
 * @returns An array of strings representing the fields.
 */
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i+1] === '"') {
                // Handle escaped quote
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }
    result.push(currentField); // Add the last field
    return result.map(field => field.trim());
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose }) => {
  const { customers, setCustomers } = useAppContext();
  const [pastedData, setPastedData] = useState('');
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleImport = async () => {
    setErrors([]);
    setSuccessCount(null);

    const lines = pastedData.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        setErrors([{ lineNumber: 0, data: '', message: 'No data to import.' }]);
        return;
    }

    const newCustomers: Customer[] = [];
    const importErrors: ImportError[] = [];
    const existingSerialNumbers = new Set(customers.map(c => c.serialNumber));
    const newSerialNumbersInBatch = new Set();

    lines.forEach((line, index) => {
      const parts = parseCSVLine(line);
      
      if (parts.length !== 7) {
        importErrors.push({
          lineNumber: index + 1,
          data: line,
          message: `Expected 7 fields, but found ${parts.length}. Check for unclosed quotes or formatting issues.`,
        });
        return;
      }
      
      const [serialNumberStr, name, address, mobile, roModel, installationDateStr, monthlyRentStr] = parts;

      const serialNumber = parseInt(serialNumberStr, 10);
      if (isNaN(serialNumber) || serialNumber <= 0) {
          importErrors.push({
            lineNumber: index + 1,
            data: line,
            message: 'Serial Number must be a valid positive number.',
          });
          return;
      }
      if (existingSerialNumbers.has(serialNumber) || newSerialNumbersInBatch.has(serialNumber)) {
          importErrors.push({
            lineNumber: index + 1,
            data: line,
            message: 'Serial Number already exists or is duplicated in the import file.',
          });
          return;
      }
      
      const installationDate = new Date(installationDateStr);
      if (isNaN(installationDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(installationDateStr)) {
          importErrors.push({
            lineNumber: index + 1,
            data: line,
            message: 'Invalid date format. Please use YYYY-MM-DD.',
          });
          return;
      }

      const monthlyRent = parseInt(monthlyRentStr, 10);
      if (isNaN(monthlyRent) || monthlyRent < 0) {
          importErrors.push({
            lineNumber: index + 1,
            data: line,
            message: 'Monthly Rent must be a valid positive number.',
          });
          return;
      }

      newSerialNumbersInBatch.add(serialNumber);
      const newCustomer: Customer = {
          id: crypto.randomUUID(),
          serialNumber,
          name,
          address,
          mobile,
          roModel,
          installationDate: installationDate.toISOString(),
          monthlyRent,
          payments: generatePaymentsForCustomer(installationDate),
      };
      newCustomers.push(newCustomer);
    });

    if (newCustomers.length > 0) {
      await setCustomers([...customers, ...newCustomers]);
    }

    setSuccessCount(newCustomers.length);
    setErrors(importErrors);
  };
  
  const hasProcessed = successCount !== null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black dark:bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Bulk Import Customers</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            {!hasProcessed ? (
              <>
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Instructions:</p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                        <li>Each customer must be on a new line.</li>
                        <li>Separate each field with a comma (,). If a field contains a comma, enclose it in double quotes (e.g., "123 Main St, Apt 4B").</li>
                        <li>Format: <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded">S.No, Name, Address, Mobile, RO Model, Install Date (YYYY-MM-DD), Rent</code></li>
                        <li>Example: <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded">101, "Doe, John", "123 Main St, Suite 5", 9876543210, AquaPure, 2023-05-15, 250</code></li>
                    </ul>
                </div>
                <div className="mt-4">
                    <label htmlFor="bulk-data" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Paste Customer Data Here
                    </label>
                    <textarea
                        id="bulk-data"
                        rows={10}
                        value={pastedData}
                        onChange={e => setPastedData(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                        placeholder="Start pasting your data..."
                    />
                </div>
              </>
            ) : (
                <div className="mt-4 p-4 text-sm max-h-96 overflow-y-auto">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">Import Report</h4>
                    {successCount !== null && successCount > 0 && (
                        <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-md">
                           Successfully imported {successCount} customer(s).
                        </div>
                    )}
                    {errors.length > 0 && (
                        <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-md">
                           Failed to import {errors.length} row(s).
                        </div>
                    )}
                    {successCount === 0 && errors.length === 0 && pastedData.length > 0 && (
                        <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-md">
                           No new customers were imported. Please check your data format.
                        </div>
                    )}
                    {errors.length > 0 && (
                        <div className="mt-4">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Details:</p>
                            <ul className="list-disc list-inside mt-2 space-y-2">
                                {errors.map(err => (
                                    <li key={err.lineNumber}>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            <span className="font-bold">Line {err.lineNumber}:</span> {err.message}
                                        </p>
                                        <code className="text-xs text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-900 p-1 rounded-md block mt-1 overflow-x-auto">{err.data}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="pt-4 flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                    {hasProcessed ? 'Close' : 'Cancel'}
                </button>
                {!hasProcessed ? (
                  <button type="button" onClick={handleImport} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700" disabled={!pastedData}>
                      Import Customers
                  </button>
                ) : (
                  <button type="button" onClick={() => { setPastedData(''); setErrors([]); setSuccessCount(null); }} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                      Import More
                  </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default BulkImportModal;