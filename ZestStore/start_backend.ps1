Set-Location -LiteralPath "D:\ZEST_Store\ZEST_Store\ZestStore"
$p = Start-Process -NoNewWindow -FilePath ".\mvnw.cmd" -ArgumentList "spring-boot:run" -RedirectStandardOutput "backend.log" -RedirectStandardError "backend.err" -PassThru
Write-Output "Backend started with PID: $($p.Id)"
