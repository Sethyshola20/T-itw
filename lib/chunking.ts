import { RecursiveCharacterTextSplitter} from "@langchain/textsplitters"

export const textsplitters = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 20,
    separators: [" "],
})

export async function chunkContent(content: string){
    return await textsplitters.splitText(content.trim())
}