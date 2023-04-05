# Use the official Python image as the base image
FROM python:3.9-slim-buster

# Set the working directory to the NodeBB/career-model directory
WORKDIR /usr/src/app/NodeBB/career-model

# Copy the requirements file to the working directory
COPY requirements.txt .

# Install the required packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the microservice file to the working directory
COPY microservice.py .

# Expose port 8000 for the web application
EXPOSE 8000

# Start the web application with uvicorn
CMD ["uvicorn", "microservice:app", "--host", "0.0.0.0", "--port", "8000"]
