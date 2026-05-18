import React, { createContext, useEffect, useMemo, useState } from "react";

// Global app context
export const AppContext = createContext(null);

// Main provider component
export function AppProvider({ children }) {
  // Theme state
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("spark_theme") || "light";
    } catch {
      return "light";
    }
  });

  // Language state
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("spark_lang") || "en";
    } catch {
      return "en";
    }
  });

  // Save theme/language and update HTML attributes
  useEffect(() => {
    try {
      localStorage.setItem("spark_theme", theme);
      localStorage.setItem("spark_lang", lang);
    } catch {
      // ignore localStorage errors
    }

    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", lang);
    }
  }, [theme, lang]);

  // Theme toggle
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Language toggle
  const toggleLang = () => {
    setLang((prev) => (prev === "en" ? "ar" : "en"));
  };

  // Translation dictionary
  const DICT = useMemo(
    () => ({
      en: {
        theme: "Theme mode",
        language: "Language",
        resetPassword: "Reset Password",
        logout: "Logout",
        hi: "Hi",
        open: "Open",
        close: "Close",
        home: "Home",
        back: "Back",
        save: "Save",
        cancel: "Cancel",
        login: "Login",
        register: "Register",
        email: "Email",
        password: "Password",
        certificates: "Certificates",
        notifications: "Notifications",
        feedback: "Feedback",
        reports: "Reports",
        events: "Events",
        contact: "Contact",
        about: "About",
        heroTitleA: "Your ideas deserve a",
        heroTitleB: "safe space",
        heroTitleC: "to grow.",
        heroDesc: "SparkUp protects, supports, and elevates your innovation journey.",
        getStarted: "Get Started",
        menu: "Menu",
        adminLogin: "Admin Login",
        aboutUs: "About Us",
        contactUs: "Contact Us",
        reviewer: "Reviewer",
        funder: "Funder",
        innovator: "Innovator",
      },
      ar: {
        theme: "الوضع",
        language: "اللغة",
        resetPassword: "إعادة تعيين كلمة المرور",
        logout: "تسجيل الخروج",
        hi: "مرحباً",
        open: "فتح",
        close: "إغلاق",
        home: "الرئيسية",
        back: "رجوع",
        save: "حفظ",
        cancel: "إلغاء",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        certificates: "الشهادات",
        notifications: "الإشعارات",
        feedback: "التغذية الراجعة",
        reports: "التقارير",
        events: "الفعاليات",
        contact: "تواصل",
        about: "من نحن",
        heroTitleA: "أفكارك تستحق",
        heroTitleB: "مساحة آمنة",
        heroTitleC: "لتنمو.",
        heroDesc: "SparkUp يحمي ويدعم ويطور رحلتك الابتكارية.",
        getStarted: "ابدأ الآن",
        menu: "القائمة",
        adminLogin: "دخول الإدارة",
        aboutUs: "من نحن",
        contactUs: "تواصل معنا",
        reviewer: "مراجع",
        funder: "ممّول",
        innovator: "مبتكر",
      },
    }),
    []
  );

  // Translation function
  const t = useMemo(() => {
    return (key) => DICT[lang]?.[key] ?? key;
  }, [lang, DICT]);

  // Color palette
  const palette = useMemo(() => {
    const dark = theme === "dark";

    return {
      isDark: dark,
      bg: dark ? "#0b1220" : "linear-gradient(180deg, #F7FAFF 0%, #EEF6FF 100%)",
      surface: dark ? "#0f172a" : "#ffffff",
      surface2: dark ? "#111c33" : "rgba(234,244,255,0.9)",
      text: dark ? "#041028" : "#0f2e4d",
      muted: dark ? "#94a3b8" : "#3b5877",
      border: dark ? "rgba(148,163,184,0.22)" : "rgba(26,77,128,0.12)",
      btnBg: dark ? "#111c33" : "#ffffff",
    };
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        theme,
        lang,
        toggleTheme,
        toggleLang,
        t,
        palette,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}