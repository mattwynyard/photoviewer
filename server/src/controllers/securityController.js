const securityServices = require('../services/securityServices');
const jwtExpirySeconds = 10000;

const login = async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        const result = await securityServices.login(req.body.user, req.body.key)
        if (result.login) {
            res.cookie('token', result.token, { maxAge: jwtExpirySeconds * 1000 });
            res.json(result);
        } else {
            res.json( { login: false, error: "incorrect user or password" }); 
        }
    } catch (err) {
        res.json( { login: false, error: err });
    }

  };

  const logout = async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        const result = await securityServices.login(req.body.user, req.body.key)
        if (result) {   
            res.send({success: true});
        } else {     
            res.send({success: false});
        }
    } catch (err) {
        res.send({success: false, error: err});
    }
    
  }

  const mapbox = async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        const security = await securityServices.mapbox(req.body.user, req.body.key);
        if (security) {
            res.send({ result: process.env.MAPBOX });
        } else {
            res.send({ result: "public" });
        }
    } catch (err) {
        res.send({ result: "public", error: err });  
    } 
  }

  module.exports = {
    login,
    logout,
    mapbox
}