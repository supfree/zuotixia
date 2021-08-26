'use strict';
const Hashids = require('hashids/cjs');
const hashids = new Hashids('supersmart');

import Base from './base.js';

export default class extends Base {

    //请求预处理
    async __before(){
        this.setCorsHeader();
        let sub=this.http.req.headers.host.replace('.zuotixia.com','');
        this.get('sub',sub);
    }
    
    //题目
    async itemAction(){
      	let page=this.get('page');
      	let urls=[];
      	let item=await this.model('item').where({oindex:page}).find();
      	let list=await this.model('item').limit(10000).field('id').where({id:['>=',item.id]}).order('id asc').select();
      	for(let i=0;i<list.length;i++){
      		urls.push('https://'+this.get('sub')+'.zuotixia.com/item/'+hashids.encode(list[i].id)+'.html');
      	}
    	let html=this.sitemap(urls);
    	this.type('text/xml');
    	this.end(html);
    }
    
    //试卷
    async testAction(){
      	let page=this.get('page');
      	let urls=[];
      	let list=await this.model('test').cache(3600*24*3).limit((page-1)*10000,10000).field('id').order('id asc').select();
      	for(let i=0;i<list.length;i++){
      		urls.push('https://'+this.get('sub')+'.zuotixia.com/test/'+hashids.encode(list[i].id)+'.html');
      	}
    	let html=this.sitemap(urls);
    	this.type('text/xml');
    	this.end(html);
    }
    
    //课程
    async courseAction(){
      	let urls=[];
      	let list=await this.model('course').cache(3600*24*3).field('id').order('id asc').select();
      	for(let i=0;i<list.length;i++){
      		urls.push('https://'+this.get('sub')+'.zuotixia.com/course/'+hashids.encode(list[i].id)+'.html');
      	}
    	let html=this.sitemap(urls);
    	this.type('text/xml');
    	this.end(html);
    }
    
    sitemap(urls){
        let html='';
        html+='<?xml version="1.0" encoding="UTF-8"?>\n';
        html+='<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        for(let i=0;i<urls.length;i++){
            urls[i]=urls[i].replace('&','&amp;');
            html+='<url>\n';
            html+='<loc>'+urls[i]+'</loc>\n';
            html+='<lastmod>'+think.datetime(new Date,'YYYY-MM-DD')+'</lastmod>\n';
            html+='<changefreq>monthly</changefreq>\n';
            html+='<priority>1.0</priority>\n';
            html+='</url>\n';
        }
        html+='</urlset>\n';
        return html;
    }
    
    //处理地图序列
    async indexAction(){
        let mark=0;
        for(let i=1;i<=1110;i++){
            let item=await this.model('item').limit(1).where({id:['>',mark]}).order('id asc').find();
            console.log(i,mark,item.id);
            await this.model('item').where({id:item.id}).field('id').update({oindex:i});
            let list=await this.model('item').field('id').limit(10000).where({id:['>=',item.id]}).order('id asc').select();
            mark=list[9999].id;
            
        }
    }
    
    //百度随机PC
    async randomAction(){
        let page=Math.floor(Math.random()*222);
        page=page*5+1;
      	let item=await this.model('item').where({oindex:page}).find();
      	let list=await this.model('item').limit(50000).field('id').where({id:['>=',item.id]}).order('id asc').select();
      	let html='';
      	for(let i=0;i<list.length;i++){
      		html+='https://'+this.get('sub')+'.zuotixia.com/item/'+hashids.encode(list[i].id)+'.html\n';
      	}
      	this.end(html);
    }
    
    //提交百度
    async baiduAction(){
        let fs=require('fs');
        let max=parseInt(fs.readFileSync('baidu.txt','utf-8'));
        let pre=await this.pushBaidu('www','aaa');
        pre=JSON.parse(pre);
        let remain=pre.remain;
        if(remain==0){
            this.success(0);return false;
        }
        let list=await this.model('item').limit(Math.min(1000,remain)).where({id:['<',max]}).order('id desc').select();
        let pc_urls='';
        let mobile_urls='';
        for(let i=0;i<list.length;i++){
            pc_urls+='https://www.zuotixia.com/course/'+hashids.encode(list[i].id)+'.html\n';
            mobile_urls+='https://m.zuotixia.com/course/'+hashids.encode(list[i].id)+'.html\n';
        }
        let pc_result=await this.pushBaidu('www',pc_urls);
        let mobile_result=await this.pushBaidu('m',mobile_urls);
        if(pc_result!=404){
            fs.writeFileSync('baidu.txt',list[list.length-1].id);//写入文件
        }
        this.success(remain+'     '+list[list.length-1].id);
    }
    
  async pushBaidu(site,urls){
    let superagent=require('superagent');
    let url='http://data.zz.baidu.com/urls?site=https://'+site+'.zuotixia.com&token=tEp1043a4IJGj0KM';
    return new Promise((resolve, reject) => {
      superagent
        .post(url)
        .send(urls)
        .timeout(10000)
        .end(function (err,res){
          if(err){
            console.log(err);
            resolve(404);
          }else{
            resolve(res.text);
          }
      });
    });
  }
    
}