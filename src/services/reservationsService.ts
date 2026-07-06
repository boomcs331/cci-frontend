import { apiFetch } from "@/utils/api";
import type { GenerateProductQrOrdersResponse } from "@/services/productionPlanQrService";
import type { PlanDetailForLots } from "@/utils/ensureProductionLotsAfterReserve";

export interface ProductionPlan {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  planTime?: string;
  status: "reserved" | "confirmed";
  materialIssuedBy?: string[];
  items?: {
    product?: { productName: string };
    quantity: number;
    unit: string;
  }[];
}

export const reservationsService = {
  /**
   * Fetch all production plans that are reserved or confirmed (acting as reservations)
   */
  fetchReservations: async (): Promise<ProductionPlan[]> => {
    const res = await apiFetch("/production-plans");
    if (!res.ok) {
      throw new Error(`โหลดรายการแผนจองวัตถุดิบไม่สำเร็จ (${res.status})`);
    }

    const data = await res.json();
    const allPlans = Array.isArray(data) ? data : data.data || [];

    return allPlans
      .filter(
        (plan: ProductionPlan) =>
          plan.status === "reserved" || plan.status === "confirmed",
      )
      .map((plan: ProductionPlan & { material_issued_by?: string[] }) => ({
        ...plan,
        materialIssuedBy: Array.isArray(plan.materialIssuedBy)
          ? plan.materialIssuedBy
          : Array.isArray(plan.material_issued_by)
            ? plan.material_issued_by
            : [],
      }));
  },

  /**
   * Confirm a production plan and issue materials
   */
  confirmAndIssue: async (
    planId: number,
  ): Promise<{ productionQrGeneration?: GenerateProductQrOrdersResponse | null }> => {
    const res = await apiFetch(`/production-plans/${planId}/confirm-and-issue`, {
      method: "POST",
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: "ไม่สามารถยืนยันแผนได้" }));
      throw new Error(errorData.message || "ไม่สามารถยืนยันแผนได้");
    }

    return res.json();
  },

  /**
   * Fetch production plan details by planId
   */
  fetchDetails: async (planId: number): Promise<PlanDetailForLots> => {
    const res = await apiFetch(`/production-plans/${planId}/details`);
    if (!res.ok) {
      throw new Error(`โหลดรายละเอียดแผนผลิตไม่สำเร็จ (${res.status})`);
    }

    const detail = (await res.json()) as {
      id?: number;
      planId?: number;
      planCode: string;
      status?: string;
      items: Array<{
        id?: number;
        planItemId?: number;
        productId: number;
        productName: string;
        quantity: number;
        unit: string;
      }>;
    };

    return {
      id: detail.id,
      planId: detail.planId,
      planCode: detail.planCode,
      status: detail.status,
      items: detail.items.map((it) => ({
        planItemId: it.planItemId,
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unit: it.unit,
      })),
    };
  },
};
