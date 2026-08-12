const en = {
  common: {
    appName: "Business MS",
    dashboard: "Dashboard",
    bookings: "Bookings",
    employees: "Employees",
    products: "Products",
    customers: "Customers",
    sales: "Sales",
    reports: "Reports",
    settings: "Settings",
    goToWebsite: "Go to Website",
    search: "Search",
    filter: "Filter",
    sortBy: "Sort by",
    loading: "Loading...",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    back: "Back",
    all: "All",
  },

  navbar: {
    dashboard: "Dashboard",
    bookings: "Bookings",
    employees: "Employees",
    products: "Products",
    customers: "Customers",
    sales: "Sales",
    reports: "Reports",
    language: "Language",
    theme: "Theme",
    signIn: "Sign In",
    signOut: "Sign Out",
  },

  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your Business Management System",

    welcome: "Welcome to the Business Management System",

    employees: "Employees",
    products: "Products",
    customers: "Customers",
    sales: "Sales",

    totalEmployees: "Total Employees",
    totalProducts: "Total Products",
    totalCustomers: "Total Customers",
    totalSales: "Total Sales",

    sale: "Sale",
    completed: "completed",

    salesSummary: "Sales Summary",
    totalRevenue: "Total Revenue",
    recentActivity: "Recent Activity",
    noRecentActivity: "No recent activity.",
  },

  employees: {
    title: "Employees",
    searchPlaceholder: "Search employees...",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    position: "Position",
    salary: "Salary",
    addEmployee: "Add Employee",
    editEmployee: "Edit Employee",
    deleteEmployee: "Delete Employee",
    noEmployees: "No employees found.",
  },

  products: {
    title: "Products",
    searchPlaceholder: "Search products...",
    name: "Name",
    description: "Description",
    category: "Category",
    price: "Price",
    stock: "Stock",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete Product",
    noProducts: "No products found.",
  },

  customers: {
    title: "Customers",
    searchPlaceholder: "Search customers...",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    addCustomer: "Add Customer",
    editCustomer: "Edit Customer",
    deleteCustomer: "Delete Customer",
    noCustomers: "No customers found.",
  },

  sales: {
    title: "Sales",
    searchPlaceholder: "Search sales...",
    customer: "Customer",
    product: "Product",
    quantity: "Quantity",
    total: "Total",
    date: "Date",
    addSale: "Add Sale",
    editSale: "Edit Sale",
    deleteSale: "Delete Sale",
    noSales: "No sales found.",
  },

  reports: {
    title: "Reports",
    overview: "Overview",
  },
  public: {
    nav: {
      home: "Home",
      services: "Services",
      about: "About Us",
      contact: "Contact",
      booking: "Book an Appointment",
      myBooking: "My booking",
    },

    footer: {
      description:
        "Professional vehicle detailing, cleaning, polishing, wrapping, window tinting and underbody protection.",
      links: "Quick Links",
      contact: "Contact",
      rights: "All rights reserved.",
    },
  },

  settings: {
    title: "Settings",
    appearance: "Appearance",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
  },
} as const;

export default en;
