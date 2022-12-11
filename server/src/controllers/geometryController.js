const securityServices = require('../services/securityServices');
const geometryServices= require('../services/geometryServices');

const closestCarriage = async (req, res) => {
    res.set('Content-Type', 'application/json');
    
    try {
        const security = await securityServices.isAuthorized(req.query.user, req.query.project, req.headers.authorization);      
        if (security) {
            if (!req.query.project) {
                res.send({error: "No project selected"});
            } else {
                const carriage =  await geometryServices.closestCarriage(req.query);
                res.send(carriage);
            }     
        } else {
            res.send({error: 'incorrect security credentials'});
        }
    } catch (err) {
        res.send({error: err});
    }
    
  };

  module.exports = {
    closestCarriage
}