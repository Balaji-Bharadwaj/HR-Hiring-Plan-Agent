import os
from dotenv import load_dotenv
from typing import TypedDict, List, Annotated, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import BaseTool, tool
from langchain_core.pydantic_v1 import BaseModel as PydanticBaseModel, Field
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from contextlib import asynccontextmanager
import logging
import json

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API requests/responses
class RoleRequest(BaseModel):
    role_description: str

class ClarificationResponse(BaseModel):
    questions: List[str]
    needs_clarification: bool

class ClarificationAnswers(BaseModel):
    answers: str

class HiringPlanResponse(BaseModel):
    job_description: str
    sourcing_channels: List[str]
    interview_stages: List[Dict[str, Any]]
    final_plan_summary: str

class HiringPlanState(TypedDict):
    initial_role_description: str
    clarified_role_details: str | None
    job_description: str | None
    sourcing_channels: List[str] | None
    interview_stages: List[Dict[str, Any]] | None
    final_plan_summary: str | None
    messages: List
    needs_clarification: bool
    session_id: str | None

class RoleAnalysisInput(PydanticBaseModel):
    """Input for role analysis tool"""
    role_description: str = Field(description="The initial role description to analyze")

class JobDescriptionInput(PydanticBaseModel):
    """Input for job description creation tool"""
    role_details: str = Field(description="Detailed role information for creating job description")

class SourcingChannelsInput(PydanticBaseModel):
    """Input for sourcing channels suggestion tool"""
    role_details: str = Field(description="Role details to determine appropriate sourcing channels")
    job_description: str = Field(description="Job description to help with channel selection")

class InterviewProcessInput(PydanticBaseModel):
    """Input for interview process design tool"""
    role_details: str = Field(description="Role details to design appropriate interview stages")

class HiringPlanSummaryInput(PydanticBaseModel):
    """Input for hiring plan summary tool"""
    role_details: str = Field(description="Role details")
    job_description: str = Field(description="Complete job description")
    sourcing_channels: List[str] = Field(description="List of sourcing channels")
    interview_stages: List[Dict[str, Any]] = Field(description="Interview stages with details")

# Defining LangChain Tools
@tool("analyze_role_for_clarification", args_schema=RoleAnalysisInput)
def analyze_role_for_clarification(role_description: str) -> str:
    """
    Analyze a role description to identify if crucial details are missing for creating a comprehensive hiring plan.
    Returns either clarification questions or confirmation that the description is complete.
    """
    analysis_prompt = f"""
    You are an expert HR consultant. Based on the initial role description provided,
    identify if crucial details are missing for creating a comprehensive hiring plan.
    Missing details could include: specific responsibilities beyond general duties, required years of experience,
    team structure (e.g., reporting line, team size), key success metrics for the role, or specific technologies.

    If details are missing, formulate 2-3 targeted questions to ask the HR professional to get these details.
    If the description seems reasonably complete for initial planning, state that and suggest moving to drafting the Job Description.

    Output format:
    - If questions are needed: Start your response with "CLARIFICATION_NEEDED:" followed by your questions.
    - If no questions are needed: Start your response with "CLARIFICATION_NOT_NEEDED:" followed by your statement.

    Role description: {role_description}
    """
    
    return analysis_prompt

@tool("create_job_description", args_schema=JobDescriptionInput)
def create_job_description(role_details: str) -> str:
    """
    Create a comprehensive job description based on role details.
    """
    return f"""
    Create a comprehensive job description for the following role:

    Role Details: {role_details}

    Please include:
    - Job Title
    - Company Overview
    - Role Summary
    - Key Responsibilities (5-7 bullet points)
    - Required Qualifications
    - Preferred Qualifications
    - What We Offer
    - Compensation Range (if applicable)

    Make it engaging and specific to attract the right candidates.
    """

@tool("suggest_sourcing_channels", args_schema=SourcingChannelsInput)
def suggest_sourcing_channels(role_details: str, job_description: str) -> str:
    """
    Suggest 3-5 diverse and effective sourcing channels for finding suitable candidates.
    """
    return f"""
    Based on the role details and job description below, suggest 3-5 diverse and effective sourcing channels 
    for a startup to find suitable candidates. Consider a mix of common platforms (like LinkedIn, specialized job boards) 
    and niche communities if applicable.

    For each channel, briefly explain (1-2 sentences) why it is suitable for this specific role at a startup.

    Role Details: {role_details}

    Job Description: {job_description[:300]}...

    Format your response as a numbered list with explanations.
    """

