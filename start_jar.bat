@echo off
cd /d "%~dp0"
start /B java -jar "%~dp0target\ZestStore-0.0.1-SNAPSHOT.jar" > "%~dp0boot_jar.log" 2>&1
echo Started
