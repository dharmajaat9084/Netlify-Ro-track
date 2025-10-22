import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import type { Customer } from '../types';
import { generatePaymentsForCustomer } from '../utils/paymentUtils';

interface CustomerFormProps {
  onClose: () => void;
  customerToEdit?: Customer;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onClose, customerToEdit }) => {
    const { customers, setCustomers } = useAppContext();
    const [serialNumber, setSerialNumber] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [roModel, setRoModel] = useState('');
    const [installationDate, setInstallationDate] = useState('');
    const [monthlyRent, setMonthlyRent] = useState('');
    const [enableMonthlyReminder, setEnableMonthlyReminder] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!customerToEdit;

    useEffect(() => {
        if (isEditing) {
            setSerialNumber(customerToEdit.serialNumber.toString());
            setName(customerToEdit.name);
            setAddress(customerToEdit.address);
            setMobile(customerToEdit.mobile);
            setRoModel(customerToEdit.roModel);
            setInstallationDate(customerToEdit.installationDate.split('T')[0]);
            setMonthlyRent(customerToEdit.monthlyRent.toString());
            setEnableMonthlyReminder(customerToEdit.enableMonthlyReminder ?? false);
        } else {
            setInstallationDate(new Date().toISOString().split('T')[0]);
        }
    }, [customerToEdit, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const sn = parseInt(serialNumber, 10);
        const rent = parseInt(monthlyRent, 10);

        if (isNaN(sn) || sn <= 0) {
            setError('Serial Number must be a positive number.');
            return;
        }
        
        if (isNaN(rent) || rent < 0) {
            setError('Monthly rent must be a valid number.');
            return;
        }

        // Check for duplicate serial number only if adding a new customer or changing the number
        if ((!isEditing || sn !== customerToEdit.serialNumber) && customers.some(c => c.serialNumber === sn)) {
            setError('This Serial Number is already in use. Please choose a unique one.');
            return;
        }

        if (isEditing) {
            const updatedCustomer: Customer = {
                ...customerToEdit,
                serialNumber: sn,
                name,
                address,
                mobile,
                roModel,
                installationDate: new Date(installationDate).toISOString(),
                monthlyRent: rent,
                enableMonthlyReminder: enableMonthlyReminder,
            };
             // Fix: Pass a function to setCustomers to ensure the transaction gets the latest state.
            await setCustomers(prev => prev.map(c => c.id === customerToEdit.id ? updatedCustomer : c));
        } else {
            const newCustomer: Customer = {
                id: crypto.randomUUID(),
                serialNumber: sn,
                name,
                address,
                mobile,
                roModel,
                installationDate: new Date(installationDate).toISOString(),
                monthlyRent: rent,
                payments: generatePaymentsForCustomer(new Date(installationDate)),
                enableMonthlyReminder: enableMonthlyReminder,
            };
            // Fix: Pass a function to setCustomers to ensure the transaction gets the latest state.
            await setCustomers(prev => [...prev, newCustomer]);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black dark:bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {isEditing ? 'Edit Customer' : 'Add New Customer'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                {error && <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</div>}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number</label>
                        <input type="number" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                        <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RO Model Installed</label>
                        <input type="text" value={roModel} onChange={e => setRoModel(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Installation Date</label>
                        <input type="date" value={installationDate} onChange={e => setInstallationDate(e.target.value)} required disabled={isEditing} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-600 dark:[color-scheme:dark]" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Rent Amount (₹)</label>
                        <input type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="monthly-reminder"
                            aria-describedby="monthly-reminder-description"
                            name="monthly-reminder"
                            type="checkbox"
                            checked={enableMonthlyReminder}
                            onChange={(e) => setEnableMonthlyReminder(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label htmlFor="monthly-reminder" className="font-medium text-gray-900 dark:text-gray-200">
                            Enable Monthly Reminder
                          </label>
                          <p id="monthly-reminder-description" className="text-gray-500 dark:text-gray-400">
                            If checked, a reminder will be generated on the installation day of each month.
                          </p>
                        </div>
                      </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                            {isEditing ? 'Save Changes' : 'Save Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm;