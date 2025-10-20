import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import type { Customer, Payment } from '../types';
import { PaymentStatus } from '../types';
import { MONTHS } from '../constants';
import CustomerForm from './CustomerForm';
import ConfirmationModal from './ConfirmationModal';

type SelectedMonth = { year: number; month: number };

const PaymentModal: React.FC<{
  customer: Customer;
  selectedMonth: SelectedMonth;
  payment: Payment | undefined;
  onClose: () => void;
}> = ({ customer, selectedMonth, payment, onClose }) => {
    const { customers, setCustomers } = useAppContext();
    const [notes, setNotes] = useState(payment?.notes || '');

    const handleSave = (newStatus: PaymentStatus) => {
        const updatedCustomers = customers.map(c => {
            if (c.id === customer.id) {
                const newPayments = [...c.payments];
                const paymentIndex = newPayments.findIndex(p => p.year === selectedMonth.year && p.month === selectedMonth.month);
                const isPaying = newStatus === PaymentStatus.Paid;

                if (paymentIndex !== -1) {
                    newPayments[paymentIndex] = {
                        ...newPayments[paymentIndex],
                        status: newStatus,
                        notes: notes,
                        paymentDate: isPaying ? new Date().toISOString() : undefined,
                        amount: isPaying ? customer.monthlyRent : undefined,
                    };
                } else {
                    // This case should ideally not happen if payments are pre-generated
                     newPayments.push({
                        year: selectedMonth.year,
                        month: selectedMonth.month,
                        status: newStatus,
                        notes: notes,
                        paymentDate: isPaying ? new Date().toISOString() : undefined,
                        amount: isPaying ? customer.monthlyRent : undefined,
                    });
                }
                return { ...c, payments: newPayments };
            }
            return c;
        });
        setCustomers(updatedCustomers);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black dark:bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Log Payment for {MONTHS[selectedMonth.month]} {selectedMonth.year}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer: {customer.name}</p>
                </div>
                <div className="mt-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Notes</label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        placeholder="e.g., Paid via cash, received late..."
                    ></textarea>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:col-start-2"
                        onClick={() => handleSave(PaymentStatus.Paid)}
                    >
                        Confirm Payment Received
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 dark:bg-gray-600 dark:text-gray-200 dark:ring-gray-500 dark:hover:bg-gray-500"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
                 {payment?.status === PaymentStatus.Paid && (
                    <div className="mt-4">
                         <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            onClick={() => handleSave(PaymentStatus.Pending)}
                        >
                            Mark as Unpaid / Revert
                        </button>
                    </div>
                 )}
            </div>
        </div>
    );
};


