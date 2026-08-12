export type UserRole="ADMIN"|"MANAGER"|"EMPLOYEE";
export type SaleItemInput={type:"PRODUCT";productId:string;quantity:number}|{type:"SERVICE";serviceId:string;quantity:number;unitPriceOverrideMinor?:number|undefined};
export interface SaleWriteInput{businessId:string;actorId:string;role:UserRole;customerId?:string|null|undefined;bookingId?:string|null|undefined;items:SaleItemInput[];discountMinor:number}
export interface SaleListInput{businessId:string;page:number;limit:number;search?:string|undefined;status?:"DRAFT"|"COMPLETED"|"CANCELLED"|undefined;customerId?:string|undefined;bookingId?:string|undefined;dateFrom?:Date|undefined;dateTo?:Date|undefined;sort:"createdAt"|"soldAt"|"totalMinor"|"saleNumber";order:"asc"|"desc"}
