using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Demo02.Migrations.WarehouseDb
{
    /// <inheritdoc />
    public partial class WarehouseInit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DimGuests",
                columns: table => new
                {
                    GuestKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nationality = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LoyaltyTier = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DimGuests", x => x.GuestKey);
                });

            migrationBuilder.CreateTable(
                name: "DimRooms",
                columns: table => new
                {
                    RoomKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Floor = table.Column<int>(type: "int", nullable: false),
                    TypeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DimRooms", x => x.RoomKey);
                });

            migrationBuilder.CreateTable(
                name: "FactReservations",
                columns: table => new
                {
                    ReservationKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoomKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GuestKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DateKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChannelName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Revenue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Nights = table.Column<int>(type: "int", nullable: false),
                    ADR = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FactReservations", x => x.ReservationKey);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DimGuests");

            migrationBuilder.DropTable(
                name: "DimRooms");

            migrationBuilder.DropTable(
                name: "FactReservations");
        }
    }
}
