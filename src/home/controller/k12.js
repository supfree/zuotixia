'use strict';
let fs=require('fs');
let cheerio = require("cheerio");

import Base from './base.js';

export default class extends Base {

  //请求预处理
  async __before(){
    this.setCorsHeader();
  }

  async getAction(){
    let k12=[['yuwen',1,4998],['shuxue',2,28449],['yingyu',3,4967]];//小学
    //let k12=[['yuwen',1,10414],['shuxue',2,40670],['yingyu',3,17872],['wuli',4,18630],['huaxue',5,18630],['shengwu',6,15342],['dili',7,11210],['lishi',8,10915],['zhengzhi',9,9525]];//初中
    //let k12=[['yuwen',1,14921],['shuxue',2,30415],['yingyu',3,19813],['wuli',4,17757],['huaxue',5,18929],['shengwu',6,3132],['dili',7,9038],['lishi',8,12257],['zhengzhi',9,14177]];//高中
    for(let j=0;j<k12.length;j++){
      for(let i=1;i<=k12[j][2];i++){
        let url='https://k12.mayi173.com/exam/list/1-'+k12[j][1]+'-0-'+i+'.html';
        let filename='k12/xiaoxue/'+k12[j][0]+'/'+i+'.txt';
        if(!think.isFile(filename)){
          let html=await this.getPage(url);
          let $=this.getQuery(html);
          let list=$('a:contains("查看答案")');
          let array=[];
          list.each(function(){
            array.push($(this).attr('href').replace('/exam/detail/','').replace('.html',''));
          });
          if(html!=404){
            fs.writeFileSync(filename,JSON.stringify(array));//写入文件
          }
        }
        console.log(i);
      }
    }
    this.success();
  }
  
  async insertAction(){
    //let k12=[['yuwen',1,4998],['shuxue',2,28449],['yingyu',3,4967]];//小学
    //let k12=[['yuwen',1,10414],['shuxue',2,40670],['yingyu',3,17872],['wuli',4,18630],['huaxue',5,18630],['shengwu',6,15342],['dili',7,11210],['lishi',8,10915],['zhengzhi',9,9525]];//初中
    let k12=[['yuwen',1,14921],['shuxue',2,30415],['yingyu',3,19813],['wuli',4,17757],['huaxue',5,18929],['shengwu',6,3132],['dili',7,9038],['lishi',8,12257],['zhengzhi',9,14177]];//高中
    for(let j=0;j<k12.length;j++){
      let date=[];
      for(let i=1;i<=k12[j][2];i++){
        let filename='k12/gaozhong/'+k12[j][0]+'/'+i+'.txt';
        let html=fs.readFileSync(filename,'utf-8');
        let obj=JSON.parse(html);
        for(let k=0;k<obj.length;k++){
          date.push({id:obj[k],class_id:3,subclass_id:k12[j][1]});
        }
      }
      await this.model('k12').addMany(date);
      console.log(j,k12[j],date.length);
    }
    this.success();
  }
  
  //采集
  async caijiAction(){
      let list=await this.model('k12').limit(1000).where({otitle:null}).select();
      let update=[];
      for(let i=0;i<list.length;i++){
          let url='https://k12.mayi173.com/exam/detail/'+list[i].id+'.html';
          let html=await this.getPage(url);
          if(html!=404){
              let $=this.getQuery(html);
              let otitle=($('.header:contains("题目")').next().html()||'').trim();
              let oanswer=($('#i-tab-content').html()||'').trim();
              let memo=($('.header:contains("解析")').next().html()||'').trim();
              if(memo.indexOf('sorry')>0){
                  memo='';
              }
              let tixing=($('.label:contains("题型：")').next().html()||'').trim();
              let nandu=($('.label:contains("难度：")').next().html()||'').trim();
              let kaodian=($('.header:contains("梳理考点")').next().find(':contains("知识考点概述")').html()||'').replace('知识考点概述','').trim();
              let item={id:list[i].id,otitle:otitle,oanswer:oanswer,memo:memo,tixing:tixing,nandu:nandu,kaodian:kaodian}
              update.push(item);
          }
          console.log(i,list[i].id);
      }
      await this.model('k12').updateMany(update);
      this.end('<meta http-equiv="refresh" content="0">');
  }
  
