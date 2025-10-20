import React, { useState } from 'react';
import { useAppContext } from '../App';

const Reminders: React.FC = () => {
    const { appSettings, setAppSettings, dailyReminders: reminders, dismissReminder, forceReminderGeneration } = useAppContext();
    const [paymentLink, setPaymentLink] = useState(appSettings.paymentLink || '');
    const [copySuccess, setCopySuccess] = useState(''); // Holds the ID of the reminder whose message was copied
    const [selectedLanguages, setSelectedLanguages] = useState<Record<string, 'en' | 'hi'>>({});


    const handleSaveSettings = async () => {
        await setAppSettings({ ...appSettings, paymentLink });
        alert('Settings saved successfully!');
    };

    const handleSendWhatsApp = (mobile: string, message: string) => {
        const encodedMessage = encodeURIComponent(message);
        const cleanMobile = mobile.replace(/[^0-9]/g, '');
        const whatsappNumber = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    };

    const handleSendSms = (mobile: string, message: string) => {
        const encodedMessage = encodeURIComponent(message);
        const cleanMobile = mobile.replace(/[^0-9]/g, '');
        window.open(`sms:${cleanMobile}?body=${encodedMessage}`, '_blank');
    };


    const handleCopyToClipboard = (message: string, reminderId: string) => {
        navigator.clipboard.writeText(message).then(() => {
            setCopySuccess(reminderId);
            setTimeout(() => setCopySuccess(''), 2000); // Hide message after 2 seconds
        }, (err) => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy text.');
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Reminders</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-300">Configure your payment link and action today's automated reminders.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                <div className="mt-4">
                    <label htmlFor="paymentLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your Payment Link (PhonePe, Google Pay, etc.)
                    </label>
                    <input
                        type="url"
                        id="paymentLink"
                        value={paymentLink}
                        onChange={(e) => setPaymentLink(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        placeholder="https://your-payment-link.com"
                    />
                </div>
                <div className="mt-4 text-right">
                    <button
                        onClick={handleSaveSettings}
                        className="inline-flex items-center justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                    >
                        Save Settings
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reminders to Send Today</h2>
                     <button
                        onClick={forceReminderGeneration}
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
                    >
                        <svg className="-ml-0.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00-1.449.39 5.5 5.5 0 01-9.201-2.466l-.312.311H8.384a.75.75 0 000 1.5h4.242a.75.75 0 00.75-.75V3.989a.75.75 0 00-1.5 0v2.43l-.31-.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39z" clipRule="evenodd" />
                        </svg>
                        Refresh
                    </button>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This list is generated automatically. Click refresh to regenerate it now.</p>
                <div className="mt-4 flow-root">
                    {reminders.length > 0 ? (
                        <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                            {reminders.map((reminder) => {
                                const lang = selectedLanguages[reminder.id] || 'en';
                                const messageToShow = lang === 'en' ? reminder.message : reminder.messageHi;
                                const setLang = (newLang: 'en' | 'hi') => {
                                    setSelectedLanguages(prev => ({...prev, [reminder.id]: newLang}));
                                };

                                return (
                                <li key={reminder.id} className="py-5">
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{reminder.customerName}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{reminder.customerMobile}</p>
                                            </div>
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${reminder.type === 'Overdue' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800' : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800'}`}>
                                                {reminder.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                             <div className="flex rounded-md shadow-sm" role="group">
                                                <button
                                                    type="button"
                                                    onClick={() => setLang('en')}
                                                    className={`px-3 py-1 text-xs font-medium transition-colors ${lang === 'en' ? 'bg-primary-600 text-white' : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600'} rounded-l-lg`}
                                                >
                                                    English
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLang('hi')}
                                                    className={`px-3 py-1 text-xs font-medium transition-colors ${lang === 'hi' ? 'bg-primary-600 text-white' : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600'} rounded-r-lg`}
                                                >
                                                    Hindi
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{messageToShow}</p>
                                        </div>
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => dismissReminder(reminder.id)} className="rounded-md bg-gray-200 px-2.5 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                                                Dismiss
                                            </button>
                                            <button onClick={() => handleCopyToClipboard(messageToShow, reminder.id)} className="relative rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-500 dark:hover:bg-gray-600">
                                                {copySuccess === reminder.id ? 'Copied!' : 'Copy'}
                                            </button>
                                            <button onClick={() => handleSendSms(reminder.customerMobile, messageToShow)} className="rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                                                Send via SMS
                                            </button>
                                            <button onClick={() => handleSendWhatsApp(reminder.customerMobile, messageToShow)} className="rounded-md bg-green-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                                                Send via WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                            })}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4 dark:text-gray-400">No reminders to send today. Everyone is up to date!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reminders;