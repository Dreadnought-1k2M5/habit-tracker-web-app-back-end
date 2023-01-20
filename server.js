const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

const connection = require('./app/config/db.config');
const corsConfiguration = require('./app/config/cors.config');

const PORT = process.env.PORT || 8080;



app.use(cors(corsConfiguration));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    key: 'userid',
    secret: "randomsecret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 60 * 60 *24
    }
}));

app.get('/', (req, res)=>{
    //Check if client has cookie/session ID
    let isAuthenticated = req.body.isAuthenticated;
    if(req.session.user){
        //send username only
        res.send({isAuthenticated: true, userProp: req.session.user[0].username});
    }else{
        console.log("NO SESSION");
        console.log(req.session.user);
        res.send({isAuthenticated: false});
    }
})

app.post('/login', (req, res)=>{
    connection.query(`SELECT * FROM account_table WHERE username='${req.body.username}' and password='${req.body.password}'`, function(err, result){
        if(err || result.length < 1 || result == null){
            console.log(err);
            res.send({isAuthenticated: false});
        }else if(result){
            req.session.user = result;
            console.log(req.session.user);
            res.send({isAuthenticated: true, userObject: result});
        }
    });
})

app.listen(PORT, ()=>{
    console.log(`Listening to PORT: ${PORT}`);
})

