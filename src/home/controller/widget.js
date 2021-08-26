'use strict';
let fs=require('fs');
let unzip=require('unzip');

import Base from './base.js';

export default class extends Base {

  //请求预处理
  async __before(){
    this.setCorsHeader();
  }

  async tikuAction(){
    let ids=await this.model('ocourse').order('ocourse_id').select();
    //let ids=[992,993,994].sort(function(a,b){return a-b;});
    for(let i=0;i<ids.length;i++){
      let id=ids[i].ocourse_id;
      console.log('====='+id+'=====');
      console.log('1.获取文件地址');
      let url=await this.getZipUrl(id);//获得ZIP地址
      console.log('2.文件下载中 '+url);
      let content=await this.getPage(url);//下载文件
      console.log('3.写入文件');
      fs.writeFileSync('tiku/tiku.zip',content,'binary');//写入文件
      console.log('4.文件解压中');
      await this.unzipSync();//解压
      console.log('5.移动图片文件');
      if(fs.existsSync('tiku/image')){
        //fs.renameSync('tiku/image','tiku_image/'+id);
        this.emptyDir('tiku/image');
        fs.rmdirSync('tiku/image');//删除文件夹
      }
      console.log('6.导入试卷');
      await this.importTest();//导入试卷
      console.log('7.导入题目');
      await this.importItem();//导入题目
      console.log('8.完成');
    }
    this.end('已完成!!!!!!!');
  }
  
  async imageAction(){
    let ids=[143,142,141,140,139,138,134,133].sort(function(a,b){return a-b;});
    for(let i=0;i<ids.length;i++){
      let id=ids[i];
      console.log('====='+id+'=====');
      console.log('1.获取文件地址');
      let url=await this.getZipUrl(id);//获得ZIP地址
      console.log('2.文件下载中 '+url);
      let content=await this.getPage(url);//下载文件
      console.log('3.写入文件');
      fs.writeFileSync('tiku/tiku.zip',content,'binary');//写入文件
      console.log('4.文件解压中');
      await this.unzipSync();//解压
      console.log('5.移动图片文件');
      if(fs.existsSync('tiku/image')){
        fs.renameSync('tiku/image','tiku_image2/'+id);
      }
    }
    this.end('已完成!!!!!!!');
  }
  
  //导入试卷
  async importTest(){
    let content=fs.readFileSync('tiku/coursechapter.txt','utf-8');
    let list=JSON.parse(content);
    fs.unlinkSync('tiku/tiku.zip');
    fs.unlinkSync('tiku/course.txt');
    if(fs.existsSync('tiku/courseoutline.txt')){
        fs.unlinkSync('tiku/courseoutline.txt');
    }
    fs.unlinkSync('tiku/coursechapter.txt');
    let data=[];
    for(let i=0;i<list.length;i++){
      data.push({title:list[i].cchaptername,oid:list[i].ichapterid,ocourse_id:list[i].icourseid});
    }
    await this.model('test').addMany(data);
  }
  
  //导入题目
  async importItem(){
    let olist=fs.readdirSync('tiku');
    for(let i=0;i<olist.length;i++){
      let content=fs.readFileSync('tiku/'+olist[i],'utf-8');
      let list=JSON.parse(content);
      fs.unlinkSync('tiku/'+olist[i]);
      let data=[];
      for(let j=0;j<list.length;j++){
        data.push({otitle:list[j].ctitle,oquestion:list[j].cquestion,memo:list[j].cdescription,oid:list[j].isubjectid,otest_id:list[j].ichapterid,otype:list[j].isubjecttype,oanswer:list[j].canswer,ocourse_id:list[j].icourseid});
      }
      await this.model('item').addMany(data);
    }
  }
  
  async getZipUrl(id){
    let request=require('request');
    let xml ='<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Header><MGSoapHeader xmlns="http://tempuri.org/"><UserID>ttexam</UserID><Password>jKd!098764321</Password></MGSoapHeader></soap:Header><soap:Body><GetCourseUpdateName xmlns="http://tempuri.org/"><courseId>'+id+'</courseId><courseType>1</courseType><district /></GetCourseUpdateName></soap:Body></soap:Envelope>'
    
    let options={
      url: 'http://www.jinkaodian.com/CL.ExamWebService/ExamClientService.asmx?WSDL',
      method: 'POST',
      body: xml,
      headers: {
        'User-Agent':'Mozilla/4.0 (compatible; MSIE 6.0; MS Web Services Client Protocol 2.0.50727.8800)',
        'Content-Type':'text/xml; charset=utf-8',
        'SOAPAction':'http://tempuri.org/GetCourseUpdateName'
      }
    };
    
    return new Promise((resolve, reject) =>{
        let callback=(error, response, body) => {
          if (!error && response.statusCode == 200) {
            console.log(body);
            let left=body.split('<GetCourseUpdateNameResult>');
            let right=left[1].split('<');
            let mid=right[0];
            let url='http://www.jinkaodian.com/CL.ExamWebService/subject/'+mid+'.zip';
            resolve(url);
          };
          //console.log('E', response.statusCode, response.statusMessage);  
        };
        request(options, callback);
    });
  }
  
  async getPage(url){
    let superagent=require('superagent');
    return new Promise((resolve, reject) => {
      superagent
        .get(url)
        .set('Referer','https://music.163.com/')
        .maxResponseSize(1024*1024*1024)
        .timeout(1000*60*60)
        .end(function (err,res){
          if(err){
            console.log(err);
            resolve(404);
          }else{
            resolve(res.body);
          }
      });
    });
  }

  unzipSync(){
    return new Promise((resolve, reject) => {
      fs.createReadStream('tiku/tiku.zip').pipe(unzip.Extract({
        path: 'tiku'
      })).on('close', () => {
        //console.log('stream close')
        resolve()
      }).on('error', (err) => {
        reject(err)
      })
    })
  }
  
    emptyDir(fileUrl){   
        var files = fs.readdirSync(fileUrl);//读取该文件夹
        files.forEach(function(file){
            var stats = fs.statSync(fileUrl+'/'+file);
            if(stats.isDirectory()){
                emptyDir(fileUrl+'/'+file);
            }else{
             fs.unlinkSync(fileUrl+'/'+file); 
    
            }        
    
        });   
    
    }
    
    //处理试卷题目数
    async testItemNumberAction(){
        let list=await this.model('test').field('id').select();
        for(let i=0;i<list.length;i++){
            let num=await this.model('item').where({test_id:list[i].id}).count();
            await this.model('test').where({id:list[i].id}).update({item_num:num});
            console.log(i);
        }
        this.success();
    }
}