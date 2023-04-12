from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel
from predict import predict

app = FastAPI()

class StudentData(BaseModel):
    student_id: str
    major: str
    age: str
    gender: str 
    gpa: str
    extra_curricular: str
    num_programming_languages: str
    num_past_internships: str

@app.post("/predict")
async def process_student_data(studentData: StudentData):
    return predict(studentData)
