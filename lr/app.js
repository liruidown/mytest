var express=require("express");

var app=new express();//实例化
//ejs中 设置全局数据 所有页面都可以使用

var md5=require("md5-node");

//获取post
var bodyParser=require("body-parser");

//固定模板,设置中间件
app.use(bodyParser.urlencoded({extended:false}));

app.use(bodyParser.json());



var multiparty=require('multiparty');/*图片上传模块，既可以获取form表单的数据 也可以实现上传图片*/


var fs=require('fs');


// var MongoClient=require('mongodb').MongoClient;
// var DbUrl='mongodb://localhost:27017/productmanage';  /*连接数据库*/

var DB=require('./modules/db.js');


var session = require('express-session');


//配置中间件  固定格式
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge:1000*60*30
    },
    rolling:true
}))



//使用模板引擎  默认找VIEW这个目录
app.set("view engine","ejs");


//配置public目录为我们的静态资源目录
app.use(express.static("public"));


app.use('/upload',express.static('upload'));
//自定义中间件，判断登录状态
// app.use(function (req,res,next) {
//
//     if(req.url=='/login'||req.url=='/doLogin'){
//         next();
//
//     }else {
//         if (req.session.userinfo&&req.session.userinfo.username!=''){
//            //判断有没有登录
//            //  app.locals['userinfo']="111111";
//             app.locals['userinfo']=req.session.userinfo;
//             next();
//         }else {
//             res.redirect('/login')
//         }
//
//
//     }
//
// })

app.get("/",function (req,res) {
    res.send("index");
})

//登录
app.get("/login",function (req,res) {
    //res.send("login");

res.render("login");


})

//获取登陆提交的数据
app.post("/doLogin",function (req,res) {
    //res.send("login");
    console.log(req.body);
    var username=req.body.username;
    var password=md5(req.body.password);  /*要对用户输入的密码加密*/

   // DB.find('user',{username:username,passwprd:password},function (err,data) {
   //     if (data.length>0){
   //         console.log('登录成功');
   //         //保存用户信息
   //         req.session.userinfo=data[0];
   //         res.redirect('product');/*登陆成功跳转到商品列表*/
   //     }else {
   //         console.log(data);
   //         console.log(err);
   //         res.send("<script>alert('登陆失败');location.href='/login'</script>")
   //
   //     }
   // })

    DB.find('user',{
        username:username,
        password:password
    },function(err,data){
        if(data.length>0){
            console.log('登录成功');
            //保存用户信息
            req.session.userinfo=data[0];

            res.redirect('/product');  /*登录成功跳转到商品列表*/

        }else{
            //console.log('登录失败');
            res.send("<script>alert('登录失败');location.href='/login'</script>");
        }
    })






        //获取数据
        //链接数据库
   //
   //  MongoClient.connect(DbUrl,function (err,db) {
   //      if(err){
   //          console.log(err);
   //          return;
   //      }
   //  //查询数据
   //      var result=db.collection("user").find({
   //          username:username,
   //          password:password
   //
   //          }
   //      );
   //
   //      //遍历数据 的方法
   //      result.toArray(function (err,data) {
   //      console.log(data);
   //
   //      if(data.length>0){
   //          console.log("登陆成功");
   //      //保存用户信息
   //      req.session.userinfo=data[0];
   //      //这时的data是个数组对象
   //      // [{_id:59924sffs3sf35wqaad,
   //      //     username:"admin",
   //      //     password:'123456'
   //      //       status:'1'}]
   //
   //
   //
   //      res.redirect('/product');
   //      }else{
   //          console.log("登陆失败");
   //
   // res.send("<script>alert('登陆失败');location.href='/login'</script>");
   //
   //
   //      }
   //
   //      db.close();
   //      });

    })










app.get("/product",function (req,res) {
        // MongoClient.connect(DbUrl,function (err,db) {
        //     if(err){
        //         console.log(err);
        //         console.log('数据连接失败');
        //         return;
        //
        //     }
        //     var result=db.collection('product').find();
        //     result.toArray(function (error,data) {
        //         if(error){
        //             console.log(error);
        //             return;
        //         }
        //         db.close();
        //         console.log(data);
        //         res.render("product",{
        //
        //         list:data
        //         });
        //     })
        // })

    DB.find('product',{},function(err,data){

        res.render('product',{

            list:data
        });
    })




    // res.render("product",{
    //
    //
    //
    //
    // });
})
//显示增加商品的页面
app.get("/productadd",function (req,res) {
    res.render("productadd");
})

//获取表单提交过来的数据 以及post过来的图片
app.post('/doProductAdd',function (req,res) {

    var form =new multiparty.Form();

    form.uploadDir='upload';//上传图片保存的地址    目录必须存在
    form.parse(req,function (err,fields,files) {
        //获取提交的数据以及图片上传成功返回的图片信息
        console.log(fields);  /*获取表单的数据*/
        console.log(files);  /*图片上传成功返回的信息*/
        var tittle=fields.title[0];
        var price=fields.price[0];
        var fee=fields.fee[0];
        var description=fields.description[0];
        var pic=files.pic[0].path;
        console.log(pic);

        DB.insert('product',{
            tittle:tittle,
            price:price,
            fee:fee,
            description:description,
            pic:pic

        },function (err,data) {
            if(!err){
                res.redirect('/product'); /*上传成功跳转到首页*/
            }
        })


    })





})






app.get("/productedit",function (req,res) {

    //获取get传值 id
    var id=req.query.id;

    console.log(id);

    //去数据库查询这个id对应的数据  自增长的id要用{"_id":new DB.ObjectID(id)}
    DB.find('product',{"_id":new DB.ObjectID(id)},function(err,data){
        res.render("productedit",{
            list:data[0]
        });

    });



})


app.post('/doProductEdit',function (req,res) {
    var form =new multiparty.Form();

    form.uploadDir='upload' //上传图片保存的地址

    form.parse(req,function (err,fields,files) {
        //获取提交的数据以及图片上传成功返回的图片信息
        console.log(fields);
        console.log(files);

        var _id=fields._id[0];
        var tittle=fields.title[0];
        var price=fields.price[0];
        var fee=fields.fee[0];
        var description=fields.description[0];
        var originalFilename=files.pic[0].originalFilename;
        var pic=files.pic[0].path;
         if(originalFilename)/*图片被修改了*/{
             var setData={
                 tittle:tittle,
                 price:price,
                 fee:fee,
                 description:description,
                 pic:pic
             };
         }else { //图片没有被修改

             var setData={
                 tittle:tittle,
                 price:price,
                 fee:fee,
                 description:description,

             };

             //删除临时生成的文件
             fs.unlink(pic);

         }
       DB.update('product',{'_id':new DB.ObjectID(_id)},setData,function (err,data) {
           if(!err){
               res.redirect('/product');
           }
       })

    })
})










//以上 配置路由

app.get("/loginOut",function (req,res) {
    req.session.destroy(function (err) {
        if (err){
            console.log(err);
        }else{
            res.redirect('/login');
        }
    });
})


//删除数据
// app.get('/delete',function (req,res) {
//     DB.deleteOne('product',{'tittle':'iphone4'},function (error,data) {
//         if(!error){
//             res.send('删除数据成功');
//         }
//     })
//
// })


app.get('/productdelete',function (req,res) {
    var id=req.query.id;


    DB.deleteOne('product',{'_id':new DB.ObjectID(id)},function (err) {
        if(!err){
           res.redirect('/product');

        }
    })
})


app.listen(3005,"127.0.0.1");