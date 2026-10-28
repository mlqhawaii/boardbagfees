# n8n workflow versioning (setup in progress)

This folder will hold reviewed, credential-free n8n JSON exports and tests.

**Do not upload raw workflow exports.** Historical exports contained embedded API credentials; rotate affected Supabase, Apify, Google Places, and Gemini keys before deployment, and store new secrets in n8n credentials or protected environment variables.

Next steps:
1. Identify the actual active workflows in the local n8n instance.
2. Audit and redact all exports (including nested code and URL parameters).
3. Promote one tested workflow per purpose; retain prior versions as archives only.
4. Add schema, location and duplicate validation before publishing.
5. Establish reviewed deployment to local n8n, with backup and rollback.

Changes to live n8n workflows are not authorized or performed by this README.
