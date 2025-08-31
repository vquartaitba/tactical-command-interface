"use client"

import { useState } from "react"
import { ChevronRight, BarChart3, Users as UsersIcon, Settings, Bell, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import CommandCenterPage from "./command-center/page"
import UsersPage from "./users/page"
import SettingsPage from "./settings/page"

export default function ZkreditDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const formatUTC = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  }
  const [lastUpdated, setLastUpdated] = useState<string>(formatUTC(new Date()))

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">ZKREDIT</h1>
              <p className="text-neutral-500 text-xs">LEMON FINTECH</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "overview", icon: BarChart3, label: "Resumen" },
              { id: "users", icon: UsersIcon, label: "Usuarios" },
              { id: "settings", icon: Settings, label: "Settings" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SISTEMA ONLINE</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              LEMON / <span className="text-orange-500">{activeSection === "overview" ? "RESUMEN" : activeSection === "users" ? "USUARIOS" : "SETTINGS"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">ÚLTIMA ACTUALIZACIÓN: {lastUpdated}</div>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-orange-500"
              onClick={() => setLastUpdated(formatUTC(new Date()))}
              aria-label="Actualizar hora"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "overview" && <CommandCenterPage />}
          {activeSection === "users" && <UsersPage />}
          {activeSection === "settings" && <SettingsPage />}
        </div>
      </div>
    </div>
  )
}
