import type { AdminRoleName } from "@prisma/client";
import { PERMISSIONS } from "@/lib/platform/rbac";

export type AdminPersonaId =
  | "owner"
  | "manager"
  | "floor"
  | "cash"
  | "support"
  | "employee";

export type ChartTier = "full" | "limited" | "none";

export type AdminPersona = {
  id: AdminPersonaId;
  label: string;
  tagline: string;
  chartTier: ChartTier;
  /** Primary nav items for this role */
  nav: Array<{ href: string; label: string }>;
  showArenaGrid: boolean;
  showBookingTable: boolean;
  showReportsLink: boolean;
  showExecutiveKpis: boolean;
  showFinanceDeepDive: boolean;
  showOperationsPanel: boolean;
  showWalkInPos: boolean;
  showStaffSchedulingStub: boolean;
  showApprovalsStub: boolean;
  showSupportTicketsStub: boolean;
  showIncidentLogStub: boolean;
  showCalendarStrip: boolean;
  showEmployeeClockStub: boolean;
};

const STAFF = { href: "/platform/admin/staff", label: "Staff & schedule" };
const CAL = { href: "/platform/admin/calendar", label: "Calendar" };
const OPS = { href: "/platform/admin/operations", label: "Operations" };
const SYS = { href: "/platform/admin/settings", label: "System" };

function perm(role: AdminRoleName) {
  return PERMISSIONS[
    role === "OWNER"
      ? "owner"
      : role === "STORE_MANAGER"
        ? "storeManager"
        : role === "EMPLOYEE"
          ? "employee"
          : role === "FLOOR_SUPERVISOR"
            ? "floorSupervisor"
            : role === "CASH_POS_USER"
              ? "cashPosUser"
              : "adminSupport"
  ];
}

export function personaForRole(role: AdminRoleName): AdminPersona {
  const p = perm(role);
  const reports = p.reporting;
  const finances = p.finances;
  const resOps = p.reservationOps;

  if (role === "OWNER") {
    return {
      id: "owner",
      label: "Owner",
      tagline: "Strategic oversight, configuration, and executive KPIs across all arenas.",
      chartTier: "full",
      nav: [
        { href: "/platform/admin", label: "Dashboard" },
        STAFF,
        CAL,
        OPS,
        { href: "/platform/admin/reports", label: "Reports & export" },
        SYS,
      ],
      showArenaGrid: true,
      showBookingTable: true,
      showReportsLink: true,
      showExecutiveKpis: true,
      showFinanceDeepDive: true,
      showOperationsPanel: true,
      showWalkInPos: true,
      showStaffSchedulingStub: false,
      showApprovalsStub: false,
      showSupportTicketsStub: false,
      showIncidentLogStub: false,
      showCalendarStrip: true,
      showEmployeeClockStub: false,
    };
  }

  if (role === "STORE_MANAGER") {
    return {
      id: "manager",
      label: "Manager",
      tagline: "Day-to-day operations, staffing view, and arena performance.",
      chartTier: "full",
      nav: [
        { href: "/platform/admin", label: "Dashboard" },
        STAFF,
        CAL,
        OPS,
        ...(reports ? [{ href: "/platform/admin/reports", label: "Reports" }] : []),
      ],
      showArenaGrid: true,
      showBookingTable: true,
      showReportsLink: reports,
      showExecutiveKpis: true,
      showFinanceDeepDive: finances,
      showOperationsPanel: resOps,
      showWalkInPos: resOps,
      showStaffSchedulingStub: false,
      showApprovalsStub: false,
      showSupportTicketsStub: false,
      showIncidentLogStub: false,
      showCalendarStrip: true,
      showEmployeeClockStub: false,
    };
  }

  if (role === "FLOOR_SUPERVISOR") {
    return {
      id: "floor",
      label: "Floor",
      tagline: "Live arena status, check-in, and floor operations.",
      chartTier: "limited",
      nav: [
        { href: "/platform/admin", label: "Floor console" },
        STAFF,
        CAL,
        OPS,
      ],
      showArenaGrid: true,
      showBookingTable: true,
      showReportsLink: false,
      showExecutiveKpis: false,
      showFinanceDeepDive: false,
      showOperationsPanel: true,
      showWalkInPos: false,
      showStaffSchedulingStub: false,
      showApprovalsStub: false,
      showSupportTicketsStub: false,
      showIncidentLogStub: false,
      showCalendarStrip: true,
      showEmployeeClockStub: false,
    };
  }

  if (role === "CASH_POS_USER") {
    return {
      id: "cash",
      label: "Cash / POS",
      tagline: "Payments, walk-ins, and shift financial summary.",
      chartTier: "limited",
      nav: [
        { href: "/platform/admin", label: "POS console" },
        STAFF,
        CAL,
        OPS,
        ...(finances || reports ? [{ href: "/platform/admin/reports", label: "Shift reports" }] : []),
      ],
      showArenaGrid: true,
      showBookingTable: true,
      showReportsLink: finances || reports,
      showExecutiveKpis: false,
      showFinanceDeepDive: finances,
      showOperationsPanel: true,
      showWalkInPos: true,
      showStaffSchedulingStub: false,
      showApprovalsStub: false,
      showSupportTicketsStub: false,
      showIncidentLogStub: false,
      showCalendarStrip: true,
      showEmployeeClockStub: false,
    };
  }

  if (role === "ADMIN_SUPPORT") {
    return {
      id: "support",
      label: "Support",
      tagline: "Customer bookings, service adjustments, and operational signals.",
      chartTier: "limited",
      nav: [
        { href: "/platform/admin", label: "Support desk" },
        STAFF,
        CAL,
        OPS,
        ...(reports ? [{ href: "/platform/admin/reports", label: "Analytics" }] : []),
      ],
      showArenaGrid: true,
      showBookingTable: true,
      showReportsLink: reports,
      showExecutiveKpis: false,
      showFinanceDeepDive: false,
      showOperationsPanel: true,
      showWalkInPos: false,
      showStaffSchedulingStub: false,
      showApprovalsStub: false,
      showSupportTicketsStub: false,
      showIncidentLogStub: false,
      showCalendarStrip: true,
      showEmployeeClockStub: false,
    };
  }

  /* EMPLOYEE */
  return {
    id: "employee",
    label: "Employee",
    tagline: "Your shift, assigned arenas, and read-only booking visibility.",
    chartTier: "none",
    nav: [
      { href: "/platform/admin", label: "My shift" },
      STAFF,
      CAL,
      OPS,
    ],
    showArenaGrid: true,
    showBookingTable: true,
    showReportsLink: false,
    showExecutiveKpis: false,
    showFinanceDeepDive: false,
    showOperationsPanel: false,
    showWalkInPos: false,
    showStaffSchedulingStub: false,
    showApprovalsStub: false,
    showSupportTicketsStub: false,
    showIncidentLogStub: false,
    showCalendarStrip: true,
    showEmployeeClockStub: false,
  };
}

export function displayRoleName(role: AdminRoleName): string {
  return personaForRole(role).label;
}
