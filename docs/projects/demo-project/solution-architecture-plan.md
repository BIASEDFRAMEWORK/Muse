# Solution Architecture Plan: PII Redaction and Concealment Service

**Epic:** EPIC-47BE9E5C-03 - Enforce Privacy Act Compliance and Access Controls  
**Feature:** Automate PII Redaction and Concealment  
**Architect:** GitHub Copilot CLI  
**Created:** 2026-02-02  
**For:** Development Team Planning Session

---

## Executive Summary

This plan provides a detailed technical design for a **standalone PII Redaction Service** that integrates with the Muse platform. The service will automatically detect, redact, and audit personally identifiable information (PII) in documents before external transfer, ensuring Privacy Act compliance as outlined in governance document `recguide20111`.

### Feature Scope
- **Story 01:** PII Detection Engine - Pattern-based PII scanning with confidence scoring
- **Story 02:** Automated Redaction Processing - Document redaction with content preservation
- **Story 03:** Redaction Audit Trail - Comprehensive logging and searchability
- **Story 04:** Transfer Prevention Controls - Threshold-based transfer blocking

---

## Architecture Overview

### System Context

```
┌─────────────────┐
│   Muse Web UI   │
│  (apps/web)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────────────────┐
│   Muse API      │◄─────►│  PII Redaction Service   │
│ (services/api)  │       │    (Standalone)          │
└─────────────────┘       └──────────┬───────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                     ┌────▼─────┐         ┌────▼─────┐
                     │ MinIO    │         │ Postgres │
                     │ Storage  │         │  Audit   │
                     └──────────┘         └──────────┘
```

### Integration Points
1. **Muse API** exposes document transfer endpoints that delegate to PII service
2. **MinIO** stores original and redacted document versions (existing infrastructure)
3. **Postgres** stores audit logs (shared or dedicated schema)
4. **Redis** (optional) for async job status tracking

---

## Workplan

### Phase 1: Foundation & Setup
- [ ] **1.1** Create new service directory structure: `services/pii-redaction/`
- [ ] **1.2** Initialize Node.js + TypeScript project with Express
- [ ] **1.3** Configure Docker container and add to `docker-compose.yml`
- [ ] **1.4** Set up health check endpoint: `GET /health`
- [ ] **1.5** Create database schema for audit logs (migration script)
- [ ] **1.6** Define OpenAPI contract in `contracts/pii-redaction.yaml`

### Phase 2: PII Detection Engine (Story 01)
- [ ] **2.1** Design PII detection module architecture
  - Pattern matchers for SSN, phone, address, DOB
  - Confidence scoring algorithm (0-100)
  - Plugin architecture for extensibility
- [ ] **2.2** Implement SSN pattern detection (XXX-XX-XXXX variants)
- [ ] **2.3** Implement configurable PII element detection (name, address, phone, DOB)
- [ ] **2.4** Build confidence scoring engine
- [ ] **2.5** Create API endpoint: `POST /api/v1/detect`
  - Input: document reference (MinIO path) or raw text
  - Output: detected PII elements with confidence scores
- [ ] **2.6** Add unit tests for pattern matching edge cases
- [ ] **2.7** Document detection algorithms and thresholds

### Phase 3: Automated Redaction Processing (Story 02)
- [ ] **3.1** Design redaction processor module
  - Document format handlers (PDF, DOCX, TXT)
  - Coordinate-based redaction (preserve layout)
  - Configurable replacement strategies (black box, asterisks, placeholder text)
- [ ] **3.2** Implement document cloning (preserve original)
- [ ] **3.3** Build redaction engine for detected PII coordinates
- [ ] **3.4** Add document structure preservation logic
- [ ] **3.5** Create API endpoint: `POST /api/v1/redact`
  - Input: document reference, detection results, threshold config
  - Output: redacted document reference + redaction metadata
- [ ] **3.6** Add integration tests with sample documents
- [ ] **3.7** Handle edge cases (overlapping redactions, multi-page documents)

