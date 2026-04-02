using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Demo02.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRoomType_Final : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BasePrice",
                table: "RoomTypes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "RoomTypes",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BasePrice",
                table: "RoomTypes");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "RoomTypes");
        }
    }
}
