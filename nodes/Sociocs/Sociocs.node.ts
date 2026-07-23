import { NodeConnectionTypes } from 'n8n-workflow';
import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

const providerProperty: INodeProperties = {
	displayName: 'Provider',
	name: 'provider',
	type: 'options',
	required: true,
	options: [
		{
			name: 'Twilio SMS',
			value: 'twlo',
		},
		{
			name: 'Twilio WhatsApp',
			value: 'twlowa',
		},
		{
			name: 'Gupshup WhatsApp',
			value: 'gswa',
		},
	],
	default: 'twlo',
	routing: {
		send: {
			type: 'body',
			property: 'provider',
		},
	},
};

const channelKeyProperty: INodeProperties = {
	displayName: 'Channel Key',
	name: 'channelKey',
	type: 'options',
	required: true,
	default: '',
	description:
		'Channel to send the message from. The list is fetched for the selected provider. Choose from the list, or switch to expression mode to enter a channel key manually.',
	typeOptions: {
		loadOptionsDependsOn: ['provider'],
		loadOptions: {
			routing: {
				request: {
					method: 'GET',
					url: '/channels',
					qs: {
						provider: '={{$parameter.provider}}',
					},
				},
				output: {
					postReceive: [
						async function (
							this: IExecuteSingleFunctions,
							items: INodeExecutionData[],
							response: IN8nHttpFullResponse,
						): Promise<INodeExecutionData[]> {
							const channels = Array.isArray(response.body)
								? (response.body as Array<{ channel_key: string; name: string }>)
								: [];
							return channels.map((channel) => ({
								json: {
									name: `${channel.name} (${channel.channel_key})`,
									value: channel.channel_key,
								},
							}));
						},
					],
				},
			},
		},
	},
	routing: {
		send: {
			type: 'body',
			property: 'channel_key',
		},
	},
};

const mediaFields: INodeProperties[] = [
	{
		displayName: 'Image URL',
		name: 'image_url',
		type: 'string',
		default: '',
		description:
			'Publicly accessible image URL. Supported only when provider is Twilio SMS (twlo).',
		routing: {
			send: {
				type: 'body',
				property: 'image_url',
			},
		},
	},
	{
		displayName: 'Video URL',
		name: 'video_url',
		type: 'string',
		default: '',
		description:
			'Publicly accessible video URL. Supported only when provider is Twilio SMS (twlo).',
		routing: {
			send: {
				type: 'body',
				property: 'video_url',
			},
		},
	},
	{
		displayName: 'File URL',
		name: 'file_url',
		type: 'string',
		default: '',
		description: 'Publicly accessible file URL. Supported only when provider is Twilio SMS (twlo).',
		routing: {
			send: {
				type: 'body',
				property: 'file_url',
			},
		},
	},
];

const scheduleField: INodeProperties = {
	displayName: 'Schedule',
	name: 'schedule',
	type: 'dateTime',
	default: '',
	description:
		'Date & time to send the message at (ISO 8601). Creates a scheduled message when set to a future date.',
	routing: {
		send: {
			type: 'body',
			property: 'schedule',
		},
	},
};

const userIdField: INodeProperties = {
	displayName: 'User ID',
	name: 'user_id',
	type: 'string',
	default: '',
	description:
		'Sociocs user ID to show that user as sender of the message. When not provided, the message shows as sent by "Sociocs API".',
	routing: {
		send: {
			type: 'body',
			property: 'user_id',
		},
	},
};

