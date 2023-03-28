import { Configuration, OpenAIApi,CreateChatCompletionRequest, ChatCompletionRequestMessage } from "openai";
import atob from 'atob'
import {Blob} from 'node:buffer';
import fetch from 'node-fetch'
import { cloneDeep } from "lodash";
const configuration = new Configuration({
    organization: "org-cshSfJEe6EJh3zEGowKNJKQn",
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let requestObject:CreateChatCompletionRequest ={
    model:'gpt-3.5-turbo',
    messages:[
        {"role": "system", "content": "You are a helpful assistant and don't beat around the bush. You get to the point."}
    ]
}

export const getAIRequest = async (request:string,previousContent?: ChatCompletionRequestMessage[])=>{
    let r = cloneDeep(requestObject)
    if(previousContent){
        r.messages.push(...previousContent)
    }
    let message = {"role": "user", "content": request}
    r.messages.push(message as any)

    let result = await openai.createChatCompletion(r)
    let res = result.data.choices[0]
    console.log(result)
    console.log(result.data.choices[0])
    if(res.finish_reason=='stop'){
        return result.data.choices[0].message?.content||''
    }else{
        let message =result.data.choices[0].message?.content as string
        let endsWithDot = message.endsWith('.') || message.endsWith('!') || message.endsWith('?')
        console.log(result.data.choices[0])
        if(res.finish_reason==null && !!message){
            return message
        }
        return ''
    }
}


export const getImage =  async(text:string,size:"256x256"| "512x512"|"1024x1024"="1024x1024",base64=false)=>{
    const response = await openai.createImage({
        prompt:text,
        n:1,
        size:size,
        ...(base64?{response_format:'b64_json'}:{})
    })
    return base64? response.data.data[0].b64_json||'':response.data.data[0].url
}

export const customCreateImage = async(text:string,size:"256x256"| "512x512"|"1024x1024"="1024x1024",base64=false)=>{
let p =  await fetch(`https://api.openai.com/v1/images/generations`,{
    method: 'POST',headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
    body:JSON.stringify({
        prompt:text,
            n:1,
            size:size,
            ...(base64?{response_format:'b64_json'}:{})
    })
})

let r = await p.json()

if(r.error){
    console.error(r.error)
    console.log('prompt: ',text)
    return ''
}
return base64? r.data[0].b64_json||'':r.data[0].url

}