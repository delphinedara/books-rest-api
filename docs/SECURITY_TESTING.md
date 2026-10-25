# API Security Testing Strategy

## Automated Tests

- 20 Jest and Supertest API tests passing
- 4 C# NUnit, Reqnroll, and RestSharp BDD tests

## Verified Jest Coverage

- Statements: 80.55%
- Branches: 61.53%
- Functions: 80.95%
- Lines: 80.37%

## OWASP API Security Testing

- API2:2023 Broken Authentication
- API5:2023 Broken Function Level Authorization

## Automated Security Tools

- CodeQL: static code analysis
- Gitleaks: secret scanning
- OWASP ZAP: dynamic and authenticated API scanning
- Dependency auditing: known vulnerability checks

## Limitations

Passing tests and scans do not guarantee complete security. Future work includes increasing branch coverage and expanding OWASP test scenarios.
