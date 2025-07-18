from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for form submissions
submissions = []

class WeeklyFormSubmission(BaseModel):
    riot_id: str
    days: List[str]
    avoid_lanes: List[str]
    preferred_opponents: str

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/weekly-form")
def submit_weekly_form(form: WeeklyFormSubmission):
    submissions.append(form.dict())
    return {"message": "Form submitted successfully!"}

@app.get("/api/weekly-form")
def get_weekly_forms():
    return {"submissions": submissions} 