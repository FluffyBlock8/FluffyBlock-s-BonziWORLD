let bot = io("//")
bot.emit('login',{name:'BlocksChat.in (+help)'})
bot.on('reconnected',reconnected)
var reconnected = function(){
    let bot = io("//")
    onbeforeinput.emit('login',{name:'BlocksChat.in | +help'})
    bot.on('talk',function(data){
        var text = data.text
        if(text.startsWith('+help')){
            text = text.slice(1)
            var cmd = text.split(' ')[0]
            var oth = text.slice(cmd.length+1)
            if(Object.keys(commands).includes(cmd)){
                var command = commands[cmd](oth)
                setTimeout(function(){
                    bot.emit('talk',{text:command})
                },100)
            }
        }
    })
    bot.on('reconnected',reconnected)
}
var cool = false;
var sockets = []
var commands = {
    help:function(){
        return "<h2>+help, a fork of b!help.</h2><h3>Commands:</h3>+help, +echo [text], +join [user], +burn, +drunk [text], +clickbait [text], +speed [number], +pitch [number], +mouth [number], +throat [number], +joke, +fact, +triggered, +linux, +pawn, +name [New Name], +resetname, +color [colors], +color2, +stinky, +mock, +youtube (More Commands Coming Soon!)"
    },
    echo(txt){
        if(txt.startsWith('+')){
            return 'hahahaha nice joke lmao hahaha'
        }
        return txt
    },
    join(txt){
        if(cool){
            return "On cooldown!"
        }else{
            if(sockets.length > 50) return "Too much users."
            var sock = io("//")
            sock.emit('login',{name:txt})
            sockets.push(sock)
            cool = true
            setTimeout(function(){
                cool = false
            },5000)
        }
    },
    burn(){
        if(sockets.length==0){
            return 'i have nothing to burn'
        }
        sockets.map(n=>{
            n.disconnect()
        })
        sockets = []
    },
    drunk(txt){
        if(txt.startsWith('+')){
             return 'hahahaha nice joke lmao hahaha'.split('').map(n=>{
                if(Math.random()>0.5) return n.toUpperCase()
                return n
            }).join('')
        }
        return txt.toLowerCase().split('').map(n=>{
            if(Math.random()>0.5) return n.toUpperCase()
            return n
        }).join('')
    },
    mock(txt){
        if(txt.startsWith('+')){
             return 'hahahaha nice joke lmao hahaha'.split('').map(n=>{
                if(Math.random()>0.5) return n.toUpperCase()
                return n
            }).join('')
        }
        return txt.toLowerCase().split('').map(n=>{
            if(Math.random()>0.5) return n.toUpperCase()
            return n
        }).join('')
    },
    stinky(txt){
        bot.emit("command", {list:["asshole",txt]})
    },
    youtube(txt){
        bot.emit("command", {list:["youtube",txt]})
    },
    color(txt){
        bot.emit("command", {list:["color",txt]})
    },
        speed(txt){
        bot.emit("command", {list:["speed",txt]})
    },
        pitch(txt){
        bot.emit("command", {list:["pitch",txt]})
    },
        mouth(txt){
        bot.emit("command", {list:["mouth",txt]})
    },
        throat(txt){
        bot.emit("command", {list:["throat",txt]})
    },
            joke(txt){
        bot.emit("command", {list:["joke",txt]})
    },
            fact(txt){
        bot.emit("command", {list:["fact",txt]})
    },
            triggered(txt){
        bot.emit("command", {list:["triggered",txt]})
    },
            linux(txt){
        bot.emit("command", {list:["linux",txt]})
    },
            pawn(txt){
        bot.emit("command", {list:["pawn",txt]})
    },
                name(txt){
        bot.emit("command", {list:["name",txt]})
    },
                    resetname(txt){
        bot.emit("command", {list:["name","BlocksChat.in (+help)"]})
    },
    color2(txt){
        bot.emit("command", {list:["color"]})
    },
    clickbait(txt){
        return (["omg!",':O','what?','wtf?!'][Math.floor(Math.random()*4)]+' '+txt+' '+["(gone wrong)",'(gone sexual)','(not clickbait!)','(cops called)', '(GET RCKT)'][Math.floor(Math.random()*4)]+'\u{1F631}'.repeat(Math.ceil(Math.random()*5))).toUpperCase()
    } 
}
bot.on('talk',function(data){
    var text = data.text
    if(text.startsWith('+')){
        text = text.slice(1)
        var cmd = text.split(' ')[0]
        var oth = text.slice(cmd.length+1)
        if(Object.keys(commands).includes(cmd)){
            var command = commands[cmd](oth)
            setTimeout(function(){
                bot.emit('talk',{text:command})
            },100)
        }
    }
})
