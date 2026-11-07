import type { Database } from "@/types/database";

export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type AdminStatus = Database["public"]["Enums"]["admin_status"];

export const ROLE_RANK: Record<AdminRole, number> = {
  editor: 1,
  administrator: 2,
  owner: 3,
};

/** True when `role` is at least as privileged as `required`. */
export function roleAtLeast(role: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Owner · Super Admin",
  administrator: "Administrator",
  editor: "Editor",
};
