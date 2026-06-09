var D=require("better-sqlite3"); var db=new D("/app/data/database.sqlite"); var users=db.prepare("SELECT id,username,role,status FROM users").all(); console.log(JSON.stringify(users)); db.close();
