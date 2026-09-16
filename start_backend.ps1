Set-Location -LiteralPath $PSScriptRoot
$p = Start-Process -WindowStyle Hidden -FilePath ".\mvnw.cmd" -ArgumentList "spring-boot:run" -WorkingDirectory $PSScriptRoot -RedirectStandardOutput "backend.log" -RedirectStandardError "backend.err" -PassThru
Write-Output "Backend started with PID: $($p.Id)"