@tool("design_interview_process", args_schema=InterviewProcessInput)
def design_interview_process(role_details: str) -> str:
    """
    Design a multi-stage interview process suitable for the role.
    """
    return f"""
    Based on the role details provided, outline a typical multi-stage interview process suitable for hiring 
    this technical role at a startup.

    For each stage, please clearly structure it as follows:
    STAGE NAME: [Name of the stage]
    PURPOSE: [What this stage aims to assess]
    KEY SAMPLE QUESTIONS:
    - [Question 1]
    - [Question 2]
    - [Question 3]

    Role Details: {role_details}

    Please structure your output clearly following this format for each stage. Ensure each stage is 
    distinctly separated and begins with "STAGE NAME:".
    """

@tool("create_hiring_plan_summary", args_schema=HiringPlanSummaryInput)
def create_hiring_plan_summary(
    role_details: str, 
    job_description: str, 
    sourcing_channels: List[str], 
    interview_stages: List[Dict[str, Any]]
) -> str:
    """
    Create a comprehensive summary of the entire hiring plan.
    """
    sourcing_text = "\n".join([f"- {channel}" for channel in sourcing_channels])
    
    interview_text = ""
    for stage in interview_stages:
        if isinstance(stage, dict):
            interview_text += f"\n- **Stage:** {stage.get('stage_name', 'N/A')}\n"
            interview_text += f"  **Purpose:** {stage.get('purpose', 'N/A')}\n"
            questions = stage.get('questions', [])
            if questions:
                interview_text += f"  **Sample Questions:**\n"
                for q in questions:
                    interview_text += f"    - {q}\n"
    
    return f"""
    **COMPREHENSIVE HIRING PLAN**

    **Role:** {role_details}

    **Job Description:**
    {job_description}

    **Suggested Sourcing Channels:**
    {sourcing_text}

    **Proposed Interview Process:**
    {interview_text}

    **Next Steps:**
    - Review and customize this plan based on your company's specific needs
    - Set up tracking mechanisms for candidate pipeline
    - Prepare interview scorecards based on the suggested questions
    - Consider timeline and resource allocation for the hiring process

    This plan provides a foundational structure. Remember to adapt it based on candidate flow and feedback.
    """

# Global variables
llm = None
agent_executor = None
tools = None

