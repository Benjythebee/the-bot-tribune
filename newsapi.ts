const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API);

export const headlines =['business','entertainment','general','health','science','sports','technology'] as const
export type headlines = typeof headlines[number]

export type Headline ={
        source: {
        "id": string|null,
        "name": string
        };
        "author": string,
        "title": string,
        "description":string,
}

type result = {
    "status": "ok"|"notOk",
    "totalResults": number,
    "articles": Headline[]
}

export const getHeadlinesForCategory = async (category:headlines)=>{
   let result:Promise<result> = await newsapi.v2.topHeadlines({
        category: category,
        language: 'en'
      })
      return result
}

export const getRandomCategory = ()=>{
    let randomheadline = headlines[Math.floor(Math.random()*headlines.length)] || 'general'
    return randomheadline
}
export const getRandomHeadline = async (category:headlines)=>{
    let headline =await getHeadlinesForCategory(category)
    return headline.articles.map((t)=>t.title).slice(0,5)
}
