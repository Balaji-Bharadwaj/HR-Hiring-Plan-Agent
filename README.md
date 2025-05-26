# AI Hiring Plan Generator

An AI-powered FastAPI backend and React frontend application that automates the creation of comprehensive hiring plans for HR professionals using LangChain tools and Google Gemini Pro.

You can access the application with the following URL: https://hragent-793025276323.us-central1.run.app/

Please find the sample prompts in Sample_Prompts.txt


## Table of Contents

*   [Features](#features)
*   [How It Works (Application Flow)](#how-it-works-application-flow)
*   [Tech Stack](#tech-stack)
*   [Project Structure](#project-structure)
*   [Prerequisites](#prerequisites)
*   [Setup and Installation](#setup-and-installation)
    *   [Backend (FastAPI)](#backend-fastapi)
    *   [Frontend (React)](#frontend-react)
*   [Running the Application](#running-the-application)
    *   [Development Mode](#development-mode)
    *   [Production-like (Serving Frontend via Backend)](#production-like-serving-frontend-via-backend)
*   [Environment Variables](#environment-variables)
*   [API Endpoints](#api-endpoints)
*   [Contributing](#contributing)
*   [License](#license)

## Features

*   **AI-Driven Role Analysis:** Intelligently analyzes initial role descriptions.
*   **Clarification Question Generation:** Asks targeted questions if crucial details are missing.
*   **Automated Job Description Creation:** Generates professional and engaging job descriptions.
*   **Sourcing Channel Recommendations:** Suggests effective channels to find suitable candidates.
*   **Customized Interview Process Design:** Outlines a multi-stage interview process with sample questions.
*   **Comprehensive Hiring Plan Summary:** Compiles all generated components into a final plan.
*   **Interactive Multi-Step UI:** User-friendly interface to guide through the plan creation process.
*   **Tool Execution Visualization:** Provides a (simulated) visual insight into the AI agent's tool usage.
*   **API Health & Tool Status:** Displays the status of the backend API and available tools.
*   **Downloadable Hiring Plan:** Allows users to download the generated plan as a JSON file.

## How It Works (Application Flow)

The application guides the user through a series of steps to generate a hiring plan:

1.  **Input Role Description:** The user provides an initial description of the job role.
2.  **AI Analysis & Clarification (Optional):**
    *   The frontend sends the description to the backend's `/api/analyze-role` endpoint.
    *   The backend AI agent uses the `analyze_role_for_clarification` tool.
    *   If the AI determines more information is needed, it returns clarification questions.
    *   The frontend displays these questions, and the user can provide answers.
3.  **Generate Hiring Plan:**
    *   The user (with or without providing clarification answers) triggers the plan creation.
    *   The frontend calls the backend's `/api/create-hiring-plan` endpoint with the role description and any answers.
    *   The backend AI agent then sequentially uses its specialized tools:
        *   `create_job_description`: To draft the job description.
        *   `suggest_sourcing_channels`: To list relevant sourcing platforms.
        *   `design_interview_process`: To outline interview stages and questions.
        *   `create_hiring_plan_summary`: To compile a comprehensive summary.
    *   Throughout this process, the frontend's "Tool Visualization" section shows a simulated progression of these tools being "used".
4.  **Display & Download Plan:**
    *   The backend returns the complete hiring plan (job description, sourcing channels, interview stages, and summary).
    *   The frontend displays this information in a structured format.
    *   The user can download the generated plan as a JSON file.

## Tech Stack

**Backend:**

*   Python 3.9+
*   FastAPI: For building the REST API.
*   LangChain: Framework for LLM application development.
*   Langchain-Google-Genai: Integration with Google Gemini models.
*   Pydantic: For data validation.
*   Uvicorn: ASGI server for FastAPI.
*   python-dotenv: For managing environment variables.

**Frontend:**

*   React 18+
*   JavaScript (ES6+)
*   Tailwind CSS: For styling.
*   Lucide React: For icons.
*   Vite: For frontend tooling (bundling, dev server).

**Core AI:**

*   Google Gemini Pro (via LangChain)
*   LangChain Agents & Tool Calling

## Project Structure

├── Backend/
│ ├── main.py # FastAPI application, LangChain agent, and tools
│ ├── .env.example # Environment variable template

│ └── requirements.txt # Python dependencies

├── Frontend/

│ ├── public/

│ │ └── ... # Static assets

│ ├── src/

│ │ ├── App.jsx # Main React application component

│ │ ├── index.css # Main CSS (Tailwind directives)

│ │ └── main.jsx # React entry point

│ ├── index.html # HTML entry point for Vite

│ ├── package.json # Frontend dependencies and scripts

│ ├── postcss.config.js # PostCSS configuration (for Tailwind)

│ ├── tailwind.config.js # Tailwind CSS configuration

│ └── vite.config.js # Vite configuration

├── dist/ # (Generated by frontend build, served by backend)

└── README.md


## Prerequisites

*   Node.js (v18.x or later recommended) and npm/yarn.
*   Python (v3.9 or later recommended) and pip.
*   A Google Cloud Project with the Vertex AI API enabled.
*   A `GOOGLE_API_KEY` for accessing the Gemini models (obtained from Google AI Studio or Google Cloud Console).

## API Endpoints

The backend exposes the following main API endpoints:
* GET /api/health: Checks the health of the API and LLM initialization.
* GET /api/tools: Lists the available LangChain tools configured in the agent.
* POST /api/analyze-role: Analyzes the role description for clarifications.
    Request Body: { "role_description": "string" }
    Response: { "questions": ["string"], "needs_clarification": boolean }
* POST /api/create-hiring-plan: Creates the full hiring plan.
    Request Body: { "role_description": "string" }
    Query Parameter (optional): clarification_answers=string
    Response: { "job_description": "string", "sourcing_channels": ["string"], "interview_stages": [{}], "final_plan_summary": "string" }

For detailed API documentation, run the backend server and navigate to http://localhost:8000/docs.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.
