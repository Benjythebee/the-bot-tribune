require('dotenv').config()
import { getSite, uploadNewPost } from "./ghost_api"
import { getHeadlinesForCategory, getRandomCategory, getRandomHeadline, headlines } from "./newsapi"
import { customCreateImage, getAIRequest, getImage } from "./openai"
import { replaceBreaksWithParagraphs } from "./util"
import cron from 'node-cron'
// var cron = require('node-cron');


const getHeadlineAndAskGPT = async (headlineCategory:headlines,headlineExample:string)=>{
    const category =headlineCategory //|| getRandomCategory()

    let newHeadline = await getAIRequest(`Come up with a headline similar to "${headlineExample}", without plagiarizing it. The headline should be at most 250 characters. Do not add any source such as "- [Source Name]".`)
    if(!newHeadline){
        return
    }
// remove quotes
    newHeadline =newHeadline?.replaceAll('"',"")

    const isBusiness = category=='business'

    await new Promise<any>((resolve)=>setTimeout(()=>{resolve(true)},1000))
    const request = `Come up with a story given the following headline: "${newHeadline}". The story should be at least ${isBusiness?'400':'350'} words long. ${isBusiness?'It should contain statistics.':''}`
    let story = await getAIRequest(request)
    console.log(newHeadline)
    // console.log(story)

    if(!story){
        return
    }
    await new Promise<any>((resolve)=>setTimeout(()=>{resolve(true)},1000))

    let excerpt = await getAIRequest(`Come up with a short click-bait excerpt for your story.`,[
        {role:'user',content:request},
        {role:'assistant',content:story}
    ])
    excerpt =excerpt?.replaceAll('"',"")
    let imageUrl:string =null!

    let DallePrompt =await getAIRequest(`Give me an valid prompt for a Dall-e AI that will generate an image fitting for the following article title: "${newHeadline}". Prompt should avoid words that could trigger a text moderation system. Prompt should be less than 900 characters. Ask for no text.`)
    if(DallePrompt){
        DallePrompt = DallePrompt.replace('Prompt:','')
        imageUrl = await customCreateImage(DallePrompt,"1024x1024",false) as string//getImage(DallePrompt,"512x512",false) as string
    }

    let tag = category.substring(0,1).toUpperCase() + category.substring(1,category.length)
    await uploadNewPost(newHeadline,tag,excerpt||'',replaceBreaksWithParagraphs(story),imageUrl)
    
}

const main = async ()=>{
    for(const headline of headlines){
        if(headline=='business'){
            continue
        }
        console.log('Handling category: '+headline)
        let headlineList = await getHeadlinesForCategory(headline)
        for(const article of (headlineList.articles).slice(0,5)){

            try{
                await getHeadlineAndAskGPT(headline,article.title)
            }catch(e){
                console.error(e)
            }
            //sleep
            await new Promise<any>((resolve)=>setTimeout(()=>{resolve(true)},1000))
        }
      
        console.log('Done with '+ headline)
    }

}

cron.schedule('0 8 * * *', () => {
    main()
  });

// getImage('robot garbage, simple colors',"256x256").then((t)=>console.log(t))