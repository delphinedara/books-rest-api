# Books REST API — API Security & Test Automation

A security-focused REST API built with **Node.js, Express, and PostgreSQL**, with automated API testing in **JavaScript and C#**. The project combines secure API development, authentication and authorization testing, and automated security checks through GitHub Actions.

## Project Highlights

- **REST API:** Create, retrieve, update, and delete books stored in PostgreSQL.
- **Access control:** JWT authentication and reader/admin role-based authorization.
- **Secure development:** Zod input validation, parameterized SQL, Helmet security headers, and API rate limiting.
- **Automated tests:** 20 Jest/Supertest tests and 4 C# NUnit/Reqnroll/RestSharp BDD tests.
- **OWASP-aligned testing:** Automated checks targeting API2:2023 (Broken Authentication) and API5:2023 (Broken Function Level Authorization).
- **DevSecOps:** GitHub Actions CI, CodeQL, Gitleaks, dependency auditing, and authenticated OWASP ZAP baseline scanning.
- **Versioned release:** [v1.0.0](https://github.com/delphinedara/books-rest-api/releases/tag/v1.0.0).

## Technology Stack

| Area | Technology |
| --- | --- |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Authentication and authorization | JWT (HS256), role-based access control (RBAC) |
| Request validation | Zod |
| HTTP security | Helmet, express-rate-limit |
| JavaScript testing | Jest, Supertest |
| C# BDD testing | .NET 10, NUnit, Reqnroll, RestSharp |
| Security scanning | CodeQL, Gitleaks, OWASP ZAP, dependency auditing |
| CI/CD | GitHub Actions |

## Architecture and Security Documentation

- [System architecture](docs/ARCHITECTURE.md)
- [Security testing strategy](docs/SECURITY_TESTING.md)
- [Security policy and vulnerability reporting](SECURITY.md)

The API validates authentication and permissions before allowing protected operations. Request bodies are validated before database writes, and PostgreSQL queries use parameters rather than concatenating untrusted input.

### Authentication and Authorization

Requests to protected endpoints require a JWT in the `Authorization` header:

```http
Authorization: Bearer YOUR_TOKEN
```

The API validates token signatures, expiration, issuer (`books-api`), and audience (`books-api-client`). Generated test tokens expire after approximately **15 minutes**.

| Operation | Reader | Admin |
| --- | --- | --- |
| Retrieve all books | Allowed | Allowed |
| Retrieve a book by ID | Allowed | Allowed |
| Create a book | Denied | Allowed |
| Update a book | Denied | Allowed |
| Delete a book | Denied | Allowed |

Requests without valid authentication return **HTTP 401**. Authenticated users attempting operations outside their role receive **HTTP 403**.

## API Endpoints

The API listens locally at `http://127.0.0.1:5000` by default.

| Method | Endpoint | Purpose | Required role |
| --- | --- | --- | --- |
| GET | `/api/books` | List books | Reader or Admin |
| GET | `/api/books/:id` | Retrieve a book | Reader or Admin |
| POST | `/api/books` | Create a book | Admin |
| PUT | `/api/books/:id` | Update a book | Admin |
| DELETE | `/api/books/:id` | Delete a book | Admin |

Example request body for creating a book:

```json
{
  "name": "Clean Code",
  "author": "Robert C. Martin",
  "category": "Programming",
  "isEasyRead": false
}
```

Book identifiers are stored as UUIDs and returned in the `_id` field.

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- .NET 10 SDK (only required to run the C# BDD tests)

### 1. Clone and install

```bash
git clone https://github.com/delphinedara/books-rest-api.git
cd books-rest-api
npm install
```

### 2. Prepare PostgreSQL

Create separate development and test databases:

```sql
CREATE DATABASE books_api;
CREATE DATABASE books_api_test;
```

Ensure the configured PostgreSQL user can access both databases. Initialize the schema using the SQL resources in [`db/`](db/), as appropriate for your local PostgreSQL setup.

### 3. Configure environment variables

Create a private `.env` file for local development:

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

Create a separate private `.env.test` with the same required settings, but use:

```dotenv
DB_NAME=books_api_test
```

Use a strong, private JWT signing secret. **Never commit `.env`, `.env.test`, database credentials, or JWT secrets.**

### 4. Start the API

```bash
node server.js
```

The default local address is:

```text
http://127.0.0.1:5000
```

### 5. Generate authentication tokens

In a terminal configured with the appropriate environment variables:

```bash
node scripts/createToken.js reader
node scripts/createToken.js admin
```

Pass the generated token in the `Authorization: Bearer YOUR_TOKEN` header when calling protected endpoints. Regenerate tokens when they expire.

## Automated Testing

The project uses two complementary API testing approaches: JavaScript integration tests and C# behavior-driven tests. Tests use a dedicated PostgreSQL test database to avoid modifying development data.

### JavaScript — Jest and Supertest

The JavaScript suite checks CRUD behavior, authentication, role-based permissions, request validation, security headers, and expected HTTP responses.

Run the tests:

```bash
npm test
```

Run tests with coverage reporting:

```bash
npm run test:coverage
```

### C# — NUnit, Reqnroll, and RestSharp

The C# suite uses Gherkin scenarios and reusable step definitions. Verified scenarios include:

| Scenario | Expected result |
| --- | --- |
| Admin retrieves books | HTTP 200 |
| Reader retrieves books | HTTP 200 |
| Reader cannot create books | HTTP 403 |
| Unauthenticated request is rejected | HTTP 401 |

To run the C# suite locally, first start the API against the **test** database in one terminal:

```bash
set -a
source .env.test
set +a
node server.js
```

In a second terminal, from the repository root:

```bash
set -a
source .env.test
set +a
export BOOKS_READER_TOKEN="$(node scripts/createToken.js reader)"
export BOOKS_ADMIN_TOKEN="$(node scripts/createToken.js admin)"
cd automation/BooksApi.Automation
dotnet test
```

The API must be running for the C# tests. Tokens expire after approximately 15 minutes.

### Verified Test Results

| Metric | Result |
| --- | ---: |
| Jest/Supertest tests | 20 passed |
| C# BDD tests | 4 passed |
| Jest statement coverage | 80.55% |
| Jest branch coverage | 61.53% |
| Jest function coverage | 80.95% |
| Jest line coverage | 80.37% |

Coverage figures are from a verified local Jest run. Coverage measures code execution, not security assurance.

## Continuous Integration and Security Scanning

GitHub Actions automates testing and security checks across four workflows:

| Workflow | Purpose |
| --- | --- |
| CI | PostgreSQL-backed JavaScript and C# tests, dependency auditing, and Jest coverage artifact |
| CodeQL | Static application security analysis (SAST) |
| Gitleaks | Detection of potential secrets in Git history |
| OWASP ZAP | Baseline dynamic security scanning (DAST), including authenticated requests using a reader JWT |

The repository uses feature branches, pull requests, and checks on a protected `master` branch to validate changes before merging.

## Security Testing Scope

Automated tests include checks aligned with **OWASP API2:2023 — Broken Authentication** and **OWASP API5:2023 — Broken Function Level Authorization**. The project also verifies input validation, HTTP security headers, and expected rejection responses.

Security tools have different capabilities and limitations. Passing tests and scans does **not** establish that the application is free of vulnerabilities or constitute a comprehensive penetration test.

For architecture details, test scope, and vulnerability reporting, see the [architecture](docs/ARCHITECTURE.md), [security testing](docs/SECURITY_TESTING.md), and [security policy](SECURITY.md) documents.
