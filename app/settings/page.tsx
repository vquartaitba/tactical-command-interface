"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Key, Shield, Globe, UserCog } from "lucide-react"

interface Tenant {
  id: string
  name: string
  role: "admin" | "member" | "viewer"
  status: "active" | "disabled"
}

export default function SettingsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: "TEN-LEMON", name: "LEMON", role: "admin", status: "active" },
    { id: "TEN-ACME", name: "ACME FINTECH", role: "member", status: "active" },
    { id: "TEN-BETA", name: "BETA CREDIT", role: "viewer", status: "active" },
    { id: "TEN-GAMMA", name: "GAMMA PAY", role: "member", status: "disabled" },
  ])
  const [newTenantName, setNewTenantName] = useState("")
  const [apiKey, setApiKey] = useState("sk_live_****************")
  const [webhookUrl, setWebhookUrl] = useState("https://zkredit.example.com/webhooks/lemon")
  const [mfaEnabled, setMfaEnabled] = useState(true)
  const [ipAllowlist, setIpAllowlist] = useState("10.0.0.0/8, 200.32.0.0/16")
  const [riskPolicy, setRiskPolicy] = useState({
    ficoMin: 600,
    ltvMax: 65,
    kycStrict: true,
    cryptoExposureMax: 25,
  })

  const addTenant = () => {
    if (!newTenantName.trim()) return
    setTenants((t) => [
      ...t,
      { id: `TEN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, name: newTenantName.trim(), role: "member", status: "active" },
    ])
    setNewTenantName("")
  }

  const removeTenant = (id: string) => setTenants((t) => t.filter((x) => x.id !== id))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-wider">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tenants & Access */}
        <Card className="lg:col-span-7 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">Tenants y Accesos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-neutral-500">
              <span className="font-mono text-white">admin</span> = CEO (control total: tenants, políticas, claves, usuarios) · 
              <span className="font-mono">member</span> = gestionar usuarios y solicitudes · 
              <span className="font-mono">viewer</span> = solo lectura
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del tenant"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
              />
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={addTenant}>
                <Plus className="w-4 h-4 mr-2" /> Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {tenants.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white/10 text-white text-xs">{t.id}</Badge>
                    <span className="text-sm text-white">{t.name}</span>
                    <Badge className={t.status === "active" ? "bg-green-500/20 text-green-500" : "bg-neutral-500/20 text-neutral-300"}>
                      {t.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue={t.role} onValueChange={(v) => setTenants((all) => all.map((x) => (x.id === t.id ? { ...x, role: v as Tenant["role"] } : x)))}>
                      <SelectTrigger className="w-[140px] bg-neutral-900 border-neutral-700 text-neutral-300">
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" className="text-neutral-400 hover:text-white" onClick={() => removeTenant(t.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security & API */}
        <Card className="lg:col-span-5 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">Seguridad y API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 flex items-center gap-2"><Key className="w-4 h-4" /> API Key</div>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-neutral-800 border-neutral-600 text-white" />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 flex items-center gap-2"><Globe className="w-4 h-4" /> Webhook URL</div>
              <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="bg-neutral-800 border-neutral-600 text-white" />
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded">
              <div className="text-sm text-neutral-300 flex items-center gap-2"><Shield className="w-4 h-4" /> MFA obligatorio</div>
              <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-neutral-400">IP Allowlist</div>
              <Input value={ipAllowlist} onChange={(e) => setIpAllowlist(e.target.value)} className="bg-neutral-800 border-neutral-600 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Risk Policy */}
        <Card className="lg:col-span-12 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">Política de Riesgo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-neutral-800 rounded space-y-2">
              <div className="text-xs text-neutral-400">FICO mínimo</div>
              <Input type="number" value={riskPolicy.ficoMin} onChange={(e) => setRiskPolicy({ ...riskPolicy, ficoMin: Number(e.target.value) })} className="bg-neutral-900 border-neutral-700 text-white" />
            </div>
            <div className="p-3 bg-neutral-800 rounded space-y-2">
              <div className="text-xs text-neutral-400">LTV máximo (%)</div>
              <Input type="number" value={riskPolicy.ltvMax} onChange={(e) => setRiskPolicy({ ...riskPolicy, ltvMax: Number(e.target.value) })} className="bg-neutral-900 border-neutral-700 text-white" />
            </div>
            <div className="p-3 bg-neutral-800 rounded flex items-center justify-between">
              <div className="text-sm text-neutral-300 flex items-center gap-2"><UserCog className="w-4 h-4" /> KYC estricto</div>
              <Switch checked={riskPolicy.kycStrict} onCheckedChange={(v) => setRiskPolicy({ ...riskPolicy, kycStrict: v })} />
            </div>
            <div className="p-3 bg-neutral-800 rounded space-y-2">
              <div className="text-xs text-neutral-400">Exposición cripto máx. (%)</div>
              <Input type="number" value={riskPolicy.cryptoExposureMax} onChange={(e) => setRiskPolicy({ ...riskPolicy, cryptoExposureMax: Number(e.target.value) })} className="bg-neutral-900 border-neutral-700 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


