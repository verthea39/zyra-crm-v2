---
description: Auto-deploy rule
---
# Deployment Rule

Whenever you are asked to make an edit to the codebase (or if you proactively edit the codebase to fulfill a request), you MUST automatically run the `vercel --prod` command in the background after the edits are completed, verified, and functioning properly locally. Do not wait for the user to explicitly ask you to "deploy".

Always inform the user that their changes are being deployed in the background.
