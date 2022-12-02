//const router = express.Router();
const securityController = require('../controllers/securityController');
const app = require('../app');
const router = app.Router()


app.post('/login', securityController.login);

module.exports = {
    app
};