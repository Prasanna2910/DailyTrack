import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Load MongoDB URI from environment or use placeholder (will be set by user).
# The password 'Indegene@7481' must be escaped as 'Indegene%407481'
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://Sahanashre_ind-data:Indegene%407481@cluster0.5cdvrf5.mongodb.net/")
DATABASE_NAME = "dailytrack"
COLLECTION_NAME = "worklogs"

client = AsyncIOMotorClient(MONGODB_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

app = FastAPI()

# Allow CORS for frontend development and production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "https://your-app.vercel.app"]
origins = list(set(DEFAULT_ORIGINS + [o.strip() for o in ALLOWED_ORIGINS if o.strip()]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EntityModel(BaseModel):
    person: str
    task: str
    hours: float = 0
    status: str = "completed"

class WorkLogModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    dateKey: str
    task: Optional[str] = None
    entities: List[EntityModel] = []
    collaborators: List[str] = []
    collaboratedWith: Optional[str] = None
    status: str = "completed"
    hours: float = 0
    loggedAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

# Helper to compute aggregates
def compute_aggregates(log: dict):
    entities = log.get("entities", [])
    collaborators = list({e.get("person") for e in entities if e.get("person")})
    collaborated_with = ", ".join(collaborators)
    status = "pending" if any(e.get("status") == "pending" for e in entities) else "completed"
    hours = sum(float(e.get("hours", 0)) for e in entities)
    primary_task = ", ".join([e.get("task", "") for e in entities])
    log.update({
        "collaborators": collaborators,
        "collaboratedWith": collaborated_with,
        "status": status,
        "hours": hours,
        "task": primary_task,
    })
    return log

@app.get("/worklogs", response_model=List[WorkLogModel])
async def get_all_worklogs():
    cursor = collection.find({})
    logs = []
    async for doc in cursor:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        logs.append(WorkLogModel(**doc))
    return logs

@app.get("/worklogs/{date_key}", response_model=WorkLogModel)
async def get_worklog_by_date(date_key: str):
    doc = await collection.find_one({"dateKey": date_key})
    if not doc:
        raise HTTPException(status_code=404, detail="WorkLog not found")
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return WorkLogModel(**doc)

@app.post("/worklogs", response_model=WorkLogModel)
async def upsert_worklog(log: WorkLogModel):
    log_dict = log.model_dump(by_alias=True, exclude_unset=True)
    if "_id" in log_dict:
        del log_dict["_id"]
        
    log_dict = compute_aggregates(log_dict)
    now_iso = datetime.utcnow().isoformat()
    if "loggedAt" not in log_dict or not log_dict["loggedAt"]:
        log_dict["loggedAt"] = now_iso
    log_dict["updatedAt"] = now_iso

    await collection.update_one(
        {"dateKey": log_dict["dateKey"]},
        {"$set": log_dict},
        upsert=True,
    )
    saved = await collection.find_one({"dateKey": log_dict["dateKey"]})
    if "_id" in saved:
        saved["_id"] = str(saved["_id"])
    return WorkLogModel(**saved)

@app.on_event("startup")
async def startup_event():
    try:
        count = await collection.count_documents({})
        if count == 0:
            dummy_logs = [
                {
                    "dateKey": "2026-05-07",
                    "entities": [
                        {"person": "Alice", "task": "Design UI", "hours": 3, "status": "completed"},
                        {"person": "Bob", "task": "Implement API", "hours": 4, "status": "completed"},
                    ],
                },
                {
                    "dateKey": "2026-05-08",
                    "entities": [
                        {"person": "Charlie", "task": "Test App", "hours": 2, "status": "completed"},
                        {"person": "Dana", "task": "Write Docs", "hours": 1.5, "status": "completed"},
                    ],
                },
            ]
            for d in dummy_logs:
                d = compute_aggregates(d)
                now_iso = datetime.utcnow().isoformat()
                d["loggedAt"] = now_iso
                d["updatedAt"] = now_iso
                await collection.insert_one(d)
            print("✅ Seeded dummy worklog data for May 7 & 8.")
    except Exception as e:
        print(f"❌ Startup error: {e}")
