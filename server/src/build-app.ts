import cors from "@fastify/cors";
import Fastify from "fastify";

import type { ServerEnvironment } from "./config/env.js";
import type { DataStore } from "./database/data-store.js";
import { PrismaDataStore } from "./database/prisma.js";
import type { AuthProvider } from "./shared/auth/auth-provider.js";
import { registerClerkAuthentication } from "./plugins/auth.plugin.js";
import { registerErrorHandling } from "./plugins/error-handler.plugin.js";
import { registerHealthRoute } from "./modules/health/health.route.js";
import { registerIdentityRoutes } from "./modules/identity/identity.route.js";
import { registerAdminServiceRoutes, registerPublicServiceRoutes } from "./modules/services/service.route.js";
import type { BookingStore } from "./modules/bookings/booking.types.js";
import { PrismaBookingStore } from "./modules/bookings/prisma-booking.store.js";
import { registerAdminBookingRoutes, registerPublicBookingRoutes } from "./modules/bookings/booking.route.js";
import { registerCustomerRoutes } from "./modules/customers/customer.route.js";
import type { ProductStore } from "./modules/products/product.types.js";
import { PrismaProductStore } from "./modules/products/prisma-product.store.js";
import { registerProductRoutes } from "./modules/products/product.route.js";
import { PrismaSaleStore } from "./modules/sales/prisma-sale.store.js";
import { registerSaleRoutes } from "./modules/sales/sale.route.js";
import { PrismaEmployeeStore } from "./modules/employees/prisma-employee.store.js";
import { registerEmployeeRoutes } from "./modules/employees/employee.route.js";
import { PrismaReportStore } from "./modules/reports/prisma-report.store.js";
import { registerReportRoutes } from "./modules/reports/report.route.js";
import type { ReportStore } from "./modules/reports/report.types.js";
import { PrismaSettingsStore } from "./modules/settings/prisma-settings.store.js";
import { registerSettingsRoutes } from "./modules/settings/settings.route.js";

export interface BuildAppOptions {
  environment: ServerEnvironment;
  authProvider?: AuthProvider;
  dataStore?: DataStore;
  bookingStore?: BookingStore;
  productStore?: ProductStore;
  reportStore?: ReportStore;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions) {
  const dataStore = options.dataStore ?? new PrismaDataStore(options.environment.DATABASE_URL);
  const bookingStore = options.bookingStore ??
    (dataStore instanceof PrismaDataStore ? new PrismaBookingStore(dataStore.client) : undefined);
  const productStore = options.productStore ??
    (dataStore instanceof PrismaDataStore ? new PrismaProductStore(dataStore.client) : undefined);
  const saleStore = dataStore instanceof PrismaDataStore ? new PrismaSaleStore(dataStore.client) : undefined;
  const employeeStore = dataStore instanceof PrismaDataStore ? new PrismaEmployeeStore(dataStore.client) : undefined;
  const reportStore = options.reportStore ?? (dataStore instanceof PrismaDataStore ? new PrismaReportStore(dataStore.client) : undefined);
  const settingsStore = dataStore instanceof PrismaDataStore ? new PrismaSettingsStore(dataStore.client) : undefined;
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            level: options.environment.LOG_LEVEL,
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "req.headers['x-clerk-auth-message']",
                "req.headers['x-clerk-auth-reason']",
              ],
              censor: "[REDACTED]",
            },
          },
  });

  registerErrorHandling(app);

  if (!options.dataStore) {
    app.addHook("onClose", () => dataStore.disconnect());
  }

  await app.register(cors, {
    origin: options.environment.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  });

  registerHealthRoute(app);
  registerPublicServiceRoutes(app, dataStore);
  if (bookingStore) registerPublicBookingRoutes(app, bookingStore);

  if (options.authProvider) {
    registerIdentityRoutes(app, options.authProvider, dataStore);
    registerAdminServiceRoutes(app, options.authProvider, dataStore);
    if (productStore) registerProductRoutes(app, options.authProvider, dataStore, productStore);
    if (saleStore) registerSaleRoutes(app, options.authProvider, dataStore, saleStore);
    if (employeeStore) registerEmployeeRoutes(app, options.authProvider, dataStore, employeeStore);
    if (reportStore) registerReportRoutes(app, options.authProvider, dataStore, reportStore);
    if (settingsStore) registerSettingsRoutes(app, options.authProvider, dataStore, settingsStore);
    if (bookingStore) {
      registerAdminBookingRoutes(app, options.authProvider, dataStore, bookingStore);
      registerCustomerRoutes(app, options.authProvider, dataStore, bookingStore);
    }
  } else {
    await app.register(async (protectedRoutes) => {
      const authProvider = await registerClerkAuthentication(
        protectedRoutes,
        options.environment,
      );

      registerIdentityRoutes(protectedRoutes, authProvider, dataStore);
      registerAdminServiceRoutes(protectedRoutes, authProvider, dataStore);
      if (productStore) registerProductRoutes(protectedRoutes, authProvider, dataStore, productStore);
      if (saleStore) registerSaleRoutes(protectedRoutes, authProvider, dataStore, saleStore);
      if (employeeStore) registerEmployeeRoutes(protectedRoutes, authProvider, dataStore, employeeStore);
      if (reportStore) registerReportRoutes(protectedRoutes, authProvider, dataStore, reportStore);
      if (settingsStore) registerSettingsRoutes(protectedRoutes, authProvider, dataStore, settingsStore);
      if (bookingStore) {
        registerAdminBookingRoutes(protectedRoutes, authProvider, dataStore, bookingStore);
        registerCustomerRoutes(protectedRoutes, authProvider, dataStore, bookingStore);
      }
    });
  }

  return app;
}
