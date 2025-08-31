"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Users, CheckCircle, XCircle, IdCard, Shield } from "lucide-react"

import { peopleRequests, type KyCStatus, type RiskLevel, type PeopleRequest, ficoCategory } from "@/lib/zkredit-data"
import { toUSDString } from "@/lib/utils"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [kycFilter, setKycFilter] = useState<KyCStatus | "todos">("todos")
  const [selected, setSelected] = useState<PeopleRequest | null>(null)
  // Open modal when navigated with ?selected=<usuarioId>
  if (typeof window !== "undefined" && !selected) {
    const params = new URLSearchParams(window.location.search)
    const sel = params.get("selected")
    if (sel) {
      const found = peopleRequests.find((p) => p.usuarioId === sel)
      if (found) setSelected(found)
    }
  }

  const solicitudes = peopleRequests

  const filtered = useMemo(() => {
    return solicitudes.filter((s) => {
      const matchesText =
        s.usuarioId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesKyc = kycFilter === "todos" ? true : s.kyc === kycFilter
      return matchesText && matchesKyc
    })
  }, [searchTerm, kycFilter])

  const kycBadge = (status: KyCStatus) => {
    switch (status) {
      case "verificado":
        return "bg-green-500/20 text-green-500"
      case "pendiente":
        return "bg-orange-500/20 text-orange-500"
      case "rechazado":
        return "bg-red-500/20 text-red-500"
    }
  }

  const riesgoBadge = (level: RiskLevel) => {
    switch (level) {
      case "bajo":
        return "bg-white/20 text-white"
      case "medio":
        return "bg-orange-500/20 text-orange-500"
      case "alto":
        return "bg-red-500/20 text-red-500"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">Usuarios / Solicitudes</h1>
          <p className="text-sm text-neutral-400">Listado de solicitudes de historial crediticio</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por usuario, DNI/CUIL o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">USUARIOS CON KYC</p>
                <p className="text-2xl font-bold text-white font-mono">2,134</p>
              </div>
              <IdCard className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">APROBADOS (24H)</p>
                <p className="text-2xl font-bold text-green-500 font-mono">318</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">RECHAZADOS (24H)</p>
                <p className="text-2xl font-bold text-red-500 font-mono">49</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RESUMEN RÁPIDO removido por requerimiento */}

      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SOLICITUDES</CardTitle>
            <div className="flex items-center gap-2">
              {(["todos", "verificado", "pendiente", "rechazado"] as const).map((s) => (
                <Button
                  key={s}
                  variant={kycFilter === s ? "default" : "outline"}
                  className={
                    kycFilter === s
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                  }
                  onClick={() => setKycFilter(s as KyCStatus | "todos")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {s.toString().toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">FECHA</th>
                  
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">USUARIO</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DOC</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">MONTO</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">FICO</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RIESGO</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">KYC</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">FUENTES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, index) => (
                  <tr
                    key={s.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                    onClick={() => setSelected(s)}
                  >
                    <td className="py-3 px-4 text-sm text-white font-mono">{s.id}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400 font-mono">{s.timestamp}</td>
                    
                    <td className="py-3 px-4 text-sm text-white font-mono">{s.usuarioId}</td>
                    <td className="py-3 px-4 text-sm text-neutral-300">{s.documento}</td>
                    <td className="py-3 px-4 text-sm text-green-500 font-mono">{toUSDString(s.monto)}</td>
                    <td className="py-3 px-4 text-sm text-white font-mono">{s.score} <span className="text-neutral-400">({ficoCategory(s.score)})</span></td>
                    <td className="py-3 px-4">
                      <Badge className={`${riesgoBadge(s.riesgo)} text-xs`}>{s.riesgo.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${kycBadge(s.kyc)} text-xs`}>{s.kyc.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-neutral-300">
                      {s.fuentes.map((f) => (
                        <span key={f} className="mr-2 font-mono">
                          {f}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      

      {selected && (
        <UserDetail selected={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

function SectionRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  )
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-400">{label}</span>
        <span className="text-white font-mono">{value}%</span>
      </div>
      <div className="w-full bg-neutral-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function UserDetail({ selected, onClose }: { selected: PeopleRequest; onClose: () => void }) {
  const radarData = [
    // Off-chain (FICO)
    { axis: "Historial de pagos (35%)", value: 96 },
    { axis: "Utilización de crédito (30%)", value: 59 },
    { axis: "Antigüedad crediticia (15%)", value: 72 },
    { axis: "Mix de crédito (10%)", value: 65 },
    { axis: "Consultas de crédito (10%)", value: 80 },
    // On-chain (Crypto)
    { axis: "Activos totales", value: 68 },
    { axis: "Interacción con DApps", value: 72 },
    { axis: "Tx otras wallets", value: 85 },
    { axis: "Historial de liquidaciones", value: 92 },
    { axis: "Ratios de deuda", value: 76 },
    { axis: "Inversión/Activos totales", value: 64 },
    { axis: "Confiabilidad de activos", value: 70 },
    { axis: "Clustering de wallets", value: 60 },
  ]
  const radarConfig = {
    score: {
      label: "Score",
      color: "#f97316",
    },
  } as const
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-white tracking-wider">Detalle del Usuario</CardTitle>
            <p className="text-sm text-neutral-400 font-mono">{selected.usuarioId} • {selected.documento} • {selected.id}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              onClose()
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href)
                url.searchParams.delete("selected")
                window.history.replaceState({}, "", url.toString())
              }
            }}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-neutral-800 rounded">
              <SectionRow label="Cliente" value={selected.tenant} />
            </div>
            <div className="p-3 bg-neutral-800 rounded">
              <SectionRow label="Monto" value={selected.monto} />
            </div>
            <div className="p-3 bg-neutral-800 rounded">
              <SectionRow label="FICO" value={`${selected.score} (${ficoCategory(selected.score)})`} />
            </div>
            <div className="p-3 bg-neutral-800 rounded">
              <SectionRow label="Riesgo" value={selected.riesgo.toUpperCase()} />
            </div>
            <div className="p-3 bg-neutral-800 rounded md:col-span-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Wallet</span>
                {selected.walletAddress ? (
                  <a
                    href={`https://etherscan.io/address/${selected.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                  >
                    {selected.walletAddress}
                  </a>
                ) : (
                  <span className="text-white font-mono">—</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-neutral-800 rounded md:col-span-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">ENS</span>
                {selected.ensName ? (
                  <a
                    href={`https://app.ens.domains/${selected.ensName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                  >
                    {selected.ensName}
                  </a>
                ) : (
                  <span className="text-white font-mono">—</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-neutral-800 rounded md:col-span-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Twitter</span>
                {selected.twitterUrl ? (
                  <a
                    href={selected.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                  >
                    {selected.twitterUrl}
                  </a>
                ) : (
                  <span className="text-white font-mono">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="p-3 bg-neutral-800 rounded">
            <div className="text-xs text-neutral-400 mb-2">Perfil de crédito (radar)</div>
            <ChartContainer config={radarConfig} className="mx-auto aspect-square max-h-[340px]">
              <RadarChart data={radarData.map((d) => ({ axis: d.axis, score: d.value }))} outerRadius={110}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: "#a3a3a3", fontSize: 12, fontFamily: "ui-sans-serif, system-ui, -apple-system" }}
                  tickLine={false}
                  tickMargin={12}
                  tickFormatter={(v: string) => v.replace("Inversión/Activos totales", "Inv./Activos")}
                />
                <PolarGrid />
                <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.35} />
              </RadarChart>
            </ChartContainer>
          </div>

          <Tabs defaultValue="offchain" className="w-full">
            <TabsList className="bg-neutral-800 text-neutral-300">
              <TabsTrigger value="offchain">Off-chain</TabsTrigger>
              <TabsTrigger value="crypto">On-chain / Crypto</TabsTrigger>
            </TabsList>
            <TabsContent value="offchain" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Historial de pagos (35%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ProgressRow label="Pagos a término últimos 24m" value={96} color="bg-green-500" />
                    <SectionRow label="Pagos atrasados (12m)" value={"2"} />
                    <SectionRow label="Incumplimientos" value={"0"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Payment history accounts for 35% of your FICO credit scores. On-time payments can be helpful to your score, while late or missed payments can result in lost credit score points.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Utilización de crédito (30%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ProgressRow label="Utilización promedio" value={41} color="bg-orange-500" />
                    <SectionRow label="Líneas abiertas" value={"5"} />
                    <SectionRow label="Crédito total" value={toUSDString("3.200.000")} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Credit utilization refers to the percentage of available credit that’s in use at any given time. This factor accounts for 30% of FICO score calculations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Antigüedad crediticia (15%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Antigüedad promedio" value={"4.8 años"} />
                    <SectionRow label="Cuenta más antigua" value={"8.2 años"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Credit age measures the average length of time for which someone has been using credit. The older someone’s credit age is, the better. This factor accounts for 15% of FICO credit score calculations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Mix de crédito (10%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Revolving / Cuotas" value={"60% / 40%"} />
                    <SectionRow label="Hipotecario/Auto/Consumo" value={"0 / 1 / 4"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      FICO also considers the types of credit someone uses (i.e., installment loans versus revolving credit). Credit mix makes up 10% of FICO credit score calculations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Consultas de crédito (10%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Consultas duras (12m)" value={"2"} />
                    <SectionRow label="Última consulta" value={"hace 3 meses"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Credit inquiries account for 10% of your FICO credit score. A new inquiry is registered on your credit report following a hard credit check. Checking your own credit reports doesn’t trigger a hard credit pull or affect your credit score.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="crypto" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-neutral-900 border-neutral-700 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Identidad on-chain</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Wallet</span>
                      {selected.walletAddress ? (
                        <a
                          href={`https://etherscan.io/address/${selected.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                        >
                          {selected.walletAddress}
                        </a>
                      ) : (
                        <span className="text-white font-mono">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">ENS</span>
                      {selected.ensName ? (
                        <a
                          href={`https://app.ens.domains/${selected.ensName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                        >
                          {selected.ensName}
                        </a>
                      ) : (
                        <span className="text-white font-mono">—</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Total de activos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Valor estimado" value={toUSDString("5.6M")} />
                    <SectionRow label="N° de activos" value={"37"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      The total asset represents the financial strength of accounts.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Interacción con DApps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="DApps reputadas" value={"18"} />
                    <SectionRow label="Riesgo de contrapartes" value={"BAJO"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      This parameter reflects the trustworthiness of the wallets. It evaluates the transacting behavior, type and reputation of Dapps they interact with.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Transacciones con otras wallets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Tx con wallets de alta confianza" value={"72%"} />
                    <SectionRow label="Tx con wallets de bajo crédito" value={"3%"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      To evaluate wallet credit accurately, we examine its interactions with other wallets. Higher wallet credit results from numerous transactions with trustworthy wallets, while transactions with wallets holding poor credit lower the wallet’s overall credit score.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Historial de liquidaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Liquidaciones" value={"0"} />
                    <SectionRow label="Antigüedad de cuenta" value={"3.4 años"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      This parameter reflects the wallet’s credit risk based on assessing the age of the account along with the number of liquidations and liquidated amount.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Ratios de deuda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ProgressRow label="Loan-to-Asset" value={24} color="bg-orange-500" />
                    <SectionRow label="Deuda total" value={toUSDString("820k")} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Loan ratios (debt ratios) represent the debt position of an account.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Inversión sobre activos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ProgressRow label="Investment/Total Asset" value={38} color="bg-green-500" />
                    <SectionRow label="Activeness" value={"ALTA"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      This ratio represents the activeness of the account in the crypto business. It indicates how much percentage of the total asset that the account puts into financing activities.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Confiabilidad de activos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Valor en blue-chips" value={toUSDString("3.1M")} />
                    <SectionRow label="Exposición a alto riesgo" value={"7%"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      The credit of a wallet can be seen by the value and trustworthiness of the digital assets it holds.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-700 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm text-neutral-300">Clustering de wallets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <SectionRow label="Posibles wallets relacionadas" value={"3"} />
                    <SectionRow label="Confianza del cluster" value={"ALTA"} />
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Clustering the wallets para encontrar wallets cercanas que sean de la misma persona que use para fraude.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}


