FROM docker.1ms.run/library/python:3.12.16-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.lock requirements-dev.txt requirements.txt ./
RUN pip install --no-cache-dir -r requirements.lock
COPY . .

EXPOSE 5000
CMD ["python", "run.py"]

