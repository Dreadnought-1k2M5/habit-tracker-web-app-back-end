const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();

const connection = require('./app/config/db.config');
const corsConfiguration = require('./app/config/cors.config');

const PORT = process.env.PORT || 8080;



app.use(cors(corsConfiguration));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
        key: 'sessionID',
        secret: "randomsecret123",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 300000,
            expires: 300000
        }
    })
);

app.get('/', (req, res)=>{
    //Check if client has cookie/session ID
    let isAuthenticated = req.body.isAuthenticated;
    console.log(req.session.userSession);
    if(req.session.userSession){
        console.log(req.session.userSession);
        //send username only
        res.send({isAuthenticated: true, userProp: req.session.userSession[0].username});
    }else{
        console.log("NO SESSION");

        res.send({isAuthenticated: false});
    }
})

app.post('/login', (req, res)=>{
/*     connection.query(`SELECT * FROM account_table WHERE username='${req.body.username}' and password='${req.body.password}'`, function(err, result){
        if(err || result.length < 1 || result == null){
            console.log(err);
            res.send({isAuthenticated: false});
        }else if(result){
            req.session.user = result;
            console.log(req.session.user);
            res.send({isAuthenticated: true, userObject: result});
        }
    }); */
    connection.query(`SELECT * FROM account_table WHERE username='${req.body.username}';`, function(err, results){
        if(err || results.length < 1 || results == null){
            console.log(err);
            return res.send({isAuthenticated: false, description: 'No Account exists'});
        }else{
            bcrypt.compare(req.body.password, results[0].password, (err, hashResult)=>{
                if(hashResult){
                    req.session.userSession = results;
                    return res.send({isAuthenticated: true, userObject: results});
                }else{
                    return res.send({isAuthenticated: false, desc: err});
                }
            })
        }
    })
})

app.post('/register', (req, res)=>{
    let saltRounds = 10;
    console.log(req.body.password);
    bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
        if(err){
            return res.send(err);
        }
        else{
            console.log(hash);
            connection.query(`INSERT INTO account_table (username, password) VALUES ('${req.body.username}', '${hash}');`);
            return res.send("ACCOUNT REGISTERED SUCCESSFULLY");
        }
    })
    
})

app.get('/logout', (req, res)=>{
    req.session.destroy((err)=>{
        res.send(true);
    })
})

app.listen(PORT, ()=>{
    console.log(`Listening to PORT: ${PORT}`);
})

