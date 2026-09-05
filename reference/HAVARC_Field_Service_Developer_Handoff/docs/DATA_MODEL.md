# Data Model

## Technician
- id
- name
- email
- active

## WorkOrder
- id
- externalWorkOrderNumber
- customerName
- propertyName
- serviceAddress
- unitSuite
- complaint
- assignedTechnicianId
- scheduledAt
- status

## Equipment
- id
- workOrderId or propertyId
- equipmentTag
- equipmentType
- manufacturer
- modelNumber
- serialNumber
- tonnage
- refrigerantType
- voltagePhase
- filterSize
- location

## ServiceReport
- id
- workOrderId
- technicianId
- status
- arrivalTime
- departureTime
- serviceTypes[]
- complaint
- airflowReadings{}
- electricalReadings{}
- refrigerantReadings{}
- conditionChecks[]
- findings[]
- repairs[]
- materialsUsed
- technicianNotes
- recommendations[]
- recommendedWork
- systemStatus
- customerRepresentativeName
- customerSignatureFileId
- technicianSignatureFileId
- submittedAt
- createdAt
- updatedAt

## Photo
- id
- serviceReportId
- fileUrl
- category
- caption
- capturedAt
- uploadedAt

## AuditEvent
- id
- serviceReportId
- actorId
- action
- createdAt
- metadata