### Phase 4: Redaction Audit Trail (Story 03)
- [ ] **4.1** Design audit log database schema
  - Tables: `redaction_events`, `document_versions`, `pii_detections`
  - Indexes: timestamp, document_id, destination, user_id
- [ ] **4.2** Implement audit event capture middleware
- [ ] **4.3** Store document version references (original + redacted MinIO paths)
- [ ] **4.4** Log PII detection details with confidence scores
- [ ] **4.5** Create API endpoint: `GET /api/v1/audit/logs`
  - Query params: date_range, document_id, destination
  - Output: paginated audit log entries
- [ ] **4.6** Add search and filter capabilities
- [ ] **4.7** Implement data retention policy (configurable via env vars)

### Phase 5: Transfer Prevention Controls (Story 04)
- [ ] **5.1** Design threshold configuration service
  - Default: 80% confidence threshold
  - Configurable range: 70-100%
  - Role-based access control for threshold changes
- [ ] **5.2** Implement transfer validation logic
  - Check detection confidence against threshold
  - Generate clear error messages with document identifiers
- [ ] **5.3** Create API endpoint: `POST /api/v1/transfer/validate`
  - Input: document references, destination metadata
  - Output: validation result (allowed/blocked + reasons)
- [ ] **5.4** Log blocked transfer attempts
- [ ] **5.5** Create API endpoint: `PUT /api/v1/config/threshold` (admin only)
- [ ] **5.6** Add rate limiting and abuse prevention
- [ ] **5.7** Document error codes and user messaging

### Phase 6: Muse API Integration
- [ ] **6.1** Add PII service client to `services/api/`
- [ ] **6.2** Create new API route: `POST /api/documents/transfer`
  - Calls PII service for detection + validation
  - Triggers redaction if needed
  - Returns transfer status or redacted document
- [ ] **6.3** Update Muse Web UI to display transfer status
- [ ] **6.4** Add configuration UI for threshold settings (admin panel)
- [ ] **6.5** Implement audit log viewer in Muse Web
- [ ] **6.6** End-to-end integration testing

### Phase 7: Testing & Compliance
- [ ] **7.1** Create comprehensive test suite
  - Unit tests for detection, redaction, audit modules
  - Integration tests for API workflows
  - E2E tests simulating document transfers
- [ ] **7.2** Performance testing (handle 100+ page documents)
- [ ] **7.3** Security review (OWASP top 10)
- [ ] **7.4** Compliance validation against governance references
  - sec-47be9e5c-144-5fc01bfe
  - sec-47be9e5c-182-62d0c42d
  - sec-47be9e5c-193-ef19c5cd
  - sec-47be9e5c-889-41dccc37
- [ ] **7.5** Document security controls and audit procedures
- [ ] **7.6** Smoke test script integration (`scripts/pii_smoke_test.sh`)

### Phase 8: Documentation & Deployment
- [ ] **8.1** Write API documentation (OpenAPI + usage examples)
- [ ] **8.2** Create runbook for operations team
- [ ] **8.3** Document configuration options and env vars
- [ ] **8.4** Add architecture diagrams to `docs/architecture/pii-service.md`
- [ ] **8.5** Production deployment checklist
- [ ] **8.6** Rollback procedures and incident response plan

---

## Technical Design

### 1. Service Architecture

#### Technology Stack
- **Runtime:** Node.js 20.x LTS
- **Framework:** Express.js (consistent with Muse API)
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15 (shared Muse instance)
- **Storage:** MinIO (existing Muse storage)
- **Testing:** Jest + Supertest
- **Documentation:** OpenAPI 3.1

