import { api } from "./api";

export type LegalInvestigatorStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export interface LegalInvestigatorItem {
  id: string;
  status: LegalInvestigatorStatus;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
}

export interface LegalInvestigatorCandidate {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  countryCode: string | null;
}

const base = "/legal-investigator-admin";

export async function listLegalInvestigators() {
  const res = await api.get<LegalInvestigatorItem[]>(base);
  return res.data;
}

export async function searchLegalInvestigatorCandidates(q: string) {
  const res = await api.get<LegalInvestigatorCandidate[]>(
    `${base}/candidates`,
    { params: { q } },
  );
  return res.data;
}

export async function promoteToLegalInvestigator(userId: string) {
  const res = await api.post(`${base}/promote`, { userId });
  return res.data;
}

export async function setLegalInvestigatorStatus(
  profileId: string,
  status: LegalInvestigatorStatus,
) {
  const res = await api.patch(`${base}/${profileId}/status`, { status });
  return res.data;
}