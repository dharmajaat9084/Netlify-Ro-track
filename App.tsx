import React, { useState, createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import type { Customer, View, AppSettings, Reminder } from './types';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerProfile from './components/CustomerProfile';
import Reminders from './components/Reminders';
import Login from './components/Login';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';
import { doc, onSnapshot, setDoc, runTransaction, DocumentData } from 'firebase/firestore';
import { initialCustomers } from './utils/initialData';
import { generateDailyReminders } from './utils/reminderUtils';

interface AppContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => Promise<void> | void;
  view: View;
  setView: React.Dispatch<React.SetStateAction<View>>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => Promise<void> | void;
  user: User | null;
  isGuestMode: boolean;
  loading: boolean;
  handleSignOut: () => Promise<void>;
  dailyReminders: Reminder[];
  dismissReminder: (reminderId: string) => void;
  forceReminderGeneration: () => void;
  fetchMoreCustomers: () => Promise<void>;
  hasMoreCustomers: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const Header: React.FC = () => {
    const { setView, theme, toggleTheme, isGuestMode, handleSignOut } = useAppContext();

    return (
        <header className="bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <svg className="h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="ml-2 text-2xl font-bold text-gray-800 dark:text-white">RO-Track {isGuestMode && <span className="text-sm font-normal text-gray-500">(Guest)</span>}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setView({ page: 'dashboard' })} className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium px-3 py-2 rounded-md text-sm">Dashboard</button>
                        <button onClick={() => setView({ page: 'customers' })} className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium px-3 py-2 rounded-md text-sm">Customers</button>
                        <button onClick={() => setView({ page: 'reminders' })} className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 font-medium px-3 py-2 rounded-md text-sm">Reminders</button>
                        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="Toggle dark mode">
                           {theme === 'light' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                           ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                           )}
                        </button>
                        <button onClick={handleSignOut} className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" aria-label="Sign Out">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

const FirebaseWarningBanner = () => (
    <div className="bg-red-600 text-white text-center p-2 text-sm font-bold">
        Firebase is not configured. Please add your API keys to the <code>firebaseConfig.ts</code> file to enable cloud features.
    </div>
);


const App: React.FC = () => {
  // Global state
  const [view, setView] = useState<View>({ page: 'dashboard' });
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('ro-track-theme', 'light');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Data state
  const [firebaseCustomers, setFirebaseCustomers] = useState<Customer[]>([]);
  const [firebaseAppSettings, setFirebaseAppSettings] = useState<AppSettings>({ paymentLink: '' });
  const [localCustomers, setLocalCustomers] = useLocalStorage<Customer[]>('ro-track-customers', initialCustomers);
  const [localAppSettings, setLocalAppSettings] = useLocalStorage<AppSettings>('ro-track-settings', { paymentLink: '' });
  
  // Local reminder generation state
  const [dailyReminders, setDailyReminders] = useLocalStorage<Reminder[]>('ro-track-daily-reminders', []);
  const [remindersLastGenerated, setRemindersLastGenerated] = useLocalStorage<string>('ro-track-reminders-last-generated', '');


  // Determine which data source to use
  const customers = isGuestMode ? localCustomers : firebaseCustomers;
  const setCustomers = isGuestMode ? setLocalCustomers : async (updatedCustomers: Customer[] | ((prev: Customer[]) => Customer[])) => {
      if (!user || !isFirebaseConfigured) return;
      const userDocRef = doc(db, 'users', user.uid);

      try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const currentCustomers = userDoc.exists() ? userDoc.data().customers || [] : [];
            const finalCustomers = typeof updatedCustomers === 'function' ? updatedCustomers(currentCustomers) : updatedCustomers;
            transaction.set(userDocRef, { customers: finalCustomers }, { merge: true });
        });
      } catch (e) {
        console.error("Transaction failed: ", e);
      }
  };
  const appSettings = isGuestMode ? localAppSettings : firebaseAppSettings;
  const setAppSettings = isGuestMode ? setLocalAppSettings : async (updatedSettings: AppSettings | ((prev: AppSettings) => AppSettings)) => {
      if (!user || !isFirebaseConfigured) return;
      const userDocRef = doc(db, 'users', user.uid);

       try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const currentSettings = userDoc.exists() ? userDoc.data().appSettings || { paymentLink: '' } : { paymentLink: '' };
            const finalSettings = typeof updatedSettings === 'function' ? updatedSettings(currentSettings) : updatedSettings;
            transaction.set(userDocRef, { appSettings: finalSettings }, { merge: true });
        });
      } catch (e) {
        console.error("Transaction failed: ", e);
      }
  };

  // Firebase auth listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firebase data listener for all user data
  useEffect(() => {
    if (!user || isGuestMode || !isFirebaseConfigured) {
      setFirebaseCustomers([]);
      setFirebaseAppSettings({ paymentLink: '' });
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirebaseCustomers(data.customers || []);
        setFirebaseAppSettings(data.appSettings || { paymentLink: '' });
      } else {
        setDoc(userDocRef, { customers: [], appSettings: { paymentLink: '' } }, { merge: true });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isGuestMode]);
  
  const forceReminderGeneration = useCallback(() => {
    if (customers.length > 0) {
      const newReminders = generateDailyReminders(customers, appSettings);
      setDailyReminders(newReminders);
      // Also update the generated date to prevent re-triggering on the same day if app reloads
      const today = new Date().toISOString().split('T')[0];
      setRemindersLastGenerated(today);
    }
  }, [customers, appSettings, setDailyReminders, setRemindersLastGenerated]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSignOut = async () => {
    // Fix: Clear user-specific local storage on sign out to prevent data leakage.
    localStorage.removeItem('ro-track-daily-reminders');
    localStorage.removeItem('ro-track-reminders-last-generated');
    setDailyReminders([]); // Clear in-memory state as well

    if (isGuestMode) {
      setIsGuestMode(false);
    } else if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    }
  };
  
  const dismissReminder = useCallback((reminderId: string) => {
    setDailyReminders(prevReminders => 
        prevReminders.filter(r => r.id !== reminderId)
    );
  }, [setDailyReminders]);

  // Perf: Split context value into stable and dynamic parts to avoid re-rendering consumers unnecessarily.
  const stableContextValue = useMemo(() => ({
      setCustomers,
      setView,
      toggleTheme,
      setAppSettings,
      handleSignOut,
      dismissReminder,
      forceReminderGeneration,
      fetchMoreCustomers
  }), [setCustomers, setView, toggleTheme, setAppSettings, handleSignOut, dismissReminder, forceReminderGeneration, fetchMoreCustomers]);

  const contextValue = useMemo(() => ({
      ...stableContextValue,
      customers,
      view,
      theme,
      appSettings,
      user,
      isGuestMode,
      loading,
      dailyReminders,
      hasMoreCustomers
  }), [stableContextValue, customers, view, theme, appSettings, user, isGuestMode, loading, dailyReminders, hasMoreCustomers]);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-10 dark:text-white">Loading...</div>;
    }
    
    if (!user && !isGuestMode) {
        return <Login onGuestLogin={() => setIsGuestMode(true)} />;
    }

    switch (view.page) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <CustomerList />;
      case 'reminders':
        return <Reminders />;
      case 'profile':
        return <CustomerProfile customerId={view.customerId} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {!isFirebaseConfigured && <FirebaseWarningBanner />}
        {(user || isGuestMode) && !loading && <Header />}
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;