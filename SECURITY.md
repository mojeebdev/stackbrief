# Security and privacy

StackBrief’s CLI analysis is local by design. The scanner, knowledge model, intelligence engine, change briefs, and agent installer make no hosted AI or telemetry request.

`stackbrief scan` and `stackbrief brief` read the repository available on the local machine. They can generate `stackbrief.json`, which may contain file paths, dependency names, environment-variable names, and source evidence. Treat generated reports according to your repository’s security policy and do not publish them if that information is sensitive.

The independent website in `apps/web` is separate from the CLI package and does not receive repository analysis data.

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability. Email [hello@mojeeb.xyz](mailto:hello@mojeeb.xyz) with a concise reproduction and impact description. You will receive an acknowledgement and a coordinated disclosure response.
