# FROM python:3.9

# EXPOSE 8080

# # ENV VAR1 = 10

# # ENV PYTHONDONTWRITEBYTECODE 1
# # ENV PYTHONUNBUFFERED 1

# ADD requirements.txt .
# RUN python -m pip install -r requirements.txt

# CMD ["uvicorn", "microservice:app", "--host", "0.0.0.0", "--port", "8080"]

# 
# FROM python:3.9

# # 
# WORKDIR /code

# # 
# COPY ./requirements.txt /code/requirements.txt

# # 
# RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# # 
# COPY ./microservice.py /code/microservice.py

# # 
# CMD ["uvicorn", "microservice:app", "--host", "0.0.0.0", "--port", "80"]


# Use the official Python image as the base image
FROM python:3.9-slim-buster
# Set the working directory to the NodeBB/career-model directory
WORKDIR /usr/src/app/NodeBB/career-model
# Copy the requirements file to the working directory
# COPY requirements.txt .
# Install the required packages
RUN pip install -r requirements.txt
# Copy the microservice file to the working directory
# COPY microservice.py .
COPY . .
# Expose port 8000 for the web application
EXPOSE 8000
# Start the web application with uvicorn
CMD ["uvicorn", "microservice:app", "--host", "0.0.0.0", "--port", "8000"]