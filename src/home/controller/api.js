'use strict';
const Hashids = require('hashids/cjs');
const hashids = new Hashids('supersmart');

import Base from './base.js';

export default class extends Base {

    //请求预处理
    async __before(){
        this.setCorsHeader();
    }
    
    //首页
    async indexAction(){
        //大类
        let classes=await this.model('class').cache(3600).select();
        for(let i=0;i<classes.length;i++){
            //子类        
            let subclasses=await this.model('subclass').cache(3600).where({class_id:classes[i].id,course_num:['>',0]}).select();
            classes[i].subclasses=subclasses;
        }
        this.success({classes:classes,index:1});
    }
    
    //子类页
    async subclassAction(){
        let id=this.get('id');
        //子类
        let subclass=await this.model('subclass').cache(3600).where({id:id}).find();
        //子类列表
        let subclasses=await this.model('subclass').cache(3600).where({class_id:subclass.class_id,course_num:['>',0]}).select();
        //课程
        let courses=await this.model('course').cache(3600).where({subclass_id:id}).select();
        //大类
        let oclass=await this.model('class').cache(3600).where({id:subclass.class_id}).find();
        this.success({subclass:subclass,subclasses:subclasses,courses:courses,oclass:oclass});
    }
    
    //课程页
    async courseAction(){
        let id=this.get('id');
        let page=this.get('page')||1;
        let course=await this.model('course').where({id:id}).find();
        let courses=await this.model('course').where({subclass_id:course.subclass_id}).select();
        let tests=await this.model('test').limit((page-1)*20,20).where({course_id:id,item_num:['>',0]}).select();
        //子类
        let subclass=await this.model('subclass').cache(3600).where({id:course.subclass_id}).find();
        //大类
        let oclass=await this.model('class').cache(3600).where({id:course.class_id}).find();
        //试卷总数
        let total=await this.model('test').where({course_id:id}).count();
        let total_page=Math.ceil(total/20);
        this.success({course:course,courses:courses,tests:tests,subclass:subclass,page:page,total:total,total_page:total_page});
    }
    
    //试卷页
    async testAction(){
        let id=this.get('id');
        let page=this.get('page')||1;
        //试卷本身
        let test=await this.model('test').where({id:id}).find();
        //本页题目列表
        let list=await this.model('item').limit((page-1)*20,20).where({test_id:id}).order('id').select();
        //题目总数
        let total=await this.model('item').where({test_id:id}).count();
        //页数
        let total_page=Math.ceil(total/20);
        //相关试卷
        let tests=await this.model('test').where({course_id:test.course_id,item_num:['>',0]}).select();
        //课程
        let course=await this.model('course').cache(3600).where({id:test.course_id}).find();
        //子类
        let subclass=await this.model('subclass').cache(3600).where({id:course.subclass_id}).find();
        //大类
        let oclass=await this.model('class').cache(3600).where({id:course.class_id}).find();
        this.success({test:test,list:list,page:page,total:total,total_page:total_page,tests:tests,course:course,subclass:subclass,oclass:oclass});
    }
    
    //题目页
    async itemAction(){
        let id=this.get('id');
        //题目内容
        let item=await this.model('item').where({id:id}).find();
        //相关题目，10条，随机，本试卷
        let relate=await this.model('item').limit(10).where({test_id:item.test_id,id:['!=',item.id]}).order('random()').select();
        //上一道
        let prev=await this.model('item').where({id:['<',item.id],test_id:item.test_id}).order('id').find();
        //下一道
        let next=await this.model('item').where({id:['>',item.id],test_id:item.test_id}).order('id').find();
        //所属试卷
        let test=await this.model('test').where({id:item.test_id}).find();
        //相关试卷
        let tests=await this.model('test').cache(3600).where({course_id:item.course_id}).select();
        //课程
        let course=await this.model('course').cache(3600).where({id:item.course_id}).find();
        //子类
        let subclass=await this.model('subclass').cache(3600).where({id:course.subclass_id}).find();
        //大类
        let oclass=await this.model('class').cache(3600).where({id:course.class_id}).find();
        //处理题目图片
        item.otitle=this.dealImageUrl(item.otitle);
        item.memo=this.dealImageUrl(item.memo);
        this.success({item:item,relate:relate,prev:prev,next:next,test:test,tests:tests,course:course,subclass:subclass,oclass:oclass});
    }
    
    //处理文本
    textFormat(text){
        return text.replace(/\n/g,'<br>');
    }
    
    //替换图片
    replaceImage(text){
        return text.replace(/<\s?img[^>]*>/gi, '（图）');
    }
    
    //处理图片
    dealImageUrl(text){
        let imgReg = /<img.*?(?:>|\/>)/gi //匹配图片中的img标签
        let srcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/i // 匹配图片中的src
        let arr = text.match(imgReg)||[]  //筛选出所有的img
        let srcArr = []
        for (let i = 0; i < arr.length; i++) {
            let src = arr[i].match(srcReg)
            // 获取图片地址
            srcArr.push(src[1])
            let url=src[1].replace('file_dbpath/image/','');
            text=text.replace(src[1],'https://ti.jisuan.mobi/'+url);
        }
        return text;
    }
    
    //处理题目标题
    dealItemTitle(text){
        text=this.dealImageUrl(text);
        return text.replace(/<.*?>/g,'').replace(/\n/g,'');
    }
    
    //答案
    async answerAction(){
        let id=this.post('id');
        let referer=this.http.req.headers.referer;
        if(referer.indexOf(hashids.encode(id)+'.html')>0){
            let item=await this.model('item').field('oanswer').where({id:id}).find();
            this.success(item.oanswer);
        }else{
            this.end('');
        }
    }
}