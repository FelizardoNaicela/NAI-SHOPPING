import { api } from "./api";

export interface RevenueMonth {
  month: number;
  total: number;
  verification: number;
  promotion: number;
  nationalRanking: number;
  other: number;
  count: number;
}

export interface RevenueStats {
  year: number;
  currency: string;
  total: number;
  paymentsCount: number;
  byType: {
    verification: number;
    promotion: number;
    nationalRanking: number;
    other: number;
  };
  months: RevenueMonth[];
  availableYears: number[];
}

export interface RevenueRegion {
  region: string;
  total: number;
  verification: number;
  promotion: number;
  nationalRanking: number;
  other: number;
  count: number;
}

export interface RevenueStats {
  year: number;
  region: string | null;
  // ...resto igual
  byRegion: RevenueRegion[];
}

export async function getRevenueStats(
  year?: number,
  region?: string,
): Promise<RevenueStats> {
  const response = await api.get<RevenueStats>("/admin/payments/revenue", {
    params: {
      ...(year ? { year } : {}),
      ...(region ? { region } : {}),
    },
  });

  return response.data;
}