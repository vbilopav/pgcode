using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Norm.Extensions;
using Npgsql;

namespace Pgcode.Api
{
    public static class Extensions
    {
        public static async ValueTask<string> GetStringAsync<T>(this NpgsqlConnection connection, string name, T parameters) => 
            await connection.SingleAsync<string>(
                $"select {Program.Settings.PgCodeSchema}.{name}(@_data::json)", 
                JsonSerializer.Serialize(parameters));

        public static async ValueTask VoidAsync<T>(this NpgsqlConnection connection, string name, T parameters) =>
            await connection.ExecuteAsync(
                $"select {Program.Settings.PgCodeSchema}.{name}(@_data::json)",
                JsonSerializer.Serialize(parameters));

        public static async ValueTask<ContentResult> GetContentResultAsync<T>(this NpgsqlConnection connection, string name, T parameters) =>
            new ContentResult
            {
                StatusCode = 200,
                Content = await connection.SingleAsync<string>(
                    $"select {Program.Settings.PgCodeSchema}.{name}(@_data::json)",
                    JsonSerializer.Serialize(parameters)),
                ContentType = "application/javascript; charset=UTF-8"
            };
    }
}