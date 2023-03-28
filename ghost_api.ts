const GhostAdminAPI = require('@tryghost/admin-api')
import path from 'path'
import FormData from 'form-data'
import fs from 'fs'
import fetch from 'node-fetch'
import { Blob } from "buffer";
import { resolveAPIPrefix } from './util'
import jwt from 'jsonwebtoken'
// import { File } from 'buffer'
import { File } from 'node:buffer'
const { Readable } = require('stream');

const api = new GhostAdminAPI({
    url: process.env.API_URL||'',
    version:'v5.37',
    key: process.env.STAFF_KEY
});



// Utility function to find and upload any images in an HTML string
function processImagesInHTML(html:string) {
    // Find images that Ghost Upload supports
    let imageRegex = /="([^"]*?(?:\.jpg|\.jpeg|\.gif|\.png|\.svg|\.sgvz))"/gmi;
    let imagePromises = [];
    let result = null
    while((result = imageRegex.exec(html)) !== null) {
        let file = result[1];
            // Upload the image, using the original matched filename as a reference
            imagePromises.push(api.images.upload({
                ref: file,
                file: path.resolve(file)
            }));
    }

    return Promise
        .all(imagePromises)
        .then(images => {
            images.forEach(image => html = html.replace(image.ref, image.url));
            return html;
        });
}

export const uploadImageAndReturnRef = async (img:Blob,ref:string)=>{
    try{
       return await api.images.upload({
            file: img,
            ref
        }) as Promise<{images:{url:string,ref:string}}>
    }catch(e){
        console.error('uploading failed')
        console.error(e)
        return null
    }
}


// Your content
let html = '<p>My test post content.</p><figure><img src="/path/to/my/image.jpg" /><figcaption>My awesome photo</figcaption></figure>';
export const uploadNewPost = async (title:string,tag:string,excerpt:string,text:string,image?:string)=>{
    let image_url=''
    if(image){
        let imageRef =title.toLowerCase().replace(/[^a-zA-Z ]/g, "").replaceAll(" ","_").substring(0,50)
        let result = await customUpload(image,imageRef+'.png')
        console.log(result)
        if(result){
            image_url = (result).images[0].url
        }
    }

    api.posts
            .add(
                {title: title, 
                authors: ["arrowaimed@gmail.com"],
                "status": "published",
                tags:[tag],
                html:text,
                custom_excerpt:excerpt,
                ...(image_url?{feature_image:image_url}:{})
                },
                {source: 'html'} // Tell the API to use HTML as the content source, instead of mobiledoc
            )
            .then((res:any) => console.log('Success uploading '+title))
            .catch((err:any) => console.log(err));
}

export const getSite =async ()=>{
    console.log(await api.site.read())
}



export const customUpload = async (url:string,ref:string,purpose?:string)=>{
    let formData:FormData=new FormData()
    
    let resp = await fetch(url)
    let respimage = await resp.buffer()

    formData.append('file',Readable.from(respimage),{ filename :ref+'.png' });

    if (ref) {
        formData.append('ref', ref);
    }
    let siteInfo = await api.site.read()
    console.log('Uploading image')
    // Split the key into ID and SECRET
    const [id, secret] = (process.env.STAFF_KEY||'').split(':');

    // Create the token (including decoding secret)
    const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
        keyid: id,
        algorithm: 'HS256',
        expiresIn: '5m',
        audience: `/admin/`
    });


    let prefix = resolveAPIPrefix('v'+siteInfo.version)
    const apiUrl =`${process.env.API_URL}/ghost/api${prefix}images/upload/`

    let fetchR = await fetch(apiUrl,{
        method: 'POST',
        headers:{
        "Authorization": `Ghost ${token}`,
        ...formData.getHeaders()},
        body:formData
    }
        )
        return await fetchR.json()
}