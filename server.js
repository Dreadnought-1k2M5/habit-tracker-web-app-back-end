const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const { v4: uuidv4 } = require('uuid');
const v4options = {
    random: [
      0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea, 0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36,
    ],
}

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
            maxAge: 900000,
            expires: 900000
        }
    })
);

app.get('/', (req, res)=>{
    //Check if client has cookie/session ID
    let isAuthenticated = req.body.isAuthenticated;
    if(req.session.userSession){
        //send username only
        res.send({isAuthenticated: true, userProp: req.session.userSession[0].username});
    }else{
        console.log("NO SESSION");
        res.send({isAuthenticated: false});
    }
});

app.post('/login', (req, res)=>{
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
});

app.post('/register', (req, res)=>{
    let profile_key = uuidv4();
    let saltRounds = 10;
    console.log(req.body.password);
    bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
        if(err){
            return res.send(err);
        }
        else{
            console.log(hash);
            //REMEBER - When dealing with foreign keys, the primary key cell of the second table should have a value first before the foreign key cell of the first error.
            //Otherwise, it wont work.
            connection.query(`INSERT INTO profile_data (profile_key, habit_key_id) VALUES ('${profile_key}', '${profile_key}');`);
            connection.query(`INSERT INTO account_table (username, password, profile_key) VALUES ('${req.body.username}', '${hash}', '${profile_key}');`);

            return res.send("ACCOUNT REGISTERED SUCCESSFULLY");
        }
    })
    
});

app.post('/add-habit', (req, res)=>{
    console.log("\n\n--------------------------------------------------");
    console.log(req.session.userSession);
    let profile_key = req.session.userSession[0].profile_key;
    console.log(`\nPROFILE KEY: ${profile_key}\n`);
    console.log(req.body.data);
    
    connection.query(`INSERT INTO habit_table (habit_key_id, habit_data) VALUES ('${profile_key}', '${req.body.data}');`);
    
    res.send("SUCCESS");
});

//EDIT HABIT ITEM
app.post('/edit-habit', (req, res)=>{
    console.log(req.body);
    let id_habit_table = req.body.elemObject.id_habit_table;
    let habit_key_id = req.body.elemObject.habit_key_id;
    let habit_data = req.body.habit;
    connection.query(`UPDATE habit_table SET habit_data='${habit_data}' WHERE id_habit_table=${id_habit_table} AND habit_key_id='${habit_key_id}';`);
    res.send("EDIT SUCCESS");
});

//DELETE HABIT ITEM
app.post('/remove-habit', (req, res)=>{
    console.log(req.body);
    connection.query(`DELETE FROM habit_table WHERE id_habit_table=${req.body.id_habit_table} AND habit_key_id='${req.body.habit_key_id}' AND habit_data='${req.body.habit_data}';`, function(err, result){
        if(err){
            return res.send(err);
        }else{
            return res.send(result);
        }
    });
})

//GET HABITS LIST
app.get('/get-habits-list', (req, res)=>{
    let profile_key = req.session.userSession[0].profile_key;
    console.log(profile_key);
    connection.query(`SELECT id_habit_table, habit_key_id, habit_data from habit_table WHERE habit_key_id='${profile_key}';`, function(err, result){
        return res.send(result);
    });
})

app.get('/logout', (req, res)=>{
    req.session.destroy((err)=>{
        res.send(true);
    })
});

app.listen(PORT, ()=>{
    console.log(`Listening to PORT: ${PORT}`);
})

