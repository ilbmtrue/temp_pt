const mysql = require("mysql");
 
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pixel"
});

sql = `SELECT * FROM \`pixel\`.\`users\`;`;
connection.query(sql, function(err, results, fields) {
    if(err) {
        console.log(err);
        console.log('ошибка запроса' + sql.slice(0,40));	
    } else {
        console.log('все ок');
        console.log(results);
        // console.log(fields);

        console.log
    }   

});

process.exit(-1);

// sql = `create table if not exists users(id int primary key auto_increment, name varchar(255) unique, password varchar(255));`;
// connection.query(sql, function(err, results) {
//     if(err) {
//         console.log(err);
//         console.log('ошибка запроса' + sql.slice(0,10));	
//     } else {
//         console.log('все ок');	
//     }
// });

