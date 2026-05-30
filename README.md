# Contract Clause Tracker

A lightweight, frontend-focused web application designed to help legal teams track and maintain specific clauses across multiple contracts. For simplicity, each legal clause is represented by a single sentence.

# Local Development Setup

Building and running the application components requires minimal local configuration. All dependencies are isolated via Docker.

## Prerequisites

Docker and Docker Compose installed locally.

Note: You do not need Node.js, npm, Python, or the Angular CLI installed on your local host machine. Everything runs, compiles, hot-reloads, and links directly inside isolated Docker runtime containers.

### Running the Application

To spin up the Python FastAPI server locally in development mode (with live reload enabled):

1. Ensure you are at the root directory of the project.
2. Build and launch both the Angular frontend and FastAPI backend applications simultaneously using Docker Compose:
   
    ```bash
    docker compose up --build
    ```

3. Accessing the Applications:

    - Angular Frontend Interface: http://localhost:4200
    - FastAPI Backend Service: http://localhost:8000
    - Interactive API Documentation: http://localhost:8000/docs

Note: The SQLite database file will be automatically initialized and seeded with sample legal documents on the initial container startup.

To stop the running application containers, use:

```bash
docker compose down
```

# Architecture

## Project Structure

To keep the frontend and backend architectures unified within a single repository without introducing over-engineered structural layers, a structured simple monorepo approach was used. 

We explicitly decided not to use tooling like Nx Monorepo or architectural frameworks like Feature-Sliced Design (FSD). Given the target implementation time of 3–4 hours, a lightweight folder-based separation provides the necessary isolation without the configuration overhead.

## Styling Strategy

Tailwind CSS was chosen as the primary stylesheet system. Utilizing a utility-first utility class strategy allows us to drastically simplify and delegate styling choices directly within the templates. This setup ensures that we can focus more on core business logic implementation, reactive state patterns, and Angular Material CDK integrations without spending valuable time writing and maintaining verbose custom CSS/SCSS sheets.

## Backend Framework Selection

Python with FastAPI was selected over traditional alternatives like Flask. Because its automatic Swagger UI document generation significantly reduces testing cycles during frontend-to-backend integration and provides an immediate playground for pair-programming expansions later. Additionally, FastAPI provides out-of-the-box asynchronous route support and rapid JSON serialization.

## Database Strategy

SQLite is used as the relational database engine. It represents the most conservative choice as it introduces zero infrastructural overhead or external container dependencies during local development. 

To guarantee cross-compatibility with enterprise tools like PostgreSQL down the line, database tables are abstracted using an Object Relational Mapper (SQLModel). This ensures that upgrading from local SQLite to cloud-hosted PostgreSQL involves changing only a single environment connection string.

## File Uploading & Trade-Offs

To maintain a fast development velocity and keep the codebase highly predictable, a streamlined approach was chosen for handling document ingestion. When a user uploads a document, the frontend transmits it as a standard binary blob wrapped in a FormData payload, which FastAPI intercepts natively.

### In-Database Ingestion vs. File System Storage

The application explicitly avoids persisting uploaded files onto local server storage, cloud blocks, or container file systems. Instead, incoming text streams are parsed in-memory and stored directly within the relational database (contract table) as raw strings.

- **Why this choice was made**: Storing physical files on a server requires managing persistent storage volumes, maintaining strict directory hierarchies, handling file-write collisions, and dealing with OS-specific folder permissions.
- **The Benefit**: Storing raw text directly in the SQLite database keeps the backend container completely stateless. Database migrations, automated backups, and text queries remain fully unified inside a single engine, completely eliminating file system overhead and state synchronization issues.

### Streamlined Processing and External Dependencies

Because the application strictly restricts file uploads to the `.txt` ecosystem, the extraction pipeline on the backend requires zero external parsing libraries.

Using FastAPI’s asynchronous `UploadFile` type, reading the text stream and translating it into a database-ready format is handled natively in just a few lines of code:

```Python
content_bytes = await file.read()
text_content = content_bytes.decode("utf-8")
```

This offloads presentation and formatting considerations entirely to the frontend consumer layer, ensuring the backend acts as a lightweight data proxy.

### Non-Normalization Trade-Off & Technical Risks

A major architectural shortcut taken in this implementation is the complete omission of text normalization or character sanitization on ingestion. The backend does not attempt to clean, strip, or reformat problematic symbols, trailing spaces, or foreign punctuation rules.

While this drastically simplifies the backend codebase, it introduces explicit trade-offs and structural risks that must be monitored:

- **Risk of Encoding Mismatches**: The backend assumes all uploaded files are strictly formatted in UTF-8. If a user uploads a .txt file encoded in legacy formats (such as Windows-1252 or ISO-8859-1), decoding errors may occur, or the text might save as corrupted text symbols (mojibake).
- **Special Character Distortion**: Complex legal typography—such as paragraph hooks (§), section signs, curly smart-quotes, or em-dashes—are preserved in their raw format. Without backend normalization, the system relies entirely on the frontend application's font-family configurations and HTML escaping rules to render these glyphs correctly without breaking the user interface layout.
- **Lack of Data Deduplication**: Uploading the exact same document multiple times will create duplicate records under identical names in the database, as the system does not compare raw string footprints on ingest.

## Search Strategy & Scalability Trade-Offs

To maintain a frontend-focused velocity, the initial implementation executes search queries entirely on the client side using Angular Material's built-in `MatTableDataSource` filtering engine. While this provides instantaneous results without server round-trips for small datasets, it introduces a critical scalability ceiling.

### The Limits of Client-Side Filtering

As the database grows, this approach exposes major technical trade-offs:

- **The Pagination Blocker**: The core architectural flaw of frontend filtering is its inability to coexist with backend pagination (`LIMIT/OFFSET`). If the backend API restricts responses to paginated chunks (e.g., 20 contracts per page), a frontend search can only filter the 20 records currently sitting in browser memory. It becomes completely blind to matching records residing on un-fetched pages.
- **Network and Memory Bloat**: To keep a client-side search accurate *without* pagination, the application would be forced to stream the entire contract index—including heavy raw text data—across the network to the browser on initial load. This leads to massive payload sizes and heavy browser memory consumption as the document catalog scales.
- **CPU Bottlenecks**: Executing continuous string matching routines across large multi-megabyte datasets scales poorly inside a single-threaded browser environment compared to optimized database indexing engines.

### The Superior Alternative: Backend-Driven Queries

For enterprise or production readiness, this search strategy should be refactored into a **backend-driven, server-paginated pipeline**:

1. **Database-Level Execution**: The frontend search input should trigger an API call to an endpoint like `GET /contracts?search=query&page=1&size=20`. 
2. **Pragmatic Backend Integration**: The FastAPI backend would capture this query parameter and execute a structured relational query utilizing a `SQL LIKE %query%` operation (or a native case-insensitive `contains` clause via SQLModel) against the `Contract.title` and `Contract.text` columns.
3. **Advanced Growth Path**: Down the line, this structure easily upgrades to leverage PostgreSQL's native Full-Text Search (FTS) vectors or external indexing engines like Elasticsearch without requiring any structural changes to the frontend state management.