import type { FastifyInstance } from "fastify";
import type { z } from "zod";
import type { AuthProvider } from "../../shared/auth/auth-provider.js";
import type { DataStore } from "../../database/data-store.js";
import { requireApplicationUser } from "../../shared/application-user/require-application-user.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { BookingStore } from "../bookings/booking.types.js";
import { customerIdParamsSchema, customerListQuerySchema } from "../bookings/booking.schema.js";
function parse<T>(schema:z.ZodType<T>,input:unknown){const result=schema.safeParse(input);if(!result.success)throw new AppError(400,"VALIDATION_ERROR","The request is invalid.");return result.data;}
export function registerCustomerRoutes(app:FastifyInstance,authProvider:AuthProvider,dataStore:DataStore,store:BookingStore){app.get("/api/v1/customers",async request=>{const user=await requireApplicationUser(request,authProvider,dataStore);const input=parse(customerListQuerySchema,request.query);return {...await store.listCustomers({businessId:user.businessId,page:input.page,limit:input.limit,...(input.search?{search:input.search}:{})}),page:input.page,limit:input.limit};});app.get("/api/v1/customers/:customerId",async request=>{const user=await requireApplicationUser(request,authProvider,dataStore);const {customerId}=parse(customerIdParamsSchema,request.params);const customer=await store.findCustomer(user.businessId,customerId);if(!customer)throw new AppError(404,"CUSTOMER_NOT_FOUND","Customer not found.");return customer;});app.get("/api/v1/customers/:customerId/vehicles",async request=>{const user=await requireApplicationUser(request,authProvider,dataStore);const {customerId}=parse(customerIdParamsSchema,request.params);const customer=await store.findCustomer(user.businessId,customerId);if(!customer)throw new AppError(404,"CUSTOMER_NOT_FOUND","Customer not found.");return store.listCustomerVehicles(user.businessId,customerId);});}
