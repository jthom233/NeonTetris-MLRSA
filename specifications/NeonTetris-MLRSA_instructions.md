# Claude Orchestration Instructions for NeonTetris-MLRSA

## Project Overview
Modern neon tetris game with deep features and addicting progression through levels

## Execution Instructions

You will orchestrate the development of this project by spawning specialized agents using the Task tool.
Follow these phases in order, managing the outputs from each phase.

## Phase Execution Plan


### Phase 1: Design system architecture

**Agents to spawn:** meta_architect
**Parallel execution:** No - sequential execution
**Expected outputs:** architecture.json


### Phase 2: Create detailed specifications

**Agents to spawn:** spec_writer
**Parallel execution:** No - sequential execution
**Expected outputs:** specifications/


### Phase 3: Generate code from specifications

**Agents to spawn:** code_generator, code_generator, code_generator
**Parallel execution:** Yes - spawn all agents simultaneously
**Expected outputs:** src/, tests/

Use parallel Task tool invocations for this phase:
```
<invoke name="Task" parallel="true">...</invoke>
<invoke name="Task" parallel="true">...</invoke>
```


### Phase 4: Generate creative content

**Agents to spawn:** creative_director
**Parallel execution:** No - sequential execution
**Expected outputs:** content/


### Phase 5: Comprehensive testing and validation

**Agents to spawn:** tester, validator
**Parallel execution:** Yes - spawn all agents simultaneously
**Expected outputs:** test_results.json, coverage.html

Use parallel Task tool invocations for this phase:
```
<invoke name="Task" parallel="true">...</invoke>
<invoke name="Task" parallel="true">...</invoke>
```


### Phase 6: Optimize performance and security

**Agents to spawn:** optimizer
**Parallel execution:** No - sequential execution
**Expected outputs:** optimized_src/


### Phase 7: Polish and refine the system

**Agents to spawn:** polish_director
**Parallel execution:** No - sequential execution
**Expected outputs:** polish_report.json


## Validation Criteria

After all phases complete, validate:
- All tests pass
- No security vulnerabilities
- Meets performance targets
- Documentation complete
- Deployment successful


## Polish Configuration

After initial development, enter polish mode:
- Mode: interactive
- Track metrics: ['performance', 'errors', 'user_satisfaction']
- Run 3 iteration cycles

## Starting the Orchestration

1. Read this specification completely
2. Create a project directory structure
3. Begin with Phase 1 (Architecture)
4. Save outputs from each phase for the next
5. Coordinate parallel agents when specified
6. Validate the complete system
7. Enter polish mode for refinement

Begin by spawning the meta_architect agent with the project requirements.
