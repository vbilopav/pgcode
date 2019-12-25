@echo off
REM building css...
call node-sass --output-style compressed web/css/theme-dark.scss ^> web/css/theme-dark.css
call node-sass --output-style compressed web/css/theme-light.scss ^> web/css/theme-light.css

REM building scripts...
node _tools\build.js


REM statrting build...
REM see more on targets on rid catalog: https://docs.microsoft.com/en-us/dotnet/core/rid-catalog
REM also, check out wrap global tool: https://github.com/Hubert-Rybak/dotnet-warp

REM win build...
dotnet clean app\pgcode.csproj
dotnet publish -r win10-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\win10-x64" --nologo app\pgcode.csproj

REM linux build...
dotnet clean app\pgcode.csproj
dotnet publish -r linux-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\linux-x64" --nologo app\pgcode.csproj

REM osx build...
dotnet clean app\pgcode.csproj
dotnet publish -r osx-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\osx-x64" --nologo app\pgcode.csproj
