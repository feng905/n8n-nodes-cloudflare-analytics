import type { INodeProperties } from 'n8n-workflow';

const cloudflareAnalyticsProperties: INodeProperties[] = [
    {
        displayName: '账户选择 Names or IDs',
        name: 'accountNames',
        type: 'multiOptions',
        typeOptions: {
            loadOptionsMethod: 'getAccountNames'
        },
        default: ['ALL'],
        description: '选择一个或多个账户. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        required: true
    },
    {
        displayName: '时间选择 Name or ID',
        name: 'timeSelect',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getDynamicOptions'
        },
        default: '',
        description: '选择时间. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        required: true
    },
    {
        displayName: '选择开始日期',
        name: 'dateStart',
        type: 'dateTime',
        default: {
            startDate: '',
            endDate: ''
        },
        description: '选择自定义日期范围',
        displayOptions: {
            show: {
                timeSelect: ['3']
            }
        },
        typeOptions: {
            dateOnly: true,
        }
    },
    {
        displayName: '选择结束日期',
        name: 'dateEnd',
        type: 'dateTime',
        default: {
            startDate: '',
            endDate: ''
        },
        description: '选择自定义日期范围',
        displayOptions: {
            show: {
                timeSelect: ['3']
            }
        },
        typeOptions: {
            dateOnly: true,
        }
    }
];

export default cloudflareAnalyticsProperties;