## Summary

- What changed:
- Why:

## Validation

- [ ] `npm ci` (if dependencies changed)
- [ ] `npx tsc --noEmit`
- [ ] `npm run test:ci`
- [ ] `npm run test:integration` (when API flows changed)

## API Route Coverage Checklist

- [ ] For every new or changed route, tests include success path
- [ ] For every new or changed route, tests include validation failures
- [ ] For every protected route, tests include unauthorized and forbidden behavior
- [ ] Response contract assertions match API helpers (`data`, `meta`, and error shape)

## Documentation Checklist

- [ ] README updated if scripts/setup/operations changed
- [ ] CHANGELOG updated for user-visible or workflow-relevant changes
- [ ] Swagger/OpenAPI updated when endpoint contract changes
