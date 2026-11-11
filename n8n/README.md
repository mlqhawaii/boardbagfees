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

## BoardBagFees Rotating 20 evidence checks

Export the current Rotating 20 workflow from n8n. In a private local directory, run:

```sh
node n8n/patch-boardbagfees-qc.mjs < workflow-export.json > workflow-reviewed.json
```

Both exports may contain credentials. Keep them out of Git. Apply the generated
Gemini and Supabase node parameters to the existing workflow, along with the
Apify status node retry settings. Preserve the current workflow ID and publish
the edited version so the existing schedule uses it.

The extraction must cite text from the scraped airline page. The updater
preserves current values when evidence is absent or fails the field checks.
The existing Supabase QC endpoint still decides whether to apply or hold the
result. After a manual run, check the Supabase update node for applied and held
results before relying on the next scheduled run.
