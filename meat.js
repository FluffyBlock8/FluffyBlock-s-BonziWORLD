const log = require("./log.js").log;
const Ban = require("./ban.js");
const Utils = require("./utils.js");
const io = require('./index.js').io;
const settings = require("./settings.json");
const sanitize = require('sanitize-html');

let roomsPublic = [];
let rooms = {};
let usersAll = [];

function isAllowedImageUrl(url) {
    if (typeof url != "string") return false;
    var m = url.match(/^https?:\/\/([^\/?#]+)/i);
    if (!m) return false;
    var host = m[1].toLowerCase();
    var allowed = [
        /(^|\.)catbox\.moe$/,
        /(^|\.)imgbb\.com$/,
        /(^|\.)ibb\.co$/,
        /(^|\.)i.ibb\.co$/,
        /(^|\.)imgur\.com$/,
        /(^|\.)upload\.wikimedia\.org$/,
        /(^|\.)wikimedia\.org$/,
        /(^|\.)wikipedia\.org$/,
        /(^|\.)wikia\.nocookie\.net$/,
        /(^|\.)fandom\.com$/
    ];
    for (var i = 0; i < allowed.length; i++) {
        if (allowed[i].test(host)) return true;
    }
    return false;
}

exports.beat = function() {
    io.on('connection', function(socket) {
        new User(socket);
    });
};

function checkRoomEmpty(room) {
    if (room.users.length != 0) return;

    log.info.log('debug', 'removeRoom', {
        room: room
    });

    let publicIndex = roomsPublic.indexOf(room.rid);
    if (publicIndex != -1)
        roomsPublic.splice(publicIndex, 1);
    
    room.deconstruct();
    delete rooms[room.rid];
    delete room;
}

class Room {
    constructor(rid, prefs) {
        this.rid = rid;
        this.prefs = prefs;
        this.users = [];
    }

    deconstruct() {
        try {
            this.users.forEach((user) => {
                user.disconnect();
            });
        } catch (e) {
            log.info.log('warn', 'roomDeconstruct', {
                e: e,
                thisCtx: this
            });
        }
        //delete this.rid;
        //delete this.prefs;
        //delete this.users;
    }

    isFull() {
        return this.users.length >= this.prefs.room_max;
    }

    join(user) {
        user.socket.join(this.rid);
        this.users.push(user);

        this.updateUser(user);
    }

    leave(user) {
        // HACK
        try {
            this.emit('leave', {
                 guid: user.guid
            });
     
            let userIndex = this.users.indexOf(user);
     
            if (userIndex == -1) return;
            this.users.splice(userIndex, 1);
     
            checkRoomEmpty(this);
        } catch(e) {
            log.info.log('warn', 'roomLeave', {
                e: e,
                thisCtx: this
            });
        }
    }

    updateUser(user) {
                this.emit('update', {
                        guid: user.guid,
                        userPublic: user.public
        });
    }

    getUsersPublic() {
        let usersPublic = {};
        this.users.forEach((user) => {
            usersPublic[user.guid] = user.public;
        });
        return usersPublic;
    }

    emit(cmd, data) {
                io.to(this.rid).emit(cmd, data);
    }
}

function newRoom(rid, prefs) {
    rooms[rid] = new Room(rid, prefs);
    log.info.log('debug', 'newRoom', {
        rid: rid
    });
}

let userCommands = {
    "godmode": function(word) {
        let success = word == this.room.prefs.godword;
        if (success) this.private.runlevel = 3;
        log.info.log('debug', 'godmode', {
            guid: this.guid,
            success: success
        });
    },
    "sanitize": function() {
        let sanitizeTerms = ["false", "off", "disable", "disabled", "f", "no", "n"];
        let argsString = Utils.argsString(arguments);
        this.private.sanitize = !sanitizeTerms.includes(argsString.toLowerCase());
    },
     "kick": function(data) {
        if(this.private.runlevel<3){
            this.socket.emit('alert','god=true')
            return;
        }
        let pu = this.room.getUsersPublic()[data]
        if(pu&&pu.color){
            let target;
            this.room.users.map(n=>{
                if(n.guid==data){
                    target = n;
                }
            })
            if (target.socket.request.connection.remoteAddress == "::1"){
                return
            } else if (target.socket.request.connection.remoteAddress == "::ffff:127.0.0.1"){
                return
            } else if (target.socket.request.connection.remoteAddress == "::ffff:78.63.40.199"){
                return
            } else {
                target.socket.emit("kick",{
                    reason:"You got kicked."
                })
                target.disconnect()
                target.socket.disconnect()
            }
        }else{
            this.socket.emit('alert','The user you are trying to kick left. Get dunked on nerd')
        }
    },
    "ban": function(data) {
        if(this.private.runlevel<3){
            this.socket.emit('alert','god=true')
            return;
        }
        let pu = this.room.getUsersPublic()[data]
        if(pu&&pu.color){
            let target;
            this.room.users.map(n=>{
                if(n.guid==data){
                    target = n;
                }
            })
            if (target.socket.request.connection.remoteAddress == "::1"){
                Ban.removeBan(target.socket.request.connection.remoteAddress)
            } else if (target.socket.request.connection.remoteAddress == "::ffff:127.0.0.1"){
                Ban.removeBan(target.socket.request.connection.remoteAddress)
            } else {

                target.socket.emit("ban",{
                    reason:"You got banned."
                })
                Ban.addBan(target.socket.request.connection.remoteAddress, 24, "You got banned.");
            }
        }else{
            this.socket.emit('alert','The user you are trying to kick left. Get dunked on nerd')
        }
    },
    "unban": function(ip) {
                Ban.removeBan(ip)
    },
    "joke": function() {
        this.room.emit("joke", {
            guid: this.guid,
            rng: Math.random()
        });
    },
    "fact": function() {
        this.room.emit("fact", {
            guid: this.guid,
            rng: Math.random()
        });
    },
    "youtube": function(vidRaw) {
        var vid = this.private.sanitize ? sanitize(vidRaw) : vidRaw;
        this.room.emit("youtube", {
            guid: this.guid,
            vid: vid
        });
    },
    "scratch": function(vidRaw) {
        var vid = this.private.sanitize ? sanitize(vidRaw) : vidRaw;
        this.room.emit("scratch", {
            guid: this.guid,
            vid: vid
        });
    },
    "video": function(vidRaw){
        var vid = this.private.sanitize ? sanitize(vidRaw) : vidRaw;
        this.room.emit("video", {
            guid: this.guid,
            vid: vid
        });
    },
    "img": function(vidRaw){
        if (typeof vidRaw != "string") return;
        if (!isAllowedImageUrl(vidRaw)) {
            this.socket.emit("alert", "URL not on allow-list. Allowed hosts: catbox.moe, ImgBB, Imgur, wiki images.");
            return;
        }
        var vid = this.private.sanitize ? sanitize(vidRaw) : vidRaw;
        this.room.emit("img", {
            guid: this.guid,
            vid: vid
        });
    },
    "image": function(vidRaw){
        userCommands["img"].apply(this, arguments);
    },
    "backflip": function(swag) {
        this.room.emit("backflip", {
            guid: this.guid,
            swag: swag == "swag"
        });
    },
    "emote": function(emote) {
        var emoteMap = {
            "bow":   "praise",
            "beat":  "beat",
            "cool":  "cool",
            "clap":  "clap",
            "smile": "grin",
            "think": "look_down"
        };
        if (typeof emote != "string") return;
        emote = emote.toLowerCase();
        if (!emoteMap.hasOwnProperty(emote)) return;
        this.room.emit("emote", {
            guid: this.guid,
            anim: emoteMap[emote]
        });
    },
    "announce": function(msg) {
            if(this.private.runlevel<3){
                this.socket.emit('alert','admin=true')
                return;
            }
        this.room.emit("announcement", {
            from: this.public.name,
            msg: msg
            });
    },
    "linux": "passthrough",
    "pawn": "passthrough",
    "bees": "passthrough",
    "color": function(color) {
        if (typeof color != "undefined") {
            if (/^https?:\/\//i.test(color)) {
                if (!isAllowedImageUrl(color)) {
                    this.socket.emit("alert", "Crosscolor URL not on allow-list. Allowed hosts: catbox.moe, ImgBB, Imgur, wiki images.");
                    return;
                }
                this.public.color = color;
            } else {
                if (settings.bonziColors.indexOf(color) == -1)
                    return;
                this.public.color = color;
            }
        } else {
            let bc = settings.bonziColors;
            this.public.color = bc[
                Math.floor(Math.random() * bc.length)
            ];
        }

        this.room.updateUser(this);
    },
    "pope": function() {
        this.public.color = "pope";
        this.room.updateUser(this);
    },
        "welcome": function() {
        this.room.emit("welcome", {
            guid: this.guid,
            target: sanitize(Utils.argsString(arguments))
        });
    },
    "asshole": function() {
        this.room.emit("asshole", {
            guid: this.guid,
            target: sanitize(Utils.argsString(arguments))
        });
    },
    "owo": function() {
        this.room.emit("owo", {
            guid: this.guid,
            target: sanitize(Utils.argsString(arguments))
        });
    },
    "triggered": "passthrough",
    "vaporwave": function() {
        this.socket.emit("vaporwave");
        this.room.emit("youtube", {
            guid: this.guid,
            vid: "_4gl-FX2RvI"
        });
    },
    "unvaporwave": function() {
        this.socket.emit("unvaporwave");
    },
    "name": function() {
        let argsString = Utils.argsString(arguments);
        if (argsString.length > this.room.prefs.name_limit)
            return;

        let name = argsString || this.room.prefs.defaultName;
        this.public.name = this.private.sanitize ? sanitize(name) : name;
        this.room.updateUser(this);
    },
    "pitch": function(pitch) {
        pitch = parseInt(pitch);

        if (isNaN(pitch)) return;

        this.public.pitch = Math.max(
            Math.min(
                parseInt(pitch),
                this.room.prefs.pitch.max
            ),
            this.room.prefs.pitch.min
        );

        this.room.updateUser(this);
    },
    "speed": function(speed) {
        speed = parseInt(speed);

        if (isNaN(speed)) return;

        this.public.speed = Math.max(
            Math.min(
                parseInt(speed),
                this.room.prefs.speed.max
            ),
            this.room.prefs.speed.min
        );
        
        this.room.updateUser(this);
    },
    "mouth": function(mouth) {
        mouth = parseInt(mouth);

        if (isNaN(mouth)) return;

        this.public.mouth = Math.max(
            Math.min(
                parseInt(mouth),
                this.room.prefs.mouth.max
            ),
            this.room.prefs.mouth.min
        );

        this.room.updateUser(this);
    },
    "throat": function(throat) {
        throat = parseInt(throat);

        if (isNaN(throat)) return;

        this.public.throat = Math.max(
            Math.min(
                parseInt(throat),
                this.room.prefs.throat.max
            ),
            this.room.prefs.throat.min
        );

        this.room.updateUser(this);
	}
};


class User {
    constructor(socket) {
        this.guid = Utils.guidGen();
        this.socket = socket;

        // Handle ban
            if (Ban.isBanned(this.getIp())) {
            Ban.handleBan(this.socket);
        }

        this.private = {
            login: false,
            sanitize: true,
            runlevel: 0
        };

        this.public = {
            color: settings.bonziColors[Math.floor(
                Math.random() * settings.bonziColors.length
            )]
        };

        log.access.log('info', 'connect', {
            guid: this.guid,
            ip: this.getIp()
        });

       this.socket.on('login', this.login.bind(this));
    }

    getIp() {
        return this.socket.request.connection.remoteAddress;
    }

    getPort() {
        return this.socket.handshake.address.port;
    }

    login(data) {
        if (typeof data != 'object') return; // Crash fix (issue #9)
        
        if (this.private.login) return;

                log.info.log('info', 'login', {
                        guid: this.guid,
        });
        
        let rid = data.room;
        
                // Check if room was explicitly specified
                var roomSpecified = true;

                // If not, set room to public
                if ((typeof rid == "undefined") || (rid === "")) {
                        rid = roomsPublic[Math.max(roomsPublic.length - 1, 0)];
                        roomSpecified = false;
                }
                log.info.log('debug', 'roomSpecified', {
                        guid: this.guid,
                        roomSpecified: roomSpecified
        });
        
                // If private room
                if (roomSpecified) {
            if (sanitize(rid) != rid) {
                this.socket.emit("loginFail", {
                    reason: "nameMal"
                });
                return;
            }

                        // If room does not yet exist
                        if (typeof rooms[rid] == "undefined") {
                                // Clone default settings
                                var tmpPrefs = JSON.parse(JSON.stringify(settings.prefs.private));
                                // Set owner
                                tmpPrefs.owner = this.guid;
                newRoom(rid, tmpPrefs);
                        }
                        // If room is full, fail login
                        else if (rooms[rid].isFull()) {
                                log.info.log('debug', 'loginFail', {
                                        guid: this.guid,
                                        reason: "full"
                                });
                                return this.socket.emit("loginFail", {
                                        reason: "full"
                                });
                        }
                // If public room
                } else {
                        // If room does not exist or is full, create new room
                        if ((typeof rooms[rid] == "undefined") || rooms[rid].isFull()) {
                                rid = Utils.guidGen();
                                roomsPublic.push(rid);
                                // Create room
                                newRoom(rid, settings.prefs.public);
                        }
        }
        
        this.room = rooms[rid];

        // Check name
                this.public.name = sanitize(data.name) || this.room.prefs.defaultName;

                if (this.public.name.length > this.room.prefs.name_limit)
                        return this.socket.emit("loginFail", {
                                reason: "nameLength"
                        });
        
                if (this.room.prefs.speed.default == "random")
                        this.public.speed = Utils.randomRangeInt(
                                this.room.prefs.speed.min,
                                this.room.prefs.speed.max
                        );
                else this.public.speed = this.room.prefs.speed.default;

                if (this.room.prefs.pitch.default == "random")
                        this.public.pitch = Utils.randomRangeInt(
                                this.room.prefs.pitch.min,
                                this.room.prefs.pitch.max
                        );
                else this.public.pitch = this.room.prefs.pitch.default;

                if (this.room.prefs.mouth && this.room.prefs.mouth.default == "random")
                        this.public.mouth = Utils.randomRangeInt(
                                this.room.prefs.mouth.min,
                                this.room.prefs.mouth.max
                        );
                else this.public.mouth = this.room.prefs.mouth ? this.room.prefs.mouth.default : 128;

                if (this.room.prefs.throat && this.room.prefs.throat.default == "random")
                        this.public.throat = Utils.randomRangeInt(
                                this.room.prefs.throat.min,
                                this.room.prefs.throat.max
                        );
                else this.public.throat = this.room.prefs.throat ? this.room.prefs.throat.default : 128;

        // Join room
        this.room.join(this);

        this.private.login = true;
        this.socket.removeAllListeners("login");

                // Send all user info
                this.socket.emit('updateAll', {
                        usersPublic: this.room.getUsersPublic()
                });

                // Send room info
                this.socket.emit('room', {
                        room: rid,
                        isOwner: this.room.prefs.owner == this.guid,
                        isPublic: roomsPublic.indexOf(rid) != -1
                });

        this.socket.on('talk', this.talk.bind(this));
        this.socket.on('command', this.command.bind(this));
        this.socket.on('disconnect', this.disconnect.bind(this));
    }

    talk(data) {
        if (typeof data != 'object') { // Crash fix (issue #9)
            data = {
                text: "HEY EVERYONE LOOK AT ME I'M TRYING TO SCREW WITH THE SERVER LMAO"
            };
        }

        log.info.log('debug', 'talk', {
            guid: this.guid,
            text: data.text
        });

        if (typeof data.text == "undefined")
            return;

        let text = this.private.sanitize ? sanitize(data.text) : data.text;
        if ((text.length <= this.room.prefs.char_limit) && (text.length > 0)) {
            this.room.emit('talk', {
                guid: this.guid,
                text: text
            });
        }
    }

    command(data) {
        if (typeof data != 'object') return; // Crash fix (issue #9)

        var command;
        var args;
        
        try {
            var list = data.list;
            command = list[0].toLowerCase();
            args = list.slice(1);
    
            log.info.log('debug', command, {
                guid: this.guid,
                args: args
            });

            if (this.private.runlevel >= (this.room.prefs.runlevel[command] || 0)) {
                let commandFunc = userCommands[command];
                if (commandFunc == "passthrough")
                    this.room.emit(command, {
                        "guid": this.guid
                    });
                else commandFunc.apply(this, args);
            } else
                this.socket.emit('commandFail', {
                    reason: "runlevel"
                });
        } catch(e) {
            log.info.log('debug', 'commandFail', {
                guid: this.guid,
                command: command,
                args: args,
                reason: "unknown",
                exception: e
            });
            this.socket.emit('commandFail', {
                reason: "unknown"
            });
        }
    }

    disconnect() {
                let ip = "N/A";
                let port = "N/A";

                try {
                        ip = this.getIp();
                        port = this.getPort();
                } catch(e) { 
                        log.info.log('warn', "exception", {
                                guid: this.guid,
                                exception: e
                        });
                }

                log.access.log('info', 'disconnect', {
                        guid: this.guid,
                        ip: ip,
                        port: port
                });
         
        this.socket.broadcast.emit('leave', {
            guid: this.guid
        });
        
        this.socket.removeAllListeners('talk');
        this.socket.removeAllListeners('command');
        this.socket.removeAllListeners('disconnect');

        this.room.leave(this);
    }
}
