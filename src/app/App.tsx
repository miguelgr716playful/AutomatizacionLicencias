import { useState } from "react";
import tecMilenioLogo from "@/imports/tecMilenio.png";
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Settings,
  Package,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  CheckCircle2,
  Clock,
  Upload,
  Download,
  Plus,
  Edit3,
  ChevronDown,
  Filter,
  Search,
  Eye,
  CalendarDays,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────────

type Section = "dashboard" | "aprovisionar" | "reportes" | "configuracion";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "aprovisionar", label: "Aprovisionar", icon: UserPlus },
  { id: "reportes", label: "Reportes", icon: FileText },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const barData = [
  { mes: "Ene", adobe: 312, minitab: 88 },
  { mes: "Feb", adobe: 328, minitab: 91 },
  { mes: "Mar", adobe: 310, minitab: 94 },
  { mes: "Abr", adobe: 341, minitab: 97 },
  { mes: "May", adobe: 330, minitab: 100 },
  { mes: "Jun", adobe: 370, minitab: 108 },
  { mes: "Jul", adobe: 410, minitab: 115 },
  { mes: "Ago", adobe: 445, minitab: 128 },
];

const lineData = [
  { mes: "Ene", aprov: 1050, desaprov: 120 },
  { mes: "Feb", aprov: 950, desaprov: 200 },
  { mes: "Mar", aprov: 300, desaprov: 80 },
  { mes: "Abr", aprov: 420, desaprov: 150 },
  { mes: "May", aprov: 820, desaprov: 800 },
  { mes: "Jun", aprov: 200, desaprov: 100 },
  { mes: "Jul", aprov: 1600, desaprov: 300 },
  { mes: "Ago", aprov: 850, desaprov: 200 },
  { mes: "Sep", aprov: 100, desaprov: 80 },
  { mes: "Oct", aprov: 80, desaprov: 50 },
  { mes: "Nov", aprov: 60, desaprov: 40 },
  { mes: "Dic", aprov: 400, desaprov: 350 },
];

const actividadReciente = [
  { fecha: "14 Feb 2024", software: "Adobe",   tipo: "APROV", estado: "Completado" },
  { fecha: "12 Feb 2024", software: "Minitab", tipo: "DESAP", estado: "Completado" },
  { fecha: "10 Feb 2024", software: "Adobe",   tipo: "APROV", estado: "En Proceso" },
  { fecha: "08 Feb 2024", software: "Adobe",   tipo: "DESAP", estado: "Completado" },
  { fecha: "05 Feb 2024", software: "Minitab", tipo: "APROV", estado: "Completado" },
];

const historialRows = [
  { id: "OP-1009", fecha: "2024-02-28", software: "Adobe", periodo: "Ene-May", tipo: "APROVISIONAMIENTO", cantidad: 89, estado: "Completado" },
  { id: "OP-1008", fecha: "2024-02-14", software: "Minitab", periodo: "Ene-May", tipo: "DESAPROVISIONAMIENTO", cantidad: 34, estado: "Completado" },
  { id: "OP-1007", fecha: "2024-02-10", software: "Adobe", periodo: "Ene-May", tipo: "APROVISIONAMIENTO", cantidad: 120, estado: "Completado" },
  { id: "OP-1006", fecha: "2024-01-30", software: "Minitab", periodo: "Sep-Dic", tipo: "APROVISIONAMIENTO", cantidad: 58, estado: "Completado" },
  { id: "OP-1005", fecha: "2024-01-15", software: "Adobe", periodo: "Sep-Dic", tipo: "DESAPROVISIONAMIENTO", cantidad: 47, estado: "Completado" },
  { id: "OP-1004", fecha: "2023-12-20", software: "Adobe", periodo: "Sep-Dic", tipo: "APROVISIONAMIENTO", cantidad: 210, estado: "Completado" },
];

const adobeMapping = [
  { local: "banner_id", api: "federatedID" },
  { local: "email_inst", api: "email" },
  { local: "nombres", api: "firstname" },
  { local: "apellidos", api: "lastname" },
];

