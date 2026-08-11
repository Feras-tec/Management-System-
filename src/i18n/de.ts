const de = {
  common: {
    appName: "Business MS",
    dashboard: "Dashboard",
    employees: "Mitarbeiter",
    products: "Produkte",
    customers: "Kunden",
    sales: "Verkäufe",
    reports: "Berichte",
    settings: "Einstellungen",
    search: "Suchen",
    filter: "Filter",
    sortBy: "Sortieren nach",
    loading: "Wird geladen...",
    cancel: "Abbrechen",
    save: "Speichern",
    create: "Erstellen",
    edit: "Bearbeiten",
    delete: "Löschen",
    close: "Schließen",
    back: "Zurück",
    all: "Alle",
  },

  navbar: {
    dashboard: "Dashboard",
    employees: "Mitarbeiter",
    products: "Produkte",
    customers: "Kunden",
    sales: "Verkäufe",
    reports: "Berichte",
    language: "Sprache",
    theme: "Design",
  },

  dashboard: {
    title: "Dashboard",
    subtitle: "Übersicht über Ihr Business Management System",

    welcome: "Willkommen im Business Management System",

    employees: "Mitarbeiter",
    products: "Produkte",
    customers: "Kunden",
    sales: "Verkäufe",

    totalEmployees: "Mitarbeiter insgesamt",
    totalProducts: "Produkte insgesamt",
    totalCustomers: "Kunden insgesamt",
    totalSales: "Verkäufe insgesamt",

    sale: "Verkauf",
    completed: "abgeschlossen",

    salesSummary: "Verkaufsübersicht",
    totalRevenue: "Gesamtumsatz",
    recentActivity: "Letzte Aktivitäten",
    noRecentActivity: "Keine aktuellen Aktivitäten.",
  },

  employees: {
    title: "Mitarbeiter",
    searchPlaceholder: "Mitarbeiter suchen...",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    position: "Position",
    salary: "Gehalt",
    addEmployee: "Mitarbeiter hinzufügen",
    editEmployee: "Mitarbeiter bearbeiten",
    deleteEmployee: "Mitarbeiter löschen",
    noEmployees: "Keine Mitarbeiter gefunden.",
  },

  products: {
    title: "Produkte",
    searchPlaceholder: "Produkte suchen...",
    name: "Name",
    description: "Beschreibung",
    category: "Kategorie",
    price: "Preis",
    stock: "Lagerbestand",
    addProduct: "Produkt hinzufügen",
    editProduct: "Produkt bearbeiten",
    deleteProduct: "Produkt löschen",
    noProducts: "Keine Produkte gefunden.",
  },

  customers: {
    title: "Kunden",
    searchPlaceholder: "Kunden suchen...",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    phone: "Telefon",
    company: "Unternehmen",
    addCustomer: "Kunden hinzufügen",
    editCustomer: "Kunden bearbeiten",
    deleteCustomer: "Kunden löschen",
    noCustomers: "Keine Kunden gefunden.",
  },

  sales: {
    title: "Verkäufe",
    searchPlaceholder: "Verkäufe suchen...",
    customer: "Kunde",
    product: "Produkt",
    quantity: "Menge",
    total: "Gesamt",
    date: "Datum",
    addSale: "Verkauf hinzufügen",
    editSale: "Verkauf bearbeiten",
    deleteSale: "Verkauf löschen",
    noSales: "Keine Verkäufe gefunden.",
  },

  reports: {
    title: "Berichte",
    overview: "Übersicht",
  },
  public: {
    nav: {
      home: "Startseite",
      services: "Leistungen",
      about: "Über uns",
      contact: "Kontakt",
      booking: "Termin buchen",
    },

    footer: {
      description:
        "Professionelle Fahrzeugpflege, Reinigung, Politur, Folierung, Scheibentönung und Unterbodenschutz.",
      links: "Schnellzugriff",
      contact: "Kontakt",
      rights: "Alle Rechte vorbehalten.",
    },
  },

  settings: {
    title: "Einstellungen",
    appearance: "Darstellung",
    language: "Sprache",
    theme: "Theme",
    light: "Hell",
    dark: "Dunkel",
  },
} as const;

export default de;
