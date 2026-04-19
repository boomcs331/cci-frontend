<#
Export PostgreSQL schema-only SQL and import to a new database.

Examples:
  # 1) Export only
  powershell -ExecutionPolicy Bypass -File .\scripts\pg-schema-only-export-import.ps1 `
    -Action export -SourceDb "cps_cci" -OutFile ".\cps_cci_structure.sql"

  # 2) Import to new DB (DB must already exist)
  powershell -ExecutionPolicy Bypass -File .\scripts\pg-schema-only-export-import.ps1 `
    -Action import -TargetDb "cps_cci_new" -InFile ".\cps_cci_structure.sql"

  # 3) Export + Import in one run
  powershell -ExecutionPolicy Bypass -File .\scripts\pg-schema-only-export-import.ps1 `
    -Action both -SourceDb "cps_cci" -TargetDb "cps_cci_new"
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [ValidateSet("export", "import", "both")]
  [string]$Action = "export",

  [Parameter(Mandatory = $false)]
  [string]$DbHost = "",

  [Parameter(Mandatory = $false)]
  [int]$Port = 5432,

  [Parameter(Mandatory = $false)]
  [string]$Username = "",

  [Parameter(Mandatory = $false)]
  [string]$SourceDb = "cps_cci",

  [Parameter(Mandatory = $false)]
  [string]$TargetDb = "cps_cci_new",

  [Parameter(Mandatory = $false)]
  [string]$OutFile = ".\cps_cci_structure.sql",

  [Parameter(Mandatory = $false)]
  [string]$InFile = ".\cps_cci_structure.sql",

  [Parameter(Mandatory = $false)]
  [string]$PgBinDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-CmdPath([string]$exeName) {
  if ($PgBinDir -and $PgBinDir.Trim().Length -gt 0) {
    $candidate = Join-Path $PgBinDir $exeName
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  $cmd = Get-Command $exeName -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  throw "Cannot find $exeName. Add PostgreSQL bin to PATH or pass -PgBinDir."
}

function New-CommonPgArgs() {
  $pgArgs = New-Object System.Collections.Generic.List[string]
  if ($DbHost -and $DbHost.Trim().Length -gt 0) { $pgArgs.Add("--host=$DbHost") }
  if ($Port -gt 0) { $pgArgs.Add("--port=$Port") }
  if ($Username -and $Username.Trim().Length -gt 0) { $pgArgs.Add("--username=$Username") }
  return ,$pgArgs.ToArray()
}

$pgDumpExe = Get-CmdPath "pg_dump.exe"
$psqlExe = Get-CmdPath "psql.exe"
$commonArgs = New-CommonPgArgs

if ($Action -eq "export" -or $Action -eq "both") {
  Write-Host "Exporting schema-only from '$SourceDb' to '$OutFile'"
  $dumpArgs = New-Object System.Collections.Generic.List[string]
  $dumpArgs.AddRange($commonArgs)
  $dumpArgs.Add("--schema-only")
  $dumpArgs.Add("--no-owner")
  $dumpArgs.Add("--no-privileges")
  $dumpArgs.Add("--format=plain")
  $dumpArgs.Add("--encoding=UTF8")
  $dumpArgs.Add("--dbname=$SourceDb")
  $dumpArgs.Add("--file=$OutFile")

  & $pgDumpExe @dumpArgs
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
}

if ($Action -eq "import" -or $Action -eq "both") {
  if ($Action -eq "import" -and -not (Test-Path -LiteralPath $InFile)) {
    throw "Input file not found: $InFile"
  }
  $sqlFile = if ($Action -eq "both") { $OutFile } else { $InFile }

  Write-Host "Importing schema SQL '$sqlFile' into '$TargetDb'"
  $importArgs = New-Object System.Collections.Generic.List[string]
  $importArgs.AddRange($commonArgs)
  $importArgs.Add("--set=ON_ERROR_STOP=1")
  $importArgs.Add("--dbname=$TargetDb")
  $importArgs.Add("--file=$sqlFile")

  & $psqlExe @importArgs
  if ($LASTEXITCODE -ne 0) { throw "psql import failed with exit code $LASTEXITCODE" }
}

Write-Host "Done."
