"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Language = "en" | "es" | "fr" | "hi";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.portfolio": "Portfolio",
    "nav.learning": "Learning",
    "nav.expenses": "Expenses",
    "nav.income": "Income",
    "nav.budgets": "Budgets",
    "nav.goals": "Goals",
    "nav.bills": "Bills",
    "nav.credit": "Credit",
    "nav.twin": "AI Twin",
    "nav.fraud": "Fraud Shield",
    "nav.reports": "Reports",
    "nav.tax": "Tax Planner",
    "nav.documents": "Documents",
    "nav.settings": "Settings",
  },
  es: {
    "nav.home": "Inicio",
    "nav.dashboard": "Panel",
    "nav.portfolio": "Portafolio",
    "nav.learning": "Aprendizaje",
    "nav.expenses": "Gastos",
    "nav.income": "Ingresos",
    "nav.budgets": "Presupuestos",
    "nav.goals": "Metas",
    "nav.bills": "Facturas",
    "nav.credit": "Crédito",
    "nav.twin": "Gemelo IA",
    "nav.fraud": "Antifraude",
    "nav.reports": "Informes",
    "nav.tax": "Impuestos",
    "nav.documents": "Documentos",
    "nav.settings": "Ajustes",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.dashboard": "Tableau",
    "nav.portfolio": "Portefeuille",
    "nav.learning": "Apprentissage",
    "nav.expenses": "Dépenses",
    "nav.income": "Revenus",
    "nav.budgets": "Budgets",
    "nav.goals": "Objectifs",
    "nav.bills": "Factures",
    "nav.credit": "Crédit",
    "nav.twin": "Jumeau IA",
    "nav.fraud": "Anti-Fraude",
    "nav.reports": "Rapports",
    "nav.tax": "Impôts",
    "nav.documents": "Documents",
    "nav.settings": "Paramètres",
  },
  hi: {
    "nav.home": "मुख्य पृष्ठ",
    "nav.dashboard": "डैशबोर्ड",
    "nav.portfolio": "पोर्टफोलियो",
    "nav.learning": "सीखना",
    "nav.expenses": "खर्चे",
    "nav.income": "आय",
    "nav.budgets": "बजट",
    "nav.goals": "लक्ष्य",
    "nav.bills": "बिल",
    "nav.credit": "क्रेडिट",
    "nav.twin": "एआई ट्विन",
    "nav.fraud": "धोखाधड़ी ढाल",
    "nav.reports": "रिपोर्ट",
    "nav.tax": "कर योजना",
    "nav.documents": "दस्तावेज़",
    "nav.settings": "सेटिंग्स",
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("vaultiq-language");
    if (saved) {
      setLanguageState(saved as Language);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (mounted) {
      localStorage.setItem("vaultiq-language", lang);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
