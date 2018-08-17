#!/usr/bin/env node

declare var require: any
declare var process: any
declare var console: Console
declare var __dirname: any

const AdmZip = require('adm-zip')
const commandLineArgs = require('command-line-args')

import { Ver, MBake, Scrape } from './lib/Base'

const clear = require("cli-clear")
clear()

// imports done /////////////////////////////////////////////
const cwd:string = process.cwd()

function version() {
   let b = new Ver()
   console.log()
   console.log('Your node is '+ process.version)
   console.log(b.ver()) // tsc
   console.log('from '+ __dirname)
   console.log('usage: mbake .')
   console.log(' or mbake any_dir to make(bake) a declarative low code(put) app recursively')
   console.log(' to process RIOT _tag.pug tags, and also Pug : mbake -t .')
   console.log(' to process dat_i items to items.json, and also Pug mbake -i .')
   console.log()
   console.log(' ----------------------------------------------------------------')
   console.log(' for a starter declarative web app CRUD/Pug app: mbake -c')
   console.log(' for a starter SPA/PhoneGap: mbake -s')
   console.log(' for a starter admin|build/Meta cloud service: mbake -a')

   console.log(' for a FullPage site: mbake -f')
   console.log(' for an example blog|RIOT/Pug: mbake -b')
   console.log(' Full docs: http://doc.MetaBake.org/mbake')
   console.log()

   //process.exit()
}

// args: //////////////////////////////////////////////////////////////////////////////////////////////////////
const optionDefinitions = [
   { name: 'mbake', defaultOption: true},
   { name: 'admin', alias: 'a', type: Boolean },
   { name: 'spa', alias: 's', type: Boolean },
   { name: 'fullPage', alias: 'f', type: Boolean },
   { name: 'crud', alias: 'c', type: Boolean },
   { name: 'items', alias: 'i', type: Boolean },
   { name: 'tag', alias: 't', type: Boolean },
   { name: 'blog', alias: 'b', type: Boolean }

]
const argsParsed = commandLineArgs(optionDefinitions)
let arg:string = argsParsed.mbake

console.log()

// unzip: ////////////////////////////////////////////////////////////////////////////////////////////
function unzipA() {
   let src:string =__dirname+ '/autoEG.zip'
   let zip = new AdmZip(src)
   zip.extractAllTo(cwd , /*overwrite*/true)
   console.log('extracted an starter admin|build Meta webapp')
   process.exit()
}
function unzipS() {
   let src:string =__dirname+ '/SPA.zip'
   let zip = new AdmZip(src)
   zip.extractAllTo(cwd , /*overwrite*/true)
   console.log('extracted an starter SPA|PhoneGap app')
   process.exit()
}
function unzipC() {
   let src:string =__dirname+ '/CRUDA.zip'
   let zip = new AdmZip(src)
   zip.extractAllTo(cwd , /*overwrite*/true)
   console.log('extracted an example CRUD and Auth app')
   process.exit()
}
function unzipB() {
   let src:string =__dirname+ '/linkBlog.zip'
   let zip = new AdmZip(src)
   zip.extractAllTo(cwd , /*overwrite*/true)
   console.log('extracted an example blog app')
   process.exit()
}
function unzipF() {
   let src:string =__dirname+ '/fullPage.zip'
   let zip = new AdmZip(src)
   zip.extractAllTo(cwd , /*overwrite*/true)
   console.log('extracted an fullpage site starter')
   process.exit()
}


// get folder to be processed: ///////////////////////////////////////////////////////////////////////////////////////////////////////
if(arg) {
   arg = Ver.slash(arg)
   if(arg.startsWith('/'))  {
      //do nothing, full path is arg
   } else if (arg.startsWith('..')) { // few  cases to test
      arg = arg.substring(2)
      let d = cwd
      d = Ver.slash(d)
      // find offset
      let n = d.lastIndexOf('/')
      d = d.substring(0,n)
      arg = d + arg
   } else if (arg.startsWith('.')) {//cur

      arg = cwd //test ./dd

   } else  { // just plain, dir passed
      arg = cwd + '/' + arg
   }
}


// pug: ////////////////////////////////////////////////////////////////////////////////////////////////
function bake(arg) {
   new MBake().bake(arg)
   process.exit()
}


// itemize : /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function itemize(arg) {
   new MBake().itemizeNBake(arg)
   process.exit()
}


// tag:  ///////////////////////////////////////////////////////////////////////////////////////////////
function tag(arg) {
   new MBake().tag(arg)
}

// start: /////////////////////////////////////////////////////////////////////////////////////
if(argsParsed.tag) {
   try {
      tag(arg)
      bake(arg)
   } catch(err) {
      console.log(err)
   }
}
else if(argsParsed.items)
   itemize(arg)
else if(argsParsed.admin)
   unzipA()
else if(argsParsed.fullPage)
   unzipF()
else if(argsParsed.crud)
   unzipC()
else if(argsParsed.blog)
   unzipB()
else if(argsParsed.spa)
   unzipS()
else if(!arg)
   version()
else
   bake(arg)
