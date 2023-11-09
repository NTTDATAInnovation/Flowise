import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { WatsonDiscoverySettings, WatsonDiscoveryTool, desc } from './WatsonDiscoveryTool'

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
                    'The URL to the Watson discovery instance: https://api.{region}.discovery.watson.cloud.ibm.com/instances/{region}',
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

        const settings = WatsonDiscoverySettings.safeParse(fullSettings)

        if (!settings.success) {
            throw new Error(`Failed to parse settings: ${settings.error.message}`)
        }

        console.log(`Settings`, settings)

        return new WatsonDiscoveryTool(settings.data)
    }
}

module.exports = { nodeClass: WatsonDiscovery_Tools }
