---
name: task
description: >-
  Use this skill when the user uses the /task command or asks you to process a list of tasks. The goal of this skill is to parse the provided tasks and create a detailed step-by-step execution plan for them.
---

# Task Execution Plan Skill

When the user provides a list of tasks (especially using the `/task` trigger), your objective is to analyze the requested features and generate a comprehensive execution plan with switch branch for new branch feature with the name of tasks.

## Steps

1. **Analyze the Request**: Read the user's list of tasks carefully. Understand the context, dependencies, and requirements of each item.
2. **Breakdown**: Break down each task into smaller, switch the branch for the new branch or in charge of the user's branch to execute actionable technical steps (e.g., UI components to create, database schemas to update, API routes to implement).
3. **Draft the Plan**: Create a markdown artifact named `execution_plan.md` (using the artifacts folder).
4. **Structure the Plan**: The plan should contain:
   - A high-level summary of the goal.
   - A sequential, numbered list of steps to accomplish all tasks.
   - Dependencies between steps, if any.
   - Verification steps to ensure each task is completed successfully.
5. **Request Feedback**: Ask the user to review the generated execution plan before you start implementing the code. Do not start coding until the plan is approved.
