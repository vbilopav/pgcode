@echo off
REM building scripts...
node _tools\build.js

REM statrting build...
REM see more on targets on rid catalog: https://docs.microsoft.com/en-us/dotnet/core/rid-catalog
REM also, check out wrap global tool: https://github.com/Hubert-Rybak/dotnet-warp

REM win build...
dotnet clean app
dotnet publish -r win10-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\win10-x64" --nologo app

REM linux build...
dotnet clean app
dotnet publish -r linux-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\linux-x64" --nologo app

REM osx build...
dotnet clean app
dotnet publish -r osx-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\osx-x64" --nologo app
