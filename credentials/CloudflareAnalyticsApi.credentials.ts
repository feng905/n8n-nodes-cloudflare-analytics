import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CloudflareAnalyticsApi implements ICredentialType {
	name = 'cloudflareAnalyticsApi';
	displayName = 'Cloudflare Analytics API';
	documentationUrl = 'https://developers.cloudflare.com/fundamentals/api/get-started/keys/';
	properties: INodeProperties[] = [
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			}
		},
	];

	// This allows the credential to be used by other parts of n8n
	// stating how this credential is injected as part of the request
	// An example is the Http Request node that can make generic calls
	// reusing this credential
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				// Authorization: '={{"Bearer " + $credentials.token}}',
				"X-Auth-Email": '={{$credentials.email}}',
				"X-Auth-Key": '={{$credentials.apiKey}}',
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.cloudflare.com',
			url: '/client/v4/accounts',
		},
	};
}
