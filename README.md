# FitFlow

FitFlow is a MERN stack application built with TypeScript to help users track their gym workouts, meals, and weight.

## Project Goal

The primary goal of this application is to provide a comprehensive tool for users to monitor and manage their fitness journey, including workout logging, nutrition tracking, and progress monitoring.

## Tech Stack

*   **MongoDB**: NoSQL database for storing application data.
*   **Express.js**: Backend web framework running on Node.js.
*   **React.js**: Frontend library for building the user interface.
*   **Node.js**: JavaScript runtime for the backend.
*   **TypeScript**: Superset of JavaScript for static typing.

## Features (Planned)

*   User Authentication (Sign up, Login, Logout)
*   Workout Tracking (Log exercises, sets, reps, weight)
*   Nutrition Logging (Track meals, food items, calories, macros)
*   Weight Management (Log current weight, track progress towards goal weight)
*   Gamification (Points, levels, streaks)
*   Dashboard for progress visualization

## Getting Started

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (v9.x or later recommended)
*   MongoDB (local instance or Atlas connection string)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd windsurf-gym-app
    ```
2.  Install root dependencies:
    ```bash
    npm install
    ```
    This will also install dependencies for the `server` and `client` automatically due to the `postinstall` script in the root `package.json`.

3.  Set up environment variables:
    *   Navigate to the `server` directory: `cd server`
    *   Create a `.env` file by copying the `.env.example`:
        ```bash
        cp .env.example .env
        ```
    *   Update the `.env` file with your MongoDB connection string and other necessary configurations (e.g., `JWT_SECRET`).

### Running the Application

From the root project directory (`windsurf-gym-app`):

```bash
npm run dev
```

This command will start both the backend server and the frontend development server concurrently.

*   Backend server typically runs on `http://localhost:5001` (or as configured).
*   Frontend client typically runs on `http://localhost:5173` (Vite default) or `http://localhost:3000` (CRA default).

## Project Structure

```
windsurf-gym-app/
├── client/         # React frontend (Vite + TypeScript)
├── doku/           # Documentation files
├── server/         # Express backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── config/     # Database configuration, etc.
│   │   ├── controllers/ # Request handlers
│   │   ├── middlewares/ # Custom middlewares (e.g., auth)
│   │   ├── models/     # Mongoose schemas and models
│   │   ├── routes/     # API routes
│   │   ├── utils/      # Utility functions
│   │   └── server.ts   # Main server entry point
│   ├── .env.example  # Environment variable template
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── package.json    # Root package.json
└── README.md
```

## Documentation

Project documentation can be found in the `doku/` directory and can be served locally for viewing.

## Contributing

Details on contributing to the project will be added here.
