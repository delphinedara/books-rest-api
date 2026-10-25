Feature: Books API security
  Verify authentication and authorization for book operations

  Scenario: Unauthenticated requests are rejected
    Given I have no authentication token
    When I request all books
    Then the response status should be 401

  Scenario: Reader can retrieve books
    Given I am authenticated as a reader
    When I request all books
    Then the response status should be 200

  Scenario: Reader cannot create books
    Given I am authenticated as a reader
    When I attempt to create a book
    Then the response status should be 403

  Scenario: Admin can retrieve books
    Given I am authenticated as an admin
    When I request all books
    Then the response status should be 200
