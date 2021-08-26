export default [
    [/^item\/([a-zA-Z0-9\-]*).html$/,'index/item/?id=:1'],//题目
    [/^test\/([a-zA-Z0-9\-]*).html$/,'index/test/?id=:1'],//试卷
    [/^test\/([a-zA-Z0-9\-]*)_([0-9\-]*).html$/,'index/test/?id=:1&page=:2'],//试卷
    [/^course\/([a-zA-Z0-9\-]*).html$/,'index/course/?id=:1'],//课程
    [/^course\/([a-zA-Z0-9\-]*)_([0-9\-]*).html$/,'index/course/?id=:1&page=:2'],//课程
    [/^subclass\/([a-zA-Z0-9\-]*).html$/,'index/subclass/?id=:1']//子类
]