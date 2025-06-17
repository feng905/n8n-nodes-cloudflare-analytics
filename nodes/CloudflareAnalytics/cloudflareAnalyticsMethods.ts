import type { ILoadOptionsFunctions, INodePropertyOptions,RequestHelperFunctions } from 'n8n-workflow';

type AccountInfo = {
    name: string;
    id: string;
};

export const cloudflareAnalyticsMethods = {
    loadOptions: {
        async getDynamicOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
            return [
                { name: '过去24小时', value: '0' },
                { name: '过去7天', value: '1' },
                { name: '过去30天', value: '2' },
                { name: '自定义范围', value: '3' },
            ];
        },

        async getAccountNames(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
            try {
                const options = [];
                options.push({ name: 'ALL', value: 'ALL' }); 
                const credentials = await this.getCredentials('cloudflareAnalyticsApi');

                const response = await this.helpers.request({ 
                    method: 'GET', 
                    url: 'https://api.cloudflare.com/client/v4/accounts', 
                    headers: { 
                        'X-Auth-Email': credentials.email, 
                        'X-Auth-Key': credentials.apiKey 
                    }, 
                    json: true, 
                }); 
                // console.log(response); 
                // console.log(response.result); 
                response.result.forEach((account: { id: string,name: string }) => { 
                    // options.push({ name: account.name, value: account.name +"_"+account.id });
                    options.push({ name: account.name, value: account.name });  
                }); 
                // console.log("options=", options); 
                return options; 
            } catch (error) { 
                console.error('获取账户名称失败:', error); 
                throw error; 
            } 
        }
    }
};

export const getCloudflareAccounts = async (helpers: RequestHelperFunctions, ak: string, sk: string): Promise<AccountInfo[]> => {
    let accountInfos: AccountInfo[] = [];

    try {

        const response = await helpers.request({ 
            method: 'GET', 
            url: 'https://api.cloudflare.com/client/v4/accounts', 
            headers: { 
                'X-Auth-Email': ak, 
                'X-Auth-Key': sk 
            }, 
            json: true, 
        }); 
        response.result.forEach((account: { id: string,name: string }) => { 
            accountInfos.push({ name: account.name, id: account.id }); 
        });
        
    }catch (error) {
        console.error('getCloudflareAccounts 获取账户名称失败:', error);
    }
    return accountInfos;
}

export const getSelectedDateRange = (timeSelect: string, dateStart: string, dateEnd: string): any => {
    const now = new Date().getTime();
    let end = now ;

    // 将end的秒置零
    end = end - (end % (1000 * 60));
    // 再减1秒
    end = end - 1000;

    // 默认输出过去7天的时间范围
    let start = end - 1000 * 60 * 60 * 24 * 7;

    // 辅助函数，用于移除毫秒部分
    const formatDateWithoutMilliseconds = (date: Date) => {
        const isoString = date.toISOString();
        return isoString.slice(0, isoString.indexOf('.') !== -1 ? isoString.indexOf('.') : isoString.length) + 'Z';
    };

    if (timeSelect === '3') {
        const d1 = new Date(dateStart);
        const d2 = new Date(dateEnd);
        return {
            dateStart: formatDateWithoutMilliseconds(d1),
            dateEnd : formatDateWithoutMilliseconds(d2)
        };
    }
    // 当timeSelect是0时输出过去24小时的时间范围
    else if (timeSelect === '0') {
        start = end - 1000 * 60 * 60 * 24;
    }
    // 当timeSelect是2时输出过去30天的时间范围
    else if (timeSelect === '2') {
        start = end - 1000 * 60 * 60 * 24 * 30;
    }
    // 当timeSelect是1时输出过去7天的时间范围 或 默认
    else {
        start = end - 1000 * 60 * 60 * 24 * 7;
    }
    return {
        dateStart: formatDateWithoutMilliseconds(new Date(start)),
        dateEnd: formatDateWithoutMilliseconds(new Date(end))
    }
}

