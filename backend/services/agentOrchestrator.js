// backend/services/agentOrchestrator.js
class AgentOrchestrator {
    constructor() {
      this.agents = {
        ideation: new IdeationAgent(),
        coding: new CodingAgent(),
        documentation: new DocumentationAgent(),
        testing: new TestingAgent(), // NEW
        deployment: new DeploymentAgent() // NEW
      };
    }
  
    async executeWorkflow(userPrompt, options = {}) {
      const workflow = {
        id: generateId(),
        steps: [],
        status: 'running',
        startTime: Date.now()
      };
  
      try {
        // Step 1: Ideation
        workflow.steps.push({
          agent: 'ideation',
          status: 'running',
          startTime: Date.now()
        });
        
        const ideation = await this.agents.ideation.generate(userPrompt);
        workflow.steps[0].status = 'completed';
        workflow.steps[0].result = ideation;
  
        // Step 2: Code Generation
        workflow.steps.push({
          agent: 'coding',
          status: 'running',
          startTime: Date.now()
        });
        
        const code = await this.agents.coding.generate(ideation, userPrompt);
        workflow.steps[1].status = 'completed';
        workflow.steps[1].result = code;
  
        // Step 3: Testing (NEW)
        if (options.includeTests) {
          workflow.steps.push({
            agent: 'testing',
            status: 'running',
            startTime: Date.now()
          });
          
          const tests = await this.agents.testing.generate(code, ideation);
          workflow.steps[2].status = 'completed';
          workflow.steps[2].result = tests;
        }
  
        // Step 4: Documentation
        workflow.steps.push({
          agent: 'documentation',
          status: 'running',
          startTime: Date.now()
        });
        
        const docs = await this.agents.documentation.generate(ideation, code);
        workflow.steps[workflow.steps.length - 1].status = 'completed';
        workflow.steps[workflow.steps.length - 1].result = docs;
  
        workflow.status = 'completed';
        workflow.endTime = Date.now();
        workflow.duration = workflow.endTime - workflow.startTime;
  
        return workflow;
  
      } catch (error) {
        workflow.status = 'failed';
        workflow.error = error.message;
        throw error;
      }
    }
  }