"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Label, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar, PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ficoCategory, type PeopleRequest } from "@/lib/zkredit-data"
import { toUSDString } from "@/lib/utils"
import { toRecentEvents, peopleRequests, ficoBuckets } from "@/lib/zkredit-data"
import { formatUSD, formatUSDCompact } from "@/lib/utils"

export default function CommandCenterPage() {
  const [selectedUser, setSelectedUser] = React.useState<PeopleRequest | null>(null)
  // Donut data from FICO buckets
  const chartData = [
    { key: "excellent", label: "Excelente (800–850)", usuarios: ficoBuckets["Excellent"].count, fill: "var(--color-excellent)" },
    { key: "veryGood", label: "Muy bueno (740–799)", usuarios: ficoBuckets["Very Good"].count, fill: "var(--color-veryGood)" },
    { key: "good", label: "Bueno (670–739)", usuarios: ficoBuckets["Good"].count, fill: "var(--color-good)" },
    { key: "fair", label: "Aceptable (580–669)", usuarios: ficoBuckets["Fair"].count, fill: "var(--color-fair)" },
    { key: "poor", label: "Bajo (300–579)", usuarios: ficoBuckets["Poor"].count, fill: "var(--color-poor)" },
  ]
  const totalUsuarios = chartData.reduce((acc, curr) => acc + curr.usuarios, 0)
  const chartConfig = {
    usuarios: { label: "Usuarios" },
    // diferentes niveles de naranja
    excellent: { label: "Excelente", color: "#fb923c" },
    veryGood: { label: "Muy bueno", color: "#f59e0b" },
    good: { label: "Bueno", color: "#f97316" },
    fair: { label: "Aceptable", color: "#ea580c" },
    poor: { label: "Bajo", color: "#c2410c" },
  } as const

  // Time series (mock) for additional charts (12 months)
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ]
  const seriesPrestado = months.map((m, i) => ({ m, value: 300000 + i * 50000 + (i % 3) * 25000 }))
  const seriesMorosidad = months.map((m, i) => ({ m, pct: 5 + (i % 5) * 0.4 }))
  const seriesUsuarios = months.map((m, i) => ({ m, nuevos: 200 + i * 25 + (i % 4) * 15 }))
  const seriesOrigen = months.map((m, i) => ({ m, off: 60 + (i % 3) * 10, on: 40 + (i % 4) * 8 }))
  return (
    <div className="p-6 space-y-6">
      {/* Resumen principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PORTAFOLIO DE CRÉDITO — LEMON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">{formatUSDCompact(2400000)}</div>
                <div className="text-xs text-neutral-500">Dinero prestado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">{formatUSDCompact(1900000)}</div>
                <div className="text-xs text-neutral-500">Dinero devuelto</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">7.2%</div>
                <div className="text-xs text-neutral-500">Tasa de morosidad</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { name: "Préstamos personales", status: "activa", casos: "1,240" },
                { name: "Microcréditos", status: "activa", casos: "980" },
                { name: "BNPL", status: "revisión", casos: "312" },
                { name: "Líneas en mora", status: "alerta", casos: "86" },
              ].map((seg) => (
                <div
                  key={seg.name}
                  className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        seg.status === "activa"
                          ? "bg-green-500"
                          : seg.status === "revisión"
                            ? "bg-orange-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <div className="text-xs text-neutral-400">{seg.name}</div>
                  </div>
                  <div className="text-xs text-orange-500 font-mono">{seg.casos}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">LEMON / SOLICITUDES Y RESPUESTAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {toRecentEvents(peopleRequests.filter((r) => r.tenant === "LEMON")).map((log, index) => (
                <div
                  key={index}
                  className="text-xs border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors"
                >
                  <div className="text-neutral-500 font-mono">{log.time}</div>
                  {log.action === "request" ? (
                    <div className="text-white">
                      <span className="text-orange-500 font-mono">LEMON</span> solicitó historial para {" "}
                      <button
                        className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                        onClick={() => {
                          const found = peopleRequests.find((p) => p.usuarioId === log.user)
                          if (found) setSelectedUser(found)
                        }}
                      >
                        {log.user}
                      </button>
                      <span className="text-green-500 font-mono"> {log.amount}</span>
                    </div>
                  ) : (
                    <div className="text-white">
                      <span className="text-orange-500 font-mono">ZKREDIT</span> devolvió historial para {" "}
                      <button
                        className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                        onClick={() => {
                          const found = peopleRequests.find((p) => p.usuarioId === log.user)
                          if (found) setSelectedUser(found)
                        }}
                      >
                        {log.user}
                      </button>{" "}
                      <span className="text-neutral-400">Score:</span> <span className="font-mono">{log.score}</span>{" "}
                      <span className="text-neutral-400">Riesgo:</span> <span className="font-mono">{log.riesgo?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">RIESGO PORTAFOLIO</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 border-2 border-green-500 rounded-full opacity-60"></div>
              <div className="absolute inset-2 border border-orange-500 rounded-full opacity-40"></div>
              <div className="absolute inset-4 border border-red-500 rounded-full opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl font-bold text-green-500 font-mono">BAJO</div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 space-y-1 w-full font-mono">
              <div className="flex justify-between">
                <span># ANÁLISIS DE RIESGO - 30/08/2025</span>
              </div>
              <div className="text-white">&gt; SALUD DEL PORTAFOLIO: ESTABLE</div>
              <div className="text-green-500">&gt; PREDICCIÓN DE MORA: 2.3%</div>
              <div className="text-white">&gt; CONFIANZA: 94.2%</div>
              <div className="text-neutral-400">&gt; RECOMENDACIÓN: MANTENER UMBRALES</div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              DISTRIBUCIÓN FICO — USUARIOS POR RANGO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[140px] md:max-h-[180px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={chartData} dataKey="usuarios" nameKey="label" innerRadius={40} strokeWidth={1}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-white text-[10px] font-bold">
                              {totalUsuarios.toLocaleString()}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 8} className="fill-white text-[7px]">
                              Usuarios
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">DISTRIBUCIÓN FICO (300–850)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-500 font-medium">Excelente (800–850)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Excelente</span>
                    <span className="text-white font-bold font-mono">1,240</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Muy bueno (740–799)</span>
                    <span className="text-white font-bold font-mono">2,156</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-orange-500 font-medium">Bueno / Aceptable (580–739)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Bueno (670–739)</span>
                    <span className="text-white font-bold font-mono">3,421</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Aceptable (580–669)</span>
                    <span className="text-white font-bold font-mono">2,890</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-500 font-medium">Bajo (300–579)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Bajo</span>
                    <span className="text-white font-bold font-mono">892</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white tracking-wider">Detalle del Usuario</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedUser.usuarioId} • {selectedUser.documento} • {selectedUser.id}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedUser(null)} className="text-neutral-400 hover:text-white">✕</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 bg-neutral-800 rounded">
                  <div className="flex items-center justify-between text-sm"><span className="text-neutral-400">Cliente</span><span className="text-white font-mono">{selectedUser.tenant}</span></div>
                </div>
                <div className="p-3 bg-neutral-800 rounded">
                  <div className="flex items-center justify-between text-sm"><span className="text-neutral-400">Monto</span><span className="text-white font-mono">{toUSDString(selectedUser.monto)}</span></div>
                </div>
                <div className="p-3 bg-neutral-800 rounded">
                  <div className="flex items-center justify-between text-sm"><span className="text-neutral-400">FICO</span><span className="text-white font-mono">{`${selectedUser.score} (${ficoCategory(selectedUser.score)})`}</span></div>
                </div>
                <div className="p-3 bg-neutral-800 rounded">
                  <div className="flex items-center justify-between text-sm"><span className="text-neutral-400">Riesgo</span><span className="text-white font-mono">{selectedUser.riesgo.toUpperCase()}</span></div>
                </div>
                <div className="p-3 bg-neutral-800 rounded md:col-span-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Wallet</span>
                    {selectedUser.walletAddress ? (
                      <a
                        href={`https://etherscan.io/address/${selectedUser.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                      >
                        {selectedUser.walletAddress}
                      </a>
                    ) : (
                      <span className="text-white font-mono">—</span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-neutral-800 rounded md:col-span-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">ENS</span>
                    {selectedUser.ensName ? (
                      <a
                        href={`https://app.ens.domains/${selectedUser.ensName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                      >
                        {selectedUser.ensName}
                      </a>
                    ) : (
                      <span className="text-white font-mono">—</span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-neutral-800 rounded md:col-span-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Twitter</span>
                    {selectedUser.twitterUrl ? (
                      <a
                        href={selectedUser.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-mono underline decoration-dotted hover:text-orange-400"
                      >
                        {selectedUser.twitterUrl}
                      </a>
                    ) : (
                      <span className="text-white font-mono">—</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-neutral-800 rounded">
                <div className="text-xs text-neutral-400 mb-2">Perfil de crédito (radar)</div>
                <ChartContainer config={{}} className="mx-auto aspect-square max-h-[300px]">
                  <RadarChart data={[
                    {axis:"Historial de pagos (35%)",score:96},
                    {axis:"Utilización de crédito (30%)",score:59},
                    {axis:"Antigüedad crediticia (15%)",score:72},
                    {axis:"Mix de crédito (10%)",score:65},
                    {axis:"Consultas de crédito (10%)",score:80},
                    {axis:"Activos totales",score:68},
                    {axis:"Interacción con DApps",score:72},
                    {axis:"Tx otras wallets",score:85},
                    {axis:"Historial de liquidaciones",score:92},
                    {axis:"Ratios de deuda",score:76},
                    {axis:"Inversión/Activos totales",score:64},
                    {axis:"Confiabilidad de activos",score:70},
                    {axis:"Clustering de wallets",score:60},
                  ]} outerRadius={100}>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "#a3a3a3", fontSize: 12 }} tickLine={false} />
                    <PolarGrid />
                    <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.35} />
                  </RadarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prestado en el tiempo */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">Prestado (12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-[180px]">
              <LineChart data={seriesPrestado}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#404040" }} />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#404040" }} tickFormatter={(v) => formatUSD(v as number)} width={60} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Morosidad */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">Morosidad (12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-[180px]">
              <AreaChart data={seriesMorosidad}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#404040" }} />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={{ stroke: "#404040" }} width={45} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="pct" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Usuarios nuevos */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">Usuarios nuevos (12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-[180px]">
              <LineChart data={seriesUsuarios}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#404040" }} />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#404040" }} width={35} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="nuevos" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      
    </div>
  )
}
