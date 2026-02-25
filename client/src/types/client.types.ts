export type ClientType = "FINAL" | "REVENDEDOR";

export interface Client {
  id: string;
  name: string;
  type: ClientType;

  phone?: string | null;
  address?: string | null;

  dni?: string | null;
  cuit?: string | null;
  email?: string | null;

  isActive: boolean;
}
