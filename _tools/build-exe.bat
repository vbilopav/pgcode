@echo on

REM building typescript...
call tsc

REM building scripts...
call node _tools\build.js

REM building theme-dark.css...
call node-sass --output-style compressed web/css/theme-dark.scss > _build/css/theme-dark.css

@echo on

REM building theme-light.css...
call node-sass --output-style compressed web/css/theme-light.scss > _build/css/theme-light.css

@echo on

REM starting main build... see more on targets on rid catalog: https://docs.microsoft.com/en-us/dotnet/core/rid-catalog

REM cleaning solution...
dotnet clean app\pgcode.csproj --configuration Release --output "__exe\win10-x64"

REM win build...
dotnet build -r win10-x64 --force --no-incremental --configuration Release app\pgcode.csproj

REM win publish...
dotnet publish -r win10-x64 --configuration Release /p:PublishSingleFile=true /p:PublishTrimmed=true --output "__exe\win10-x64" app\pgcode.csproj

@echo off

REM linux build...
REM dotnet publish -r linux-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\linux-x64" --nologo app\pgcode.csproj

REM osx build...
REM dotnet publish -r osx-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\osx-x64" --nologo app\pgcode.csproj
