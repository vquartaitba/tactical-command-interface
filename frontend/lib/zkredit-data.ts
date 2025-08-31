export type KyCStatus = "pendiente" | "verificado" | "rechazado"
export type RiskLevel = "bajo" | "medio" | "alto"

export interface PeopleRequest {
  id: string
  timestamp: string
  tenant: string // fintech específica (LEMON)
  usuarioId: string
  documento: string
  monto: string
  score: number
  riesgo: RiskLevel
  kyc: KyCStatus
  fuentes: Array<"on-chain" | "off-chain">
  walletAddress?: string
  ensName?: string
  twitterUrl?: string
}

// Fuente única de verdad para solicitudes de historial crediticio (People)
export const peopleRequests: PeopleRequest[] = [
  {
    id: "REQ-2025-0912",
    timestamp: "30/08/2025 14:29",
    tenant: "LEMON",
    usuarioId: "user_4521",
    documento: "DNI 35.612.345",
    monto: "$1.500.000",
    score: 782,
    riesgo: "bajo",
    kyc: "verificado",
    fuentes: ["on-chain", "off-chain"],
    walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    ensName: "vitalik.eth",
    twitterUrl: "https://x.com/VitalikButerin",
  },
  {
    id: "REQ-2025-0911",
    timestamp: "30/08/2025 13:12",
    tenant: "LEMON",
    usuarioId: "user_4520",
    documento: "DNI 41.902.113",
    monto: "$850.000",
    score: 664,
    riesgo: "medio",
    kyc: "pendiente",
    fuentes: ["off-chain"],
    walletAddress: "0x4520...c3d4",
    ensName: "user4520.eth",
  },
  {
    id: "REQ-2025-0910",
    timestamp: "30/08/2025 12:55",
    tenant: "LEMON",
    usuarioId: "user_4519",
    documento: "CUIL 20-29223344-7",
    monto: "$2.500.000",
    score: 548,
    riesgo: "alto",
    kyc: "rechazado",
    fuentes: ["off-chain"],
    walletAddress: "0x4519...e5f6",
    ensName: "user4519.eth",
  },
  {
    id: "REQ-2025-0909",
    timestamp: "30/08/2025 11:33",
    tenant: "LEMON",
    usuarioId: "user_4518",
    documento: "DNI 39.120.556",
    monto: "$1.200.000",
    score: 721,
    riesgo: "bajo",
    kyc: "verificado",
    fuentes: ["on-chain", "off-chain"],
    walletAddress: "0x4518...09ab",
    ensName: "user4518.eth",
  },
]

// Eventos derivados: solicitudes de historial y respuestas de ZKREDIT
export interface RecentEvent {
  time: string
  tenant: string
  action: "request" | "response"
  user: string
  amount: string
  score?: number
  riesgo?: RiskLevel
}

export function toRecentEvents(data: PeopleRequest[]): RecentEvent[] {
  // Por cada request generamos dos eventos: request (LEMON -> ZKREDIT) y response (ZKREDIT -> LEMON)
  const events: RecentEvent[] = []
  for (const r of data) {
    events.push({
      time: r.timestamp,
      tenant: r.tenant,
      action: "request",
      user: r.usuarioId,
      amount: r.monto,
    })
    events.push({
      time: r.timestamp,
      tenant: r.tenant,
      action: "response",
      user: r.usuarioId,
      amount: r.monto,
      score: r.score,
      riesgo: r.riesgo,
    })
  }
  return events.slice(0, 8)
}

// FICO helpers
export type FicoCategory = "Excellent" | "Very Good" | "Good" | "Fair" | "Poor"

export function ficoCategory(score: number): FicoCategory {
  if (score >= 800) return "Excellent"
  if (score >= 740) return "Very Good"
  if (score >= 670) return "Good"
  if (score >= 580) return "Fair"
  return "Poor"
}

export type FicoBucketKey = "Poor" | "Fair" | "Good" | "Very Good" | "Excellent"
export const ficoBuckets: Record<FicoBucketKey, { min: number; max: number; count: number }> = {
  Poor: { min: 300, max: 579, count: 892 },
  Fair: { min: 580, max: 669, count: 2890 },
  Good: { min: 670, max: 739, count: 3421 },
  "Very Good": { min: 740, max: 799, count: 2156 },
  Excellent: { min: 800, max: 850, count: 1240 },
}


