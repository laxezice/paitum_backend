const express = require("express");
const router = express.Router();
const firebase = require("./firenaseInit");
const firestore = firebase.firestore();
router.post("/register", async function (req, res) {
    try {
        let users = await firestore.collection("users")
            .where("username","==",req.body.username)
            .get();
        users = users.docs.map(doc => {return {id:doc.id, ...doc.data()}});
        if(users.length > 0){
            return res.send({
                status: 400,
                message: "username already used",
            });
        }
        await firestore.collection("users").add({
            ...req.body,
            following:[],
            follower: [],
            followingRestaurant: [],
            coupon: [],
            coin: 0
        });
        return res.send({
            status: 200,
            message: "created",
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            message: "server error",
        });
    }
});

router.post("/login", async function (req, res) {
    try {
        let users = await firestore.collection("users")
            .where("username","==",req.body.username)
            .where("password", "==", req.body.password)
            .get();
        users = users.docs.map(doc => {return {id:doc.id, ...doc.data()}});
        if(users.length === 0){
            return res.send({
                status: 404,
                message: "wrong username or password",
            });
        }
        return res.send({
            status: 200,
            message: "success",
            user: users[0]
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            message: "server error",
        });
    }
});

router.put("/follow", async function (req, res) {
    try {
        let mainRef = firestore.collection("users").doc(req.body.main);
        let subRef = firestore.collection("users").doc(req.body.sub);
        let mainUser = await mainRef.get();
        mainUser = mainUser.data();
        let subUser = await subRef.get();
        subUser = subUser.data();
        if (mainUser.following.indexOf(req.body.sub) === -1 && subUser.follower.indexOf(req.body.main) === -1){
            await mainRef.update({
                following: [...mainUser.following, req.body.sub]
            });
            await subRef.update({
                follower: [...subUser.follower, req.body.main]
            });
        } else {
            mainUser.following.splice(mainUser.following.indexOf(req.body.sub), 1);
            subUser.follower.splice(subUser.follower.indexOf(req.body.main), 1);
            await mainRef.update({
                following:  mainUser.following
            });
            await subRef.update({
                follower:  subUser.follower
            });
        }
        return res.send({
            status: 200,
            message: "success",
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            message: "server error",
        });
    }
});

router.get("/profile/:userId", async function (req, res) {
    try {
        let user = await firestore.collection("users").doc(req.params.userId).get();
        user = user.data();
        return res.send({
            status: 200,
            message: "success",
            user: user
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            message: "server error",
        });
    }
});

router.get("/all", async function (req, res) {
    try {
        let users = await firestore.collection("users").get();
        users = users.docs.map(doc => {return {id:doc.id, ...doc.data()}});
        return res.status(200).send({
            status: 200,
            message: "success",
            users: users
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            message: "server error",
        });
    }
});


module.exports = router;