const minitabMapping = [
  { local: "email_inst", api: "Email" },
  { local: "nombres", api: "FirstName" },
  { local: "apellidos", api: "LastName" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, trend, accentColor = "text-foreground",
}: {
  label: string; value: string; sub?: string; icon: React.ElementType;
  trend?: string; accentColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
      <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#e6f7ef" }}>
        <Icon className="w-6 h-6" style={{ color: "#00B364" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {trend && <p className="text-xs mt-0.5 font-medium" style={{ color: "#00B364" }}>{trend}</p>}
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { label: "Total Licencias Activas", value: "12,450", sub: "Adobe + Minitab", icon: Package, trend: null },
  { label: "Aprovisionadas (Periodo)", value: "1,150", sub: null, trend: "+12% vs periodo anterior", positive: true, icon: TrendingUp },
  { label: "Desaprovisionadas (Periodo)", value: "420", sub: null, trend: "-5% vs periodo anterior", positive: false, icon: TrendingDown },
  { label: "Usuarios Pendientes", value: "84", sub: "Esperando sincronización", trend: null, icon: Users },
];

function DashboardSection() {
  const [softwareFilter, setSoftwareFilter] = useState<"ambos" | "adobe" | "minitab">("ambos");

  const showAdobe  = softwareFilter === "ambos" || softwareFilter === "adobe";
  const showMini   = softwareFilter === "ambos" || softwareFilter === "minitab";
  const dualAxis   = softwareFilter === "ambos";

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel General</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen en tiempo real — Periodo 2026-Agosto</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["API Adobe: Conectado", "API Minitab: Conectado"].map((label) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border" style={{ borderColor: "#a7f3d0", backgroundColor: "#f0fdf4", color: "#00B364" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#00B364" }} />{label}
            </span>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#e8f8f1" }}>
              <c.icon className="w-6 h-6" style={{ color: "#00B364" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground leading-snug">{c.label}</p>
              <p className="text-[1.6rem] font-bold text-foreground leading-tight tracking-tight">{c.value}</p>
              {c.sub   && <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>}
              {c.trend && (
                <p className="text-xs font-semibold mt-0.5" style={{ color: (c as any).positive ? "#00B364" : "#f97316" }}>
                  {c.trend}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">

        {/* Single area chart — both lines, one axis */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Tendencia de Licencias</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-0.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#00B364" }} />Adobe
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#0B4D3C" }} />Minitab
              </span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAdobe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00B364" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00B364" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMinitab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0B4D3C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0B4D3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                  cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  formatter={(val, name) => [
                    <span style={{ color: name === "adobe" ? "#00B364" : "#0B4D3C", fontWeight: 500 }}>{val}</span>,
                    name,
                  ]}
                />
                <Area type="monotone" dataKey="adobe" name="adobe"
                  stroke="#00B364" strokeWidth={2.5} fill="url(#gAdobe)"
                  dot={{ r: 3, fill: "#00B364", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#00B364" }} />
                <Area type="monotone" dataKey="minitab" name="minitab"
                  stroke="#0B4D3C" strokeWidth={2.5} fill="url(#gMinitab)"
                  dot={{ r: 3, fill: "#0B4D3C", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#0B4D3C" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Actividad Reciente</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Últimas operaciones procesadas</p>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Fecha", "Software", "Tipo", "Estado"].map(h => (
                    <th key={h} className="px-5 py-2.5 text-[11px] font-semibold text-muted-foreground text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actividadReciente.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3 text-xs text-foreground whitespace-nowrap">{r.fecha}</td>
                    <td className="px-5 py-3 text-xs font-medium text-foreground">{r.software}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${r.tipo === "APROV" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-orange-50 text-orange-500 border-orange-200"}`}>
                        {r.tipo === "APROV" ? "APROV..." : "DESAP..."}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium">
                      <span className={r.estado === "Completado" ? "text-emerald-600" : "text-muted-foreground"}>
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Aprovisionar ─────────────────────────────────────────────────────────────

function AprovisionarSection() {
  const [software, setSoftware] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [tipoOp, setTipoOp] = useState<"aprov" | "desaprov">("aprov");
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState("");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aprovisionar Licencias</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Aprovisiona o revoca licencias de software usando archivos CSV con Claves Banner.</p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
        <h2 className="text-base font-semibold text-foreground">Gestión de Licencias</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Software</label>
            <div className="relative">
              <select
                value={software}
                onChange={(e) => setSoftware(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-muted-foreground"
              >
                <option value="">Seleccionar software</option>
                <option value="adobe">Adobe Creative Cloud</option>
                <option value="minitab">Minitab</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Período Académico</label>
            <div className="relative">
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-muted-foreground"
              >
                <option value="">Seleccionar período</option>
                <option value="ene-may-2024">Ene-May 2024</option>
                <option value="sep-dic-2024">Sep-Dic 2024</option>
                <option value="ene-may-2025">Ene-May 2025</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Tipo de Operación</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTipoOp("aprov")}
              className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 transition-all ${tipoOp === "aprov" ? "border-emerald-500 bg-emerald-50" : "border-border bg-white hover:border-emerald-300"}`}
            >
              <CheckCircle2 className={`w-6 h-6 ${tipoOp === "aprov" ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold ${tipoOp === "aprov" ? "text-emerald-700" : "text-foreground"}`}>Aprovisionamiento</span>
              <span className={`text-xs ${tipoOp === "aprov" ? "text-emerald-600" : "text-muted-foreground"}`}>Asignar nuevas licencias</span>
            </button>
            <button
              onClick={() => setTipoOp("desaprov")}
              className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 transition-all ${tipoOp === "desaprov" ? "border-orange-400 bg-orange-50" : "border-border bg-white hover:border-orange-300"}`}
            >
              <AlertTriangle className={`w-6 h-6 ${tipoOp === "desaprov" ? "text-orange-500" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold ${tipoOp === "desaprov" ? "text-orange-600" : "text-foreground"}`}>Desaprovisionamiento</span>
              <span className={`text-xs ${tipoOp === "desaprov" ? "text-orange-500" : "text-muted-foreground"}`}>Revocar acceso masivo</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Archivo de Datos (Claves Banner)</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault(); setDrag(false);
              const file = e.dataTransfer.files[0];
              if (file) setFileName(file.name);
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) setFileName(file.name);
              };
              input.click();
            }}
            className={`border-2 border-dashed rounded-xl px-8 py-12 text-center transition-colors cursor-pointer ${drag ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-emerald-300 bg-gray-50"}`}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            {fileName ? (
              <p className="text-sm font-medium text-emerald-700">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">Arrastra tu archivo CSV aquí</p>
                <p className="text-xs text-muted-foreground mt-1">o haz clic para explorar en tu equipo</p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
            Procesar Archivo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reportes ────────────────────────────────────────────────────────────────

const reporteData = [
  { fecha: "2026-06-12", hora: "04:02", nombre: "Javier Torres Ramírez",  id: "A01198234", clave: "EST-201", nivel: "Mtra.", software: "Minitab",  accion: "Alta", origen: "ETL",    operador: "sistema" },
  { fecha: "2026-06-12", hora: "04:01", nombre: "Carlos Mendoza Ríos",    id: "A01234567", clave: "DIS-101", nivel: "Lic.",  software: "Adobe CC", accion: "Alta", origen: "ETL",    operador: "sistema" },
  { fecha: "2026-06-12", hora: "04:01", nombre: "Sofía Gutiérrez Luna",   id: "A01234890", clave: "DIS-205", nivel: "Lic.",  software: "Adobe CC", accion: "Alta", origen: "ETL",    operador: "sistema" },
  { fecha: "2026-06-11", hora: "09:14", nombre: "Ana Herrera Vidal",      id: "A01299001", clave: "MKT-310", nivel: "Lic.",  software: "Adobe CC", accion: "Alta", origen: "Manual", operador: "admin" },
  { fecha: "2026-06-11", hora: "04:02", nombre: "Pedro Sánchez Mora",     id: "A01155678", clave: "CAL-400", nivel: "Lic.",  software: "Minitab",  accion: "Baja", origen: "ETL",    operador: "sistema" },
  { fecha: "2026-06-10", hora: "04:01", nombre: "Laura Castillo Reyes",   id: "A01344512", clave: "INV-502", nivel: "Mtra.", software: "Minitab",  accion: "Alta", origen: "ETL",    operador: "sistema" },
  { fecha: "2026-06-10", hora: "04:01", nombre: "Marcos Fuentes Díaz",    id: "A01099834", clave: "ARQ-150", nivel: "Lic.",  software: "Adobe CC", accion: "Baja", origen: "ETL",    operador: "sistema" },
  { fecha: "2026-06-09", hora: "14:30", nombre: "Valentina Ortiz Nava",   id: "A01280045", clave: "FIN-301", nivel: "Lic.",  software: "Minitab",  accion: "Baja", origen: "Manual", operador: "admin" },
  { fecha: "2026-06-08", hora: "04:01", nombre: "Ricardo Peña Salinas",   id: "A01102938", clave: "MAT-210", nivel: "Lic.",  software: "Adobe CC", accion: "Alta", origen: "ETL",    operador: "sistema" },
  { fecha: "2026-06-07", hora: "10:15", nombre: "Isabella Mora Vega",     id: "A01376521", clave: "QUI-330", nivel: "Mtra.", software: "Minitab",  accion: "Alta", origen: "Manual", operador: "admin" },
];

const PAGE_SIZE = 5;

function ReportesSection() {
  const [filterSoftware, setFilterSoftware] = useState("Todo software");
  const [filterAccion, setFilterAccion] = useState("Alta y Baja");
  const [filterOrigen, setFilterOrigen] = useState("ETL + Manual");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = reporteData.filter((r) =>
    (filterSoftware === "Todo software" || r.software === filterSoftware) &&
    (filterAccion === "Alta y Baja" || r.accion === filterAccion) &&
    (filterOrigen === "ETL + Manual" || r.origen === filterOrigen) &&
    (search === "" || r.nombre.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search) || r.clave.includes(search))
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes e Historial</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Historial de asignaciones almacenado en Azure · Acceso de Auditor</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Azure Blob Storage — Conectado
          </span>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#0B4D3C" }}>
            <Download className="w-4 h-4" /> Exportar Reporte a Excel/CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { value: "2,847", label: "Total movimientos",    sub: "Periodo 2026-Agosto", color: "#00B364", border: "#00B364" },
          { value: "1,983", label: "Altas totales",        sub: "69.7% del total",     color: "#00B364", border: "#00B364" },
          { value: "864",   label: "Bajas totales",        sub: "30.3% del total",     color: "#ef4444", border: "#ef4444" },
          { value: "47",    label: "Movimientos manuales", sub: "1.6% con justificación", color: "#0B4D3C", border: "#0B4D3C" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-border shadow-sm p-3.5 flex flex-col gap-0.5 border-l-4" style={{ borderLeftColor: c.border }}>
            <p className="text-xl font-bold leading-tight" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs font-semibold text-foreground">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Table header + filters */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Historial de Asignaciones
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-muted-foreground">{filtered.length}</span>
          </h2>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {[
              { val: filterSoftware, set: handleFilterChange(setFilterSoftware), opts: ["Todo software", "Adobe CC", "Minitab"] },
              { val: filterAccion,   set: handleFilterChange(setFilterAccion),   opts: ["Alta y Baja", "Alta", "Baja"] },
              { val: filterOrigen,   set: handleFilterChange(setFilterOrigen),   opts: ["ETL + Manual", "ETL", "Manual"] },
            ].map(({ val, set, opts }) => (
              <div key={opts[0]} className="relative">
                <select value={val} onChange={(e) => set(e.target.value)}
                  className="text-[11px] pl-2 pr-6 py-1.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none">
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            ))}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ID, nombre, clave..."
                className="pl-6 pr-2 py-1.5 text-[11px] rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-emerald-400 w-40" />
            </div>
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50/80">
                {["FECHA / HORA","ESTUDIANTE","CLAVE BANNER","NIVEL","SOFTWARE","ACCIÓN","ORIGEN","OPERADOR",""].map(h => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground text-left uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => (
                <tr key={i} className={`border-b border-border last:border-0 transition-colors hover:bg-gray-50/60 ${r.accion === "Baja" ? "bg-red-50/20" : ""}`}>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-mono text-[11px]" style={{ color: "#00B364" }}>{r.fecha}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground">{r.hora}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-medium text-foreground text-[12px]">{r.nombre}</span>
                    <span className="block text-[10px] font-mono" style={{ color: "#00B364" }}>{r.id}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{r.clave}</td>
                  <td className="px-3 py-3">
                    <span className="px-1.5 py-0.5 rounded border border-border text-[10px] font-medium text-muted-foreground">{r.nivel}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${r.software === "Minitab" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>{r.software}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${r.accion === "Alta" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{r.accion}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${r.origen === "ETL" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{r.origen}</span>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-muted-foreground">{r.operador}</td>
                  <td className="px-3 py-3">
                    <Eye className={`w-3.5 h-3.5 ${r.operador === "admin" ? "text-emerald-500" : "text-gray-300"}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-4 bg-gray-50/50 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Mostrando <strong className="text-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> de <strong className="text-foreground">{filtered.length}</strong> registros
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 rounded text-sm font-semibold text-muted-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                style={p === page ? { backgroundColor: "#0B4D3C", color: "#fff" } : { color: "#64748b" }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 rounded text-sm font-semibold text-muted-foreground hover:bg-gray-100 disabled:opacity-30 transition-colors">›</button>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Registros sincronizados desde Azure · 17/6/2026</span>
        </div>
      </div>
    </div>
  );
}

// ─── Configuración ───────────────────────────────────────────────────────────

function ConfiguracionSection() {
  const [editField, setEditField] = useState<string | null>(null);
  const [periodicidad, setPeriodicidad] = useState("Diario (Nocturno)");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración del Sistema</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Proveedores de licencias y sincronización automática con Banner</p>
      </div>

      {/* Proveedores */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Configuración de Proveedores</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Mapeo de datos entre el sistema local y las APIs externas</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-gray-50 transition-colors">
            <Plus className="w-4 h-4" /> Nuevo Servicio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Adobe Creative Cloud", icon: "AC", mapping: adobeMapping },
            { name: "Minitab", icon: "Mt", mapping: minitabMapping },
          ].map(({ name, icon, mapping }) => (
            <div key={name} className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded bg-emerald-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700">{icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{name}</h3>
              </div>
              <div className="space-y-0">
                <div className="grid grid-cols-2 border-b border-border pb-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Campo Local (Banner)</span>
                  <span className="text-xs font-medium text-muted-foreground">Campo Proveedor API</span>
                </div>
                {mapping.map((m) => (
                  <div key={m.local} className="grid grid-cols-2 items-center py-2 border-b border-border last:border-0">
                    <span className="text-xs font-mono text-muted-foreground">{m.local}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-foreground">{m.api}</span>
                      <button
                        onClick={() => setEditField(editField === `${name}-${m.local}` ? null : `${name}-${m.local}`)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Programador de Tareas */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-base font-semibold text-foreground">Programador de Tareas</h2>
        <p className="text-xs text-muted-foreground mt-0.5 mb-5">Configura la sincronización automática con Banner</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Periodicidad de Sincronización</label>
              <div className="relative">
                <select
                  value={periodicidad}
                  onChange={(e) => setPeriodicidad(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option>Diario (Nocturno)</option>
                  <option>Cada 12 horas</option>
                  <option>Semanal</option>
                  <option>Manual</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-4 py-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Próxima ejecución programada:</span>
              <span className="text-emerald-600 font-semibold">Hoy, 23:59 hrs</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <CalendarDays className="w-16 h-16 text-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

type Role = "admin" | "ejecutor" | "auditor";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  ejecutor: "Ejecutor",
  auditor: "Auditor",
};

const ROLE_INITIALS: Record<Role, string> = {
  admin: "AD",
  ejecutor: "EJ",
  auditor: "AU",
};

const ROLE_SECTIONS: Record<Role, Section[]> = {
  admin:    ["dashboard", "aprovisionar", "reportes", "configuracion"],
  ejecutor: ["aprovisionar", "configuracion"],
  auditor:  ["dashboard", "reportes"],
};

function Sidebar({ section, setSection, role, setRole }: {
  section: Section; setSection: (s: Section) => void;
  role: Role; setRole: (r: Role) => void;
}) {

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full text-white" style={{ backgroundColor: "#0B4D3C" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <img src={tecMilenioLogo} alt="Tecmilenio" className="h-8 w-auto object-contain" />
      </div>

      {/* Rol activo */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-2 mb-2">Rol Activo</p>
        <div className="space-y-0.5">
          {(["admin", "ejecutor", "auditor"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                if (!ROLE_SECTIONS[r].includes(section)) setSection(ROLE_SECTIONS[r][0]);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors"
              style={role === r ? { backgroundColor: "#00B364" } : {}}
              onMouseEnter={(e) => { if (role !== r) (e.currentTarget as HTMLElement).style.backgroundColor = "#167156"; }}
              onMouseLeave={(e) => { if (role !== r) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${role === r ? "bg-white" : "bg-white/30"}`} />
              <span className={role === r ? "text-white font-medium" : "text-white/60"}>{ROLE_LABELS[r]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto border-t border-white/10 mt-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-2 mb-2">Navegación</p>
        {NAV_ITEMS.filter(item => ROLE_SECTIONS[role].includes(item.id)).map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={active ? { backgroundColor: "#00B364" } : {}}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#167156"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                active ? "text-white font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <span className="text-white/60 text-xs">›</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: "#167156" }}>
            {ROLE_INITIALS[role]}
          </div>
          <div>
            <p className="text-xs font-medium text-white leading-tight">{ROLE_LABELS[role]}</p>
            <p className="text-xs text-white/40">uni.edu.mx</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [section, setSection] = useState<Section>("dashboard");
  const [role, setRole] = useState<Role>("admin");

  const content = () => {
    switch (section) {
      case "dashboard": return <DashboardSection />;
      case "aprovisionar": return <AprovisionarSection />;
      case "reportes": return <ReportesSection />;
      case "configuracion": return <ConfiguracionSection />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      <Sidebar section={section} setSection={setSection} role={role} setRole={setRole} />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="px-6 py-6">
          {content()}
        </div>
      </main>
    </div>
  );
}
