## Summary
<!-- What changed and why -->

## Checklist

### Architecture
- [ ] Dependency direction holds (no backward imports)
- [ ] Business logic separated from handlers/routes/UI
- [ ] New files follow existing naming conventions

### Quality
- [ ] No suppressed warnings without explanation
- [ ] New inputs validated at the boundary
- [ ] Types/schemas derive from source of truth, not duplicated

### Testing
- [ ] No existing tests removed or weakened
- [ ] At least one test for the happy path
- [ ] Core changes have integration coverage

### Security
- [ ] Auth check on every new endpoint or entry point
- [ ] No secrets hardcoded
- [ ] No unsanitized user input in queries or output

### Agent Red Flags
- [ ] No hallucinated imports (dependencies not in manifest)
- [ ] No over-abstracted code for simple operations
- [ ] No TODO comments left behind