  //魔方
  async mofangAction(){
    for(let i=1;i<=872;i++){
      let filename='mofang/shuxue/'+i+'_1.html'
      let url='http://www.mofangge.com/qlist/shuxue/'+i+'/';
      //let html=await this.getPage(url);
      //fs.writeFileSync(filename,html);//写入文件
      let html=fs.readFileSync(filename,'utf-8');
      let $=this.getQuery(html);
      let page=1;
      if($('.seopage a').length>0){
        page=$('.seopage a').length;
      }
      if($('.seopage').length==0){
        page=0;
      }
      if(page>1){
        for(let j=2;j<=page;j++){
          let url='http://www.mofangge.com/qlist/shuxue/'+i+'/'+j+'/';
          let html=await this.getPage(url);
          fs.writeFileSync('mofang/shuxue/'+i+'_'+j+'.html',html);//写入文件
        }
      }
      console.log(i,page);
    }
    this.success();
  }
  
  async caimoAction(){
    let list=await this.model('aaa').limit(100).where({otitle:null}).select();
    let update=[];
    for(let i=0;i<list.length;i++){
      let url='http://www.mofangge.com/html/qDetail/'+list[i].url;
      let html=await this.getPage(url);
      if(html!=404){
        let $=this.getQuery(html);
        let otitle=$('#q_indexkuai2 .q_content .q_bot').html().trim();
        let $1=this.getQuery('<html><body>'+otitle+'</body></html>');
        $1('.provider').remove();
        otitle=$1('body').html();
        let oanswer=$('#q_indexkuai3 .q_content .q_bot').html().trim();
        let $2=this.getQuery('<html><body>'+oanswer+'</body></html>');
        $1('.provider,.right').remove();
        oanswer=$1('body').html();
        let tixing=$('span:contains("题型：")').html().replace('题型：','').trim();
        let nandu=$('span:contains("难度：")').html().replace('难度：','').trim();
        let kaodian=$('.seotops').find('a').eq(2).attr('title');
        update.push({id:list[i].id,otitle:otitle,oanswer:oanswer,tixing:tixing,nandu:nandu,kaodian:kaodian,memo:''});
      }
      console.log(list[i].id-2371249);
    }
    await this.model('aaa').updateMany(update);
    this.end('<meta http-equiv="refresh" content="0">');
  }
  
  //处理数学
  async shuxueAction(self){
      for(let i=1;i<=28449;i++){
          let update=[];
          let url='https://k12.mayi173.com/exam/list/1-2-0-'+i+'.html';
          let html=await this.getPage(url);
          if(html!=404){
              let $=this.getQuery(html);
              let list=$('.i-timu');
              list.each(async function(){
                  let otitle=$(this).find('.content').html().trim();
                  let tixing=$(this).find('.label:contains("题型：")').next().html().trim();
                  let nandu=$(this).find('.label:contains("难度：")').next().html().trim();
                  let id=$(this).find('a:contains("查看答案")').attr('href').replace('/exam/detail/','').replace('.html','');
                  //console.log({id:id,otitle:otitle,tixing:tixing,nandu:nandu});
                  await self.model('k12').where({id:id,otitle:null}).update({otitle:otitle,tixing:tixing,nandu:nandu});
              });
          }
          console.log(i);
      }
  }
  
