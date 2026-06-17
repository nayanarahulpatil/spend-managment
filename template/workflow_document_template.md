# Developer Handover & Workflow Document Generator
 
## ROLE
 
Act as a Senior Software Architect
 
## TASK
 
Analyze the completed project and generate a Developer Handover & Workflow Document that enables any new developer to understand, run, maintain, troubleshoot, and extend the application with minimal onboarding.
 
## INPUT
 
Use as source of truth:
 
* PRD
* Scope Document
* KPI Document
* Frontend Code
* Backend Code
* Database Design
* API Contracts
* Infrastructure Configuration
* QA Results
 
---
 
## OUTPUT
 
### 1. Project Overview
 
Include:
 
* Project Name
* Business Purpose
* Problem Statement
* Solution Summary
* Key Features
 
---
 
### 2. Technology Stack
 
| Layer          | Technologies |
| -------------- | ------------ |
| Frontend       |              |
| Backend        |              |
| Database       |              |
| Infrastructure |              |
| Testing        |              |
 
---
 
### 3. Architecture Overview
 
Include:
 
* High-Level Architecture
* Request/Data Flow
* Major Components
* External Integrations
 
---
 
### 4. Project Structure
 
Generate:
 
* Frontend Folder Structure
* Backend Folder Structure
* Feature/Module Structure
 
Briefly explain major folders.
 
---
 
### 5. Module Summary
 
| Module | Purpose | Key Components | Dependencies |
| ------ | ------- | -------------- | ------------ |
 
---
 
### 6. Database Overview
 
| Entity / Collection | Purpose | Relationships |
| ------------------- | ------- | ------------- |
 
---
 
### 7. API Overview
 
| Endpoint | Method | Purpose | Auth Required |
| -------- | ------ | ------- | ------------- |
 
Include authentication and authorization flow.
 
---
 
### 8. Environment & Setup
 
Include:
 
* Required Environment Variables
* Installation Steps
* Local Setup
* Build Commands
* Run Commands
 
---
 
### 9. Business Workflows
 
For each major workflow provide:
 
* Purpose
* Steps
* Validation Rules
* Expected Outcome
 
---
 
### 10. Security & Error Handling
 
Include:
 
* Authentication & Authorization
* Sensitive Data Handling
* Validation Strategy
* Error Handling Strategy
 
| Scenario | Expected Behavior |
| -------- | ----------------- |
 
---
 
### 11. Testing Overview
 
| Test Type | Coverage | Tools |
| --------- | -------- | ----- |
 
Include test execution commands.
 
---
 
### 12. Deployment & Operations
 
Include:
 
* Deployment Process
* CI/CD Flow
* Monitoring & Logging
* Rollback Strategy
 
---
 
### 13. Known Limitations & Future Enhancements
 
| Type | Description | Priority |
| ---- | ----------- | -------- |
 
---
 
### 14. Troubleshooting Guide
 
| Issue | Resolution |
| ----- | ---------- |
 
---
 
### 15. Developer Quick Start
 
Provide:
 
1. Install dependencies
2. Configure environment
3. Run application
4. Execute tests
5. Build project
6. Deploy application
 
A new developer should be able to start contributing using only this document.
 
---
 
## OUTPUT REQUIREMENTS
 
* Use markdown.
* Use tables wherever appropriate.
* Do not leave sections empty.
* Do not use placeholders or N/A.
* Derive information from implementation whenever possible.
* Focus on onboarding, maintenance, troubleshooting, and future development.