#### Directory Structure
```
services/pii-redaction/
├── src/
│   ├── index.ts                    # Express app entry point
│   ├── config/
│   │   ├── database.ts             # Postgres connection
│   │   ├── storage.ts              # MinIO client
│   │   └── app.config.ts           # Service configuration
│   ├── modules/
│   │   ├── detection/
│   │   │   ├── detectors/
│   │   │   │   ├── ssn.detector.ts
│   │   │   │   ├── name.detector.ts
│   │   │   │   ├── address.detector.ts
│   │   │   │   ├── phone.detector.ts
│   │   │   │   └── dob.detector.ts
│   │   │   ├── confidence-scorer.ts
│   │   │   └── detection.service.ts
│   │   ├── redaction/
│   │   │   ├── processors/
│   │   │   │   ├── pdf.processor.ts
│   │   │   │   ├── docx.processor.ts
│   │   │   │   └── text.processor.ts
│   │   │   ├── redaction-engine.ts
│   │   │   └── redaction.service.ts
│   │   ├── audit/
│   │   │   ├── audit-logger.ts
│   │   │   ├── audit.repository.ts
│   │   │   └── audit.service.ts
│   │   └── validation/
│   │       ├── threshold-manager.ts
│   │       └── transfer-validator.ts
│   ├── routes/
│   │   ├── detection.routes.ts     # POST /api/v1/detect
│   │   ├── redaction.routes.ts     # POST /api/v1/redact
│   │   ├── audit.routes.ts         # GET /api/v1/audit/logs
│   │   ├── transfer.routes.ts      # POST /api/v1/transfer/validate
│   │   └── config.routes.ts        # PUT /api/v1/config/threshold
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT validation
│   │   ├── audit.middleware.ts     # Auto-capture events
│   │   └── error.middleware.ts     # Error handling
│   └── types/
│       ├── detection.types.ts
│       ├── redaction.types.ts
│       └── audit.types.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                   # Sample documents for testing
├── migrations/
│   └── 001_create_audit_tables.sql
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

### 2. API Specifications

#### Endpoint: POST /api/v1/detect
**Purpose:** Detect PII in a document

**Request:**
```json
{
  "source": {
    "type": "minio",
    "path": "uploads/documents/doc-123.pdf"
  },
  "options": {
    "detectSSN": true,
    "detectNames": true,
    "detectAddresses": true,
    "detectPhones": true,
    "detectDOB": true
  }
}
```

**Response:**
```json
{
  "documentId": "doc-123",
  "detections": [
    {
      "type": "SSN",
      "value": "***-**-1234",
      "confidence": 95.5,
      "location": {
        "page": 2,
        "x": 150,
        "y": 300,
        "width": 120,
        "height": 20
      }
    },
    {
      "type": "NAME",
      "value": "John D***",
      "confidence": 87.3,
      "location": { "page": 1, "x": 50, "y": 100, "width": 200, "height": 25 }
    }
  ],
  "summary": {
    "totalDetections": 2,
    "highestConfidence": 95.5,
    "lowestConfidence": 87.3,
    "requiresRedaction": true
  }
}
```

#### Endpoint: POST /api/v1/redact
**Purpose:** Redact detected PII from document

**Request:**
```json
{
  "documentId": "doc-123",
  "sourcePath": "uploads/documents/doc-123.pdf",
  "detections": [...],  // From detect endpoint
  "options": {
    "redactionMethod": "black_box",  // or "asterisks", "placeholder"
    "confidenceThreshold": 80,
    "preserveLayout": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "original": "uploads/documents/doc-123.pdf",
  "redacted": "uploads/redacted/doc-123-redacted.pdf",
  "metadata": {
    "redactionCount": 2,
    "processedAt": "2026-02-02T01:48:00Z",
    "processingTimeMs": 1250
  }
}
```

#### Endpoint: POST /api/v1/transfer/validate
**Purpose:** Validate if a document can be transferred

**Request:**
```json
{
  "documentIds": ["doc-123", "doc-456"],
  "destination": {
    "agency": "EXAMPLE-AGENCY",
    "purpose": "Personnel record transfer"
  },
  "requestedBy": "user-789"
}
```

**Response:**
```json
{
  "allowed": false,
  "blockedDocuments": [
    {
      "documentId": "doc-123",
      "reason": "PII detected with confidence 95% exceeds threshold 80%",
      "requiredAction": "Redaction required before transfer",
      "detectedPII": ["SSN", "NAME"]
    }
  ],
  "allowedDocuments": ["doc-456"]
}
```

#### Endpoint: GET /api/v1/audit/logs
**Purpose:** Query audit logs

**Query Params:**
- `startDate`: ISO timestamp
- `endDate`: ISO timestamp
- `documentId`: Optional filter
- `destination`: Optional filter
- `page`: Pagination
- `limit`: Results per page

**Response:**
```json
{
  "logs": [
    {
      "eventId": "evt-001",
      "timestamp": "2026-02-02T01:48:00Z",
      "documentId": "doc-123",
      "action": "REDACTION_COMPLETED",
      "userId": "user-789",
      "destination": "EXAMPLE-AGENCY",
      "originalPath": "uploads/documents/doc-123.pdf",
      "redactedPath": "uploads/redacted/doc-123-redacted.pdf",
      "detections": [...],
      "confidenceScores": [95.5, 87.3]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127
  }
}
```

#### Endpoint: PUT /api/v1/config/threshold
**Purpose:** Update confidence threshold (admin only)

**Request:**
```json
{
  "threshold": 85,
  "reason": "Increased sensitivity for Q1 2026 compliance review"
}
```

**Response:**
```json
{
  "updated": true,
  "previousThreshold": 80,
  "newThreshold": 85,
  "effectiveAt": "2026-02-02T01:48:00Z"
}
```

---

### 3. Database Schema

#### Table: `pii_redaction_events`
```sql
CREATE TABLE pii_redaction_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    document_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,  -- DETECTION, REDACTION, VALIDATION, BLOCKED_TRANSFER
    destination_agency VARCHAR(255),
    destination_purpose TEXT,
    status VARCHAR(50) NOT NULL,  -- SUCCESS, FAILED, BLOCKED
    error_message TEXT,
    processing_time_ms INTEGER,
    INDEX idx_created_at (created_at),
    INDEX idx_document_id (document_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action)
);
```

#### Table: `pii_document_versions`
```sql
CREATE TABLE pii_document_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES pii_redaction_events(event_id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL,
    version_type VARCHAR(50) NOT NULL,  -- ORIGINAL, REDACTED
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    checksum VARCHAR(64),  -- SHA-256 for integrity verification
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_document_id (document_id),
    INDEX idx_event_id (event_id)
);
```

#### Table: `pii_detections`
```sql
CREATE TABLE pii_detections (
    detection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES pii_redaction_events(event_id) ON DELETE CASCADE,
    pii_type VARCHAR(50) NOT NULL,  -- SSN, NAME, ADDRESS, PHONE, DOB
    detected_value_hash VARCHAR(64),  -- Hashed value for privacy
    confidence_score DECIMAL(5,2) NOT NULL,  -- 0.00 - 100.00
    location_page INTEGER,
    location_x INTEGER,
    location_y INTEGER,
    location_width INTEGER,
    location_height INTEGER,
    redaction_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX idx_event_id (event_id),
    INDEX idx_pii_type (pii_type),
    INDEX idx_confidence_score (confidence_score)
);
```

#### Table: `pii_config`
```sql
CREATE TABLE pii_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reason TEXT
);

