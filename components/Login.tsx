import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebaseConfig';

interface LoginProps {
  onGuestLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onGuestLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);


  const handleGoogleSignIn = async () => {
    setError('');
    try {
      if (!isFirebaseConfigured) {
        setError('Firebase is not configured. Please add your API keys to firebaseConfig.ts');
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setError(error.message);
      console.error("Error during Google sign-in:", error);
    }
  };
  
  const handleGuestSignIn = () => {
    setError('');
    onGuestLogin();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please add your API keys to firebaseConfig.ts');
      return;
    }

    try {
        if(isRegistering) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error: any) {
        let friendlyError = "An error occurred. Please try again.";
        if (error.code === 'auth/user-not-found') {
            friendlyError = "No account found with this email. Please register first.";
        } else if (error.code === 'auth/wrong-password') {
            friendlyError = "Incorrect password. Please try again.";
        } else if (error.code === 'auth/email-already-in-use') {
            friendlyError = "An account with this email already exists. Please sign in.";
        } else if (error.code === 'auth/weak-password') {
            friendlyError = "The password must be at least 6 characters long.";
        }
        setError(friendlyError);
        console.error("Error with email auth:", error);
    }
  };
  
  const mainLoginView = (
      <>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Welcome!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Sign in to sync your data across devices.</p>
        <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M24 9.5c3.2 0 6.1 1.1 8.4 3.2l6.3-6.3C34.9 2.5 29.8 0 24 0 14.9 0 7.3 5.4 3 13.2l7.7 6C12.5 13.2 17.8 9.5 24 9.5z"></path>
                  <path fill="#34A853" d="M46.5 24.5c0-1.7-.2-3.4-.5-5H24v9.3h12.9c-.6 3-2.3 5.6-4.9 7.3l7.4 5.7c4.3-4 6.6-10.1 6.6-17.3z"></path>
                  <path fill="#FBBC05" d="M10.7 28.5c-.3-.9-.5-1.9-.5-2.9s.2-2 .5-2.9l-7.7-6C1.2 19.5 0 22.1 0 25s1.2 5.5 3 7.4l7.7-6z"></path>
                  <path fill="#EA4335" d="M24 48c5.8 0 10.9-1.9 14.5-5.2l-7.4-5.7c-1.9 1.3-4.4 2.1-7.1 2.1-6.2 0-11.5-3.7-13.4-8.8l-7.7 6C7.3 42.6 14.9 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              Sign in with Google
            </button>
            <button onClick={() => setShowEmailForm(true)} className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                Sign in with Email
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Or</span></div>
            </div>
            <button onClick={handleGuestSignIn} className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                Continue as Guest (Data is not synced)
            </button>
        </div>
      </>
  );
  
  const emailFormView = (
      <>
        <button onClick={() => setShowEmailForm(false)} className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-4">&larr; Back to login options</button>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">{isRegistering ? 'Create an Account' : 'Sign In'}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Using your email and password.</p>
        <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <button type="submit" className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm bg-primary-600 text-sm font-medium text-white hover:bg-primary-700">
                {isRegistering ? 'Register' : 'Sign In'}
            </button>
            <p className="text-sm text-center">
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                    {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                </button>
            </p>
        </form>
      </>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
         <div className="flex items-center justify-center mb-6">
            <svg className="h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="ml-3 text-4xl font-bold text-gray-800 dark:text-white">RO-Track</span>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</div>}

        {showEmailForm ? emailFormView : mainLoginView}
      </div>
    </div>
  );
};

export default Login;