const fs=require('node:fs');fs.mkdirSync('dist',{recursive:true});for(const file of ['index.html','style.css','game.js'])fs.copyFileSync(file,'dist/'+file);console.log('Built static site in dist/');
