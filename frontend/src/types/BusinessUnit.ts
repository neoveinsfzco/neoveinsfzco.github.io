// src/types/BusinessUnit.ts

export interface BusinessUnit {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}
