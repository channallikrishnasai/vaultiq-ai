import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface LocaleContextProps {
  locale: string;
  setLocale: (loc: string) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

// Minimal translation dictionaries – extend as needed
const dictionaries: Record<string, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.portfolio': 'Portfolio',
    'nav.learning': 'Learning',
    'nav.expenses': 'Expenses',
    'nav.income': 'Income',
    'nav.budgets': 'Budgets',
    'nav.goals': 'Goals',
    'nav.bills': 'Bills',
    'nav.credit': 'Credit',
    'nav.aiTwin': 'AI Twin',
    'nav.fraud': 'Fraud Shield',
    'nav.reports': 'Reports',
    'nav.tax': 'Tax Planner',
    'nav.documents': 'Documents',
    'nav.settings': 'Settings'
  },
  hi: {
    'nav.home': 'होम',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.portfolio': 'पोर्टफ़ोलियो',
    'nav.learning': 'शिक्षा',
    'nav.expenses': 'खर्च',
    'nav.income': 'आय',
    'nav.budgets': 'बजट',
    'nav.goals': 'लक्ष्य',
    'nav.bills': 'बिल',
    'nav.credit': 'क्रेडिट',
    'nav.aiTwin': 'एआई ट्विन',
    'nav.fraud': 'धोखा शील्ड',
    'nav.reports': 'रिपोर्ट',
    'nav.tax': 'कर नियोजक',
    'nav.documents': 'दस्तावेज़',
    'nav.settings': 'सेटिंग्स'
  },
  te: {
    'nav.home': 'హోమ్',
    'nav.dashboard': 'డ్యాష్‌బోర్డ్',
    'nav.portfolio': 'పోర్ట్‌ఫోలియో',
    'nav.learning': 'లెర్నింగ్',
    'nav.expenses': 'ఖర్చులు',
    'nav.income': 'ఆదాయం'
  }
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('vaultiq-locale') : null;
  const [locale, setLocaleState] = useState<string>(stored || 'en');

  const setLocale = (loc: string) => {
    setLocaleState(loc);
    if (typeof window !== 'undefined') localStorage.setItem('vaultiq-locale', loc);
  };

  const t = (key: string) => {
    const dict = dictionaries[locale] ?? dictionaries['en'];
    return dict[key] ?? key;
  };

  // No side‑effects needed for now
  useEffect(() => {}, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
};
