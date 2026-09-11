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
if ($jdbcUrl -notmatch '^jdbc:sqlserver://localhost:1433;' -or $jdbcUrl -notmatch 'databaseName=PoloShopDB(?:;|$)') {
    throw 'Unexpected database target; no changes made.'
}
$builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
$builder['Data Source'] = 'localhost,1433'
$builder['Initial Catalog'] = 'PoloShopDB'
$builder['Encrypt'] = $true
$builder['TrustServerCertificate'] = $true
$builder['Connect Timeout'] = 10
$builder['User ID'] = Resolve-Setting $settings['spring.datasource.username']
$builder['Password'] = Resolve-Setting $settings['spring.datasource.password']
$connection = New-Object System.Data.SqlClient.SqlConnection $builder.ConnectionString
try {
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT DB_NAME() AS database_name, TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE (TABLE_NAME='don_hang' AND COLUMN_NAME IN ('checkout_key','stock_state')) OR (TABLE_NAME='thanh_toan' AND COLUMN_NAME IN ('gateway_transaction_id','refunded'))"
    $table = New-Object System.Data.DataTable
    $table.Load($command.ExecuteReader())
    Write-Output 'Target: localhost:1433 / PoloShopDB'
    Write-Output "Inventory columns present: $($table.Rows.Count)/4"
    if ($Apply) {
        $transaction = $connection.BeginTransaction()
        try {
            $sql = Get-Content -Raw -LiteralPath (Join-Path $projectDir 'src/main/resources/migration/V20260909_01__inventory_lifecycle.sql')
            foreach ($batch in [regex]::Split($sql, '(?im)^GO\s*$')) {
                if ([string]::IsNullOrWhiteSpace($batch)) { continue }
                $command = $connection.CreateCommand()
                $command.Transaction = $transaction
                $command.CommandText = $batch
                $command.CommandTimeout = 30
                [void]$command.ExecuteNonQuery()
            }
            $transaction.Commit()
            Write-Output 'Inventory migration committed. Stock quantities and wallet balances unchanged.'
        } catch { $transaction.Rollback(); throw }
    }
} finally { $connection.Dispose() }

