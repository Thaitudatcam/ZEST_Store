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
    $command.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pos_cart' AND COLUMN_NAME='draft_key'"
    $table = New-Object System.Data.DataTable
    $table.Load($command.ExecuteReader())
    Write-Output 'Target: localhost:1433 / PoloShopDB'
    Write-Output "POS draft column present: $($table.Rows.Count)/1"
    if ($Apply) {
        $transaction = $connection.BeginTransaction()
        try {
            $sql = Get-Content -Raw -LiteralPath (Join-Path $projectDir 'src/main/resources/migration/V20260916_01__pos_draft_reservations.sql')
            foreach ($batch in [regex]::Split($sql, '(?im)^GO\s*$')) {
                if ([string]::IsNullOrWhiteSpace($batch)) { continue }
                $command = $connection.CreateCommand()
                $command.Transaction = $transaction
                $command.CommandText = $batch
                $command.CommandTimeout = 30
                [void]$command.ExecuteNonQuery()
            }
            $transaction.Commit()
            Write-Output 'POS draft migration committed. Existing stock quantities unchanged.'
        } catch { $transaction.Rollback(); throw }
    }
} finally { $connection.Dispose() }
