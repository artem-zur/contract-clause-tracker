import asyncio
import uuid
import os
from typing import List, Optional
from fastapi import FastAPI, Depends, status, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, SQLModel, create_engine, Session, select, Relationship
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

# ==========================================
# Database Entity Models
# ==========================================

class ClauseType(SQLModel, table=True):
    __tablename__ = "clause_type"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    name: str = Field(nullable=False, unique=True)
    code: str = Field(nullable=False, unique=True)

    # Relationship back to individual clauses
    clauses: List["Clause"] = Relationship(back_populates="clause_type")

class Clause(SQLModel, table=True):
    __tablename__ = "clause"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    contract_id: uuid.UUID = Field(foreign_key="contract.id", nullable=False)
    clause_type_id: uuid.UUID = Field(foreign_key="clause_type.id", nullable=False)
    start_index: int = Field(nullable=False)
    end_index: int = Field(nullable=False)
    text_snippet: str = Field(nullable=False)

    # Relationships mapping to source contract and category type
    contract: "Contract" = Relationship(back_populates="clauses")
    clause_type: "ClauseType" = Relationship(back_populates="clauses")

class Contract(SQLModel, table=True):
    __tablename__ = "contract"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    title: str = Field(nullable=False)
    text: str = Field(nullable=False)

    # Relationship to tracked clauses within this contract
    clauses: List["Clause"] = Relationship(back_populates="contract")

# ==========================================
# Pydantic Schemas for API Serialization
# ==========================================

class ClauseTypeRead(SQLModel):
    id: uuid.UUID
    name: str
    code: str

    # Automatically converts 'id' to 'id' (no change) but sets up the pattern
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

class ClauseRead(SQLModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    clause_type_id: uuid.UUID
    start_index: int
    end_index: int
    text_snippet: str
    clause_type: Optional[ClauseTypeRead] = None

    # Automatically converts contract_id -> contractId, start_index -> startIndex, etc.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

class ContractRead(SQLModel):
    id: uuid.UUID
    title: str
    text: str
    clauses: List[ClauseRead] = []

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

# ==========================================
# Database Configuration & Session Yield
# ==========================================

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

# ==========================================
# Lifecycle Hooks & Database Seeding
# ==========================================

@app.on_event("startup")
def initialize_database_and_seed():
    """
    Hooks into application startup lifecycles. Checks if the database target table 
    is empty; if verified, populates it with 3 distinct contractual text records.
    """
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # 1. Seed Clause Types if missing
        existing_types = session.exec(select(ClauseType)).first()
        if not existing_types:
            type_liability = ClauseType(name="Limitation of Liability", code="LIMITATION_OF_LIABILITY")
            type_termination = ClauseType(name="Termination for Convenience", code="TERMINATION_FOR_CONVENIENCE")
            type_non_compete = ClauseType(name="Non-Compete", code="NON_COMPETE")
            
            session.add_all([type_liability, type_termination, type_non_compete])
            session.commit()
            
            # Refresh to fetch IDs for downstream mapping
            session.refresh(type_liability)
            session.refresh(type_termination)
            session.refresh(type_non_compete)
        else:
            type_liability = session.exec(select(ClauseType).where(ClauseType.name == "Limitation of Liability")).one()
            type_termination = session.exec(select(ClauseType).where(ClauseType.name == "Termination for Convenience")).one()
            type_non_compete = session.exec(select(ClauseType).where(ClauseType.name == "Non-Compete")).one()

        # 2. Seed Sample Contracts & Highlighted Clauses
        existing_records = session.exec(select(Contract)).first()
        
        if not existing_records:
            contract_nda = Contract(
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
            )
            
            contract_mspa = Contract(
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
            )
            
            contract_employment = Contract(
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
            
            session.add_all([contract_nda, contract_mspa, contract_employment])
            session.commit()
            
            session.refresh(contract_mspa)
            session.refresh(contract_employment)
            
            # 3. Build Clause maps using accurate text string index parameters
            clause_termination = Clause(
                contract_id=contract_mspa.id,
                clause_type_id=type_termination.id,
                start_index=0,
                end_index=135,
                text_snippet="Either contracting party may terminate this agreement upon 30 days of prior written notice delivered directly to the registered office."
            )
            
            clause_liability = Clause(
                contract_id=contract_mspa.id,
                clause_type_id=type_liability.id,
                start_index=401,
                end_index=525,
                text_snippet="In no event shall either party be liable for any indirect, incidental, or consequential damages arising under this contract."
            )
            
            clause_non_compete = Clause(
                contract_id=contract_employment.id,
                clause_type_id=type_non_compete.id,
                start_index=0,
                end_index=108,
                text_snippet="The employee agrees not to solicit active clients or employees of the company for 12 months post-employment."
            )
            
            session.add_all([clause_termination, clause_liability, clause_non_compete])
            session.commit()

# ==========================================
# API Endpoints
# ==========================================

@app.get("/contracts", response_model=List[ContractRead], status_code=200)
async def get_contracts(session: Session = Depends(get_db_session)):
    """
    Retrieves all contracts from the database.
    """
    # Simulate a 2.5-second server latency/loading time
    await asyncio.sleep(2.5)

    results = session.exec(select(Contract)).all()
    return results

@app.get("/contracts/{contract_id}", response_model=ContractRead, status_code=status.HTTP_200_OK)
async def get_contract_by_id(
    contract_id: uuid.UUID, 
    session: Session = Depends(get_db_session)
):
    """
    Retrieves a targeted contract contract record by its unique primary key ID.
    """

    # Simulate a 2.5-second server latency matching the UI loading experience
    await asyncio.sleep(2.5)

    contract = session.get(Contract, contract_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract with ID '{contract_id}' could not be located in database storage."
        )
        
    return contract

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
        # Simulate heavy contract analysis/parsing
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