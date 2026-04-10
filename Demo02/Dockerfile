FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Demo02.csproj", "./"]
RUN dotnet restore "Demo02.csproj"
COPY . .
RUN dotnet build "Demo02.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Demo02.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Demo02.dll"]