export const getCloudflareHeadlineStats = async (helpers: RequestHelperFunctions, ak: string, sk: string, zoneId: string,dateStart: string,dateEnd: string): Promise<any> => {
    
    let jsonStr = `{
    "operationName": "GetHeadlineStats",
    "variables": {
        "accountTag": "{{ZONE_ID}}",
        "filter": {
            "datetime_geq": "{{DATE_START}}",
            "datetime_leq": "{{DATE_END}}"
        },
        "previousPeriodFilter": {
            "datetime_geq": "{{DATE_START}}",
            "datetime_leq": "{{DATE_END}}"
        },
        "encryptedFilter": {
            "clientSSLProtocol_neq": "none"
        },
        "fourxxFilter": {
            "edgeResponseStatus_geq": 400,
            "edgeResponseStatus_leq": 499
        },
        "fivexxFilter": {
            "edgeResponseStatus_geq": 500,
            "edgeResponseStatus_leq": 599
        }
},
  "query": "query GetHeadlineStats {\\n  viewer {\\n    accounts(filter: {accountTag: $accountTag}) {\\n      statsOverTime: httpRequestsOverviewAdaptiveGroups(filter: $filter, limit: 2000) {\\n        sum {\\n          requests\\n          bytes\\n          pageViews\\n          cachedRequests\\n          cachedBytes\\n          visits\\n          __typename\\n        }\\n        dimensions {\\n          timestamp: date\\n          __typename\\n        }\\n        __typename\\n      }\\n      encryptedRequestsOverTime: httpRequestsOverviewAdaptiveGroups(filter: {AND: [$encryptedFilter, $filter]}, limit: 2000) {\\n        sum {\\n          requests\\n          bytes\\n          __typename\\n        }\\n        dimensions {\\n          timestamp: date\\n          __typename\\n        }\\n        __typename\\n      }\\n      fourxxOverTime: httpRequestsOverviewAdaptiveGroups(filter: {AND: [$fourxxFilter, $filter]}, limit: 2000) {\\n        sum {\\n          requests\\n          __typename\\n        }\\n        dimensions {\\n          timestamp: date\\n          __typename\\n        }\\n        __typename\\n      }\\n      fivexxOverTime: httpRequestsOverviewAdaptiveGroups(filter: {AND: [$fivexxFilter, $filter]}, limit: 2000) {\\n        sum {\\n          requests\\n          __typename\\n        }\\n        dimensions {\\n          timestamp: date\\n          __typename\\n        }\\n        __typename\\n      }\\n      deltas: httpRequestsOverviewAdaptiveGroups(filter: $previousPeriodFilter, limit: 1) {\\n        sum {\\n          requests\\n          bytes\\n          cachedRequests\\n          cachedBytes\\n          pageViews\\n          visits\\n          __typename\\n        }\\n        __typename\\n      }\\n      encryptedDeltas: httpRequestsOverviewAdaptiveGroups(filter: {AND: [$encryptedFilter, $previousPeriodFilter]}, limit: 1) {\\n        sum {\\n          requests\\n          bytes\\n          __typename\\n        }\\n        __typename\\n      }\\n      fourxxDeltas: httpRequestsOverviewAdaptiveGroups(filter: {AND: [$fourxxFilter, $previousPeriodFilter]}, limit: 1) {\\n        sum {\\n          requests\\n          __typename\\n        }\\n        __typename\\n      }\\n      fivexxDeltas: httpRequestsOverviewAdaptiveGroups(filter: {AND: [$fivexxFilter, $previousPeriodFilter]}, limit: 1) {\\n        sum {\\n          requests\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n"
}`

    try {
        jsonStr = jsonStr.replace("{{ZONE_ID}}", zoneId);
        jsonStr = jsonStr.replace("{{DATE_START}}", dateStart);
        jsonStr = jsonStr.replace("{{DATE_END}}", dateEnd);
        jsonStr = jsonStr.replace("{{DATE_START}}", dateStart);
        jsonStr = jsonStr.replace("{{DATE_END}}", dateEnd);

        const response = await helpers.request({ 
            method: 'POST', 
            url: 'https://api.cloudflare.com/client/v4/graphql', 
            headers: { 
                'X-Auth-Email': ak, 
                'X-Auth-Key': sk ,
                'Content-Type': 'application/json',
            }, 
            body: jsonStr,
            json: true, 
        });
        
        console.log("response=",response);
        console.log("stringify=",JSON.stringify(response, null, 2)); 
        if(response.errors === undefined || response.errors === null){
            // return JSON.stringify(response, null, 2)
            return response
        }
        
    }catch (error) {
        console.error('getCloudflareHeadlineStats 失败:', error);
    }
    return null;
}

export const getCloudflareAnalytics = async (helpers: RequestHelperFunctions, ak: string, sk: string, zoneId: string,zoneName: string, dateStart: string,dateEnd: string): Promise<any> => {
    const headlineStats = await getCloudflareHeadlineStats(helpers, ak, sk, zoneId,dateStart,dateEnd);

    return {
        zoneName: zoneName,
        zoneId: zoneId,
        headlineStats: headlineStats,
    }
}