-- Seed default configuration
INSERT INTO pii_config (config_key, config_value, updated_by, reason) VALUES
    ('confidence_threshold', '80', 'system', 'Default Privacy Act compliance threshold'),
    ('redaction_method', 'black_box', 'system', 'Default redaction display method'),
    ('max_document_size_mb', '50', 'system', 'Performance constraint'),
    ('data_retention_days', '2555', 'system', 'Seven-year compliance retention');
```

---

### 4. PII Detection Algorithms

#### SSN Detection (Pattern Matching)
```typescript
// Patterns to match:
// 123-45-6789 (standard)
// 123 45 6789 (space-separated)
// 123456789 (no separators)
// XXX-XX-6789 (partially redacted)

const SSN_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{3}\s\d{2}\s\d{4}\b/g,
    /\b\d{9}\b/g,
    /\b[X*]{3}-[X*]{2}-\d{4}\b/g
];

// Validation: Check if matches known invalid SSN ranges
// - 000-xx-xxxx, xxx-00-xxxx, xxx-xx-0000
// - 666-xx-xxxx (never issued)
// - 900-999 series (reserved)

// Confidence scoring factors:
// - Valid format: +40 points
// - Passes validation: +30 points
// - Context clues (near "SSN:", "Social Security"): +30 points
```

#### Name Detection (NLP + Context)
```typescript
// Approach:
// 1. Tokenize text into sentences and words
// 2. Identify proper nouns (capitalization patterns)
// 3. Check against common name dictionaries (first/last names)
// 4. Analyze surrounding context (titles: Mr., Mrs., Dr.)
// 5. Verify name patterns (First Last, Last, First Middle)