const dateFiltersProperty: INodeProperties = {
	displayName: 'Filters',
	name: 'filters',
	type: 'collection',
	placeholder: 'Add Filter',
	default: {},
	displayOptions: {
		show: {
			resource: ['message'],
			operation: ['getAll', 'getUnreplied'],
		},
	},
	options: [
		{
			displayName: 'Start Date',
			name: 'start_date',
			type: 'dateTime',
			default: '',
			description: 'Results include the given date. Defaults to 90 days before today.',
			routing: {
				send: {
					type: 'query',
					property: 'start_date',
					value: "={{ $value ? $value.split('T')[0] : undefined }}",
				},
			},
		},
		{
			displayName: 'End Date',
			name: 'end_date',
			type: 'dateTime',
			default: '',
			description: 'Results include the given date. Defaults to today.',
			routing: {
				send: {
					type: 'query',
					property: 'end_date',
					value: "={{ $value ? $value.split('T')[0] : undefined }}",
				},
			},
		},
	],
};

export class Sociocs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Sociocs',
		name: 'sociocs',
		icon: { light: 'file:sociocs.dark.svg', dark: 'file:sociocs.light.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send and manage messages with the Sociocs API',
		defaults: {
			name: 'Sociocs',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'sociocsApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.sociocs.com',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Bulk Message',
						value: 'bulkMessage',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Webhook Subscription',
						value: 'webhookSubscription',
					},
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Delete Scheduled',
						value: 'deleteScheduled',
						action: 'Delete a scheduled message',
						description: 'Delete a scheduled message which is not being sent yet',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/messages/scheduled/{{$parameter["messageId"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many messages',
						description: 'Get many messages, from the last 90 days by default',
						routing: {
							request: {
								method: 'GET',
								url: '/messages',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Get Scheduled',
						value: 'getScheduled',
						action: 'Get scheduled messages',
						description: 'Get the list of scheduled messages (max 100 records)',
						routing: {
							request: {
								method: 'GET',
								url: '/messages/scheduled',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Get Unreplied',
						value: 'getUnreplied',
						action: 'Get unreplied messages',
						description: 'Get all the unreplied messages from the last 90 days by default',
						routing: {
							request: {
								method: 'GET',
								url: '/messages/unreplied',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Send',
						value: 'send',
						action: 'Send a message',
						description: 'Send a message on a Twilio SMS, Twilio WhatsApp or Gupshup WhatsApp channel',
						routing: {
							request: {
								method: 'POST',
								url: '/message',
							},
						},
					},
				],
				default: 'send',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['bulkMessage'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						action: 'Send bulk messages',
						description:
							'Send messages in bulk on a Twilio SMS, Twilio WhatsApp or Gupshup WhatsApp channel',
						routing: {
							request: {
								method: 'POST',
								url: '/messages/bulk',
							},
						},
					},
				],
				default: 'send',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a webhook subscription',
						description:
							'Create or update a webhook subscription for a channel. Uses subscriber_reference_id to upsert.',
						routing: {
							request: {
								method: 'POST',
								url: '/webhook-subscriptions',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many webhook subscriptions',
						description: 'Get the list of webhook subscriptions',
						routing: {
							request: {
								method: 'GET',
								url: '/webhook-subscriptions',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a webhook subscription',
						description: 'Unsubscribe a webhook to stop receiving messages',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/webhook-subscriptions/{{$parameter["subscriptionId"]}}',
							},
						},
					},
				],
				default: 'create',
			},
			{
				...providerProperty,
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
			},
			{
				...channelKeyProperty,
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
			},
			{
				...providerProperty,
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
						operation: ['create'],
					},
				},
			},
			{
				...channelKeyProperty,
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'e.g. salesforce',
				description: 'A value that identifies the platform hosting the endpoint',
				routing: {
					send: {
						type: 'body',
						property: 'platform',
					},
				},
			},
			{
				displayName: 'Subscriber Reference ID',
				name: 'subscriberReferenceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
						operation: ['create'],
					},
				},
				default: '',
				description:
					'Unique identifier for the subscription. Calling the API again with the same value updates the existing subscription.',
				routing: {
					send: {
						type: 'body',
						property: 'subscriber_reference_id',
					},
				},
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'https://example.com/incoming',
				description: 'Webhook endpoint URL',
				routing: {
					send: {
						type: 'body',
						property: 'webhook_url',
					},
				},
			},
			{
				displayName: 'Subscription ID',
				name: 'subscriptionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
						operation: ['delete'],
					},
				},
				default: '',
				description: 'ID of the webhook subscription to delete',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['webhookSubscription'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Events',
						name: 'events',
						type: 'multiOptions',
						default: [],
						description:
							'Events to subscribe to. Defaults to messages if not provided.',
						options: [
							{
								name: 'Messages',
								value: 'messages',
								description: 'Receive incoming messages',
							},
							{
								name: 'Status Updates',
								value: 'status_updates',
								description: 'Receive status updates for outgoing messages',
							},
						],
						routing: {
							send: {
								type: 'body',
								property: 'events',
							},
						},
					},
					{
						displayName: 'Secret',
						name: 'secret',
						type: 'string',
						typeOptions: { password: true },
						default: '',
						description:
							'Webhook secret used to sign payloads. Allows you to verify requests are genuinely from Sociocs.',
						routing: {
							send: {
								type: 'body',
								property: 'secret',
							},
						},
					},
				],
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
				placeholder: '+16175551212',
				description:
					'Recipient phone number starting with the country code, with or without leading plus',
				routing: {
					send: {
						type: 'body',
						property: 'to',
					},
				},
			},
			{
				displayName: 'Recipients',
				name: 'recipients',
				type: 'json',
				required: true,
				validateType: 'array',
				displayOptions: {
					show: {
						resource: ['bulkMessage'],
						operation: ['send'],
					},
				},
				default: '[\n\t{\n\t\t"to": "+16175551212",\n\t\t"name": "John Doe"\n\t}\n]',
				description: 'Array of recipient objects with "to" (phone number) and "name" properties',
				routing: {
					send: {
						type: 'body',
						property: 'recipients',
					},
				},
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				default: '',
				description:
					'Message text. Required unless an image, video, file or template is provided. Supports dynamic parameters like {{name}} for bulk messages.',
				routing: {
					send: {
						type: 'body',
						property: 'text',
					},
				},
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['deleteScheduled'],
					},
				},
				default: '',
				description: 'ID of the scheduled message to delete',
			},
			dateFiltersProperty,
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				options: [
					{
						displayName: 'Recipient Name',
						name: 'name',
						type: 'string',
						default: '',
						routing: {
							send: {
								type: 'body',
								property: 'name',
							},
						},
					},
					...mediaFields,
					{
						displayName: 'Template',
						name: 'template',
						type: 'json',
						validateType: 'object',
						default: '{\n\t"id": "",\n\t"variables": {}\n}',
						description:
							'WhatsApp template object with template ID and variables. Used only when provider is twlowa or gswa. See the Sociocs docs for the variables format per provider.',
						routing: {
							send: {
								type: 'body',
								property: 'template',
							},
						},
					},
					{
						displayName: 'Contact Saving',
						name: 'contact_saving',
						type: 'json',
						validateType: 'object',
						default: '{\n\t"save": true,\n\t"list_id": 0\n}',
						description:
							'Instruction to save the recipient as a contact after sending. Use "save", "list_id" (0 for All Contacts) and optional "extra_fields".',
						routing: {
							send: {
								type: 'body',
								property: 'contact_saving',
							},
						},
					},
					scheduleField,
					userIdField,
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['bulkMessage'],
						operation: ['send'],
					},
				},
				options: [
					...mediaFields,
					{
						displayName: 'Duplicates Allowed',
						name: 'duplicates_allowed',
						type: 'boolean',
						default: false,
						description:
							'Whether to send the message to duplicate phone numbers (if there are any) instead of only once per phone number',
						routing: {
							send: {
								type: 'body',
								property: 'duplicates_allowed',
							},
						},
					},
					scheduleField,
					userIdField,
				],
			},
		],
	};
}
