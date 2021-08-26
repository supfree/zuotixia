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
    
    //首页
    async indexAction(){
        //大类
        let classes=await this.model('class').cache(3600).where({id:['!=',444]}).select();
        for(let i=0;i<classes.length;i++){
            //子类        
            let subclasses=await this.model('subclass').cache(3600).where({class_id:classes[i].id,course_num:['>',0]}).select();
            classes[i].subclasses=subclasses;
        }
        this.assign('classes',classes);
        this.assign('index',1);
        this.display(this.get('sub')+'_index.html');
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
        //随机题目 开始
        let course_ids=[];
        for(let i=0;i<courses.length;i++){
            course_ids.push(courses[i].id);
        }
        let list=await this.model('item').limit(20).where({course_id:course_ids}).order('random()').select();
        this.assign('subclass',subclass);
        this.assign('subclasses',subclasses);
        this.assign('courses',courses);
        this.assign('oclass',oclass);
        this.assign('list',list);
        this.display(this.get('sub')+'_subclass.html');
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
        let total=await this.model('test').where({course_id:id,item_num:['>',0]}).count();
        let total_page=Math.ceil(total/20);
        //随机题目
        let list=await this.model('item').limit(20).where({course_id:id}).order('random()').select();
        this.assign('course',course);
        this.assign('courses',courses);
        this.assign('tests',tests);
        this.assign('subclass',subclass);
        this.assign('page',page);
        this.assign('total',total);
        this.assign('total_page',total_page);
        this.assign('list',list);
        this.display(this.get('sub')+'_course.html');
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
        this.assign('test',test);
        this.assign('list',list);
        this.assign('page',page);
        this.assign('total',total);
        this.assign('total_page',total_page);
        this.assign('tests',tests);
        this.assign('course',course);
        this.assign('subclass',subclass);
        this.assign('oclass',oclass);
        this.display(this.get('sub')+'_test.html');
    }
    
    //题目页
    async itemAction(){
        let id=this.get('id');
        //题目内容
        let item=await this.model('item').where({id:id}).find();
        //本试卷所有题目
        console.time('test')
        let list=await this.model('item').field('id,otitle').where({test_id:item.test_id}).select();
        //console.timeEnd('test')
        //相关题目，10条，随机，本试卷
        let relate=this.getRelate(list,10);
        //上一道
        let prev=this.getPrev(list,item.id);
        //下一道
        let next=this.getNext(list,item.id);
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
        this.assign('item',item);
        this.assign('relate',relate);
        this.assign('prev',prev);
        this.assign('next',next);
        this.assign('test',test);
        this.assign('tests',tests);
        this.assign('course',course);
        this.assign('subclass',subclass);
        this.assign('oclass',oclass);
        this.display(this.get('sub')+'_item.html');
    }
    
    //处理文本
    textFormat(text){
        text=text||'';
        text=text.replace(/\n/g,'<br>');
        text=text.replace(/><br></g,'><');
        return text;
    }
    
    //替换图片
    replaceImage(text){
        return text.replace(/<\s?img[^>]*>/gi, '（图）');
    }
    
    //处理图片
    dealImageUrl(text){
        text=text||'';
        let imgReg=/<img.*?(?:>|\/>)/gi //匹配图片中的img标签
        let srcReg=/src=[\'\"]?([^\'\"]*)[\'\"]?/i // 匹配图片中的src
        let arr=text.match(imgReg)||[]  //筛选出所有的img
        let srcArr=[]
        for (let i=0;i<arr.length;i++) {
            let src=arr[i].match(srcReg)
            // 获取图片地址
            srcArr.push(src[1]);
            if(src[1].indexOf('base64')<0){
                if(text.indexOf('ti.jisuan.mobi'+src[1])<0){//判断是否已经被替换
                    text=text.replace(new RegExp(src[1],'gm'),'https://ti.jisuan.mobi'+src[1]);
                }
            }
        }
        return text;
    }
    
    //处理题目标题
    dealItemTitle(text,type){
        if(type==1){
            text=this.replaceImage(text);
        }
        text=this.dealImageUrl(text);
        return text.replace(/<.*?>/g,'').replace(/\n/g,'');
    }
    
    //答案
    async answerAction(){
        let id=this.post('id');
        let referer=this.http.req.headers.referer;
        if(referer.indexOf(hashids.encode(id)+'.html')>0){
            let item=await this.model('item').field('oanswer').where({id:id}).find();
            let answer=this.dealImageUrl(item.oanswer);
            this.success(answer);
        }else{
            this.end('');
        }
    }
    
    //获得前一题
    getPrev(list,id){
        let prev={id:0};
        for(let i=0;i<list.length;i++){
            if(list[i].id<id){
                prev.id=Math.max(prev.id,list[i].id);
            }
        }
        return prev;
    }
    
    //获得后一题
    getNext(list,id){
        let next={id:0};
        for(let i=0;i<list.length;i++){
            if(list[i].id>id){
                if(next.id!=0){
                    next.id=Math.min(next.id,list[i].id);
                }else{
                    next.id=list[i].id;
                }
            }
        }
        return next;
    }
    
    //获得相关题目
    getRelate(arrList,num){
        var tempArr=arrList.slice(0);
        var newArrList=[];    
        for(var i=0;i<Math.min(arrList.length,num);i++){
            var random=Math.floor(Math.random()*(tempArr.length-1));
            var arr=tempArr[random];
            tempArr.splice(random, 1);
            newArrList.push(arr);    
        }
        return newArrList;
    }
}