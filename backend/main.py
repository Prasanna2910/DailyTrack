import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Print startup info for debugging
print("🚀 Starting DailyTrack Backend...")

# Load MongoDB URI
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    # Fallback to provided URI if env var is missing (for local testing, though Render should have it)
    MONGODB_URI = "mongodb+srv://Sahanashre_ind-data:Indegene%407481@cluster0.5cdvrf5.mongodb.net/"
    print("⚠️ WARNING: MONGODB_URI env var not found, using default.")

DATABASE_NAME = "dailytrack"
COLLECTION_NAME = "worklogs"

try:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    print("✅ MongoDB Client initialized.")
except Exception as e:
    print(f"❌ Failed to initialize MongoDB Client: {e}")
    sys.exit(1)

app = FastAPI()

# Allow CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    model_config = ConfigDict(populate_by_name=True)
    
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

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/worklogs", response_model=List[WorkLogModel])
async def get_all_worklogs():
    try:
        cursor = collection.find({})
        logs = []
        async for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            logs.append(WorkLogModel(**doc))
        return logs
    except Exception as e:
        print(f"Error fetching logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    try:
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
    except Exception as e:
        print(f"Error upserting log: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    print("🔔 Application starting up...")
    try:
        # Simple ping to check DB connection
        await client.admin.command('ping')
        print("✅ MongoDB connection verified.")
        
        count = await collection.count_documents({})
        if count == 0:
            print("🌱 Seeding initial data...")
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
                }
            ]
            for d in dummy_logs:
                d = compute_aggregates(d)
                now_iso = datetime.utcnow().isoformat()
                d["loggedAt"] = now_iso
                d["updatedAt"] = now_iso
                await collection.insert_one(d)
            print("✅ Seeded dummy worklog data.")
    except Exception as e:
        print(f"❌ Startup/Seeding error: {e}")