  //
  async emptyAction(){
      let list=await this.model('aaa').limit(1000).where({oanswer:['LIKE','%揪错%']}).select();
      for(let i=0;i<list.length;i++){
          let otitle=list[i].otitle;
          let oanswer=list[i].oanswer;
          let $1=this.getQuery('<html><body>'+otitle+'</body></html>');
          $1('.provider').remove();
          otitle=$1('body').html();
          let $2=this.getQuery('<html><body>'+oanswer+'</body></html>');
          $1('.provider,.right').remove();
          oanswer=$1('body').html();
          await this.model('aaa').where({id:list[i].id}).update({otitle:otitle,oanswer:oanswer});
          console.log(i);
      }
      this.end('<meta http-equiv="refresh" content="0">');
  }
  
  async oidAction(){
      let list=await this.model('aaa').field('id,url').select();
      for(let i=0;i<list.length;i++){
          let url=list[i].url;
          let ourl=url.split('/');
          url=ourl[3];
          url=url.replace('.html','');
          let left=url.substring(0,5);
          let oid=parseInt(url.replace(left,''));
          console.log(i,oid);
          await this.model('aaa').where({id:list[i].id}).update({oid:oid});
      }
      this.success();
  }
  
  //处理图片链接
  async imageAction(){
      let j=parseInt(this.get('j'));
      let item=await this.model('item').where({oindex:j}).find();
      let list=await this.model('item').limit(10000).where({id:['>=',item.id]}).order('id').select();
      let update=[];
      for(let i=0;i<list.length;i++){
          let content=list[i].otitle||'';
          let course_id=list[i].course_id;
          let dir='/'+course_id+'/'+list[i].test_id;
          let srcReg=/src=[\'\"]?([^\'\"]*)[\'\"]?/gi;
          let images=content.match(srcReg)||[];
          for(let k=0;k<images.length;k++){
              let img=images[k];
              img=img.replace(/'/g,'"');
              img=img.replace('src="','');
              img=img.replace('"','');
              let file=img.split('/')[img.split('/').length-1];
              let filename=dir+'/'+file;
              if(img!=filename&&img.indexOf('base64')<0){
                  content=content.replace(img,filename);
              }
          }
          if(list[i].otitle!=content){
            update.push({id:list[i].id,otitle:content});
          }
          //console.log(j,i,list[i].id);
      }
      console.log(j,update.length);
      if(update.length>0){
          await this.model('item').updateMany(update);
      }
      this.end('<meta http-equiv="refresh" content="0;url=?j='+(j+1)+'">');
  }
  
  async testAction(){
      let item=await this.model('k12').where({id:202181720}).find();
  
     var srcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/gi
    
     let srcArr = item.otitle.match(srcReg)
      
      
      let $=this.getQuery('<html></body>'+item.otitle+'</body></html>');
      let images=$('img');
      let dir='/'+item.course_id+'/'+item.test_id;
      for(let k=0;k<images.length;k++){
          let that=images.eq(k);
          let img=that.attr('src');
          let file=img.split('/')[img.split('/').length-1];
          let filename=dir+'/'+file;
          if(img.indexOf('mayi')>0){
              console.log(img);
          }
          //console.log(img);
          console.log(img,filename);
          if(img!=filename){
              console.log(img);
          }
          //console.log(img,filename);
      }
      this.success(srcArr);
  }
  
    async oindexAction(){
        let mark=0;
        for(let i=1;i<=800;i++){
            let item=await this.model('k12').limit(1).where({id:['>',mark]}).order('id asc').find();
            console.log(i,mark,item.id);
            await this.model('k12').where({id:item.id}).update({index:i});
            let list=await this.model('k12').field('id').limit(10000).where({id:['>=',item.id]}).order('id asc').select();
            mark=list[9999].id;
            
        }
    }
  

  
  async getPage(url){
    let superagent=require('superagent');
    return new Promise((resolve, reject) => {
      superagent
        .get(url)
        .set('Referer','https://k12.mayi173.com')
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
  
  getQuery(html){
    return cheerio.load(html,{decodeEntities: false});
  }

}