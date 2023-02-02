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
        
        connection.query(`select total_points, total_hours from profile_table where profile_id='${req.session.userSession[0].profile_id}';`, function(err, totalValues){
            console.log(totalValues);
            console.log(totalValues.length);
            //send username and total values from profile_table
            connection.query(`select id_habit, habit_name, habit_total_points, habit_total_minutes, date_creation, update_latest_date from habit_table where profile_id='${req.session.userSession[0].profile_id}';`, function(err, tableResult){
                
                res.send({isAuthenticated: true, userProp: req.session.userSession[0].username, totalValues: totalValues[0], tableResult: tableResult})

            });
        });
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
    let profile_id = uuidv4();
    let saltRounds = 10;
    let username = req.body.username;
    
    bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
        if(err){
            return res.send(err);
        }
        else{
            
            //REMEBER - When dealing with foreign keys, the primary key cell of the second table should have a value first before the foreign key cell of the first error.
            //Otherwise, it wont work.
            connection.query(`INSERT INTO profile_table (profile_id, username, total_points, total_hours) VALUES ('${profile_id}', '${username}', 0, 0, 0);`);
            connection.query(`INSERT INTO account_table (username, password, profile_id) VALUES ('${username}', '${hash}', '${profile_id}');`);

            return res.send("ACCOUNT REGISTERED SUCCESSFULLY");
        }
    })
    
});

app.post('/add-habit', (req, res)=>{
    console.log("\n\n--------------------------------------------------");
    console.log(req.session.userSession);
    let profile_id = req.session.userSession[0].profile_id;
    console.log(`\nPROFILE KEY: ${profile_id}\n`);
    
    
    connection.query(`INSERT INTO habit_table (profile_id, habit_name, habit_total_points, habit_total_minutes, date_creation, update_latest_date) VALUES ('${profile_id}', '${req.body.data}', 0, 0, NOW(), NOW());`);
    
    res.send("SUCCESS");
});

//EDIT HABIT ITEM
app.post('/edit-habit', (req, res)=>{
    console.log(req.body);
    let id_habit = req.body.elemObject.id_habit;
    let profile_id = req.body.elemObject.profile_id;
    let habit_name = req.body.habit;
    connection.query(`UPDATE habit_table SET habit_name='${habit_name}' WHERE id_habit=${id_habit} AND profile_id='${profile_id}';`);
    res.send("EDIT SUCCESS");
});

//DELETE HABIT ITEM
app.post('/remove-habit', (req, res)=>{
    console.log(req.body);
    connection.query(`DELETE FROM habit_table WHERE id_habit=${req.body.id_habit} AND profile_id='${req.body.profile_id}' AND habit_name='${req.body.habit_name}';`, function(err, result){
        if(err){
            return res.send(err);
        }else{
            return res.send(result);
        }
    });
})

//GET HABITS LIST
app.get('/get-habits-list', (req, res)=>{
    let profile_id = req.session.userSession[0].profile_id;
    connection.query(`SELECT id_habit, profile_id, habit_name from habit_table WHERE profile_id='${profile_id}';`, function(err, result){
        if(result == undefined){
            return res.send(false);
        }
        return res.send(result);
    });
})

//add record
app.post('/add-record-habit', (req, res)=>{
    
    let profile_id = req.session.userSession[0].profile_id;

    //Get the id_habit
    let id_habit_var = req.body.modalState.habitItem.id_habit;

    //Sum of total minutes and points
    let sum_minutes = 0, sum_points = 0;
    

    //Retrieve current points and minutes
    connection.query(`select * from habit_table`, function(err, results){
        if(err){
            console.log(err);
            return res.send(err);
        }
        console.log(results);
        console.log(req.body.modalState);

        //Get habit_total_points and habit_total_minutes with the correct id_habit
        console.log(id_habit_var);

        let elemObj = results.filter((elem)=> elem.id_habit === id_habit_var);
        let habit_total_points_var = parseInt(elemObj[0].habit_total_points);
        let habit_total_minutes_var = parseInt(elemObj[0].habit_total_minutes);

        connection.query(`insert into habits_activity_log (habit_name, minutes, id_habit, profile_id) values ('${req.body.modalState.habitItem.habit_name}', ${req.body.minutesValueState}, ${req.body.modalState.habitItem.id_habit}, '${profile_id}');`, (err1, result_1)=>{
            console.log("outer query");
            if(err1){
                console.log(err1);
                return res.send(false);
            }
            habit_total_points_var += 1;
            habit_total_minutes_var += parseInt(req.body.minutesValueState);
            console.log(req.body.modalState.habitItem.profile_id);
            console.log(result_1);
            connection.query(`update habit_table set habit_total_points=${habit_total_points_var}, habit_total_minutes=${habit_total_minutes_var}, update_latest_date=NOW() where profile_id='${profile_id}' and habit_name='${req.body.modalState.habitItem.habit_name}' and id_habit=${id_habit_var}; `, (err, result)=>{
                connection.query(`select minutes from habits_activity_log where profile_id='${profile_id}';`, function(err, result_minutes){
                    console.log("LINE 183 - record");
                    console.log(result);
                    sum_minutes = result_minutes.reduce((accumulator, currentVal) => accumulator + currentVal.minutes, 0);
                    console.log(`TOTAL MINUTES: ${sum_minutes}`);
                    connection.query(`select habit_total_points from habit_table where profile_id='${profile_id}';`, function(err, result_points){
                        if(err){
                            console.log(err);
                            return res.send(err);
                        }
                        console.log("LINE 196");
                        console.log(result_points);
                        let sum_points = result_points.reduce((accumulator, currentValue) => accumulator + currentValue.habit_total_points, 0);
                        console.log(sum_points);
                        //convert minutes to hours
                        let totalTimeInHours = sum_minutes / 60;
                        connection.query(`update profile_Table set total_points=${sum_points}, total_hours=${totalTimeInHours} where profile_id='${profile_id}';`);

                    })
                    /* connection.query(select )
                    connection.query(`update profile_Table set total_points=${}, total_minutes`) */
                })
            });   
        });

    })
/* 
   
    //Update profile_table
    connection.query(`update profile_table set total`) */

    res.send(true);
})


app.get('/logout', (req, res)=>{
    req.session.destroy((err)=>{
        res.send(true);
    })
});

app.listen(PORT, ()=>{
    console.log(`Listening to PORT: ${PORT}`);
})

