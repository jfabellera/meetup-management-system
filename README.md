# meetup-management-system

A way to manage large-scale meetups for Tex Mechs.

# Project Details

This project is split into two portions:

- The backend that sets up a REST API to query the database (PostgreSQL by default)
- The frontend React application with the UI to interact with the data

# Setup

## Prerequisites

Make sure your database is setup and ready to go. You can review the following page on the Wiki for a sample database setup: https://github.com/jfabellera/meetup-management-system/wiki/Database-Setup

## backend

1. Install dependencies.

```
npm install
```

2. Create a `.env` file in `backend/api` in the following format (Ports may change depending on database used/personal preference):

```
MMS_API_SERVER_URL=http://localhost
MMS_API_SERVER_PORT=3000

MMS_DATABASE_HOST=localhost
MMS_DATABASE_PORT=5432
MMS_DATABASE_NAME=
MMS_DATABASE_USER=
MMS_DATABASE_PASSWORD=
```

3. Start server.

```
npm start
```

2.

## frontend

1. Install dependencies.

```
npm install
```

2. Create a `.env` file in `frontend` in the following format (Variables may change depending on port used/personal preference):
   **Make sure your API URL matches the API Server URL and port you specified in your backend .env file above.**

```
VITE_APP_TITLE=Meetup Management System
VITE_API_URL=http://localhost:3000/api
```

3. Run the app.

```
npm run [dev|prod]
```
