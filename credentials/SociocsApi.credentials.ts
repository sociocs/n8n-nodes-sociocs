import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class SociocsApi implements ICredentialType {
	name = 'sociocsApi';
	displayName = 'Sociocs API';
	icon: Icon = { light: 'file:sociocs.svg', dark: 'file:sociocs.dark.svg' };
	documentationUrl = 'https://docs.sociocs.com/api/auhentication/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description:
				'Generate an API key on <a href="https://app.sociocs.com">app.sociocs.com</a> under Profile &amp; settings -&gt; API',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				apikey: '={{$credentials.apiKey}}',
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.sociocs.com',
			url: '/messages',
			method: 'GET',
		},
	};
}
