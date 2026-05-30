import asyncio
from datetime import datetime
import uuid
import os
from typing import List
from fastapi import FastAPI, Depends, status, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, SQLModel, create_engine, Session, select

class Contract(SQLModel, table=True):
    __tablename__ = "contract"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    title: str = Field(nullable=False)
    text: str = Field(nullable=False)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tracker.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI(
    title="Contract Clause Tracker API",
    version="1.0.0"
)

# Enable CORS for seamless integration with the Angular frontend application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Broad scope permitted for rapid local development prototyping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_session():
    with Session(engine) as session:
        yield session

@app.on_event("startup")
def initialize_database_and_seed():
    """
    Hooks into application startup lifecycles. Checks if the database target table 
    is empty; if verified, populates it with 3 distinct contractual text records.
    """
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        check_statement = select(Contract)
        existing_records = session.exec(check_statement).first()
        
        if not existing_records:
            sample_documents = [
                Contract(
                    title="Mutual Non-Disclosure Agreement",
                    text=(
                        "The receiving party shall maintain the strict confidentiality of all proprietary information "
                        "disclosed by the disclosing party under this agreement. This agreement shall remain in full "
                        "force and effect for a period of three years from the explicit date of final disclosure. All "
                        "confidential materials must be completely returned or destroyed upon written request within ten "
                        "business days. No license, express or implied, is granted under any patent, copyright, or trade "
                        "secret by this transmission. The receiving party agrees to limit access to such information "
                        "solely to employees with a verified need to know. Any breach of this covenant will cause "
                        "irreparable harm for which monetary damages alone would be entirely inadequate."
                    )
                ),
                Contract(
                    title="Master Services Provision Agreement",
                    text=(
                        "Either contracting party may terminate this agreement upon 30 days of prior written notice "
                        "delivered directly to the registered office. Intellectual Property created under any active "
                        "Statement of Work shall belong exclusively to the Client upon full payment of fees. The Consultant "
                        "shall perform all technical services with reasonable skill, care, and diligence in accordance "
                        "with industry standards. In no event shall either party be liable for any indirect, incidental, "
                        "or consequential damages arising under this contract. Payment for all undisputed invoices shall "
                        "be due net 45 days from the date of receipt. Any amendments to this framework agreement must "
                        "be executed in writing by authorized representatives of both entities."
                    )
                ),
                Contract(
                    title="Standard Employment Contract",
                    text=(
                        "The employee agrees not to solicit active clients or employees of the company for 12 months "
                        "post-employment. This agreement is entirely governed by the laws of the State of Berlin, "
                        "Germany, without regard to conflict of law principles. The employee shall devote their full "
                        "business time, attention, and energies to the performance of their assigned duties. Standard "
                        "working hours are flexible but must align with core collaboration windows established by the team "
                        "leadership. All inventions or technical modifications conceived during the course of employment "
                        "automatically vest with the employer. The company reserves the explicit right to place the "
                        "employee on garden leave during their respective notice period."
                    )
                )
            ]
            session.add_all(sample_documents)
            session.commit()

@app.get("/contracts", response_model=List[Contract], status_code=200)
async def get_contracts(session: Session = Depends(get_db_session)):
    """
    Retrieves all contracts from the database.
    """
    # Simulate a 2.5-second server latency/loading time
    await asyncio.sleep(2.5)

    results = session.exec(select(Contract)).all()
    return results

@app.post("/contracts", status_code=status.HTTP_201_CREATED)
async def upload_contract(
    file: UploadFile = File(...), 
    session: Session = Depends(get_db_session)
):
    """
    Accepts a .txt file, extracts its content, and saves it to the database 
    using the file name as the contract title.
    """
    # Restrict to .txt files only
    if not file.filename.endswith('.txt'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension. Only '.txt' files are permitted."
        )
    
    try:
        # Simulate heavy document analysis/parsing
        await asyncio.sleep(2.5)

        # Read and decode the raw text content
        content_bytes = await file.read()
        text_content = content_bytes.decode("utf-8")
        
        # Create and persist the database record
        new_contract = Contract(
            title=file.filename,
            text=text_content
        )
        
        session.add(new_contract)
        session.commit()
        session.refresh(new_contract)
        
        # Return a meaningful success response
        return {
            "success": True,
            "message": f"File '{file.filename}' was saved successfully.",
            "contract_id": str(new_contract.id)
        }
        
    except Exception as e:
        # Rollback the transaction in case of database glitches
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing and saving the file: {str(e)}"
        )