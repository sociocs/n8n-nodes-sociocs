# n8n-nodes-sociocs

This is an n8n community node for [Sociocs](https://sociocs.com), a customer engagement platform. It lets you send and manage messages across Twilio SMS, Twilio WhatsApp, and Gupshup WhatsApp channels directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Message

- **Send** — Send a message on a Twilio SMS, Twilio WhatsApp or Gupshup WhatsApp channel. Supports text, images, videos, files, WhatsApp templates, scheduled sending, and contact saving.
- **Get Many** — Get messages from the last 90 days (default).
- **Get Scheduled** — Get the list of scheduled messages (max 100 records).
- **Get Unreplied** — Get all unreplied messages from the last 90 days (default).
- **Delete Scheduled** — Delete a scheduled message that hasn't been sent yet.

### Bulk Message

- **Send** — Send messages in bulk to multiple recipients. Supports media, scheduling, and duplicate control.

### Webhook Subscription

- **Create** — Create or update a webhook subscription for a channel. Uses `subscriber_reference_id` to upsert.
- **Get Many** — Get the list of webhook subscriptions.
- **Delete** — Unsubscribe a webhook.

## Credentials

This node uses an API key for authentication.

1. Go to [app.sociocs.com](https://app.sociocs.com).
2. Navigate to **Profile & settings** → **API**.
3. Generate an API key.
4. Add the key as a credential in n8n.

Refer to the [Sociocs API authentication docs](https://docs.sociocs.com/api/auhentication/) for more information.

## Compatibility

Compatible with n8n@1.60.0 or later.

## Usage

Add the Sociocs node to your workflow and configure the resource, operation, and required fields. The node supports expressions for dynamic values.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Sociocs API documentation](https://docs.sociocs.com/api/)
