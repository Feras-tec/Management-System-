export type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export function bookingStatusLabel(status:BookingStatus,language:"de"|"en"){const de:Record<BookingStatus,string>={PENDING:"Ausstehend",CONFIRMED:"Bestätigt",IN_PROGRESS:"In Bearbeitung",COMPLETED:"Abgeschlossen",CANCELLED:"Storniert",NO_SHOW:"Nicht erschienen"};return language==="de"?de[status]:status.replace("_"," ")}
export type VehicleType = "SEDAN" | "SUV" | "HATCHBACK" | "VAN" | "COUPE" | "WAGON" | "OTHER";

export interface BookingSummary { id?: string; bookingNumber: string; status: BookingStatus; startsAt: string; endsAt?: string; timezone?: string; notes?: string | null; customer?: { firstName:string; lastName:string; email:string; phone:string }; vehicle?: { type:VehicleType }; vehicleType?: VehicleType; service:{ id?:string; nameDe:string; nameEn:string } }
export interface BookingList { items: BookingSummary[]; total:number; page:number; limit:number }
export interface CustomerList { items:Array<{id:string;firstName:string;lastName:string;email:string;phone:string;isActive:boolean;createdAt:string}>;total:number;page:number;limit:number }

const base=import.meta.env.VITE_API_BASE_URL;
function url(path:string){if(!base)throw new Error("Missing VITE_API_BASE_URL.");return new URL(path,base)}
async function json<T>(responseInput:Response|Promise<Response>):Promise<T>{const response=await responseInput;if(!response.ok){const body=await response.json().catch(()=>null) as {code?:string}|null;throw new Error(body?.code??`REQUEST_${response.status}`)}return response.json() as Promise<T>}
async function auth<T>(path:string,token:()=>Promise<string|null>,init?:RequestInit){const value=await token();if(!value)throw new Error("AUTH_REQUIRED");return json<T>(await fetch(url(path),{...init,headers:{"Content-Type":"application/json",Authorization:`Bearer ${value}`,...init?.headers}}))}
export const bookingApi={
 services:()=>json<Array<{id:string;slug:string;nameDe:string;nameEn:string;durationMinutes:number}>>(fetch(url("/api/v1/public/services"))),
 availability:(slug:string,date:string)=>json<{date:string;timezone:string;slots:Array<{time:string;available:true}>}>(fetch(url(`/api/v1/public/booking/availability?serviceSlug=${encodeURIComponent(slug)}&date=${date}`))),
 create:(body:unknown)=>json<BookingSummary>(fetch(url("/api/v1/public/bookings"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})),
 lookup:(body:{bookingNumber:string;email:string})=>json<BookingSummary>(fetch(url("/api/v1/public/bookings/lookup"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})),
 list:(token:()=>Promise<string|null>,query:string)=>auth<BookingList>(`/api/v1/bookings?${query}`,token),
 get:(token:()=>Promise<string|null>,id:string)=>auth<BookingSummary>("/api/v1/bookings/"+id,token),
 status:(token:()=>Promise<string|null>,id:string,status:BookingStatus)=>auth<BookingSummary>(`/api/v1/bookings/${id}/status`,token,{method:"PATCH",body:JSON.stringify({status})}),
 customers:(token:()=>Promise<string|null>,query:string)=>auth<CustomerList>(`/api/v1/customers?${query}`,token),
 customer:(token:()=>Promise<string|null>,id:string)=>auth<{id:string;firstName:string;lastName:string;email:string;phone:string;notes:string|null;isActive:boolean;createdAt:string;_count:{bookings:number}}>(`/api/v1/customers/${id}`,token),
 vehicles:(token:()=>Promise<string|null>,id:string)=>auth<Array<{id:string;type:VehicleType;brand:string|null;model:string|null;year:number|null;licensePlate:string|null;color:string|null}>>(`/api/v1/customers/${id}/vehicles`,token),
};
