# Proposed API Contract

Base path example: `/api/v1`

## Authentication

### POST `/auth/login`
Request:
```json
{"email":"tech@example.com","password":"..."}
```
Response:
```json
{"accessToken":"...","technician":{"id":"tech_123","name":"Technician Name"}}
```

## Work orders

### GET `/work-orders?assignedTo=me&status=scheduled,in_progress`
Returns technician-assigned work orders.

### GET `/work-orders/{id}`
Returns customer/property, complaint, service address, and equipment if already known.

## Service reports

### POST `/service-reports`
Creates a draft service report.

### PATCH `/service-reports/{id}`
Autosaves partial form data.

### POST `/service-reports/{id}/photos`
Multipart upload for one or more photos. Store category, caption, timestamp, and equipment ID.

### POST `/service-reports/{id}/submit`
Validates required fields, records final server timestamp, and locks the report for normal editing.

### GET `/service-reports/{id}`
Retrieves the full report.

### GET `/service-reports/{id}/pdf`
Returns or redirects to the generated service-report PDF.

## Suggested error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required fields are missing.",
    "fields": ["workOrderId", "systemStatus"]
  }
}
```
