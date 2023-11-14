import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { WatsonDiscoverySettingsModel, WatsonDiscoveryTool, desc } from './WatsonDiscoveryTool'

class WatsonDiscovery_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Watson Discovery'
        this.name = 'watsonDiscovery'
        this.version = 1.0
        this.type = 'WatsonDiscovery'
        this.icon = 'ibmlogo.png'
        this.category = 'Tools'
        this.description = 'Look up information in Watson Discovery'
        this.baseClasses = [this.type, ...getBaseClasses(WatsonDiscoveryTool)]
        this.inputs = [
            {
                label: 'Base URL',
                name: 'url',
                type: 'string',
                description:
                    'The URL to the Watson discovery instance: https://api.{region}.discovery.watson.cloud.ibm.com/instances/{instance_id}',
                additionalParams: false,
                optional: false
            },
            {
                label: 'Project ID',
                name: 'projectId',

                type: 'string',
                description: 'The ID of the Watson Discovery project',
                additionalParams: false,
                optional: false
            },
            {
                label: 'Collection IDs',
                name: 'collectionIds',
                list: false,
                type: 'string',
                description: 'The IDs of the collections to query against (comma separated)',
                optional: true,
                additionalParams: false,
                placeholder: 'collection1,collection2,...'
            },
            {
                name: 'resultCount',
                type: 'number',
                label: 'Result count',
                description: 'The number of documents to retrieve from Watson Discovery',
                default: 10,
                additionalParams: false,
                optional: false
            },
            {
                label: 'Description',
                name: 'description',
                type: 'string',
                rows: 4,
                default: desc,
                description: 'Acts like a prompt to tell agent when it should use this tool',
                additionalParams: false,
                optional: true
            },
            {
                label: 'API version',
                name: 'apiVersion',
                type: 'string',
                default: '2023-03-31',
                description: 'The version of the API to use (default: 2023-03-31)',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Passages count',
                name: 'passagesCount',
                type: 'number',
                description:
                    'The maximum number of passages to return (passages.count, max: 400). Has no effect if `Passages per document` is set',
                placeholder: '1 <= count <= 400',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Passages characters',
                name: 'passagesCharacters',
                type: 'number',
                description:
                    'The approximate number of characters that any one passage will have. (passages.characters, min: 50, max: 2000)',
                placeholder: '50 <= characters <= 2000',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Passages max per document',
                name: 'passagesMaxPerDocument',
                type: 'number',
                description: 'The maximum number of passages to return per document (passages.max_per_document)',
                placeholder: '',
                additionalParams: true,
                optional: true
            }
        ]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['ibmIamApiKey']
        }
    }

    async init(nodeData: INodeData, _input: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const iamApiKey = getCredentialParam('ibmIamApiKey', credentialData, nodeData)
        const fullSettings = {
            ...nodeData.inputs,
            apiKey: iamApiKey
        }

        const settings = WatsonDiscoverySettingsModel.safeParse(fullSettings)

        if (!settings.success) {
            throw new Error(`Failed to parse settings: ${settings.error.message}`)
        }

        return new WatsonDiscoveryTool(settings.data)
    }
}

module.exports = { nodeClass: WatsonDiscovery_Tools }
