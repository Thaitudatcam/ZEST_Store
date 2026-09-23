param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$settings = @{}
foreach ($name in @('application.properties', 'application-local.properties')) {
    foreach ($line in Get-Content (Join-Path $PSScriptRoot "../src/main/resources/$name")) {
        if ($line -match '^\s*([^#!\s][^=]*)=(.*)$') { $settings[$Matches[1].Trim()] = $Matches[2].Trim() }
    }
}
function Resolve-Setting([string]$value) {
    if ($value -match '^\$\{([^:}]+)(?::(.*))?\}$') {
        $found = [Environment]::GetEnvironmentVariable($Matches[1])
        if ($found) { return $found }
        return $Matches[2]
    }
    return $value
}
$url = Resolve-Setting $settings['spring.datasource.url']
if ($url -notmatch '^jdbc:sqlserver://localhost:1433;' -or $url -notmatch 'databaseName=PoloShopDB(?:;|$)') { throw 'Unexpected database target' }
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
    $command.CommandText = 'SELECT COUNT(*) FROM dbo.bien_the_san_pham WHERE trang_thai IS NULL AND ngay_xoa IS NULL'
    Write-Output ('Legacy active variants missing status: ' + $command.ExecuteScalar())
    if ($Apply) {
        $command.CommandText = 'UPDATE dbo.bien_the_san_pham SET trang_thai = 1 WHERE trang_thai IS NULL AND ngay_xoa IS NULL'
        Write-Output ('Repaired variants: ' + $command.ExecuteNonQuery())
    }
} finally { $connection.Dispose() }
