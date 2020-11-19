var mongoose = require('mongoose');
const crypto = require('crypto')
//链接数据库
mongoose.connect('mongodb://localhost/accounts');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

//链接后的回调
db.once('open', function () {
    console.log('mongoose opened!');

    var user = new mongoose.Schema({
        name: {type: String},
        password: {type: String}
    });

    var history = new mongoose.Schema({
        recipientUser: {type: String},
        sendUser: {type: String},
        messageText: {type: String},
        sendDateTime: {type: String}
    });

//拿到model后可以对表进行操作
    var User = mongoose.model('accounts', user);
    var History = mongoose.model('historyList', history);

//对外提供查询方法
    exports.checkUser = function (user, successCal, errorCal) {
        User.findOne({
            name: user.name,
            password: user.password
        }, function (err, doc) {
            callBackFun(doc, successCal, errorCal);
        });
    };

    exports.checkUserByKey = function (user, successCal, errorCal) {
        User.findOne({
            name: user.name,
            //password: user.password
        }, function (err, doc) {
            if (doc) {
                var publicKey = "-----BEGIN RSA PUBLIC KEY-----\n" +
                    user.name +
                    "\n-----END RSA PUBLIC KEY-----";
                var privateKey = "-----BEGIN RSA PRIVATE KEY-----\n" +
                    user.password +
                    "\n-----END RSA PRIVATE KEY-----";
                console.log("pubKey:" + publicKey);
                console.log("privKey:" + privateKey);
                var checkData = uuid(6, 16);
                console.log("Plaintext:" + checkData);
                const crypto_encrypted = crypto.publicEncrypt(publicKey, Buffer.from(checkData)).toString("base64");
                console.log("公钥加密:", crypto_encrypted);
                // 解密
                try{
                    var crypto_decrypted = crypto.privateDecrypt({
                            key: privateKey,
                            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
                        },
                        Buffer.from(crypto_encrypted, "base64")
                    ).toString("utf8");
                    console.log("私钥解密:", crypto_decrypted);
                    if (checkData == crypto_decrypted) {
                    // if (1) {
                        callBackFun(doc, successCal, errorCal);
                    } else {
                        callBackFun(0, successCal, errorCal);
                    }
                }catch(error){
                    callBackFun(0, successCal, errorCal);
                }
            }else{
                callBackFun(doc, successCal, errorCal);
            }
            // callBackFun(doc, successCal, errorCal);
        });
    };


    exports.userList = function (successCal, errorCal) {
        User.find({}, {name: 1, password: 1, _id: 0}, function (err, doc) {
            callBackFun(doc, successCal, errorCal);
        });
    };

    exports.setMessageHistory = function (history, successCal, errorCal) {
        var his = new History(history);
        console.log("setMessageHistory:::" + history.recipientUser + "--" + history.sendUser + "--" + history.messageText + "--" + history.sendDateTime);
        his.save(function (err, doc) {
            callBackFun(doc, successCal, errorCal);
        });
    };

    exports.queryUserHistoryMess = function (user, successCal, errorCal) {
        console.log('queryUserHistoryMess:' + user.name);
        History.find({recipientUser: user.name}, function (err, doc) {
            console.dir('doc : ' + doc);
            console.dir('err : ' + err);
            callBackFun(doc, successCal, errorCal);
        });
    };

    exports.delMessageHistory = function (user, successCal, errorCal) {
        console.log('delMessageHistory:' + user.name);
        History.remove({sendUser: user.name}, function (err, doc) {
            callBackFun(doc, successCal, errorCal);
        });
    };

    exports.addUser = function (user) {
        var lisi = new User({
            name: user.name,
            password: user.password
        });
        lisi.save(function (err, doc) {
            callBackFun(doc);
        });
    };

});

function callBackFun(doc, successCal, errorCal) {
    if (doc) {
        console.dir('doc : ' + doc);
        successCal && successCal(doc);
    } else {
        errorCal && errorCal();
    }
};

function uuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [],
        i;
    radix = radix || chars.length;

    if (len) {
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        var r;

        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}
