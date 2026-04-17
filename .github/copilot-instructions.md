# Copilot Setup for Site Core Pilates

Follow this repository guidance in order:

1. .github/instructions/*.instructions.md
2. .github/agents/*.agent.md for specialized execution modes
3. .github/skills/*/SKILL.md for domain playbooks
4. .github/rules/* as supplemental operational frameworks

## Repository-Specific Directives

- Preserve Clean Architecture module boundaries in src/modules.
- Keep API behavior aligned with .github/instructions/api-design.instructions.md.
- Enforce OWASP-oriented practices from security-owasp.instructions.md.
- Add or update tests for backend/frontend changes and keep behavior verifiable.
- Prefer small, targeted edits over broad refactors.

## Mandatory Modular Workflow

- Before starting any product module work, always read these files in this order:
	1. docs/01-foundation/construction-method.md
	2. docs/01-foundation/module-delivery-checklist.md
	3. docs/01-foundation/module-handoff-template.md
	4. docs/modules/<current-module>/README.md
	5. docs/handoffs/<previous-module-handoff>.md, when it exists
- Before acting on any generic prompt such as `continue`, `continue module`, `avance`, or similar, the AI must recompute the next module from source files, not from chat memory or summaries.
- The next module must be determined by this checkpoint, in order:
	1. read `docs/01-foundation/construction-method.md`
	2. list files in `docs/handoffs/`
	3. compare the official module order against existing handoffs
	4. pick the first module in the official order that does not yet have a completed handoff
	5. only then open that module README and start work
- Never infer the next module only from the latest conversational summary, an open editor tab, or the last module mentioned in chat.
- If the official order and the existing handoffs diverge, the AI must stop following the accidental sequence and resume from the first missing module in the official order.
- Work one module at a time. Do not open or partially implement multiple modules in parallel.
- A module is not considered complete until documentation, API contract, data model, implementation, minimum automated tests, and handoff are all updated.
- If a module changes the database schema, the AI must create and apply the migration in the same advance before considering the module or step complete.
- Never implement endpoints, tables, or flows without first updating the module documentation.
- Never leave schema changes pending for a later step; every database change must ship with its matching migration and be recorded in the module README or handoff.
- When finishing a module, always produce a handoff package that states: what was delivered, which endpoints exist, which entities/tables were created, which business rules are now active, what remains pending, and what the next module may assume as ready.
- Before finishing a module, always run a completeness review covering UI web, API, database, app impact, shared components, error/loading/empty states, authorization, tests, documentation, and handoff.
- If a task touches an existing module, the AI must read that module's README and preserve alignment with its documented scope before editing code.

## Preferred Specialists

- Next.js routing, rendering, and performance: Next.js Senior Dev
- API and module boundary design: Backend Architect
- Prisma schema evolution and rollout safety: Database Migration Specialist
- Billing/webhook/idempotency hardening: Payment Security Specialist

## Skill Pack Scope

Use curated skills under .github/skills focused on backend, frontend, architecture, testing, security, payments, API design, git workflow, and observability logging.
