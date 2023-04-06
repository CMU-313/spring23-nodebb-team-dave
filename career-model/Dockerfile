FROM python:3.9-slim-buster

WORKDIR /usr/src/app/NodeBB/career-model

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY microservice.py .

COPY predict.py .

EXPOSE 8000

CMD ["uvicorn", "microservice:app", "--host", "0.0.0.0", "--port", "8000"]
