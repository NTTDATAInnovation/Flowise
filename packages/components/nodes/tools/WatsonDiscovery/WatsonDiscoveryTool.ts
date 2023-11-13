import fetch from 'node-fetch'
import { Tool } from 'langchain/tools'
import { z } from 'zod'

export const desc = `This tool lets you look up information regarding rules and regulations from the danish Trafikstyrelsen. Formulate the query and response in danish and also try to rephrase the question so that it is in keyword form. The results will include the URLs for the sources which you should include in your response when applicable.`

export interface Headers {
    [key: string]: string
}

export const WatsonDiscoverySettings = z.object({
    url: z.string(),
    projectId: z.string(),
    resultCount: z.number(),
    apiKey: z.string()
})

export type WatsonDiscoverySettings = z.infer<typeof WatsonDiscoverySettings>

const WatsonDiscoveryPassageModel = z.object({
    passage_text: z.string()
})

const WatsonDiscoveryMetadataModel = z.object({
    source: z.object({
        url: z.string()
    })
})

const WatsonDiscoveryResultModel = z.object({
    result_metadata: z.object({ confidence: z.number() }),
    document_passages: z.array(WatsonDiscoveryPassageModel),
    metadata: WatsonDiscoveryMetadataModel
})

const WatsonDiscoveryResponseModel = z.object({
    results: z.array(WatsonDiscoveryResultModel)
})
type WatsonDiscoveryResponse = z.infer<typeof WatsonDiscoveryResponseModel>

export class WatsonDiscoveryTool extends Tool {
    name = 'watson_discovery'
    url = ''
    description = desc
    settings: WatsonDiscoverySettings

    constructor(args: WatsonDiscoverySettings) {
        super()
        this.settings = args
        this.description = args.description
    }

    _makeBaseUrl() {
        return `${this.settings.url}/v2/projects/${this.settings.projectId}/query?version=2021-08-30`
    }

    /** @ignore */
    async _call(input: string) {
        const uri = this._makeBaseUrl()
        const token = `Basic ${Buffer.from(`apikey:${this.settings.apiKey}`).toString('base64')}`

        const body = {
            count: this.settings.resultCount,
            natural_language_query: input
            // return: ['results.document_passsages.passage_text']
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token
            },
            body: JSON.stringify(body)
        }

        const now = Date.now()
        const response = await fetch(uri, options)

        const json = await response.json()
        if (response.status !== 200) {
            console.log(`Got error response: ${response.status}`)
            throw new Error(`The tool failed with the following exception: ${JSON.stringify(json, null, 2)}`)
        }
        console.log(`Took ${Date.now() - now}ms to get response`)
        const parsed = WatsonDiscoveryResponseModel.parse(json)
        const output = formatResponse(parsed)
        const fs = require('fs')
        await fs.promises.writeFile('output.json', JSON.stringify(json, null, 2))
        return output
    }
}

function formatResponse(parsed: WatsonDiscoveryResponse) {
    const formattedResponse = parsed.results
        .map((r, index) => {
            return `
Document ${index + 1} - score: ${r.result_metadata.confidence}:
Source URL: ${r.metadata.source.url}
${r.document_passages.map((p) => p.passage_text).join('\n')}
`
        })
        .join('\n')
    return formattedResponse
}
