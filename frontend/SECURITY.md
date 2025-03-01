# Security Considerations

## Known Vulnerabilities

### Low Severity Issues (As of March 2024)

1. **Cookie Package Vulnerability**
   - **Package**: `cookie` (dependency of `expo-router`)
   - **Severity**: Low
   - **Description**: Cookie accepts cookie name, path, and domain with out of bounds characters
   - **CVE/Advisory**: [GHSA-pxg6-pf52-xh8x](https://github.com/advisories/GHSA-pxg6-pf52-xh8x)
   - **Affected Dependency Chain**:
     ```
     cookie < 0.7.0
     └─ @remix-run/server-runtime
        └─ @remix-run/node
           └─ @expo/server
              └─ expo-router
     ```
   - **Status**: Not fixed - Fixing would require breaking changes
   - **Risk Assessment**: Low risk as it affects internal routing mechanisms
   - **Mitigation**: Monitoring for non-breaking updates from expo-router team

## Recently Resolved Issues

The following high-severity vulnerabilities were resolved by updating to:
- expo@52.0.37
- expo-router@3.5.24
- react-native@0.73.11

## Security Best Practices

1. Regular dependency audits (`npm audit`)
2. Careful evaluation of breaking changes vs security risks
3. Keeping dependencies up to date when possible
4. Documentation of known issues and their risk assessment

## Reporting Security Issues

If you discover a security vulnerability, please report it by:
1. Opening a security advisory in the repository
2. Not disclosing the issue publicly until it has been addressed
3. Providing detailed information about the vulnerability and steps to reproduce

## Update History

- March 2024: Updated major dependencies to resolve high-severity vulnerabilities
- March 2024: Documented remaining low-severity issues in cookie dependency 