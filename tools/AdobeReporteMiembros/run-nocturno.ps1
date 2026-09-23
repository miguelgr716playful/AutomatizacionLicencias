# Ejecuta AdobeReporteMiembros en ventana horaria (default 02:00–04:30).
# Uso manual:
#   .\run-nocturno.ps1
#   .\run-nocturno.ps1 -Grupo todos -HoraFin "05:00"

param(
    [string]$Grupo = "profesores",
    [string]$HoraInicio = "02:00",
    [string]$HoraFin = "04:30",
    [string]$ProyectoDir = $PSScriptRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log([string]$Message) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$stamp] $Message"
    Write-Host $line
    Add-Content -Path $script:LogFile -Value $line -Encoding UTF8
}

function Get-TimeToday([string]$hhmm) {
    $parts = $hhmm.Split(":")
    if ($parts.Count -ne 2) { throw "Hora inválida: $hhmm (usa HH:mm)" }
    return (Get-Date).Date.AddHours([int]$parts[0]).AddMinutes([int]$parts[1])
}

$logsDir = Join-Path $ProyectoDir "output"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
$script:LogFile = Join-Path $logsDir ("nocturno-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))

$inicioVentana = Get-TimeToday $HoraInicio
$finVentana = Get-TimeToday $HoraFin
$ahora = Get-Date

if ($finVentana -le $inicioVentana) {
    throw "HoraFin debe ser posterior a HoraInicio el mismo día."
}

Write-Log "=== AdobeReporteMiembros (ventana $HoraInicio - $HoraFin) ==="
Write-Log "Grupo: $Grupo"
Write-Log "Proyecto: $ProyectoDir"
Write-Log "Log: $LogFile"

if ($ahora -lt $inicioVentana) {
    $espera = ($inicioVentana - $ahora).TotalSeconds
    Write-Log "Esperando inicio de ventana ($HoraInicio) en $([math]::Round($espera))s..."
    Start-Sleep -Seconds $espera
}
elseif ($ahora -ge $finVentana) {
    Write-Log "Fuera de ventana horaria. No se ejecuta (ahora=$($ahora.ToString('HH:mm')), fin=$HoraFin)."
    exit 0
}
else {
    Write-Log "Dentro de ventana. Iniciando de inmediato."
}

$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd) {
    throw "No se encontró dotnet en PATH."
}
$dotnet = $dotnetCmd.Source

$args = @("run", "--", "--grupo", $Grupo)
Write-Log "Comando: dotnet $($args -join ' ')"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $dotnet
$psi.Arguments = ($args -join " ")
$psi.WorkingDirectory = $ProyectoDir
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi

$stdoutHandler = {
    if ($EventArgs.Data) { Write-Log $EventArgs.Data }
}
$stderrHandler = {
    if ($EventArgs.Data) { Write-Log "ERR: $($EventArgs.Data)" }
}

$proc.add_OutputDataReceived($stdoutHandler)
$proc.add_ErrorDataReceived($stderrHandler)

Write-Log "Proceso iniciado."
[void]$proc.Start()
$proc.BeginOutputReadLine()
$proc.BeginErrorReadLine()

while (-not $proc.HasExited) {
    if ((Get-Date) -ge $finVentana) {
        Write-Log "Hora límite alcanzada ($HoraFin). Deteniendo proceso..."
        try { $proc.Kill($true) } catch { $proc.Kill() }
        break
    }
    Start-Sleep -Seconds 5
}

if (-not $proc.HasExited) {
    $proc.WaitForExit(15000) | Out-Null
}

$exitCode = if ($proc.HasExited) { $proc.ExitCode } else { -1 }
Write-Log "Proceso finalizado. ExitCode=$exitCode"
exit $exitCode
