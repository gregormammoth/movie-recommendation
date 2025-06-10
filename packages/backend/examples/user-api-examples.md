# User API Examples

This document provides examples of how to use the User Management API endpoints.

## Create a User

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "message": "User creation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username already exists"
    }
  ]
}
```

## Get User by ID

```bash
curl http://localhost:3001/api/users/123e4567-e89b-12d3-a456-426614174000
```

## Update User

```bash
curl -X PUT http://localhost:3001/api/users/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

## Check Username Availability

```bash
curl http://localhost:3001/api/users/check/username/new_username
```

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "new_username",
    "available": true
  }
}
```

## Get Users with Pagination

```bash
curl "http://localhost:3001/api/users?page=1&limit=10&includeInactive=false"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "john_doe",
      "email": "john@example.com",
      "isActive": true,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Deactivate User

```bash
curl -X DELETE http://localhost:3001/api/users/123e4567-e89b-12d3-a456-426614174000
```

## Reactivate User

```bash
curl -X POST http://localhost:3001/api/users/123e4567-e89b-12d3-a456-426614174000/reactivate
```

## Validation Rules

### Username
- Required field
- 2-50 characters long
- Only letters, numbers, underscores, and dashes allowed
- Must be unique
- Automatically converted to lowercase

### Email
- Optional field
- Must be valid email format
- Must be unique if provided
- Automatically converted to lowercase
- Maximum 255 characters

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Validation error or bad request
- `404` - User not found
- `500` - Internal server error 