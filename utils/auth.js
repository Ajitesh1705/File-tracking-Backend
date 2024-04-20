
const jwt = require('jsonwebtoken');

const ensureAuthenticated = (req, res, next)=>{
    if(!req.headers['authorization']){
        return res.status(403)
            .json({message: 'Token is required'});
    }
    try{
        console.log(req.headers['authorization'])
        const decoded = jwt.verify(req.headers['authorization'].substring(7), 'my-secret-key')
        console.log(decoded)
        
        return next();
    }catch(err){
        return res.status(403)
            .json({message: "Token is not valid, or it's expired"});
    }
}

module.exports = {
    ensureAuthenticated
}