# Contract Clause Tracker

A lightweight, frontend-focused web application designed to help legal teams track and maintain specific clauses across multiple contracts. For simplicity, each legal clause is represented by a single sentence.

# Local Development Setup

Building and running the application components requires minimal local configuration. All backend dependencies are isolated via Docker.

## Prerequisites

Docker and Docker Compose installed locally.

### Running the Backend Application

To spin up the Python FastAPI server locally in development mode (with live reload enabled):

1. Navigate to the project root directory.
2. Run the following command:
   
    ```bash
    docker compose up --build
    ```

3. Once the container is healthy, the backend server will be reachable at:

    - API Base URL: http://localhost:8000
    - Interactive Swagger UI Documentation: http://localhost:8000/docs

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