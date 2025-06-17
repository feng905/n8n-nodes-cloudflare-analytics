import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

import cloudflareAnalyticsProperties from './cloudflareAnalyticsProperties';
import {cloudflareAnalyticsMethods,getCloudflareAccounts,getSelectedDateRange,getCloudflareAnalytics} from './cloudflareAnalyticsMethods';

export class CloudflareAnalytics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cloudflare Analytics',
		name: 'cloudflareAnalytics',
		group: ['transform'],
		version: 1,
		description: 'Cloudflare Analytics graphql',
		icon: { light: 'file:cloudflare-dashboard.svg', dark: 'file:cloudflare-dashboard.svg' },
		defaults: {
			name: 'Cloudflare Analytics',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'cloudflareAnalyticsApi',
				required: false,
			},
		],
		properties: cloudflareAnalyticsProperties,
	};

	methods = cloudflareAnalyticsMethods;

	
	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute1(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		
		const items = this.getInputData();

		let item: INodeExecutionData;
		let myString: string;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				myString = this.getNodeParameter('accountNames', itemIndex, '') as string;
				item = items[itemIndex];

				item.json.myString = myString;
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const credentials = await this.getCredentials('cloudflareAnalyticsApi');
		const outputItems: INodeExecutionData[] = [];
		console.log('credentials:', credentials);
		console.log('items:', items);
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {

				const accountInfos = await getCloudflareAccounts(this.helpers,String(credentials.email),String(credentials.apiKey))
				console.log('accountInfos:', accountInfos);

				// 读取 accountNames 和 timeSelect 的值
				const accountNames = this.getNodeParameter('accountNames', itemIndex, []) as string[];
				const timeSelect = this.getNodeParameter('timeSelect', itemIndex, '') as string;
				const dateStart = this.getNodeParameter('dateStart', itemIndex, '') as string;
				const dateEnd = this.getNodeParameter('dateEnd', itemIndex, '') as string;

				console.log('accountNames:', accountNames);
				console.log('timeSelect:', timeSelect);
				
				const dateRange = getSelectedDateRange(timeSelect,dateStart,dateEnd)
				console.log('dateRange:', dateRange);
				const allGraphqlResponses: any[] = [];
				let hasAllAccount = false;
				if(accountNames.includes('ALL')){
					hasAllAccount = true;
				}

				for (const accountInfo of accountInfos) {
					// 检查 accountNames 是否包含当前 accountInfo 的 name
					if (hasAllAccount || accountNames.includes(accountInfo.name)) {
						// 输出 accountInfo 的 name 和 id
						console.log(`Account Name: ${accountInfo.name}, Account ID: ${accountInfo.id}`);
						// 在这里可以执行其他操作，例如调用其他函数或发送请求
						const graphqlResponse = await getCloudflareAnalytics(this.helpers,String(credentials.email),String(credentials.apiKey),accountInfo.id,accountInfo.name,dateRange.dateStart,dateRange.dateEnd)
						console.log('graphqlResponse:', graphqlResponse);
						allGraphqlResponses.push(graphqlResponse);

						const newItem: INodeExecutionData = {
							json: {
								accouts:graphqlResponse
							}
						};
						outputItems.push(newItem);
					}
				}
				items[itemIndex].json.user = { email:String(credentials.email)};
				items[itemIndex].json.dateRange = dateRange;
				items[itemIndex].json.accounts = allGraphqlResponses;
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}
		return [items];
		// return [outputItems];
	}


}



