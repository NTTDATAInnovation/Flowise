import { INodeParams, INodeCredential } from '../src/Interface'

class IBMIAM implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'IBM IAM API key'
        this.name = 'ibmIamApiKey'
        this.version = 1.0
        this.inputs = [
            {
                label: 'IBM IAM API key',
                name: 'ibmIamApiKey',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: IBMIAM }
