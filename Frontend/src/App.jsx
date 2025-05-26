import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Search, 
  MessageCircle, 
  CheckCircle2, 
  FileText, 
  Target, 
  Zap,
  ChevronRight,
  Bot,
  Sparkles,
  Clock,
  ArrowRight,
  Play,
  Award,
  Wrench,
  Loader,
  Check,
  Eye,
  Activity
} from 'lucide-react';

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [roleDescription, setRoleDescription] = useState('');
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState('');
  const [hiringPlan, setHiringPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiHealth, setApiHealth] = useState(null);
  const [availableTools, setAvailableTools] = useState([]);
  const [activeTools, setActiveTools] = useState([]);
  const [toolExecutionLog, setToolExecutionLog] = useState([]);
  const [showToolVisualization, setShowToolVisualization] = useState(false);

  const steps = [
    { id: 0, title: 'Role Description', icon: Briefcase },
    { id: 1, title: 'Clarifications', icon: MessageCircle },
    { id: 2, title: 'Hiring Plan', icon: CheckCircle2 }
  ];

  // Tool icons mapping
  const toolIcons = {
    'analyze_role_for_clarification': Target,
    'create_job_description': FileText,
    'suggest_sourcing_channels': Search,
    'design_interview_process': Users,
    'create_hiring_plan_summary': Award
  };

  // API functions
  // const API_BASE_URL = 'http://localhost:8000';
  const API_BASE_URL = '';

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const health = await response.json();
      setApiHealth(health);
    } catch (err) {
      console.error('API health check failed:', err);
      setApiHealth({ status: 'unhealthy' });
    }
  };

  const fetchAvailableTools = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools`);
      const data = await response.json();
      setAvailableTools(data.tools || []);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    }
  };

  const addToolToLog = (toolName, status, description) => {
    const timestamp = new Date().toLocaleTimeString();
    setToolExecutionLog(prev => [...prev, {
      tool: toolName,
      status,
      description,
      timestamp,
      id: Date.now()
    }]);
  };

  const simulateToolExecution = async (toolName, description, duration = 2000) => {
    // Add tool as active
    setActiveTools(prev => [...prev, toolName]);
    addToolToLog(toolName, 'running', description);
    
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Mark as completed
    setActiveTools(prev => prev.filter(t => t !== toolName));
    addToolToLog(toolName, 'completed', `${description} - Completed`);
  };

  const analyzeRole = async (roleDescription) => {
    setShowToolVisualization(true);
    setToolExecutionLog([]);
    
    // Simulate tool execution
    await simulateToolExecution(
      'analyze_role_for_clarification', 
      'Analyzing role description for missing details'
    );
    
    const response = await fetch(`${API_BASE_URL}/api/analyze-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role_description: roleDescription }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze role');
    }
    
    return await response.json();
  };

  const createHiringPlan = async (roleDescription, clarificationAnswers = null) => {
    setShowToolVisualization(true);
    setToolExecutionLog([]);
    
    // Simulate multiple tool executions
    const toolSequence = [
      { name: 'create_job_description', desc: 'Creating comprehensive job description', duration: 3000 },
      { name: 'suggest_sourcing_channels', desc: 'Identifying optimal sourcing channels', duration: 2500 },
      { name: 'design_interview_process', desc: 'Designing multi-stage interview process', duration: 3500 },
      { name: 'create_hiring_plan_summary', desc: 'Compiling final hiring plan summary', duration: 2000 }
    ];

    // Execute tools sequentially
    for (const tool of toolSequence) {
      await simulateToolExecution(tool.name, tool.desc, tool.duration);
    }
    
    const url = clarificationAnswers 
      ? `${API_BASE_URL}/api/create-hiring-plan?clarification_answers=${encodeURIComponent(clarificationAnswers)}`
      : `${API_BASE_URL}/api/create-hiring-plan`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role_description: roleDescription }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create hiring plan');
    }
    
    return await response.json();
  };

  useEffect(() => {
    checkApiHealth();
    fetchAvailableTools();
  }, []);

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleDescription.trim()) return;

    setLoading(true);
    setError('');

    try {
      const analysis = await analyzeRole(roleDescription);
      
      if (analysis.needs_clarification && analysis.questions.length > 0) {
        setClarificationQuestions(analysis.questions);
        setCurrentStep(1);
      } else {
        // Skip clarifications and go directly to hiring plan
        await handleCreateHiringPlan();
      }
    } catch (err) {
      setError('Failed to analyze role description. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    await handleCreateHiringPlan();
  };

  const handleCreateHiringPlan = async () => {
    setLoading(true);
    setError('');

    try {
      const plan = await createHiringPlan(roleDescription, clarificationAnswers);
      setHiringPlan(plan);
      setCurrentStep(2);
    } catch (err) {
      setError('Failed to create hiring plan. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setRoleDescription('');
    setClarificationQuestions([]);
    setClarificationAnswers('');
    setHiringPlan(null);
    setError('');
    setShowToolVisualization(false);
    setToolExecutionLog([]);
    setActiveTools([]);
  };

  const formatInterviewStages = (stages) => {
    if (!stages || !Array.isArray(stages)) return [];
    
    return stages.map((stage, index) => {
      if (typeof stage === 'string') {
        return { stage_name: `Stage ${index + 1}`, purpose: stage, questions: [] };
      }
      return stage;
    });
  };

  const ToolVisualization = () => {
    if (!showToolVisualization) return null;

    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
        <div className="flex items-center mb-4">
          <Activity className="h-6 w-6 text-cyan-300 mr-3" />
          <h3 className="text-xl font-semibold text-white">AI Agent Tools in Action</h3>
          <div className="ml-auto flex items-center space-x-2">
            <Eye className="h-4 w-4 text-cyan-300" />
            <span className="text-cyan-300 text-sm">Live View</span>
          </div>
        </div>

        {/* Available Tools Overview */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Available Tools:</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {availableTools.map((tool, index) => {
              const IconComponent = toolIcons[tool.name] || Wrench;
              const isActive = activeTools.includes(tool.name);
              const isCompleted = toolExecutionLog.some(log => log.tool === tool.name && log.status === 'completed');
              
              return (
                <div
                  key={index}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
                    isActive 
                      ? 'bg-cyan-500/20 border-cyan-400 animate-pulse' 
                      : isCompleted
                        ? 'bg-green-500/20 border-green-400'
                        : 'bg-white/5 border-white/10'
                  }`}
                >
                  <IconComponent className={`h-6 w-6 mb-2 ${
                    isActive ? 'text-cyan-300' : isCompleted ? 'text-green-300' : 'text-white/60'
                  }`} />
                  <span className={`text-xs font-medium text-center ${
                    isActive ? 'text-cyan-300' : isCompleted ? 'text-green-300' : 'text-white/60'
                  }`}>
                    {tool.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {isActive && (
                    <Loader className="h-3 w-3 text-cyan-300 animate-spin mt-1" />
                  )}
                  {isCompleted && (
                    <Check className="h-3 w-3 text-green-300 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Log */}
        {toolExecutionLog.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-3">Execution Log:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {toolExecutionLog.map((log) => {
                const IconComponent = toolIcons[log.tool] || Wrench;
                return (
                  <div
                    key={log.id}
                    className={`flex items-center p-3 rounded-lg border ${
                      log.status === 'running' 
                        ? 'bg-cyan-500/10 border-cyan-400/30' 
                        : 'bg-green-500/10 border-green-400/30'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 mr-3 ${
                      log.status === 'running' ? 'text-cyan-300' : 'text-green-300'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{log.description}</p>
                      <p className="text-white/60 text-xs">{log.timestamp}</p>
                    </div>
                    {log.status === 'running' ? (
                      <Loader className="h-4 w-4 text-cyan-300 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-green-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-4 mr-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              HR Hiring Plan Agent
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-300 ml-2" />
          </div>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            AI-powered hiring plan generator with transparent tool execution
          </p>
          
          {/* API Status */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/10 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${apiHealth?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-white">
                API: {apiHealth?.status === 'healthy' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/10 backdrop-blur-sm">
              <Wrench className="w-3 h-3 mr-2 text-cyan-300" />
              <span className="text-white">
                {availableTools.length} Tools Available
              </span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-3 px-4 py-2 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  <step.icon className="h-5 w-5" />
                  <span className="font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-white/40 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tool Visualization */}
        {(loading || showToolVisualization) && <ToolVisualization />}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-100 text-center backdrop-blur-sm max-w-4xl mx-auto">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Step 0: Role Description */}
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <Briefcase className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Describe Your Role</h2>
                  <p className="text-blue-100">
                    Tell us about the position you're looking to fill
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="block text-white font-medium mb-3">
                      Role Description
                    </div>
                    <textarea
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      placeholder="E.g., We're looking for a Senior Backend Developer to join our AI startup. The role involves building scalable APIs, working with LLMs, and leading a small team..."
                      className="w-full h-40 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none backdrop-blur-sm"
                    />
                  </div>

                  <button
                    onClick={handleRoleSubmit}
                    disabled={loading || !roleDescription.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl px-8 py-4 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing with AI Tools...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze Role</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Target, title: 'Smart Analysis', desc: 'AI analyzes your requirements using specialized tools' },
                  { icon: Search, title: 'Sourcing Strategy', desc: 'Find the best candidates with AI-powered recommendations' },
                  { icon: Users, title: 'Interview Process', desc: 'Structured hiring workflow designed by AI agents' }
                ].map((feature, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 transform hover:scale-105 transition-all duration-300 ease-in-out hover:shadow-2xl">
                    <feature.icon className="h-8 w-8 text-blue-300 mb-3" />
                    <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                    <p className="text-blue-100 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Clarifications */}
          {currentStep === 1 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <MessageCircle className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Clarification Questions</h2>
                <p className="text-blue-100">
                  Help us create a more detailed hiring plan
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Questions for you:</h3>
                <div className="space-y-3">
                  {clarificationQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="bg-white/5 p-4 rounded-lg border border-white/10"
                    >
                      <p className="text-white">{question}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="block text-white font-medium mb-3">
                    Your Answers
                  </div>
                  <textarea
                    value={clarificationAnswers}
                    onChange={(e) => setClarificationAnswers(e.target.value)}
                    placeholder="Please answer the questions above to help us create a better hiring plan..."
                    className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none backdrop-blur-sm"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleCreateHiringPlan()}
                    className="flex-1 bg-white/10 hover:bg-white/20 px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 border border-white/20"
                  >
                    Skip Questions
                  </button>
                  <button
                    onClick={handleClarificationSubmit}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>AI Tools Working...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Hiring Plan</span>
                        <Zap className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hiring Plan */}
          {currentStep === 2 && hiringPlan && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Your Hiring Plan</h2>
                  <p className="text-blue-100">
                    Complete strategy created by AI tools
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Job Description */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center mb-4">
                      <FileText className="h-6 w-6 text-blue-300 mr-3" />
                      <h3 className="text-xl font-semibold text-white">Job Description</h3>
                      <div className="ml-auto text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                        AI Generated
                      </div>
                    </div>
                    <div className="text-blue-100 whitespace-pre-wrap text-sm leading-relaxed">
                      {hiringPlan.job_description}
                    </div>
                  </div>

                  {/* Sourcing Channels */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center mb-4">
                      <Search className="h-6 w-6 text-purple-300 mr-3" />
                      <h3 className="text-xl font-semibold text-white">Sourcing Channels</h3>
                      <div className="ml-auto text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                        AI Recommended
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {hiringPlan.sourcing_channels?.map((channel, index) => (
                        <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <p className="text-blue-100 text-sm">{channel}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interview Process */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center mb-4">
                      <Users className="h-6 w-6 text-green-300 mr-3" />
                      <h3 className="text-xl font-semibold text-white">Interview Process</h3>
                      <div className="ml-auto text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                        AI Designed
                      </div>
                    </div>
                    <div className="space-y-4">
                      {formatInterviewStages(hiringPlan.interview_stages).map((stage, index) => (
                        <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                              {index + 1}
                            </div>
                            <h4 className="text-white font-semibold">{stage.stage_name}</h4>
                          </div>
                          <p className="text-blue-200 text-sm mb-3 ml-11">{stage.purpose}</p>
                          {stage.questions && stage.questions.length > 0 && (
                            <div className="ml-11">
                              <p className="text-white text-sm font-medium mb-2">Sample Questions:</p>
                              <ul className="space-y-1">
                                {stage.questions.map((question, qIndex) => (
                                  <li key={qIndex} className="text-blue-100 text-sm flex items-start">
                                    <span className="text-blue-300 mr-2">•</span>
                                    {question}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {hiringPlan.final_plan_summary && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-center mb-4">
                        <Award className="h-6 w-6 text-yellow-300 mr-3" />
                        <h3 className="text-xl font-semibold text-white">Plan Summary</h3>
                        <div className="ml-auto text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded">
                          AI Compiled
                        </div>
                      </div>
                      <div className="text-blue-100 whitespace-pre-wrap text-sm leading-relaxed">
                        {hiringPlan.final_plan_summary}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 mt-8">
                  <button
                    onClick={resetFlow}
                    className="bg-white/10 hover:bg-white/20 px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 border border-white/20"
                  >
                    Create Another Plan
                  </button>
                  <button
                    onClick={() => {
                      const element = document.createElement('a');
                      const file = new Blob([JSON.stringify(hiringPlan, null, 2)], {type: 'application/json'});
                      element.href = URL.createObjectURL(file);
                      element.download = 'hiring-plan.json';
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl px-6 py-3 text-white font-semibold rounded-lg flex items-center space-x-2"
                  >
                    <span>Download Plan</span>
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;