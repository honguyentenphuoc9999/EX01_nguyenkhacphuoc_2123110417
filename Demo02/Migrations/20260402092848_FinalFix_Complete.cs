using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Demo02.Migrations
{
    /// <inheritdoc />
    public partial class FinalFix_Complete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Staffs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "RoomId",
                table: "Reservations",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "DocumentNumber",
                table: "GuestDocuments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Staffs");

            migrationBuilder.DropColumn(
                name: "RoomId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "DocumentNumber",
                table: "GuestDocuments");
        }
    }
}
