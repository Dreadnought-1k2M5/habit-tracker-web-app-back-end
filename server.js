const express = require('express');
const cors = require('cors');

const app = express();

const connection = require('./app/config/db.config');

const PORT = process.env.PORT || 8080;

var corsConfiguration = {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"],
    optionSuccessStatus: 200
}

app.use(cors(corsConfiguration));

app.use(express.json());

app.post('/login', (req, res)=>{
    connection.query('SELECT * FROM employees', function(err, result){
        console.log(result);
    });
    console.log(`${req.body.username}\n${req.body.password}`);
    res.send("INPUT RECEIVED!!!");
})

app.listen(PORT, ()=>{
    console.log(`Listening to PORT: ${PORT}`);
})

