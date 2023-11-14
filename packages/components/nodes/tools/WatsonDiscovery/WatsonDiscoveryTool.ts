import fetch from 'node-fetch'
import { Tool } from 'langchain/tools'
import { z } from 'zod'

export const desc = `This tool lets you look up information regarding rules and regulations from the danish Trafikstyrelsen. Formulate the query and response in danish and also try to rephrase the question so that it is in keyword form. The results will include the URLs for the sources which you should include in your response when applicable.`

export interface Headers {
    [key: string]: string
}

const StringNumber = (fn: (val: z.ZodNumber) => z.ZodNumber = (n) => n) => z.union([fn(z.number()), z.string().pipe(z.coerce.number())])

const WatsonDiscoveryPassagesModel = z.object({
    passagesCharacters: StringNumber((n) => n.min(50).max(2000)).optional(),
    passagesMaxPerDocument: StringNumber().optional()
})

export const WatsonDiscoverySettingsModel = z
    .object({
        url: z.string(),
        projectId: z.string(),
        resultCount: StringNumber(),
        apiKey: z.string(),
        collectionIds: z
            .string()
            .transform((s) =>
                s
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
            )
            .optional()
            .default(''),
        apiVersion: z.string(),
        description: z.string()
    })
    .merge(WatsonDiscoveryPassagesModel)

export type WatsonDiscoverySettings = z.infer<typeof WatsonDiscoverySettingsModel>

const WatsonDiscoveryDocumentPassagesModel = z.object({
    passage_text: z.string()
})

const WatsonDiscoveryMetadataModel = z.object({
    source: z.object({
        url: z.string()
    })
})

const WatsonDiscoveryResultModel = z.object({
    result_metadata: z.object({ confidence: z.number() }),
    document_passages: z.array(WatsonDiscoveryDocumentPassagesModel),
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
        const { url, projectId, apiVersion } = this.settings
        return `${url}/v2/projects/${projectId}/query?version=${apiVersion}`
    }

    _buildBody(searchQuery: string) {
        const { passagesCharacters, passagesMaxPerDocument } = this.settings
        const passages: Record<string, any> = {}
        if (passagesCharacters || passagesMaxPerDocument) {
            passages.enabled = true
            passages.characters = passagesCharacters || undefined
            passages.per_document = Boolean(passagesMaxPerDocument)
            passages.max_per_document = passagesMaxPerDocument || undefined
        }

        for (const key in passages) {
            if (passages[key] === undefined || passages[key] === false) {
                delete passages[key]
            }
        }

        const body = {
            count: this.settings.resultCount,
            natural_language_query: searchQuery,
            collection_ids: this.settings.collectionIds,
            // return: ['results.document_passsages.passage_text']
            passages: passages
        }
        return body
    }

    /** @ignore */
    async _call(input: string) {
        const uri = this._makeBaseUrl()
        const token = `Basic ${Buffer.from(`apikey:${this.settings.apiKey}`).toString('base64')}`

        const body = this._buildBody(input)

        console.log(body)

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
        // console.log(json)
        if (response.status !== 200) {
            console.log(`Got error response: ${response.status}`)
            console.log(json)
            throw new Error(`The tool failed with the following exception: ${JSON.stringify(json, null, 2)}`)
        }
        console.log(`Took ${Date.now() - now}ms to get response`)
        const parsed = WatsonDiscoveryResponseModel.safeParse(json)
        if (!parsed.success) {
            console.log(JSON.stringify(parsed.error.format().results, null, 2))
            throw new Error(`Failed to parse response from Watson Discovery. See logs for more info.`)
        }
        console.log(`Result count: `, parsed.data.results.length)
        console.log(
            `Passages & lengths`,
            parsed.data.results.map((r) => r.document_passages.map((p) => p.passage_text.length))
        )
        const output = formatResponse(parsed.data)
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
