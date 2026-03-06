import { useState, useEffect } from 'react';
import {
  onAuthChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  logOut,
} from '../services/auth.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    signIn: signInWithEmail,
    signUp: signUpWithEmail,
    signInWithGoogle,
    logOut,
  };
}
