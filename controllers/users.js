const user=require("../models/user");

module.exports.renderSignupForm= (req,res)=>{
    res.render("users/signup.ejs");
};
module.exports.signup=async(req,res)=>{
    try{
    let {username, email,password}=req.body;
    const newUser=new user({email,username});
    const registeredUser=await user.register(newUser, password)
    // console.log(registeredUser);
    req.login(registeredUser, (err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","welcome to wanderLust");
        res.redirect(req.session.redirectUrl || "/listings");  
    });
    
    }catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

// login form
module.exports.renderLoginForm=(req,res)=>{
    res.render("users/login.ejs");
};

module.exports.login=async (req, res) => {
        req.flash("success", "Welcome back to WanderLust!");
        res.redirect(res.locals.redirectUrl || "/listings");  // Redirect to stored URL
}

// logout

module.exports.logout=(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.flash("success", "you are logged out");
        res.redirect("/listings");
    })
};