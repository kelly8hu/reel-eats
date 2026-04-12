# justfile — project commands
# Run with: just <command>

# ── Quality (managed by nexus) ───────────────────────────
doctor:
    nexus doctor

doctor-fix:
    nexus doctor --fix
