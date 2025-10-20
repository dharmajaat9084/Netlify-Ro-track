
import React, { useMemo } from 'react';
import { useAppContext } from '../App';
import { PaymentStatus } from '../types';

// Fix: Replaced `JSX.Element` with `React.ReactNode` to resolve the "Cannot find namespace 'JSX'" error.
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center dark:bg-gray-800 h-full">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m9 5.197a6 6 0 003.882-1.882M15 21a6 6 0 01-9-5.197" /></svg>;
const MoneyReceivedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MoneyDueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 16v-1m0-1v.01m0-4.01V12m7-4h-1a2 2 0 00-2 2v8a2 2 0 002 2h1a2 2 0 002-2V8a2 2 0 00-2-2zm-14 0H5a2 2 0 00-2 2v8a2 2 0 002 2h1a2 2 0 002-2V8a2 2 0 00-2-2z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;


const Dashboard: React.FC = () => {
  const { customers, setView, dailyReminders } = useAppContext();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalCustomers = customers.length;

    let rentCollectedThisMonth = 0;
    let rentDueThisMonth = 0;

    customers.forEach(customer => {
        customer.payments.forEach(payment => {
            if (payment.status === PaymentStatus.Paid && payment.paymentDate) {
                const paymentDate = new Date(payment.paymentDate);
                if (paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === currentMonth) {
                    rentCollectedThisMonth += payment.amount ?? customer.monthlyRent;
                }
            }
        });
        
        const paymentThisMonth = customer.payments.find(p => p.year === currentYear && p.month === currentMonth);
        if (paymentThisMonth && paymentThisMonth.status === PaymentStatus.Pending) {
            rentDueThisMonth += customer.monthlyRent;
        }
    });

    now.setHours(0, 0, 0, 0);
    const overdueCustomers = customers.filter(c => c.payments.some(p => {
        const paymentMonthEndDate = new Date(p.year, p.month + 1, 0);
        return p.status !== PaymentStatus.Paid && paymentMonthEndDate < now;
    })).map(c => ({id: c.id, name: c.name, mobile: c.mobile, serialNumber: c.serialNumber}));

    return { totalCustomers, rentCollectedThisMonth, rentDueThisMonth, overdueCustomers };
  }, [customers]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">Welcome back, here's a summary of your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={<UserIcon />} color="bg-blue-500"/>
        <StatCard title="Rent Collected This Month" value={`₹${stats.rentCollectedThisMonth.toLocaleString()}`} icon={<MoneyReceivedIcon />} color="bg-green-500" />
        <StatCard title="Rent Due This Month" value={`₹${stats.rentDueThisMonth.toLocaleString()}`} icon={<MoneyDueIcon />} color="bg-yellow-500" />
        <div onClick={() => setView({ page: 'reminders' })} className="cursor-pointer">
           <StatCard title="Reminders To Send" value={dailyReminders.length} icon={<BellIcon />} color="bg-purple-500" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Overdue Payments</h2>
        <div className="mt-4 flow-root">
          {stats.overdueCustomers.length > 0 ? (
            <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.overdueCustomers.map((customer) => (
                <li key={customer.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        <span className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 font-bold">!</span>
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span className="font-bold">#{customer.serialNumber}</span> - {customer.name}
                      </p>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">{customer.mobile}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => setView({ page: 'profile', customerId: customer.id })}
                        className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4 dark:text-gray-400">No overdue payments. Great job!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
