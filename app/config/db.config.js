const mysql = require('mysql2');

//Establish connection to MySQL Database

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'habit_tracker_main_db',
    password: 'cbm39f7yp'
});

module.exports = connection;