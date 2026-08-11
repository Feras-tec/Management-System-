import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
export type Language = "de" | "en";

interface AppPreferencesState {
  theme: Theme;
  language: Language;
}

type AppPreferencesAction =
  | {
      type: "TOGGLE_THEME";
    }
  | {
      type: "SET_THEME";
      payload: Theme;
    }
  | {
      type: "SET_LANGUAGE";
      payload: Language;
    }
  | {
      type: "TOGGLE_LANGUAGE";
    };

interface AppPreferencesContextValue extends AppPreferencesState {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const AppPreferencesContext = createContext<
  AppPreferencesContextValue | undefined
>(undefined);

const getInitialState = (): AppPreferencesState => {
  const savedTheme = localStorage.getItem("theme");
  const savedLanguage = localStorage.getItem("language");

  const theme: Theme =
    savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";

  const language: Language =
    savedLanguage === "de" || savedLanguage === "en" ? savedLanguage : "de";

  return {
    theme,
    language,
  };
};

function appPreferencesReducer(
  state: AppPreferencesState,
  action: AppPreferencesAction,
): AppPreferencesState {
  switch (action.type) {
    case "TOGGLE_THEME":
      return {
        ...state,
        theme: state.theme === "light" ? "dark" : "light",
      };

    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };

    case "SET_LANGUAGE":
      return {
        ...state,
        language: action.payload,
      };

    case "TOGGLE_LANGUAGE":
      return {
        ...state,
        language: state.language === "de" ? "en" : "de",
      };

    default:
      return state;
  }
}

interface AppPreferencesProviderProps {
  children: ReactNode;
}

export function AppPreferencesProvider({
  children,
}: AppPreferencesProviderProps) {
  const [state, dispatch] = useReducer(
    appPreferencesReducer,
    undefined,
    getInitialState,
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);

    localStorage.setItem("theme", state.theme);
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem("language", state.language);
  }, [state.language]);

  const toggleTheme = () => {
    dispatch({
      type: "TOGGLE_THEME",
    });
  };

  const setTheme = (theme: Theme) => {
    dispatch({
      type: "SET_THEME",
      payload: theme,
    });
  };

  const setLanguage = (language: Language) => {
    dispatch({
      type: "SET_LANGUAGE",
      payload: language,
    });
  };

  const toggleLanguage = () => {
    dispatch({
      type: "TOGGLE_LANGUAGE",
    });
  };

  return (
    <AppPreferencesContext.Provider
      value={{
        theme: state.theme,
        language: state.language,
        toggleTheme,
        setTheme,
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error(
      "useAppPreferences must be used inside AppPreferencesProvider",
    );
  }

  return context;
}