// Confidence factors:
// - Capitalized: +20 points
// - In name dictionary: +30 points
// - Has title prefix: +25 points
// - Follows name pattern: +25 points
```

#### Address Detection
```typescript
// Patterns:
// - Street address: number + street name + type (123 Main St)
// - City, State ZIP: (Springfield, IL 62701)
// - PO Box: (PO Box 123)

// Confidence factors:
// - Matches street pattern: +30 points
// - Valid ZIP code: +30 points
// - Known city/state: +20 points
// - Multi-line address format: +20 points
```

#### Phone Number Detection
```typescript
// Patterns:
// - (123) 456-7890
// - 123-456-7890
// - 123.456.7890
// - +1 123 456 7890

// Validation: Check area code validity
// Confidence: +80 for valid format + area code
```

#### Date of Birth Detection
```typescript
// Patterns:
// - MM/DD/YYYY
// - Month DD, YYYY
// - YYYY-MM-DD

// Context clues: near "DOB:", "Date of Birth:", "Born:"
// Validation: Reasonable date range (1900-2026)
// Confidence: Format + context + reasonable range
```

---

### 5. Redaction Strategies

#### Black Box Method (Default)
- Replace text with solid black rectangle
- Preserves document layout precisely
- Best for PDF and scanned images

#### Asterisks Method
- Replace characters with asterisks (e.g., "John Doe" → "******")
- Maintains text flow for plain text documents
- Shows redaction was applied

#### Placeholder Method
- Replace with generic text (e.g., "[REDACTED-SSN]", "[REDACTED-NAME]")
- Maintains readability of document structure
- Useful for review processes

---

### 6. Configuration & Environment Variables

```bash
# Service Configuration
PII_SERVICE_PORT=4200
PII_SERVICE_HOST=0.0.0.0

# Database
PII_DB_HOST=postgres
PII_DB_PORT=5432
PII_DB_NAME=muse
PII_DB_USER=muse_user
PII_DB_PASSWORD=<secret>
PII_DB_SCHEMA=pii_redaction  # Optional: use dedicated schema

# Storage (MinIO)
PII_MINIO_ENDPOINT=minio:9000
PII_MINIO_ACCESS_KEY=<secret>
PII_MINIO_SECRET_KEY=<secret>
PII_MINIO_BUCKET=muse-uploads
PII_MINIO_REDACTED_PREFIX=redacted/

# Detection Configuration
PII_CONFIDENCE_THRESHOLD=80  # Default: 80%
PII_DETECT_SSN=true
PII_DETECT_NAMES=true
PII_DETECT_ADDRESSES=true
PII_DETECT_PHONES=true
PII_DETECT_DOB=true

# Redaction Configuration
PII_REDACTION_METHOD=black_box  # black_box, asterisks, placeholder
PII_MAX_DOCUMENT_SIZE_MB=50
PII_PROCESSING_TIMEOUT_MS=30000

# Audit & Retention
PII_AUDIT_RETENTION_DAYS=2555  # 7 years
PII_LOG_LEVEL=info

# Integration
MUSE_API_URL=http://api:4000
MUSE_API_KEY=<secret>
```

---

### 7. Integration with Muse Platform

#### Changes to `services/api/`

**New Route: `src/routes/document-transfer.routes.ts`**
```typescript
import express from 'express';
import { PIIServiceClient } from '../clients/pii-service.client';

