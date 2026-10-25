using TestContext = BooksApi.Automation.Support.TestContext;
using NUnit.Framework;
using Reqnroll;
using RestSharp;

namespace BooksApi.Automation.StepDefinitions;

[Binding]
public class BooksSecuritySteps
{
    private readonly TestContext _context;
    private readonly RestClient _client;

    public BooksSecuritySteps(TestContext context)
    {
        _context = context;
        _client = new RestClient(context.BaseUrl);
    }

    [Given("I have no authentication token")]
    public void GivenNoToken()
    {
        _context.Token = null;
    }

    [Given("I am authenticated as a reader")]
    public void GivenReader()
    {
        _context.Token =
            Environment.GetEnvironmentVariable("BOOKS_READER_TOKEN")
            ?? throw new InvalidOperationException(
                "BOOKS_READER_TOKEN is missing.");
    }

    [Given("I am authenticated as an admin")]
    public void GivenAdmin()
    {
        _context.Token =
            Environment.GetEnvironmentVariable("BOOKS_ADMIN_TOKEN")
            ?? throw new InvalidOperationException(
                "BOOKS_ADMIN_TOKEN is missing.");
    }

    [When("I request all books")]
    public async Task WhenGetAllBooks()
    {
        var request = new RestRequest("/api/books", Method.Get);
        AddAuthorization(request);

        _context.Response = await _client.ExecuteAsync(request);
    }

    [When("I attempt to create a book")]
    public async Task WhenCreateBook()
    {
        var request = new RestRequest("/api/books", Method.Post);
        AddAuthorization(request);

        request.AddJsonBody(new
        {
            name = "Unauthorized Test Book",
            author = "Automation Engineer",
            category = "Security",
            isEasyRead = true
        });

        _context.Response = await _client.ExecuteAsync(request);
    }

    [Then("the response status should be {int}")]
    public void ThenStatusShouldBe(int expectedStatus)
    {
        Assert.That(
            _context.Response,
            Is.Not.Null,
            "No HTTP response was received.");



        Assert.That(
            (int)_context.Response.StatusCode,
            Is.EqualTo(expectedStatus),
            _context.Response.Content);
    }

    private void AddAuthorization(RestRequest request)
    {
        if (!string.IsNullOrWhiteSpace(_context.Token))
        {
            request.AddHeader(
                "Authorization",
                $"Bearer {_context.Token}");
        }
    }
}
