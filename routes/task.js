var express = require('express');
var router = express.Router();
var mysql = require('promise-mysql');
var db_config = require('../config/AWS_RDS_Config.json');

var pool = mysql.createPool({
  host: db_config.host,
  port: db_config.port,
  user: db_config.user,
  password: db_config.password,
  database: db_config.database,
  connectionLimit: db_config.connectionLimit
});

//출발지와 도착지 필터 전달받아서 임무 목록 전달 - 수행자/의뢰자인지 id
//helper의 status 의뢰중으로 바꿈
//userId 나중에 바꿔야 함! - 헤더? 에서 가져오는걸루..
router.get('/:userId', async function (req, res) {
  try {
    //이미 수행중인 사용자인지 확인
    let selectQuery = 'select status from helpers where members_id = ?'
    let helper_status = await connection.query(selectQuery, userId);
    if (helper_status == 'D') {
      res.status(405).send({ message: 'this user has already helped other client', result: [] });
    }
    else {
      let updateQuery = 'update helpers set status = ? where members_id = ?';
      await connection.query(updateQuery, ['D', userId]);
      //res.status(200).send( { message: 'change status : Success'} );

      let start_lat = req.query.start_lat;
      let start_long = req.query.start_long;
      let finish_lat = req.query.finish_lat;
      let finish_long = req.query.finish_long;
      if (!(start_lat && start_long && finish_lat && finish_long))
        res.status(400).send({ message: 'wrong inout', result: [] });
      else {
        //1. 네가지 값을 가지고 중점, 반지름제곱 구하기
        let center_lat = (start_lat + finish_lat) / 2;
        let center_long = (start_long + finish_long) / 2;
        let r = Math.pow((start_lat - center_lat), 2) + Math.pow((start_long - center_long), 2);

        var connection = await pool.getConnection();
        //2. 반경안의 task 찾기
        selectQuery = `'select * from current_tasks where 
        (home_lat - ?)*(home_lat - ?) + (home_long - ?)*(home_long - ?) <= ? and matching_time = null'`;
        let data = await connection.query(selectQuery, center_lat, center_lat, center_long, center_long, r*r);
        //selectQuery = 'select * from current_tasks where pow((home_lat - ?),2) + pow((home_long - ?),2) <= ?';
        //let data = await connection.query(selectQuery, center_lat, center_long, r*r); 
        res.status(200).send({ message: 'select the task list : success', result: data });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error : ' + err, result: [] });
  } finally {
    pool.releaseConnection(connection);
  }
});

//task를 받아서 current_tasks에 추가
//client의 status 의뢰중으로 바꿈
router.post('/:userId', async function (req, res) {
  try {
    let selectQuery = 'select status from clients where members_id = ?'
    let helper_status = await connection.query(selectQuery, userId);
    if (helper_status == 'D') {
      res.status(405).send({ message: 'this user has already requested other task', result: [] });
    }
    else
    let body = req.body;
    let insertQuery = 'insert into current_tasks set ?';
    let task = {
      task_type: body.task_type,
      cost: body.cost,
      specific: body.specific,
      deadline: body.deadline,
      workplace_lat: body.workplace_lat,
      workplace_long: body.workplace_long,
      home_lat: body.home_lat,
      home_long: body.home_long,
      workplace: body.workplace,
      home: body.home
    }
    var connection = await pool.getConnection();
    let inserted = await connection.query(insertQuery, task);
    console.log(inserted);
    res.status(200).send({ message: 'Success' });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'internal server error' + err });
  } finally {
    pool.releaseConnection(connection);
  }
});
module.exports = router;

