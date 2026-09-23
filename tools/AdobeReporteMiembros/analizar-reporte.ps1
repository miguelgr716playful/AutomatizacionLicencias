param(
    [Parameter(Mandatory = $true)]
    [string]$Archivo
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $Archivo)) {
    throw "No existe el archivo: $Archivo"
}

$raw = Get-Content $Archivo -Raw -Encoding UTF8
$data = $raw | ConvertFrom-Json

# Soporta: respuesta UMAPI { users: [] } o array directo de usuarios
$users = @()
if ($data.users) { $users = @($data.users) }
elseif ($data -is [System.Array]) { $users = @($data) }
elseif ($data.user) { $users = @($data.user) }
else { throw "Formato no reconocido. Esperaba JSON con 'users' o un array de usuarios." }

$total = $users.Count
$activos = @($users | Where-Object { $_.status -eq "active" }).Count
$inactivos = @($users | Where-Object { $_.status -eq "inactive" }).Count
$otrosStatus = $total - $activos - $inactivos

$porDominio = $users | Group-Object domain | Sort-Object Count -Descending
$porTipo = $users | Group-Object type | Sort-Object Count -Descending

$profileKeys = @(
    "Alumnos Tecmilenio",
    "Estudiantes Tecmilenio",
    "Colaboradores y Profesores Tecmilenio",
    "GG-UTM-IN",
    "GG-UTM-Empleados",
    "GG-UTM-Profesores",
    "Usuarios Tecmilenio"
)

Write-Host ""
Write-Host "=== Estadisticas Adobe UMAPI ==="
Write-Host "Archivo: $Archivo"
Write-Host "Fecha analisis: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""
Write-Host "Total usuarios: $total"
if ($data.groupName) { Write-Host "groupName: $($data.groupName)" }
if ($null -ne $data.lastPage) { Write-Host "lastPage: $($data.lastPage)" }
Write-Host ""
Write-Host "Por status:"
Write-Host "  active:   $activos"
Write-Host "  inactive: $inactivos"
if ($otrosStatus -gt 0) { Write-Host "  otros:    $otrosStatus" }
Write-Host ""
Write-Host "Por type:"
foreach ($t in $porTipo) { Write-Host ("  {0}: {1}" -f $t.Name, $t.Count) }
Write-Host ""
Write-Host "Por domain:"
foreach ($d in $porDominio) { Write-Host ("  {0}: {1}" -f ($(if ($d.Name) { $d.Name } else { '(vacío)' })), $d.Count) }
Write-Host ""
Write-Host "Membresia en grupos clave:"
foreach ($gk in $profileKeys) {
    $n = @($users | Where-Object { $_.groups -contains $gk }).Count
    if ($n -gt 0) { Write-Host ("  {0}: {1}" -f $gk, $n) }
}

$emailsUnicos = @($users | ForEach-Object { $_.email } | Where-Object { $_ } | Sort-Object -Unique).Count
$duplicados = $total - $emailsUnicos
Write-Host ""
Write-Host "Emails unicos: $emailsUnicos"
if ($duplicados -gt 0) { Write-Host "Posibles duplicados por email: $duplicados" }

if ($data.lastPage -eq $false) {
    Write-Host ""
    Write-Host "ADVERTENCIA: lastPage=false. Este archivo es solo una pagina; faltan mas usuarios."
}

# Referencia cuotas portal (aprox)
Write-Host ""
Write-Host "Referencia cuotas portal:"
Write-Host "  Alumnos Tecmilenio (Estudiantes): ~1824 / 2450"
Write-Host "  Colaboradores y Profesores:       ~469 / 600"
