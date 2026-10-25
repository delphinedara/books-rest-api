[![API Security and Automation CI](https://github.com/delphinedara/books-rest-api/actions/workflows/ci.yml/badge.svg)](https://github.com/delphinedara/books-rest-api/actions/workflows/ci.yml)

# Books REST API — API Security & Test Automation

A security-focused REST API and automated testing project built with **Node.js, Express, PostgreSQL, and C#**.

This project demonstrates practical cybersecurity and software testing skills through the implementation and validation of API security controls, including JWT authentication, role-based access control (RBAC), input validation, security headers, and automated negative testing.

**Career focus:** Cybersecurity Analyst (CySA), Security Analyst, Application Security, QA Automation Engineer, and SDET.

## Technology Stack

| Category | Technologies |
| --- | --- |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (JWT) |
| Authorization | Role-Based Access Control (RBAC) |
| Input Validation | Zod |
| Security Middleware | Helmet, Express Rate Limit |
| JavaScript Testing | Jest, Supertest |
| C# Automation | .NET 10, NUnit, Reqnroll, RestSharp |
| Reporting | Allure (integration planned) |
| Logging | Serilog (integration planned) |
| Version Control | Git, GitHub |

## Project Features

- RESTful API supporting book creation, retrieval, updates, and deletion.
- PostgreSQL database integration with UUID-based book identifiers.
- JWT-based authentication with short-lived tokens.
- Reader and admin role-based authorization.
- Input validation using Zod.
- HTTP security headers using Helmet.
- API rate limiting.
- Separate development and testing databases.
- Automated JavaScript integration tests.
- Automated C# behavior-driven security tests.

## API Security Controls

### JWT Authentication

The API uses JSON Web Tokens to authenticate requests.

- Requests without valid authentication return HTTP `401`.
- Tokens are signed using HS256.
- Token validation includes issuer and audience checks.
- Generated test tokens expire after approximately 15 minutes.

### Role-Based Access Control (RBAC)

Two roles are supported:

- **Reader:** Can retrieve books.
- **Admin:** Can retrieve, create, update, and delete books.

| API Operation | Reader | Admin |
| --- | --- | --- |
| Retrieve all books | Allowed | Allowed |
| Retrieve book by ID | Allowed | Allowed |
| Create book | Denied | Allowed |
| Update book | Denied | Allowed |
| Delete book | Denied | Allowed |

Authenticated users attempting operations outside their permissions receive HTTP `403`.

### Additional Security Measures

- **Input validation:** Zod validates request data.
- **Security headers:** Helmet applies protective HTTP headers.
- **Rate limiting:** Express Rate Limit restricts excessive requests.
- **Negative testing:** Automated tests verify rejected unauthorized and invalid requests.
- **Test isolation:** Automated tests use a dedicated PostgreSQL database.

These measures demonstrate security control implementation and validation, not a guarantee that the API is free of vulnerabilities.

## API Endpoints

Base URL:

`http://127.0.0.1:5000`

| Method | Endpoint | Description | Required Role |
| --- | --- | --- | --- |
| GET | `/api/books` | Retrieve all books | Reader or Admin |
| GET | `/api/books/:id` | Retrieve a book by ID | Reader or Admin |
| POST | `/api/books` | Create a book | Admin |
| PUT | `/api/books/:id` | Update a book | Admin |
| DELETE | `/api/books/:id` | Delete a book | Admin |

### Example Book Request

```json
{
  "name": "Clean Code",
  "author": "Robert C. Martin",
  "category": "Programming",
  "isEasyRead": false
}
```

Book IDs are stored as UUIDs and exposed through the `_id` response field.

## Project Structure

```text
books-rest-api/
├── automation/
│   └── BooksApi.Automation/
│       ├── Features/
│       │   └── BooksSecurity.feature
│       ├── StepDefinitions/
│       │   └── BooksSecuritySteps.cs
│       ├── Support/
│       │   └── TestContext.cs
│       └── BooksApi.Automation.csproj
├── db/
├── models/
├── scripts/
│   └── createToken.js
├── tests/
├── auth.js
├── jest.config.js
├── server.js
├── package.json
└── README.md
```

## Local Setup

### Prerequisites

- Node.js
- PostgreSQL
- .NET 10 SDK (for C# automation)

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd books-rest-api
npm install
```

### 2. Configure PostgreSQL

Create separate development and testing databases:

```sql
CREATE DATABASE books_api;
CREATE DATABASE books_api_test;
```

Ensure the configured PostgreSQL user has access to both databases and that the project database schema is initialized.

### 3. Configure Environment Variables

Create `.env` for development and `.env.test` for automated testing.

Example `.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=books_api
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=replace_with_a_strong_random_secret
JWT_ISSUER=books-api
JWT_AUDIENCE=books-api-client
```

For `.env.test`, use:

```dotenv
DB_NAME=books_api_test
```

Configure the remaining environment variables for your test environment.

**Security:** Never commit `.env`, `.env.test`, database passwords, or JWT signing secrets to GitHub.

### 4. Start the API

```bash
node server.js
```

The API listens at:

`http://127.0.0.1:5000`

## Authentication

Generate a reader token:

```bash
node scripts/createToken.js reader
```

Generate an admin token:

```bash
node scripts/createToken.js admin
```

Include the generated token in API requests:

```http
Authorization: Bearer YOUR_TOKEN
```

Tokens expire after approximately 15 minutes.

## Automated Testing

This project uses two complementary testing approaches:

1. **Jest and Supertest:** API integration and functional testing.
2. **NUnit, Reqnroll, and RestSharp:** C# behavior-driven API security testing.

### JavaScript Integration Tests

The Jest/Supertest suite verifies:

- Authentication
- Role-based authorization
- Input validation
- Security headers
- CRUD functionality
- Expected HTTP responses

Tests run against the isolated `books_api_test` PostgreSQL database.

Run:

```bash
npm test
```

**Last verified result: 10 tests passed.**

### C# BDD API Security Tests

The C# automation framework uses Gherkin feature files and reusable step definitions.

Example scenario:

```gherkin
Scenario: Reader cannot create books
  Given I am authenticated as a reader
  When I attempt to create a book
  Then the response status should be 403
```

Current automated scenarios:

| Scenario | Expected HTTP Status | Result |
| --- | --- | --- |
| Admin retrieves books | 200 | Passed |
| Reader retrieves books | 200 | Passed |
| Reader cannot create books | 403 | Passed |
| Unauthenticated requests are rejected | 401 | Passed |

**Last verified result: 4 tests passed, 0 failed.**

### Running C# Tests

Start the API using the test database in one terminal:

```bash
cd books-rest-api

set -a
source .env.test
set +a

node server.js
```

In another terminal, from the repository root:

```bash
set -a
source .env.test
set +a

export BOOKS_READER_TOKEN="$(node scripts/createToken.js reader)"
export BOOKS_ADMIN_TOKEN="$(node scripts/createToken.js admin)"

cd automation/BooksApi.Automation
dotnet test
```

The API must be running before the C# tests execute.

Regenerate tokens when they expire.

## Security Testing Strategy

The project focuses on repeatable testing of application security controls.

| Security Area | Testing Approach |
| --- | --- |
| Authentication | Verify unauthenticated requests are rejected |
| Authorization | Verify readers cannot perform admin operations |
| Least Privilege | Restrict modification operations to admin users |
| Input Validation | Verify invalid requests are rejected |
| HTTP Security | Validate expected security headers |
| Negative Testing | Confirm expected `4xx` responses |
| Database Isolation | Use a separate database for automated tests |
| Test Automation | Run repeatable JavaScript and C# test suites |

The project demonstrates API security control verification rather than a complete penetration test, vulnerability assessment, or Security Operations Center (SOC) implementation.

## Roadmap

- [x] PostgreSQL integration
- [x] JWT authentication
- [x] Reader/admin role-based access control (RBAC)
- [x] Input validation and security middleware
- [x] HTTP security headers and rate limiting
- [x] Jest/Supertest API integration tests
- [x] C# NUnit/Reqnroll/RestSharp automation framework
- [x] Automated authentication and authorization testing
- [x] Passing C# API security scenarios
- [x] Separate development and testing databases
- [ ] Full C# CRUD automation
- [ ] Automatic test-data cleanup
- [ ] Allure test reporting
- [ ] Structured test logging with Serilog
- [ ] GitHub Actions continuous integration
- [ ] Expanded OWASP API Security Top 10 testing
- [ ] Automated dependency vulnerability scanning
- [ ] Security event logging and monitoring

## Portfolio Purpose

This project demonstrates practical skills in **cybersecurity, API security testing, secure application development, and test automation**, relevant to the following roles:

- Cybersecurity Analyst (CySA)
- Security Analyst
- Application Security Analyst
- Security QA Engineer
- QA Automation Engineer
- Software Development Engineer in Test (SDET)

### Cybersecurity Skills Demonstrated

- **Authentication Security:** Implementing and testing JWT-based authentication to verify that unauthenticated requests are rejected.
- **Access Control and Least Privilege:** Implementing RBAC to restrict sensitive API operations to authorized users.
- **Security Control Validation:** Verifying authentication, authorization, input validation, and HTTP security controls through automated tests.
- **Negative Security Testing:** Testing unauthorized access attempts, insufficient permissions, and invalid API requests.
- **Secure API Development:** Applying security headers, request validation, and rate limiting to reduce common application security risks.
- **Automated Security Testing:** Using C#, NUnit, Reqnroll, RestSharp, Jest, and Supertest to build repeatable API security and functional tests.
- **Database and Environment Isolation:** Separating development and testing environments using PostgreSQL.
- **Security Documentation:** Documenting API security controls, test coverage, expected behavior, and future security improvements.

### Project Objective

The objective of this project is to demonstrate how **secure application development, cybersecurity principles, and automated security testing** work together to identify security weaknesses, validate protective controls, and reduce application security risks.

The project focuses on practical API security engineering and security control verification. It does not represent a complete penetration test or SOC monitoring implementation.