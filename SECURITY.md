# Security Policy

The Synapse maintainers take security seriously. We appreciate your efforts to responsibly disclose vulnerabilities and will work to acknowledge and address issues promptly.

---

## Supported Versions

Only the following versions receive security fixes. If you are using an unsupported version, please upgrade before reporting an issue.

| Version | Supported | End of Life |
|---------|-----------|-------------|
| 1.x.x | Yes (current) | — |
| 0.x.x | Yes (LTS until 2025-12-31) | 2025-12-31 |
| < 0.5.0 | No | Reached EOL |

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues, Discussions, or Pull Requests.** Doing so exposes the vulnerability to all users before a fix is available.

### How to Report

Send an email to **security@synapse-project.dev** with:

1. **Subject line**: `[SECURITY] Brief description of the vulnerability`
2. **Vulnerability description**: A clear explanation of the issue, including which component is affected
3. **Steps to reproduce**: Detailed, reproducible steps (the simpler the better)
4. **Proof of concept**: Code, screenshots, or a demo if available
5. **Impact assessment**: What an attacker could accomplish by exploiting this vulnerability
6. **Suggested fix** (optional): If you have ideas on how to fix it, we welcome them
7. **Your contact info**: So we can follow up with questions

### Encrypted Reports

If your report is particularly sensitive, you can encrypt it using our PGP key:

```
Key ID: 0xABCD1234EF567890
Fingerprint: ABCD 1234 EF56 7890 FEDC BA98 7654 3210 ABCD 1234
```

You can find our full public key at [keys.openpgp.org](https://keys.openpgp.org) by searching for `security@synapse-project.dev`.

---

## Response Timeline

We are committed to the following response SLA:

| Milestone | Target |
|-----------|--------|
| Initial acknowledgment | Within 48 hours of receipt |
| Severity assessment | Within 5 business days |
| Fix in progress confirmation | Within 10 business days |
| Patch release (Critical/High) | Within 30 days |
| Patch release (Medium) | Within 60 days |
| Patch release (Low) | Next minor release |

If we need more time due to complexity, we will communicate this proactively and keep you updated throughout the process.

---

## Severity Classification

We use the **CVSS v3.1** scoring system to classify severity:

| Severity | CVSS Score | Response |
|----------|-----------|---------|
| Critical | 9.0 – 10.0 | Emergency patch + immediate advisory |
| High | 7.0 – 8.9 | Expedited patch within 30 days |
| Medium | 4.0 – 6.9 | Patch in next minor release |
| Low | 0.1 – 3.9 | Patch in next minor or major release |

---

## Disclosure Policy

We follow a **responsible disclosure** model:

1. **Private report received** — Reporter sends details to our security email.
2. **Acknowledgment** — We acknowledge receipt and begin investigation within 48 hours.
3. **Assessment** — We assess the severity and impact, engaging the reporter with questions as needed.
4. **Patch development** — We develop and test a fix, coordinating with the reporter if they have provided a suggested fix.
5. **CVE assignment** — For qualifying issues, we request a CVE from MITRE or the GitHub Advisory Database.
6. **Coordinated release** — We agree on a disclosure date with the reporter (typically 90 days after report, sooner if the fix is ready).
7. **Public disclosure** — We publish a GitHub Security Advisory and release the patched version simultaneously.
8. **Credit** — We publicly credit the reporter in the advisory (unless they prefer to remain anonymous).

### Safe Harbor

We consider security research conducted in accordance with this policy to be:

- Authorized with respect to any applicable computer misuse laws
- Exempt from DMCA restrictions for the purpose of security research
- Lawful, helpful, and appreciated

We will not take legal action against researchers who comply with this policy. We ask that you:

- Give us reasonable time to respond before public disclosure
- Avoid accessing, modifying, or deleting user data
- Do not perform denial-of-service attacks
- Do not exploit vulnerabilities beyond what is needed to demonstrate impact

---

## Security Best Practices in Synapse

We build Synapse with security in mind at every layer:

### Dependency Management
- All dependencies are reviewed before addition using `npm audit` and `socket.dev`
- Automated dependency updates via Dependabot with security grouping
- Lock files (`pnpm-lock.yaml`) are committed to ensure reproducible builds
- Unused dependencies are removed during regular audits

### Input Sanitization
- All user-generated content is sanitized before rendering using DOMPurify
- Graph node content supports Markdown but not arbitrary HTML
- URL schemes are whitelisted (only `http`, `https`, and `mailto` allowed in node URLs)

### Authentication & Authorization
- Authentication uses industry-standard JWT with short expiry and refresh token rotation
- All API endpoints require authentication by default; public endpoints are explicitly annotated
- Graph permissions are enforced server-side; the client never receives data it is not authorized to see

### WebSocket Security
- All WebSocket connections are authenticated via token validation on connection
- Message size limits prevent denial-of-service via oversized payloads
- Rate limiting is applied to WebSocket message processing per connection

### Content Security Policy
- A strict CSP header is set in production: `default-src 'self'`
- No `eval()` or `Function()` constructor usage in production code
- All third-party scripts are subresource-integrity (SRI) protected

### Data Storage
- No sensitive data (tokens, credentials) is ever stored in `localStorage`; session-scoped storage with encryption is used
- Graph content is encrypted at rest using AES-256
- Personal data handling complies with GDPR data minimization principles

### Secure Defaults
- HTTPS is required in production; HTTP redirects to HTTPS
- HSTS headers are set with a one-year max-age
- All forms have CSRF protection

---

## Known Security Limitations

The following are known limitations of the current implementation that we are working to address:

- **Self-hosted instances**: When you self-host Synapse, the security of the deployment is your responsibility. We provide a hardened Docker image and security configuration guide, but we cannot audit custom deployments.
- **Plugin security**: Third-party plugins run in the same JavaScript context as the main application. We are developing a sandboxed plugin runtime (tracked in [#issue-number]). Until then, only install plugins from trusted sources.

---

## Security Hall of Fame

We thank the following researchers for responsibly disclosing vulnerabilities:

*Be the first! Report a vulnerability and get recognized here.*

---

## Contact

- **Security issues**: security@synapse-project.dev
- **General inquiries**: hello@synapse-project.dev
- **PGP key**: Available at [keys.openpgp.org](https://keys.openpgp.org)

Thank you for helping keep Synapse and its users safe.