const router = express.Router();
const piiClient = new PIIServiceClient(process.env.PII_SERVICE_URL);

// Initiate document transfer with PII protection
router.post('/api/documents/transfer', async (req, res) => {
    const { documentIds, destination } = req.body;
    
    // Step 1: Validate transfer eligibility
    const validation = await piiClient.validateTransfer({
        documentIds,
        destination,
        requestedBy: req.user.id
    });
    
    if (!validation.allowed) {
        return res.status(403).json({
            error: 'Transfer blocked due to PII detection',
            blockedDocuments: validation.blockedDocuments
        });
    }
    
    // Step 2: Optionally trigger redaction for allowed documents
    // (Implementation depends on business logic)
    
    res.json({ status: 'transfer_initiated', validation });
});

export default router;
```

**New Client: `src/clients/pii-service.client.ts`**
```typescript
import axios from 'axios';

export class PIIServiceClient {
    private baseURL: string;
    
    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }
    
    async detect(documentPath: string, options = {}) {
        const response = await axios.post(`${this.baseURL}/api/v1/detect`, {
            source: { type: 'minio', path: documentPath },
            options
        });
        return response.data;
    }
    
    async redact(documentId: string, detections: any[], options = {}) {
        const response = await axios.post(`${this.baseURL}/api/v1/redact`, {
            documentId,
            detections,
            options
        });
        return response.data;
    }
    
    async validateTransfer(request: any) {
        const response = await axios.post(`${this.baseURL}/api/v1/transfer/validate`, request);
        return response.data;
    }
    
    async getAuditLogs(filters: any) {
        const response = await axios.get(`${this.baseURL}/api/v1/audit/logs`, { params: filters });
        return response.data;
    }
}
```

#### Changes to `apps/web/`

**New Page: `pages/admin/pii-audit.tsx`**
- Display audit log table with filters (date range, document, destination)
- Export audit reports for compliance reviews
- Admin-only access (role-based)

**Update: `pages/documents/transfer.tsx`**
- Add PII scan status indicator
- Display blocked transfer warnings with clear messaging
- Provide redaction options before transfer

---

### 8. Testing Strategy

#### Unit Tests
- Pattern matching accuracy (SSN, phone, address, DOB)
- Confidence scoring algorithms
- Redaction coordinate calculations
- Threshold validation logic

#### Integration Tests
- Full detection → redaction → audit workflow
- MinIO document upload/download
- Database audit log persistence
- API endpoint contracts

#### End-to-End Tests
1. Upload document with PII
2. Trigger detection via API
3. Verify redaction output
4. Attempt transfer (validate blocking)
5. Query audit logs
6. Verify compliance

#### Performance Tests
- Process 100-page PDF with 50+ PII elements
- Target: <5 seconds for detection
- Target: <10 seconds for redaction
- Concurrent requests: 10+ simultaneous documents

#### Security Tests
- SQL injection prevention (audit log queries)
- File path traversal protection (MinIO paths)
- Authentication bypass attempts
- PII exposure in logs (ensure hashing)

---

### 9. Security Considerations

#### Data Protection
- **PII values never logged in plaintext** - use SHA-256 hashes in `pii_detections` table
- **Original documents preserved** - immutable storage for audit trails
- **Redacted documents isolated** - separate MinIO prefix to prevent confusion
- **Access controls** - JWT-based auth for all endpoints

#### Compliance Controls
- **Audit trails** - comprehensive logging of all PII operations
- **Data retention** - configurable retention policy (default: 7 years per federal guidelines)
- **Threshold enforcement** - prevent transfers below confidence threshold
- **Configuration changes logged** - track who changed thresholds and why

#### Infrastructure Security
- **Service isolation** - standalone container with minimal attack surface
- **Network policies** - restrict access to Muse API and internal services only
- **Secrets management** - use environment variables, never hardcode credentials
- **Rate limiting** - prevent abuse of detection/redaction endpoints

---

### 10. Deployment Considerations

#### Docker Compose Changes
```yaml
# Add to docker-compose.yml
services:
  pii-redaction:
    build:
      context: ./services/pii-redaction
      dockerfile: Dockerfile
    container_name: muse-pii-redaction
    environment:
      - PII_SERVICE_PORT=4200
      - PII_DB_HOST=postgres
      - PII_MINIO_ENDPOINT=minio:9000
      # ... (additional env vars from section 6)
    ports:
      - "4200:4200"
    depends_on:
      - postgres
      - minio
    volumes:
      - ./services/pii-redaction/src:/app/src
    networks:
      - muse-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4200/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Database Migrations
