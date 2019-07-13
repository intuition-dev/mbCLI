
const sqlite3 = require('sqlite3').verbose()

const bcrypt = require('bcryptjs') // to hash passwords
const fs = require('fs-extra')

import { BaseDB } from 'mbake/lib/BaseDB'
import { iAuth } from 'mbake/lib/Serv'

export class ADB extends BaseDB { 
    veri() {
        return 'v0.9.26'
     }
  
    // auth & auth DB
    // emailjs is client side api

   protected static db
   protected static salt

    dbExists() {
        return fs.existsSync('./ADB.sqlite')
   }

   con() {
        if(ADB.db) {
            console.log('connection exists')
            return
        }
        console.log('new connection')
        ADB.db =  new sqlite3.Database('./ADB.sqlite')
    }//()

    init() {
        if(this.dbExists())  {
           // if db exists, connect an exit
              this.con()
           return
        }//fi
        if(!(ADB.db)) {
           console.log('no connection made')
           this.con()
        }//fi
  
        ADB.db.run(`CREATE TABLE ADMIN  (email, hashPass, vcode)`) // single row in table
        ADB.db.run(`CREATE TABLE CONFIG (emailjsService_id, emailjsTemplate_id, emailjsUser_id, pathToApp, port int)`) // single row in table
        ADB.db.run(`CREATE TABLE SALT(salt)`)// single row in table
        ADB.db.run(`CREATE TABLE EDITORS(guid text, name, email, hashPass, last_login_gmt int, vcode)`)

        let salt = bcrypt.genSaltSync(10)
        const stmt =  ADB.db.prepare(`INSERT INTO SALT(salt) VALUES( ?)`)
        this._run(stmt, salt )
        ADB.salt = salt
    }

    async getSalt() {
        if(ADB.salt) return ADB.salt
        const qry =  ADB.db.prepare('SELECT * FROM SALT')// single row in table so no need for where 
        const rows = await this._qry(qry)
        const row = rows[0]
        ADB.salt = row.salt
        return ADB.salt
    }//()

    async setAdmin(email, password, emailjsService_id, emailjsTemplate_id, emailjsUser_id, port:number) {
      const salt = await this.getSalt()
      const hashPass = bcrypt.hashSync(password, salt)
     
      const stmt1 =  ADB.db.prepare(`INSERT INTO ADMIN(email, hashPass) VALUES(?,?)`)
      this._run(stmt1, email, hashPass)

      const stmt2 =  ADB.db.prepare(`INSERT INTO CONFIG(emailjsService_id, emailjsTemplate_id, emailjsUser_id, port) VALUES(?,?,?,?)`)
      this._run(stmt2, emailjsService_id, emailjsTemplate_id, emailjsUser_id, port)      
    }//()

    updateConfig(emailjsService_id, emailjsTemplate_id, emailjsUser_id, pathToApp, port) {
        const stmt =  ADB.db.prepare(`UPDATE CONFIG SET emailjsService_id=?, emailjsTemplate_id=?, emailjsUser_id=?, pathToApp=?, port=?`)// single row in table so no need for where
        this._run(stmt, emailjsService_id, emailjsTemplate_id, emailjsUser_id, pathToApp, port)
    }

    async getConfig() {
        const qry =  ADB.db.prepare(`SELECT * FROM CONFIG`)
        const rows = await this._qry(qry)
        const row = rows[0]
        return row
    }
    
    setAppPath(pathToApp) {
        const stmt =  ADB.db.prepare(`UPDATE CONFIG SET pathToApp=? `)
        this._run(stmt, pathToApp)
    }

    async getAppPath() {
        const config = await this.getConfig()
        return config.pathToApp
    }

    async getPort() {
        const qry =  ADB.db.prepare('SELECT * FROM CONFIG') 
        const rows = await this._qry(qry)
        const row = rows[0]
        return row.port
    }

    getVcodeAdmin() {
        let vcode = Math.floor(1000 + Math.random() * 9000);

        const stmt =  ADB.db.prepare(`UPDATE ADMIN SET vcode=?`)
        this._run(stmt, vcode )
        return vcode
    }//()
    getVcodeEditor(email) {
        let vcode = Math.floor(1000 + Math.random() * 9000);
 
        const stmt =  ADB.db.prepare(`UPDATE EDITORS SET vcode=? WHERE email=?`)
        this._run(stmt, vcode, email )
        return vcode
    }//()

