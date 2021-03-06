const express = require('express');
const router = express.Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Exchange = require('../models/exchange');

const config = require('../config/database');

//Register
router.post('/register', (req, res, next) => {
    let newUser = new User({
        name : req.body.name,
        email : req.body.email,
        username : req.body.username,
        password : req.body.password,
        wallet: {
            PLN : req.body.wallet.PLN,
            USD : req.body.wallet.USD,
            EUR : req.body.wallet.EUR,
            CHF : req.body.wallet.CHF,
            RUB : req.body.wallet.RUB,
            CZK : req.body.wallet.CZK,
            GBP : req.body.wallet.GBP
        }
    });

    User.getUserByUsername(newUser.username, (err, user) => {
        if (err) throw err;
        if (user){
            return res.json({'success': false, msg: 'User with username: ' + newUser.username + ' already exists, please use a different username'});
        } else {
            User.addUser(newUser, (err, user) => {
                console.log(Date.now(), newUser);
                if (err) {
                    res.json({success : false,  msg: "Failed to register user"})
                } else {
                    res.json({success : true,  msg: "User: " + newUser.username + " successfully registered"})
                }
            });
        }
    });
    
});

//Authentication when Logging in
router.post('/authenticate', (req, res) => {
    const username = req.body.username;
    const pass = req.body.password;

    User.getUserByUsername(username, (err, user) => {
        if (err) throw err;
        if (!user){
            return res.json({'success': false, msg: 'Username not found'});
        }

        if (pass === undefined){
            return res.json({'success': false, msg: 'Please fill in the password'});
        }

        User.checkPassword(pass, user.password, (err, isMatch) => {
            if (err) throw err;

            if (!isMatch){
                return res.json({'success': false, msg: 'Wrong password'});
            } else {
                Exchange.getExchange((err, exchData)=> {
                    if (err) throw err;
                    if (!exchData){
                        return res.json({'success': false, msg: 'Exchange Data not found in DB'});
                    } else {
                        const token = jwt.sign({data: user}, config.secret, {
                            expiresIn: '7d' //1 week
                        });
                        res.json({  //sending values to client app
                            'success': true, 
                            token: 'JWT ' + token,
                            user: {     //creating new object for Front end, not to send a password
                            id: user._id,   
                            name: user.name,
                            username: user.username,
                            email: user.email,
                            wallet: user.wallet
                            }
                        });
                    }
                });
            }
        });
    });
});

// Profile, protected
router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
        user: req.user
    })
});



// router.get('/login', (req, res) => {
//     res.send('Login GET here')
// });

// router.post('/login', (req, res) => {
//     res.send('Login PUT here')
// });


module.exports = router;