async def initialize_llm_and_tools():
    """Initialize the LLM and tools on startup"""
    global llm, agent_executor, tools
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro-latest", 
            temperature=0.7, 
            convert_system_message_to_human=True
        )
        
        # Define tools
        tools = [
            analyze_role_for_clarification,
            create_job_description,
            suggest_sourcing_channels,
            design_interview_process,
            create_hiring_plan_summary
        ]
        
        # Create agent prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert HR consultant specializing in creating comprehensive hiring plans. 
            You have access to specialized tools to help analyze roles, create job descriptions, suggest sourcing channels, 
            design interview processes, and summarize hiring plans.
            
            Always use the appropriate tools to complete tasks. Be thorough and professional in your responses.
            When using tools, make sure to extract and format the results appropriately for the user."""),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])
        
        # Create agent
        agent = create_tool_calling_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        
        logger.info("LLM and tools initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize LLM and tools: {e}")
        raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    await initialize_llm_and_tools()
    yield
    # Shutdown
    logger.info("Shutting down HR Agent API")

# Initialize FastAPI app
app = FastAPI(
    title="HR Hiring Plan Agent API",
    description="AI-powered HR assistant for creating comprehensive hiring plans using LangChain Tools",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper functions to parse tool outputs
def parse_clarification_response(response: str) -> tuple[bool, List[str]]:
    """Parse the clarification analysis response"""
    questions = []
    needs_clarification = False
    
    if "CLARIFICATION_NEEDED:" in response:
        needs_clarification = True
        questions_text = response.split("CLARIFICATION_NEEDED:")[1].strip()
        # Parse questions from the text
        lines = questions_text.split('\n')
        for line in lines:
            line = line.strip()
            if line and (line.startswith(('1.', '2.', '3.', '-', '•')) or '?' in line):
                # Clean up the question
                question = line.lstrip('123.-•').strip()
                if question and '?' in question:
                    questions.append(question)
    
    return needs_clarification, questions

def parse_interview_stages(response: str) -> List[Dict[str, Any]]:
    """Parse interview stages from tool response"""
    stages = []
    
    # Split by STAGE NAME:
    stage_segments = response.split("STAGE NAME:")
    
    for segment in stage_segments[1:]:  # Skip first empty segment
        stage_data = {"stage_name": "", "purpose": "", "questions": []}
        lines = [line.strip() for line in segment.split('\n') if line.strip()]
        
        if not lines:
            continue
            
        # First line is the stage name
        stage_data["stage_name"] = lines[0].strip()
        
        # Parse purpose and questions
        parsing_questions = False
        for line in lines[1:]:
            if line.startswith("PURPOSE:"):
                stage_data["purpose"] = line.replace("PURPOSE:", "").strip()
                parsing_questions = False
            elif line.startswith("KEY SAMPLE QUESTIONS:"):
                parsing_questions = True
            elif parsing_questions and line.startswith("-"):
                question = line.lstrip("- ").strip()
                if question:
                    stage_data["questions"].append(question)
        
        if stage_data["stage_name"]:
            stages.append(stage_data)
    
    return stages

def parse_sourcing_channels(response: str) -> List[str]:
    """Parse sourcing channels from tool response"""
    channels = []
    lines = response.split('\n')
    
    for line in lines:
        line = line.strip()
        if line and (line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•'))):
            # Extract the channel info
            channel = line.lstrip('12345.-•').strip()
            if channel:
                channels.append(channel)
    
    return channels if channels else [response]  # Fallback to full response

# API Endpoints
@app.post("/api/analyze-role", response_model=ClarificationResponse)
async def analyze_role(request: RoleRequest):
    """Analyze the initial role description and determine if clarification is needed."""
    try:
        if not agent_executor:
            raise HTTPException(status_code=500, detail="Service not initialized")
        
        # Use the agent to analyze the role
        result = await agent_executor.ainvoke({
            "input": f"Please analyze this role description for missing details that would be crucial for creating a comprehensive hiring plan: {request.role_description}"
        })
        
        response_text = result.get("output", "")
        needs_clarification, questions = parse_clarification_response(response_text)
        
        return ClarificationResponse(
            questions=questions,
            needs_clarification=needs_clarification
        )
        
    except Exception as e:
        logger.error(f"Error in analyze_role: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-hiring-plan", response_model=HiringPlanResponse)
async def create_hiring_plan(request: RoleRequest, clarification_answers: Optional[str] = None):
    """Create a complete hiring plan based on role description and optional clarification answers."""
    try:
        if not agent_executor:
            raise HTTPException(status_code=500, detail="Service not initialized")
        
        # Prepare role details
        role_details = request.role_description
        if clarification_answers:
            role_details += f"\n\nAdditional Details:\n{clarification_answers}"
        
        # Step 1: Create job description
        jd_result = await agent_executor.ainvoke({
            "input": f"Create a comprehensive job description for this role: {role_details}"
        })
        job_description = jd_result.get("output", "")
        
        # Step 2: Suggest sourcing channels
        sourcing_result = await agent_executor.ainvoke({
            "input": f"Suggest sourcing channels for this role: {role_details}\n\nJob Description: {job_description[:300]}..."
        })
        sourcing_response = sourcing_result.get("output", "")
        sourcing_channels = parse_sourcing_channels(sourcing_response)
        
        # Step 3: Design interview process
        interview_result = await agent_executor.ainvoke({
            "input": f"Design an interview process for this role: {role_details}"
        })
        interview_response = interview_result.get("output", "")
        interview_stages = parse_interview_stages(interview_response)
        
        # Step 4: Create summary
        summary_result = await agent_executor.ainvoke({
            "input": f"Create a comprehensive hiring plan summary with these components:\nRole: {role_details}\nJob Description: {job_description}\nSourcing Channels: {sourcing_channels}\nInterview Stages: {interview_stages}"
        })
        final_plan_summary = summary_result.get("output", "")
        
        return HiringPlanResponse(
            job_description=job_description,
            sourcing_channels=sourcing_channels,
            interview_stages=interview_stages,
            final_plan_summary=final_plan_summary
        )
        
    except Exception as e:
        logger.error(f"Error in create_hiring_plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "HR Hiring Plan Agent API with LangChain Tools",
        "llm_initialized": llm is not None,
        "agent_executor_initialized": agent_executor is not None,
        "tools_count": len(tools) if tools else 0
    }

@app.get("/api/tools")
async def list_tools():
    """List available tools."""
    if not tools:
        return {"tools": []}
    
    tool_info = []
    for tool in tools:
        tool_info.append({
            "name": tool.name,
            "description": tool.description,
            "args_schema": tool.args_schema.schema() if tool.args_schema else None
        })
    
    return {"tools": tool_info}

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

@app.get("/")
def read_root():
    return FileResponse('dist/index.html')

app.mount("/assets", StaticFiles(directory="dist/assets"), name = "assets")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")