<# 
Export PostgreSQL schema (no data) and generate a deterministic, name-sorted
sequence recreation script for the database.

Outputs (in -OutDir):
  - cps_cci.schema.sql
  - cps_cci.sequences.reorder.sql
  - cps_cci.schema+reseq.sql

Notes:
  - This does NOT "setval()" sequences to match existing data. It's schema-only.
  - Requires `pg_dump` and `psql` in PATH (PostgreSQL client tools).
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$DbName = "cps_cci",

  [Parameter(Mandatory = $false)]
  [string]$DbHost = "",

  [Parameter(Mandatory = $false)]
  [int]$Port = 5432,

  [Parameter(Mandatory = $false)]
  [string]$Username = "",

  [Parameter(Mandatory = $false)]
  [string]$OutDir = "."
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Build-PgArgs([string[]]$BaseArgs) {
  $args = New-Object System.Collections.Generic.List[string]
  $args.AddRange($BaseArgs)
  if ($DbHost -and $DbHost.Trim().Length -gt 0) { $args.Add("--host=$DbHost") }
  if ($Port -gt 0) { $args.Add("--port=$Port") }
  if ($Username -and $Username.Trim().Length -gt 0) { $args.Add("--username=$Username") }
  return ,$args.ToArray()
}

Ensure-Dir $OutDir

$schemaFile = Join-Path $OutDir "$DbName.schema.sql"
$seqFile = Join-Path $OutDir "$DbName.sequences.reorder.sql"
$combinedFile = Join-Path $OutDir "$DbName.schema+reseq.sql"

Write-Host "Exporting schema-only to $schemaFile"
$pgDumpArgs = Build-PgArgs @(
  "--schema-only",
  "--no-owner",
  "--no-privileges",
  "--dbname=$DbName",
  "--file=$schemaFile"
)
& pg_dump @pgDumpArgs
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }

Write-Host "Generating deterministic sequence script to $seqFile"
$sql = @"
WITH seq AS (
  SELECT
    schemaname,
    sequencename,
    start_value,
    increment_by,
    min_value,
    max_value,
    cache_size,
    cycle
  FROM pg_sequences
  WHERE schemaname NOT IN ('pg_catalog','information_schema')
)
SELECT
  '-- Reordered sequences: ' || quote_ident(schemaname) || '.' || quote_ident(sequencename) || E'\n' ||
  'DROP SEQUENCE IF EXISTS ' || quote_ident(schemaname) || '.' || quote_ident(sequencename) || ' CASCADE;' || E'\n' ||
  'CREATE SEQUENCE ' || quote_ident(schemaname) || '.' || quote_ident(sequencename) ||
  ' INCREMENT BY ' || increment_by ||
  ' MINVALUE ' || min_value ||
  ' MAXVALUE ' || max_value ||
  ' START WITH ' || start_value ||
  ' CACHE ' || cache_size ||
  CASE WHEN cycle THEN ' CYCLE;' ELSE ' NO CYCLE;' END || E'\n'
FROM seq
ORDER BY schemaname, sequencename;
"@

$psqlArgs = Build-PgArgs @(
  "--dbname=$DbName",
  "-v", "ON_ERROR_STOP=1",
  "-A",
  "-t",
  "-c", $sql
)

$generated = & psql @psqlArgs
if ($LASTEXITCODE -ne 0) { throw "psql failed with exit code $LASTEXITCODE" }

Set-Content -LiteralPath $seqFile -Value ($generated -join "`n") -Encoding UTF8

Write-Host "Combining into $combinedFile"
$schemaContent = Get-Content -LiteralPath $schemaFile -Raw -Encoding UTF8
$seqContent = Get-Content -LiteralPath $seqFile -Raw -Encoding UTF8
Set-Content -LiteralPath $combinedFile -Value ($schemaContent + "`n" + $seqContent) -Encoding UTF8

Write-Host "Done."