const CustomerProfile: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { customers, setCustomers, setView } = useAppContext();
  const customer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [multiSelectedMonths, setMultiSelectedMonths] = useState<SelectedMonth[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const installationDate = useMemo(() => new Date(customer?.installationDate || Date.now()), [customer]);

  if (!customer) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Customer not found.</div>;
  }
  
  const handleDelete = async () => {
    await setCustomers(customers.filter(c => c.id !== customerId));
    setIsDeleting(false);
    setView({ page: 'customers' });
  };

  const handleToggleReminder = (enabled: boolean) => {
    const updatedCustomers = customers.map(c => c.id === customerId ? { ...c, enableMonthlyReminder: enabled } : c);
    setCustomers(updatedCustomers);
  };

  const handleBulkUpdate = (newStatus: PaymentStatus) => {
    if (multiSelectedMonths.length === 0) return;

    const updatedCustomers = customers.map(c => {
        if (c.id === customerId) {
            let newPayments = [...c.payments];
            multiSelectedMonths.forEach(selected => {
                const paymentIndex = newPayments.findIndex(p => p.year === selected.year && p.month === selected.month);
                const isPaying = newStatus === PaymentStatus.Paid;
                const note = isPaying ? `Bulk updated on ${new Date().toLocaleDateString()}` : '';

                if (paymentIndex !== -1) {
                    newPayments[paymentIndex] = {
                        ...newPayments[paymentIndex],
                        status: newStatus,
                        paymentDate: isPaying ? new Date().toISOString() : undefined,
                        amount: isPaying ? c.monthlyRent : undefined,
                        notes: newPayments[paymentIndex].notes || note,
                    };
                } else {
                     newPayments.push({
                        year: selected.year,
                        month: selected.month,
                        status: newStatus,
                        paymentDate: isPaying ? new Date().toISOString() : undefined,
                        amount: isPaying ? c.monthlyRent : undefined,
                        notes: note,
                    });
                }
            });
            return { ...c, payments: newPayments };
        }
        return c;
    });

    setCustomers(updatedCustomers);
    setIsMultiSelectMode(false);
    setMultiSelectedMonths([]);
  };

  const handleSelectAll = () => {
    const allSelectableMonths: SelectedMonth[] = [];
    MONTHS.forEach((_, monthIndex) => {
        const isBeforeInstall = year < installationDate.getFullYear() || 
                                (year === installationDate.getFullYear() && monthIndex < installationDate.getMonth());
        if (!isBeforeInstall) {
            allSelectableMonths.push({ year, month: monthIndex });
        }
    });
    setMultiSelectedMonths(allSelectableMonths);
  };

  const getPaymentStatus = (month: number): { status: PaymentStatus | 'Overdue', color: string, darkColor: string, textColor: string, darkTextColor: string } => {
    const payment = customer.payments.find(p => p.year === year && p.month === month);
    if (payment?.status === PaymentStatus.Paid) {
      return { status: PaymentStatus.Paid, color: 'bg-green-100', darkColor: 'dark:bg-green-900', textColor: 'text-green-800', darkTextColor: 'dark:text-green-300' };
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0);
    if (endOfMonth < now) {
      return { status: PaymentStatus.Overdue, color: 'bg-red-100', darkColor: 'dark:bg-red-900', textColor: 'text-red-800', darkTextColor: 'dark:text-red-300' };
    }
    
    return { status: PaymentStatus.Pending, color: 'bg-gray-100', darkColor: 'dark:bg-gray-700', textColor: 'text-gray-800', darkTextColor: 'dark:text-gray-300' };
  };
  
  const paymentForSelectedMonth = selectedMonth ? customer.payments.find(p => p.year === selectedMonth.year && p.month === selectedMonth.month) : undefined;
  
  const paymentHistory = useMemo(() => {
    return [...customer.payments]
      .filter(p => p.status === PaymentStatus.Paid && p.paymentDate)
      .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());
  }, [customer.payments]);

  return (
    <div className="space-y-8">
      {selectedMonth && <PaymentModal customer={customer} selectedMonth={selectedMonth} payment={paymentForSelectedMonth} onClose={() => setSelectedMonth(null)} />}
      {isEditing && <CustomerForm onClose={() => setIsEditing(false)} customerToEdit={customer} />}
      <ConfirmationModal
        isOpen={isDeleting}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleting(false)}
        confirmText="Delete"
      />

      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <div className="md:flex md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                <span className="text-gray-400 dark:text-gray-500 font-normal">#{customer.serialNumber}</span> {customer.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{customer.address}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customer.mobile} | Rent: ₹{customer.monthlyRent}/month</p>
            <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M5.75 3a.75.75 0 00-.75.75v.5h-1.5a2 2 0 00-2 2v8.5a2 2 0 002 2h10a2 2 0 002-2V6.25a2 2 0 00-2-2h-1.5v-.5a.75.75 0 00-1.5 0v.5h-5v-.5A.75.75 0 005.75 3zM4.5 8.25a.75.75 0 000 1.5h11a.75.75 0 000-1.5h-11z" />
                </svg>
                Installed on {new Date(customer.installationDate).toLocaleDateString()}
            </p>
            <div className="mt-4 flex items-center space-x-3">
                <label htmlFor="reminder-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Reminders:</label>
                <button
                    type="button"
                    onClick={() => handleToggleReminder(!customer.enableMonthlyReminder)}
                    className={`${customer.enableMonthlyReminder ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 dark:ring-offset-gray-800`}
                    role="switch"
                    aria-checked={customer.enableMonthlyReminder}
                    id="reminder-toggle"
                >
                    <span
                    aria-hidden="true"
                    className={`${customer.enableMonthlyReminder ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                </button>
                <span className={`text-sm ${customer.enableMonthlyReminder ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                    {customer.enableMonthlyReminder ? 'Enabled' : 'Disabled'}
                </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
              >
                <svg className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                </svg>
                Edit
              </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button onClick={() => setYear(y => y - 1)} disabled={isMultiSelectMode} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-700 dark:text-white">&lt;</button>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{year}</h3>
            <button onClick={() => setYear(y => y + 1)} disabled={isMultiSelectMode} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-gray-700 dark:text-white">&gt;</button>
          </div>
          {!isMultiSelectMode ? (
            <button onClick={() => setIsMultiSelectMode(true)} className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600">Select Months</button>
          ) : (
            <button onClick={() => { setIsMultiSelectMode(false); setMultiSelectedMonths([]); }} className="inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
          )}
        </div>
        
        {isMultiSelectMode && (
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 p-3 mb-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-900/50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{multiSelectedMonths.length} month(s) selected</span>
              <div className="space-x-3">
                 <button onClick={handleSelectAll} className="text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400 focus:outline-none">Select All for {year}</button>
                 <button onClick={() => setMultiSelectedMonths([])} className="text-sm font-semibold text-gray-600 hover:underline dark:text-gray-400 focus:outline-none">Clear Selection</button>
              </div>
            </div>
            <div className="space-x-2">
                <button onClick={() => handleBulkUpdate(PaymentStatus.Pending)} disabled={multiSelectedMonths.length === 0} className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:ring-gray-500 dark:hover:bg-gray-500">Mark as Pending</button>
                <button onClick={() => handleBulkUpdate(PaymentStatus.Paid)} disabled={multiSelectedMonths.length === 0} className="rounded-md bg-green-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50">Mark as Paid</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {MONTHS.map((monthName, index) => {
            const isBeforeInstall = year < installationDate.getFullYear() || (year === installationDate.getFullYear() && index < installationDate.getMonth());
            
            if (isBeforeInstall) {
                return (
                    <div key={index} className="p-4 rounded-lg text-center bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed">
                         <p className="font-semibold text-gray-400 dark:text-gray-500">{monthName}</p>
                         <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">N/A</p>
                    </div>
                );
            }

            const isSelected = multiSelectedMonths.some(m => m.year === year && m.month === index);
            const { status, color, darkColor, textColor, darkTextColor } = getPaymentStatus(index);
            
            return (
              <button
                key={index}
                onClick={() => {
                  if (isMultiSelectMode) {
                    const selection = { year, month: index };
                    if (isSelected) {
                      setMultiSelectedMonths(prev => prev.filter(m => !(m.year === year && m.month === index)));
                    } else {
                      setMultiSelectedMonths(prev => [...prev, selection]);
                    }
                  } else {
                    setSelectedMonth({ year, month: index });
                  }
                }}
                className={`p-4 rounded-lg text-center cursor-pointer transition-all duration-150 ${color} ${darkColor} ${isSelected ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-800' : 'transform hover:scale-105'}`}
              >
                <p className={`font-semibold ${textColor} ${darkTextColor}`}>{monthName}</p>
                <p className={`text-xs mt-1 ${textColor} ${darkTextColor}`}>{status}</p>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
         <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment History & Notes</h3>
         {paymentHistory.length > 0 ? (
            <ul className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {paymentHistory.map((p, idx) => (
                    <li key={`${p.year}-${p.month}-${idx}`} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{new Date(p.paymentDate!).toLocaleDateString()} - {MONTHS[p.month]} {p.year}</p>
                        {p.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{p.notes}</p>}
                    </li>
                ))}
            </ul>
         ) : (
            <p className="mt-4 text-gray-500 dark:text-gray-400">No payments have been recorded yet.</p>
         )}
      </div>

       <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-6 rounded-lg shadow-md">
         <h3 className="text-xl font-bold text-red-800 dark:text-red-300">Danger Zone</h3>
         <p className="mt-2 text-sm text-red-700 dark:text-red-400">
           Deleting a customer is a permanent action and cannot be undone. All associated payment data will be lost.
         </p>
         <div className="mt-4">
           <button
             onClick={() => setIsDeleting(true)}
             className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
           >
             Delete This Customer
           </button>
         </div>
       </div>

    </div>
  );
};

export default CustomerProfile;