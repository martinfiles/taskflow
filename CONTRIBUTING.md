# Contributing

## Branching strategy — GitHub Flow

- `main` está protegida: siempre desplegable, requiere PR + checks de CI en verde + 1 review.
- Ramas de trabajo con prefijo por tipo: `feature/*`, `fix/*`, `chore/*`, `refactor/*`.
- Merge por squash hacia `main`. No se usan ramas `develop` ni `release/*`.

## Commits — Conventional Commits

Formato: `<tipo>(<scope opcional>): <descripción>`

Tipos: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `perf`.

Ejemplos:

```
feat(tasks): add drag-and-drop reordering between columns
fix(auth): correct refresh token expiry check
chore(deps): bump prisma to 5.20
```

Los commits se validan automáticamente con Husky + commitlint (`.husky/commit-msg`).

## Pre-commit hooks

`.husky/pre-commit` ejecuta `lint-staged`, que corre ESLint y Prettier solo sobre los archivos modificados antes de cada commit.

## Pull Requests

1. Crea la rama desde `main`.
2. Abre el PR con una descripción clara del cambio y su motivación.
3. Espera a que el pipeline de CI (`lint`, `test`, `build`) pase en verde.
4. Solicita revisión y aplica el squash merge una vez aprobado.
