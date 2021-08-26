'use strict';
const Hashids = require('hashids/cjs');
const hashids = new Hashids('supersmart');


export default class extends think.controller.base {
  //对ID等加密
  encryptId(id){
    id=id.toString();
    let key='19800725';
    let crypto=require('crypto');
    let cipher=crypto.createCipher('aes-256-cbc', key)
    let crypted=cipher.update(id,'utf8','hex');
    crypted+=cipher.final('hex');
    return crypted;
  }

  //对ID等解密
  decryptId(text){
    let key='19800725';
    let crypto=require('crypto');
    let decipher = crypto.createDecipher('aes-256-cbc',key);
    let dec=decipher.update(text,'hex','utf8');
    dec+= decipher.final('utf8');
    return parseInt(dec);
  } 

  //校验邮箱 
  verifyEmail(username){
    let reg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
    if(!reg.test(username)){
      return false;
    }else{
      return true;
    }
  }

  //获得访问者IP，来解决反向代理的IP透传问题
  realIP(){
    let ip=this.http.header('x-real-ip');
    if(!ip){
      ip=this.ip();
    }
    return ip;
  }
  
  //校验手机号
  verifyMobile(mobile){
    let reg = /^1[3|4|5|6|7|8][0-9]{9}$/; 
    if(!reg.test(mobile)){ 
      return false; 
    }else{
      return true;
    }
  }
  
  //生成随机数字，多用来短信验证码，默认为4位
  getVerifyCode(len=4){
    let Num="";
    for(let i=0;i<len;i++)
    {
      Num+=Math.floor(Math.random()*10);
    }
    //console.log(Num,'======================================');
    return Num;
  }
  
  //设置跨域头
  setCorsHeader(){
    this.header('Access-Control-Allow-Origin', '*');
    this.header('Access-Control-Allow-Origin', this.header('origin') || '*');
    this.header('Access-Control-Allow-Headers', 'x-requested-with');
    this.header('Access-Control-Request-Method', 'GET,POST,PUT,DELETE');
    this.header('Access-Control-Allow-Credentials', 'true');
    this.decryptQuery();
  }
  
  //日期时间格式化
  dateFormat(date,type){
    date=new Date(date)
    switch (type){
      case undefined:
        return think.datetime(date,'YYYY-MM-DD HH:mm');break;
      case 'complete':
        return think.datetime(date,'YYYY-MM-DD HH:mm:ss');break;
      case 'date':
        return think.datetime(date,'YYYY-MM-DD');break;
      case 'minidate':
        return think.datetime(date,'MM-DD');
      case 'serial':
        return think.datetime(date,'YYYYMMDDHHmmss')+('00'+date.getMilliseconds()).slice(-3);break;
      default:
        return think.datetime(date,type);
    }
  }
  
  //日期时间转换为时间戳
  convertStam(date){
    return new Date(date).getTime()/1000
  }
  
  //判断是否存在
  isExist(data){
    if(!think.isEmpty(data)){
      return true;
    }else{
      return false;
    }
  }
  
  //复制对象
  objectCopy(object){ 
    return JSON.parse(JSON.stringify(object));
  }
  
  //数组去重复
  ArrayUnique(arr){
    var hash=[];
    for (var i = 0; i < arr.length; i++) {
     if(hash.indexOf(arr[i])==-1){
      hash.push(arr[i]);
     }
    }
    return hash;
  }
  
  //判断是否在数组中
  inArray(item,array){
    for(var i=0;i<array.length;i++){
      if(item==array[i]){
        return true;
      }
    }
    return false;
  }
  
  //数组添加元素并去重复
  arrayPush(arr,element){
    arr.push(element);
    return this.ArrayUnique(arr);
  }
  
  //数组去重复
  arrayUnique(arr){
    var hash=[];
    for (var i = 0; i < arr.length; i++) {
       if(hash.indexOf(arr[i])==-1){
        hash.push(arr[i]);
       }
    }
    return hash;
  }
  
  //左截取
  left(str,lngLen){
    if(lngLen>0){
      return str.substring(0,lngLen);
    }else{
      return null
    }
  }
  
  //右截取
  right(str,lngLen){
    if (str.length-lngLen>=0&&str.length>=0&&str.length-lngLen<=str.length){
      return str.substring(str.length-lngLen,str.length);
    }else{
      return null
    }
  }
  
  //中间截取
  mid(str,starnum,endnum){
    if(str.length>=0){
      return str.substr(starnum,endnum)
    }else{
      return null
    }
  }
  
	//价格格式化
	priceFormat(price){
	  var value=Math.round(parseFloat(price)*100)/100;
	  var xsd=value.toString().split(".");
	  if(xsd.length==1){
	    value=value.toString()+'.00';
	    return value;
	  }
	  if(xsd.length>1){
	  if(xsd[1].length<2){
	    value=value.toString()+'0';
	  }
	  return value;
	  }
	}
  
  
  //解密请求ID数据
  decryptQuery(){ 
    let post=this.post();
    for(let key in post){
      if((key=='id'||this.right(key,3)=='_id')&&this.post(key)!=0){
        if(this.post(key).indexOf(']')>0){
          let array=JSON.parse(this.post(key));
          for(let i=0;i<array.length;i++){
        	array[i]=hashids.decode(array[i]);
          }
          this.post(key,JSON.stringify(array));
        }else{
        	if(this.post(key).indexOf(',')<0){
        		this.post(key,hashids.decode(this.post(key)));
        	}
        }
      }
    }
    let get=this.get();
    for(let key in get){
      if((key=='id'||this.right(key,3)=='_id')&&this.get(key)!=0){
        this.get(key,hashids.decode(this.get(key)));
      }
    }
  }
  
  //处理数据ID加密
  encryptObject(obj,name){
    if(typeof(name)=='undefined'){
      name='';
    }
    if(typeof(obj)==='object'){
      obj=JSON.parse(JSON.stringify(obj));
      if(obj==null){
        return null;
      }
      if(Array.isArray(obj)){
        let newArr=[];
        for(let i=0;i<obj.length;i++){
          newArr.push(this.encryptObject(obj[i],name));
        }
        return newArr;
      }else{
        let newObj={};
        for(let key in obj){
          newObj[key]=this.encryptObject(obj[key],key);
        }
        return newObj;
      }
    }else{
      if((name=='id'||this.right(name,3)=='_id')&&obj!=0&&isNaN(obj)==false){
        obj=hashids.encode(obj);
      }
      return obj;
    }
  };



  
}