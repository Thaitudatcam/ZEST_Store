param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$projectDir = Split-Path $PSScriptRoot -Parent
$settings = @{}
foreach ($name in @('application.properties', 'application-local.properties')) {
    $file = Join-Path $projectDir "src/main/resources/$name"
    if (Test-Path -LiteralPath $file) {
        foreach ($line in Get-Content -LiteralPath $file) {
            if ($line -match '^\s*([^#!\s][^=]*)=(.*)$') { $settings[$Matches[1].Trim()] = $Matches[2].Trim() }
        }
    }
}
function Resolve-Setting([string]$value) {
    if ($value -match '^\$\{([^:}]+)(?::(.*))?\}$') {
        $envValue = [Environment]::GetEnvironmentVariable($Matches[1])
        if ($envValue) { return $envValue }
        return $Matches[2]
    }
    return $value
}
$jdbcUrl = Resolve-Setting $settings['spring.datasource.url']
if ($jdbcUrl -notmatch '^jdbc:sqlserver://localhost:1433;' -or $jdbcUrl -notmatch 'databaseName=PoloShopDB(?:;|$)') { throw 'Unexpected database target; no changes made.' }
$builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
$builder['Data Source'] = 'localhost,1433'; $builder['Initial Catalog'] = 'PoloShopDB'; $builder['Encrypt'] = $true; $builder['TrustServerCertificate'] = $true; $builder['Connect Timeout'] = 10
$builder['User ID'] = Resolve-Setting $settings['spring.datasource.username']; $builder['Password'] = Resolve-Setting $settings['spring.datasource.password']
$connection = New-Object System.Data.SqlClient.SqlConnection $builder.ConnectionString
try {
    $connection.Open()
    $command = $connection.CreateCommand(); $command.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='lich_su_don_hang' AND COLUMN_NAME='khach_hang_xem'"
    $table = New-Object System.Data.DataTable; $table.Load($command.ExecuteReader())
    Write-Output "Target: localhost:1433 / PoloShopDB; visibility column present: $($table.Rows.Count)/1"
    if ($Apply -and $table.Rows.Count -eq 0) {
        $command = $connection.CreateCommand(); $command.CommandText = "ALTER TABLE dbo.lich_su_don_hang ADD khach_hang_xem BIT NULL"; [void]$command.ExecuteNonQuery()
        Write-Output 'Order note visibility migration committed.'
    }
} finally { $connection.Dispose() }
