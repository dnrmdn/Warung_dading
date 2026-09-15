import 'server-only';

import { prisma } from '@/lib/prisma';
import { Supplier, CreateSupplierInput, UpdateSupplierInput } from '@/types/warung';
import { Prisma } from '@prisma/client';

// ─── Domain Errors ───────────────────────────────────────────────────────────

export class SupplierValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupplierValidationError';
  }
}

export class SupplierNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupplierNotFoundError';
  }
}

export class SupplierDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupplierDuplicateError';
  }
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export interface GetSuppliersFilter {
  activeOnly?: boolean; // default true
}

// ─── Type Converters / Mappers ───────────────────────────────────────────────

type PrismaSupplier = Prisma.SupplierGetPayload<Record<string, never>>;

function toDomainSupplier(s: PrismaSupplier): Supplier {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone ?? undefined,
    address: s.address ?? undefined,
    note: s.note ?? undefined,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// ─── Query Operations ────────────────────────────────────────────────────────

/**
 * Retrieves suppliers, filtered by active status (default: active only).
 * Sorted alphabetically by name.
 */
export async function getSuppliers(filter?: GetSuppliersFilter): Promise<Supplier[]> {
  const activeOnly = filter?.activeOnly ?? true;

  const where: Prisma.SupplierWhereInput = {};
  if (activeOnly) {
    where.isActive = true;
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return suppliers.map(toDomainSupplier);
}

/**
 * Retrieves a single supplier by ID.
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
  });

  return supplier ? toDomainSupplier(supplier) : null;
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

/**
 * Creates a new supplier with duplicate name validation.
 */
export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const name = input.name?.trim();
  if (!name) {
    throw new SupplierValidationError('Nama supplier wajib diisi.');
  }

  // Check for duplicate name
  const existing = await prisma.supplier.findUnique({
    where: { name },
  });
  if (existing) {
    throw new SupplierDuplicateError(`Supplier dengan nama "${name}" sudah terdaftar.`);
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      note: input.note?.trim() || null,
    },
  });

  return toDomainSupplier(supplier);
}

/**
 * Partially updates a supplier.
 */
export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new SupplierNotFoundError(`Supplier dengan ID "${id}" tidak ditemukan.`);
  }

  const data: Prisma.SupplierUpdateInput = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new SupplierValidationError('Nama supplier tidak boleh kosong.');
    }
    // Check for duplicate name (excluding current record)
    const duplicate = await prisma.supplier.findFirst({
      where: { name, id: { not: id } },
    });
    if (duplicate) {
      throw new SupplierDuplicateError(`Supplier dengan nama "${name}" sudah terdaftar.`);
    }
    data.name = name;
  }

  if (input.phone !== undefined) {
    data.phone = input.phone.trim() || null;
  }

  if (input.address !== undefined) {
    data.address = input.address.trim() || null;
  }

  if (input.note !== undefined) {
    data.note = input.note.trim() || null;
  }

  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data,
  });

  return toDomainSupplier(supplier);
}

/**
 * Toggles a supplier's active status (soft-archive).
 */
export async function toggleSupplierActive(id: string): Promise<Supplier> {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new SupplierNotFoundError(`Supplier dengan ID "${id}" tidak ditemukan.`);
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return toDomainSupplier(supplier);
}