- Run migration script on first deployment: `migrations/001_create_audit_tables.sql`
- Use Flyway or similar tool for production environments
- Verify schema creation before service starts

#### Smoke Tests
- Add PII-specific checks to `scripts/smoke_test.sh`:
  ```bash
  # Verify PII service health
  curl -f http://localhost:4200/health || exit 1
  
  # Test basic detection endpoint
  curl -X POST http://localhost:4200/api/v1/detect \
    -H "Content-Type: application/json" \
    -d '{"source":{"type":"text","content":"SSN: 123-45-6789"}}' \
    | grep -q "confidence" || exit 1
  ```

---

### 11. Open Questions for Planning Session

1. **Document Format Support**: Which formats are priority? (PDF, DOCX, TXT, images?)
2. **ML Integration**: Should we plan for future ML-based detection (named entity recognition)?
3. **Redaction Reversibility**: Should authorized admins be able to "unredact" for legitimate purposes?
4. **Batch Processing**: Do we need async job queue for bulk redactions (100+ documents)?
5. **Multi-language Support**: English only, or support Spanish/other languages?
6. **Notification System**: Email/SMS alerts when transfers are blocked?
7. **SLA Requirements**: What are acceptable latency targets for production?
8. **Disaster Recovery**: What's the RTO/RPO for audit logs and redacted documents?

---

### 12. Dependencies & Risks

#### External Dependencies
- **pdf-lib** or **PDFKit** - PDF manipulation (redaction rendering)
- **mammoth** or **docx** - DOCX file parsing
- **tesseract.js** - OCR for scanned documents (optional, Phase 2)
- **MinIO client** - Document storage operations
- **PostgreSQL driver** (pg) - Audit log persistence

#### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| False positives (redacting non-PII) | Medium | Confidence thresholds, manual review workflow |
| False negatives (missing PII) | **High** | Multiple pattern strategies, regular pattern updates |
| Performance with large PDFs | Medium | Async processing, pagination, caching |
| Compliance gaps | **High** | Regular audits, governance validation, legal review |
| Integration complexity | Medium | Clear API contracts, comprehensive testing |

---

### 13. Success Metrics

- **Detection Accuracy**: >95% true positive rate, <5% false positive rate
- **Processing Time**: <5 seconds for 50-page document detection
- **Audit Completeness**: 100% of redaction events logged
- **Transfer Prevention**: Zero unauthorized PII transfers in production
- **Compliance**: Pass external Privacy Act audit (annual)

---

### 14. Governance Traceability

This architecture addresses the following governance requirements:

- **sec-47be9e5c-144-5fc01bfe**: Automatic redaction before transfers
- **sec-47be9e5c-182-62d0c42d**: PII detection with pattern matching
- **sec-47be9e5c-193-ef19c5cd**: Transfer prevention controls
- **sec-47be9e5c-889-41dccc37**: Comprehensive audit logging

Full governance document: `docs/projects/demo-project/governance/recguide20111-*.md`

---

## Next Steps

1. **Review this plan** in the team planning session
2. **Address open questions** (Section 11)
3. **Prioritize phases** based on sprint capacity
4. **Assign technical leads** for each module (detection, redaction, audit, validation)
5. **Set up project board** with tasks from workplan
6. **Schedule architecture review** with security/compliance teams
7. **Begin Phase 1** (Foundation & Setup)

---

**Plan Status:** Draft - Awaiting Team Review  
**Next Review:** Planning Session - TBD
