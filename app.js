const express = require('express');
const app = express();
const userModel = require("./models/user");// importing user model
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/register', (req, res) => {
    res.render('register'); 
});

app.get('/login', (req, res) => {
    res.render("login");
});
// protected route
app.get('/profile',isLoggedIN,async (req, res) => {
   let user = await userModel.findOne({email:req.user.email}).populate("posts")
//    console.log(user);  
    res.render("profile",{user}); 
   
});

app.get('/like/:id',isLoggedIN,async (req, res) => {
    let post = await postModel.findOne({_id:req.params.id}).populate("user")
    // console.log(req.user); 
    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid)  
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }

    await post.save()
     res.redirect("/profile"); 
    
 });

 app.get('/edit/:id',isLoggedIN,async (req, res) => {
    let post = await postModel.findOne({_id:req.params.id}).populate("user")
    // console.log(req.user); 
    res.render('edit',{post});
    
 });

 app.get('/delete/:id',isLoggedIN,async (req, res) => {
    let post = await postModel.findOneAndDelete({_id:req.params.id}).populate("user")
    // console.log(req.user); 
    res.redirect('/profile');
    
 });

 app.post('/update/:id',isLoggedIN,async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content})
    // console.log(req.user); 
    res.redirect('/profile');
    
 });

app.post('/post',isLoggedIN,async (req, res) => {
    let user = await userModel.findOne({email:req.user.email})
    let {content} = req.body;

    let post = await postModel.create({
        user:user._id,
        content: content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
    
 });

app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body

    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("user already registered")


    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async(err, hash) => {
           // console.log(hash);
          let user = await userModel.create({
            username,
            email,
            age,
            name,
            password:hash

           });

           let token = jwt.sign({email:email, userid:user._id},"shhhhh");
           res.cookie("token", token);
           res.send("registered");
        })
    })

});

app.post('/login', async (req, res) => {
    let { email, password, username, name, age } = req.body

    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password,user.password, function (err,result){
        // if(result) res.status(200).send("login sucessfull!");
        if(result){
            let token = jwt.sign({email:email, userid:user._id},"shhhhh");
            res.cookie("token", token);
             res.status(200).redirect("/profile");
        }
        else res.redirect("/login")

    })


    
});

app.get('/logout', (req, res) => {
   res.cookie("token","");
   res.render("login");
});

//is login middleware
function isLoggedIN(req,res,next){
    // if(req.cookies.token ==="") res.send("you must be loggedin");
    if(req.cookies.token ==="") res.redirect("/login");
    else{
        let data = jwt.verify(req.cookies.token,"shhhhh");
        req.user= data;
        next();
    }
}

app.listen(3000);