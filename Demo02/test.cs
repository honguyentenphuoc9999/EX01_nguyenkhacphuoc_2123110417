using System;
using System.Text.Json.Nodes;

var json = JsonNode.Parse("{\"imageUrl\":\"https://cloudinary.com/abcd\"}");
var imgNode = json["imageUrl"];
Console.WriteLine(imgNode?.ToString());
Console.WriteLine($"Length: {imgNode?.ToString()?.Length}");
