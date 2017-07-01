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

//용돈 조회
router.get('/money/:userId', async function (req, res) {
    try {
        let selectQuery = 'select money from members where members_id = ?'
        let data = await connection.query(selectQuery, userId);
        res.status(200).send({ message: 'Success selecting the money', result: data });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'internal server error : ' + err, result: [] });
    } finally {
        pool.releaseConnection(connection);
    }
});

//유저 토큰 받아서 식별하는걸로 바꿔야함 8주차 세미나 자료 참고 / 유저가 없는 경우 예외처리 필요함
//마이페이지
router.get('/money/mypage/:userId', async function (req, res) {
    try {
        let selectQuery = 'select money from members where members_id = ?'
        let data = await connection.query(selectQuery, userId);
        res.status(200).send({ message: 'Success selecting the money', result: data });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'internal server error : ' + err, result: [] });
    } finally {
        pool.releaseConnection(connection);
    }
});

//마이페이지 - 설정 (들어가면 기본 정보 보임)
router.get('/money/mypage/set/:userId', async function (req, res) {
    try {
        let selectQuery = 'select user_name, phone, about from members where members_id = ?'
        let data = await connection.query(selectQuery, userId);
        res.status(200).send({ message: 'Success selecting the informattion of user', result: data });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'internal server error : ' + err, result: [] });
    } finally {
        pool.releaseConnection(connection);
    }
});

//마이페이지 - 설정 변경
router.put('/money/mypage/set/:userId', async function (req, res) {
    try {
        let user_name = req.query.user_name;
        let phone = req.query.phone;
        let about = req.query.about;

        if (!(user_name && phone && about))
            res.status(400).send({ message: 'wrong inout', result: [] });
        else {
            let selectQuery = 'update members set user_name = ?, phone = ?, about = ? where members_id = ?'
            let data = await connection.query(selectQuery, user_name, phone, about, userId);
            res.status(200).send({ message: 'Success update the user information', result: data });
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
        else{
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
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'internal server error' + err });
    } finally {
        pool.releaseConnection(connection);
    }
});
 
module.exports = router;