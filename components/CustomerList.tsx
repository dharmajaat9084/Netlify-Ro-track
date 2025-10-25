import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../App';
import BulkImportModal from './BulkImportModal';
import CustomerForm from './CustomerForm';
import Fuse from 'fuse';
import { exportCustomersToCSV } from '../utils/exportUtils';

// Extend window type for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Fix: Add types for the Web Speech API to resolve "Cannot find name 'SpeechRecognition'" errors.
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
    item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    start: () => void;
    stop: () => void;
}

declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

const CustomerList: React.FC = () => {
    const { customers, setView } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                setSearchTerm(transcript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (isMounted.current) {
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                if (isMounted.current) {
                    setIsListening(false);
                }
            };
            
            recognitionRef.current = recognition;
        } else {
            console.warn('Speech Recognition not supported by this browser.');
            setIsSpeechSupported(false);
        }

        return () => {
            isMounted.current = false;
            recognitionRef.current?.stop();
        };
    }, []);

    const handleToggleListening = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                setIsListening(true);
            } catch (error) {
                console.error("Could not start speech recognition:", error);
            }
        }
    };

    const fuse = useMemo(() => {
        const options = {
            keys: ['name', 'mobile', 'address', 'serialNumber'],
            threshold: 0.4, // Adjust for more or less strictness
        };
        return new Fuse(customers, options);
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) {
            return [...customers].sort((a, b) => a.serialNumber - b.serialNumber);
        }
        return fuse.search(searchTerm).map(result => result.item);
    }, [customers, searchTerm, fuse]);

    return (
        <div className="space-y-6">
            {isAdding && <CustomerForm onClose={() => setIsAdding(false)} />}
            {isBulkImporting && <BulkImportModal onClose={() => setIsBulkImporting(false)} />}
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                     <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
                </div>
                <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 md:ml-4 md:mt-0">
                    <button
                        type="button"
                        onClick={() => exportCustomersToCSV(customers)}
                        className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
                    >
                        <svg className="-ml-0.5 mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
                        </svg>
                        Export All to CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsBulkImporting(true)}
                        className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
                    >
                        <svg className="-ml-0.5 mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        Bulk Import
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                        <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        Add New Customer
                    </button>
                </div>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by S.No, name, mobile, or address..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                {isSpeechSupported && (
                    <button
                        type="button"
                        onClick={handleToggleListening}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                        aria-label="Search by voice"
                    >
                        {isListening ? (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"></path>
                                <rect x="7" y="7" width="6" height="6" rx="1" fill="white" />
                             </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCustomers.map(customer => (
                        <li key={customer.id} onClick={() => setView({ page: 'profile', customerId: customer.id })} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-center px-4 py-4 sm:px-6">
                                <div className="min-w-0 flex-1 flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold bg-primary-500`}>
                                            {customer.serialNumber}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">{customer.name}</p>
                                            <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                 <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path d="M5.75 3a.75.75 0 00-.75.75v.5h-1.5a2 2 0 00-2 2v8.5a2 2 0 002 2h10a2 2 0 002-2V6.25a2 2 0 00-2-2h-1.5v-.5a.75.75 0 00-1.5 0v.5h-5v-.5A.75.75 0 005.75 3zM4.5 8.25a.75.75 0 000 1.5h11a.75.75 0 000-1.5h-11z" />
                                                </svg>
                                                <span className="truncate">Installed on {new Date(customer.installationDate).toLocaleDateString()}</span>
                                            </p>
                                        </div>
                                        <div className="hidden md:block">
                                            <div>
                                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                                    Rent: <span className="font-medium">₹{customer.monthlyRent}</span> / month
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CustomerList;