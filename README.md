# Contract Clause Tracker

A lightweight, frontend-focused web application designed to help legal teams track and maintain specific clauses across multiple contracts. For simplicity, each legal clause is represented by a single sentence.

# Project Structure

To keep the frontend and backend architectures unified within a single repository without introducing over-engineered structural layers, a structured simple monorepo approach was used. 

We explicitly decided not to use tooling like Nx Monorepo or architectural frameworks like Feature-Sliced Design (FSD). Given the target implementation time of 3–4 hours, a lightweight folder-based separation provides the necessary isolation without the configuration overhead.