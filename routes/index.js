var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db_config = require('../config/AWS_RDS_Config.json');

var pool= mysql.createPool({
  host: db_config.host,
  port: db_config.port,
  user: db_config.user,
  password: db_config.password,
  database: db_config.database,
  connectionLimit: db_config.connectionLimit
});

router.get('/', function(req, res, next) {
    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
          //  var value = [req.params.id];
            connection.query('select * from User;'/*, value*/, function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('All Users');
                    res.send(rows);
                    connection.release();
                }
            });
        }
    });
});

module.exports = router;