    async authEditor(email, password) {
        const salt = await this.getSalt()
        const hashPassP = bcrypt.hashSync(password, salt)

        const qry =  ADB.db.prepare('SELECT * FROM EDITORS where email =  ?') 
        const rows = await this._qry(qry, email)
        const row = rows[0]
        const hashPassS = row.hashPass

        return hashPassP == hashPassS
    }//()
    async authAdmin(email, password) {
        const salt = await this.getSalt()
        const hashPassP = bcrypt.hashSync(password, salt)

        const qry =  ADB.db.prepare('SELECT * FROM ADMIN where email =  ?') 
        const rows = await this._qry(qry, email)
        const row = rows[0]
        const hashPassS = row.hashPass

        return hashPassP == hashPassS
    }//()

    /**
     * @param guid You can user ToolBelt's getGUID on browser
     * You can set vcode with the vcode method
     */
    async addEditor(guid, name, email, password) {
        const salt = await this.getSalt()
        const hashPass = bcrypt.hashSync(password, salt)

        const stmt =  ADB.db.prepare(`INSERT INTO EDITORS(guid, name, email, hashPass ) VALUES(?,?, ?,?)`)
        await this._run(stmt, guid, name, email, hashPass )
    }//()

    async getEditors() {
        const qry =  ADB.db.prepare(`SELECT guid, name FROM editors`)
        return await this._qry(qry)
    }

    async deleteEditor(guid) {
        const stmt =  ADB.db.prepare(`DELETE FROM editors WHERE guid=?`)
        await this._run(stmt, guid)
    }

  
    /**
     * this one is used for uptime server monitoring
     * doesn't matter the count result
     **/
    async monitor() {
        const qry =  ADB.db.prepare(`SELECT COUNT(*) AS count FROM ADMIN`)
        const rows = await this._qry(qry)
        return rows[0]
    }

    async resetPasswordAdminIfMatch(email, vcode, password) {
        // is there a row match?
        const qry =  ADB.db.prepare(`SELECT COUNT(*) AS count FROM ADMIN where email=? and vcode=?`)
        const rows = await this._qry(qry, email, vcode)
        const row= rows[0]
        const count = row.count
        if(!(count==0)) throw new Error('mismatch')

        const salt = await this.getSalt()
        const hashPass = bcrypt.hashSync(password, salt)
        const stmt =  ADB.db.prepare(`UPDATE ADMIN SET (hashPass=?, vcode=null) WHERE email=?`)
        this._run(stmt, hashPass, email)
        return 'OK'
    }//()

    async resetPasswordEditorIfMatch(email, vcode, password) {
        // is there a row match?
        const qry =  ADB.db.prepare(`SELECT COUNT(*) AS count FROM EDITORS where email=? and vcode=?`)
        const rows = await this._qry(qry, email, vcode)
        const row= rows[0]
        const count = row.count
        if(!(count==0)) throw new Error('mismatch')

        const salt = await this.getSalt()
        const hashPass = bcrypt.hashSync(password, salt)
        const stmt =  ADB.db.prepare(`UPDATE EDITORS SET (hashPass=?, vcode=null) WHERE email=?`)
        this._run(stmt, hashPass, email)
        return 'OK'
    }//()

}//()

// Auth section //////////////////////////////////////////////////////////////////
export class EditorAuth implements iAuth {
    db:ADB
    constructor(db) {
        this.db = db
    }//()

    async auth(user: string, pswd: string, resp?: any, ctx?: any): Promise<string> {     
        return new Promise( async function (resolve, reject) {
        const ok = await this.db.authEditor(user, pswd)
        if(ok) return resolve('OK')
                
        this.RetErr(resp, 'NO')
        reject('NO')
        })// pro
    }    
    retErr(resp: any, msg: any) {
        console.log(msg)
        const ret:any= {} // new return
        ret.errorLevel = -1
        ret.errorMessage = msg
        resp.json(ret)    
    }//()
}//class

export class AdminAuth implements iAuth {
    db:ADB
    constructor(db) {
        this.db = db
    }//()

    async auth(user: string, pswd: string, resp?: any, ctx?: any): Promise<string> {     
        return new Promise( async function (resolve, reject) {
        const ok = await this.db.authAdmin(user, pswd)
        if(ok) return resolve('OK')        

        this.RetErr(resp, 'NO')
        reject('NO')
        })// pro
    }    
    retErr(resp: any, msg: any) {
        console.log(msg)
        const ret:any= {} // new return
        ret.errorLevel = -1
        ret.errorMessage = msg
        resp.json(ret)    
    }//()
}//class

module.exports = {
   ADB, EditorAuth, AdminAuth
}
