import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { EmployeeBody, EmployeeUpdate } from "./employee.schema.js";

const include = {
  user: { select: { id: true, role: true, isActive: true } },
} as const;

type EmployeeWithUser = Prisma.EmployeeGetPayload<{ include: typeof include }>;

function fail(code: string): never {
  throw Object.assign(new Error(code), { code });
}

export class PrismaEmployeeStore {
  constructor(private readonly prisma: PrismaClient) {}

  private dto(employee: EmployeeWithUser, includeSalary = false) {
    const { user, salaryMinor, ...safeEmployee } = employee;
    return {
      ...safeEmployee,
      ...(includeSalary ? { salaryMinor } : {}),
      linkedUser: user,
    };
  }

  async list(input: {
    businessId: string;
    page: number;
    limit: number;
    search?: string | undefined;
    status?: string | undefined;
    position?: string | undefined;
    linkedUser?: boolean | undefined;
    sort: string;
    order: "asc" | "desc";
    selfUserId?: string | undefined;
    includeSalary?: boolean | undefined;
  }) {
    const where: Prisma.EmployeeWhereInput = {
      businessId: input.businessId,
      ...(input.selfUserId ? { userId: input.selfUserId } : {}),
      ...(input.status ? { status: input.status as "ACTIVE" | "INACTIVE" | "ON_LEAVE" } : {}),
      ...(input.position ? { position: { equals: input.position, mode: "insensitive" } } : {}),
      ...(input.linkedUser !== undefined
        ? input.linkedUser ? { userId: { not: null } } : { userId: null }
        : {}),
      ...(input.search
        ? { OR: [
            { firstName: { contains: input.search, mode: "insensitive" } },
            { lastName: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            { employeeNumber: { contains: input.search, mode: "insensitive" } },
            { position: { contains: input.search, mode: "insensitive" } },
          ] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.employee.findMany({
        where, include, orderBy: { [input.sort]: input.order },
        skip: (input.page - 1) * input.limit, take: input.limit,
      }),
      this.prisma.employee.count({ where }),
    ]);
    return { items: rows.map((employee) => this.dto(employee, input.includeSalary)), total };
  }

  async get(businessId: string, id: string, includeSalary = false) {
    const employee = await this.prisma.employee.findFirst({ where: { id, businessId }, include });
    return employee ? this.dto(employee, includeSalary) : null;
  }

  async create(businessId: string, input: EmployeeBody) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const employee = await this.prisma.employee.create({
          data: {
            businessId,
            employeeNumber: `EMP-${randomBytes(3).toString("hex").toUpperCase()}`,
            firstName: input.firstName, lastName: input.lastName,
            email: input.email ?? null, phone: input.phone ?? null, position: input.position,
            salaryMinor: input.salaryMinor ?? null, status: input.status,
            hiredAt: input.hiredAt ? new Date(`${input.hiredAt}T00:00:00Z`) : null,
            notes: input.notes ?? null,
          },
          include,
        });
        return this.dto(employee, true);
      } catch (error) {
        if (!(typeof error === "object" && error && "code" in error && error.code === "P2002")) throw error;
      }
    }
    fail("EMPLOYEE_NUMBER_CONFLICT");
  }

  async update(businessId: string, id: string, input: EmployeeUpdate, includeSalary = false) {
    const data: Prisma.EmployeeUpdateManyMutationInput = {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.salaryMinor !== undefined ? { salaryMinor: input.salaryMinor } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.hiredAt !== undefined ? { hiredAt: input.hiredAt ? new Date(`${input.hiredAt}T00:00:00Z`) : null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
    const changed = await this.prisma.employee.updateMany({ where: { id, businessId }, data });
    return changed.count ? this.get(businessId, id, includeSalary) : null;
  }

  async deactivate(businessId: string, id: string, includeSalary = false) {
    const changed = await this.prisma.employee.updateMany({
      where: { id, businessId }, data: { status: "INACTIVE" },
    });
    return changed.count ? this.get(businessId, id, includeSalary) : null;
  }

  async users(businessId: string, unlinked: boolean) {
    return this.prisma.user.findMany({
      where: { businessId, ...(unlinked ? { employee: null } : {}) },
      select: { id: true, role: true, isActive: true, employee: { select: { id: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async link(businessId: string, employeeId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({ where: { id: employeeId, businessId } });
      if (!employee) fail("EMPLOYEE_NOT_FOUND");
      if (employee.userId) fail("EMPLOYEE_ALREADY_LINKED");
      const user = await tx.user.findFirst({ where: { id: userId, businessId }, include: { employee: true } });
      if (!user) fail("USER_NOT_FOUND");
      if (user.employee) fail("USER_ALREADY_LINKED");
      await tx.employee.update({ where: { id: employeeId }, data: { userId } });
      return this.get(businessId, employeeId, true);
    }, { isolationLevel: "Serializable" });
  }

  async unlink(businessId: string, employeeId: string) {
    const changed = await this.prisma.employee.updateMany({
      where: { id: employeeId, businessId }, data: { userId: null },
    });
    if (!changed.count) fail("EMPLOYEE_NOT_FOUND");
    return this.get(businessId, employeeId, true);
  }

  async role(businessId: string, userId: string, role: "ADMIN" | "MANAGER" | "EMPLOYEE") {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", `${businessId}:admins`);
      const user = await tx.user.findFirst({ where: { id: userId, businessId } });
      if (!user) fail("USER_NOT_FOUND");
      if (user.role === "ADMIN" && role !== "ADMIN" && await tx.user.count({ where: { businessId, role: "ADMIN" } }) <= 1) fail("LAST_ADMIN_PROTECTED");
      return tx.user.update({ where: { id: userId }, data: { role }, select: { id: true, role: true, isActive: true } });
    }, { isolationLevel: "Serializable" });
  }

  async access(businessId: string, userId: string, isActive: boolean) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", `${businessId}:admins`);
      const user = await tx.user.findFirst({ where: { id: userId, businessId } });
      if (!user) fail("USER_NOT_FOUND");
      if (!isActive && user.role === "ADMIN" && user.isActive && await tx.user.count({ where: { businessId, role: "ADMIN", isActive: true } }) <= 1) fail("LAST_ADMIN_PROTECTED");
      return tx.user.update({ where: { id: userId }, data: { isActive }, select: { id: true, role: true, isActive: true } });
    }, { isolationLevel: "Serializable" });
  }
}
