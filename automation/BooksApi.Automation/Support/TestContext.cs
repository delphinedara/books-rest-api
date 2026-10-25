using RestSharp;

namespace BooksApi.Automation.Support;

public class TestContext
{
    public RestResponse? Response { get; set; }

    public string? Token { get; set; }

    public string BaseUrl { get; } =
        Environment.GetEnvironmentVariable("BOOKS_API_URL")
        ?? "http://127.0.0.1:5000";
}
