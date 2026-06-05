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
function sendMsg(msg) {
    setTimeout(() => {
        bot.emit("talk", { text: msg });
    }, 1000);
}
function getWeather(location) {
    const apiKey = "dcc6b2a3fa3d4fe58d9193316232905";
    fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) return sendMsg("Couldn't find weather info for that location.");
            const w = data.current;
            sendMsg(`🌦 Weather in ${data.location.name}, ${data.location.country}\nCondition: ${w.condition.text}\nTemperature: ${w.temp_c}°C\nHumidity: ${w.humidity}%\nWind: ${w.wind_kph} km/h`);
        })
        .catch(() => sendMsg("Weather service unavailable right now."));
}
setTimeout(() => { bot.emit("command", { list: ["speed", "62"] }) }, 3000);
setTimeout(() => { bot.emit("command", { list: ["pitch", "54"] }) }, 3000);
setTimeout(() => { bot.emit("command", { list: ["mouth", "184"] }) }, 3000);
setTimeout(() => { bot.emit("command", { list: ["throat", "204"] }) }, 3000);
setTimeout(() => { sendMsg(`BlocksChat.in is online. Type +help to see commands.`); }, 5000);

var cool = false;
var sockets = []
var commands = {
    help:function(){
        return "<h2>+help, a fork of b!help.</h2><h3>Commands:</h3>+help, +echo [text], +join [user], +burn, +drunk [text], +clickbait [text], +speed [number], +pitch [number], +mouth [number], +throat [number], +joke, +fact, +triggered, +linux, +pawn, +bees, +name [NEWNAME], +resetname, +color [colors], +color2, +stinky [NAME], +mock [text], +youtube [URL], +weather [LOCATION], +roominfo, +tts [TEXT], +image [URL], +video [URL], +suck [NAME], +hey [NAME], +voice [VOICE], +france (More Commands Coming Soon!)"
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
            joke(){
        bot.emit("command", {list:["joke"]})
    },
            fact(){
        bot.emit("command", {list:["fact"]})
    },
            triggered(){
        bot.emit("command", {list:["triggered"]})
    },
            linux(){
        bot.emit("command", {list:["linux"]})
    },
            pawn(){
        bot.emit("command", {list:["pawn"]})
    },
                name(txt){
        bot.emit("command", {list:["name",txt]})
    },
                    image(txt){
        bot.emit("command", {list:["image",txt]})
    },
                    video(txt){
        bot.emit("command", {list:["video",txt]})
    },
                        bees(){
        bot.emit("command", {list:["bees"]})
    },
                            suck(txt){
        bot.emit("command", {list:["suck",txt]})
    },
                hey(txt){
        bot.emit("command", {list:["heyname",txt]})
    },
                    resetname(txt){
        bot.emit("command", {list:["name","BlocksChat.in (+help)"]})
    },
                france(){
        bot.emit("command", {list:["france"]})
    },
    color2(txt){
        bot.emit("command", {list:["color"]})
    },
            voice(txt){
        bot.emit("command", {list:["voice",txt]})
    },
    weather(txt){
        const location = txt;
        return getWeather(location);
    },
    tts(txt){
        const ttsText = txt;
        const audio = new Audio(`https://tts.cyzon.us/tts?text=${encodeURIComponent(ttsText)}`);
        return audio.play();
    },
    roominfo(){
        return sendMsg("Users in room: " + window.usersAmt);
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
