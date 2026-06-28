# nxtlvl-labs Plugin — Open Gaps

> What is still undefined or exploratory in the labs plugin architecture.

## 1. Plugin identity and packaging

- What is the exact plugin name and namespace? (`nxtlvl-labs:` seems likely, but not confirmed.)
- Where does the labs plugin repo live? (Separate repo, same plugin marketplace.)
- What does the plugin manifest look like?
- How is it installed alongside the core plugin without conflicts?

## 2. Promotion mechanism

- How does a lab artifact graduate to the core plugin?
- Is it a file move, a package publish, a spec-driven reimplementation, or a combination?
- Who approves the promotion?
- What gates must the artifact pass?
- Does the core plugin's audit run on the lab artifact before promotion?

## 3. Standalone vs. integrated mode

- What does the labs plugin need to duplicate from the core plugin to function standalone?
- How does it detect whether the core plugin is present?
- What is the plugin API surface between core and labs?
- How is version incompatibility handled?

## 4. Source-driven development workflow

- What is the exact workflow: research → compare → test → eval → decide?
- What artifacts does each step produce?
- How are experiments recorded and recalled?
- How does the workflow decide between copying a reference and creating from scratch?

## 5. Meta-builder teams

- What are the specific meta-builder domain teams in the labs plugin?
- How do they coordinate?
- What is the first meta-builder team to build?

## 6. Experimentation infrastructure

- What is the eval runner interface?
- What is the A/B runner interface?
- How are strategies compared and scored?
- How do experiments feed the decision log?

## 7. Labs memory model

- How are lab experiments and decisions persisted?
- How do they differ from core memory?
- Is there a separate memory store for labs, or does it use the same native memory?

## 8. Conditional core dependency

- How does the labs plugin conditionally use core utilities?
- Is there a shared library package both plugins depend on?
- Or does the labs plugin reimplement core utilities locally?
