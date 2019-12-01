
REM see more on targets on rid catalog: https://docs.microsoft.com/en-us/dotnet/core/rid-catalog
REM check out wrap global tool: https://github.com/Hubert-Rybak/dotnet-warp

dotnet clean app
dotnet publish -r win10-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\win10-x64" --nologo app
dotnet clean app
dotnet publish -r linux-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\linux-x64" --nologo app
dotnet clean app
dotnet publish -r osx-x64 -c Release /p:PublishSingleFile=true /p:PublishTrimmed=true -o "__exe\osx-x64" --nologo app
