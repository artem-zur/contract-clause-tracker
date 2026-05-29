from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Contract Clause Tracker API",
    description="Minimal backend API to support contract and clause layout management.",
    version="1.0.0"
)

# Enable CORS for seamless integration with the Angular frontend application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Broad scope permitted for rapid local development prototyping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/contracts", status_code=200)
async def get_contracts():
    """
    Retrieve a tracking list of all contracts.
    Returns an empty response placeholder for current structural verification.
    """
    return []