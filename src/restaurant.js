const express = require("express");
const router = express.Router();
const firebase = require("./firenaseInit");
const firestore = firebase.firestore();
router.post("/create", async function (req, res) {
    try {
        await firestore.collection("restaurants").add({
            ...req.body,
            follower: [],
            coupon:[],
            promotion:[],
            review: [],
            coin: 1000,
            owner: req.body.userId
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

router.put("/follow", async function (req, res) {
    try {
        let userRef = firestore.collection("users").doc(req.body.user);
        let resRef = firestore.collection("restaurants").doc(req.body.restaurant);
        let user = await userRef.get();
        user = user.data();
        let restaurant = await resRef.get();
        restaurant = restaurant.data();
        if (user.followingRestaurant.indexOf(req.body.restaurant) === -1 && restaurant.follower.indexOf(req.body.user) === -1){
            await userRef.update({
                followingRestaurant: [...user.followingRestaurant, req.body.restaurant]
            });
            await resRef.update({
                follower: [...restaurant.follower, req.body.user]
            });
        } else {
            user.followingRestaurant.splice(user.following.indexOf(req.body.restaurant), 1);
            restaurant.follower.splice(restaurant.follower.indexOf(req.body.user), 1);
            await userRef.update({
                followingRestaurant: user.followingRestaurant
            });
            await resRef.update({
                follower: restaurant.follower
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

router.post("/promotion/:restaurantId", async function (req, res) {
    try {
        let resRef = firestore.collection("restaurants").doc(req.params.restaurantId);
        let restaurant = await resRef.get();
        restaurant = restaurant.data();
        await resRef.update({
            promotion : [...restaurant.promotion, req.body]
        });
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

router.post("/coupon/:restaurantId", async function (req, res) {
    try {
        let resRef = firestore.collection("restaurants").doc(req.params.restaurantId);
        let restaurant = await resRef.get();
        restaurant = restaurant.data();
        if(!restaurant.coupon.some((c) => c.name === req.body.name)){
            await resRef.update({
                coupon : [...restaurant.coupon, req.body]
            });
            return res.send({
                status: 200,
                message: "success",
            });
        } else {
            return res.send({
                status: 400,
                message: "already has coupon",
            });
        }

    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            message: "server error",
        });
    }
});

router.post("/review/:restaurantId", async function (req, res) {
    try {
        let resRef = firestore.collection("restaurants").doc(req.params.restaurantId);
        let userRef = firestore.collection("users").doc(req.body.userId);
        let restaurant = await resRef.get();
        let user = await userRef.get();
        restaurant = restaurant.data();
        user = user.data();

        let d = restaurant.review.length+1;

        let base = 20;
        if(restaurant.coin < 20){
            base = restaurant.coin;
            restaurant.coin = 0;
        }else{
            restaurant.coin = restaurant.coin - 20
        }
        let rsCoin = base + Math.ceil(1000/(d*10));
        await resRef.update({
            review : [...restaurant.review, req.body],
            coin: restaurant.coin
        });
        await userRef.update({
            coin : user.coin + rsCoin
        });
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

router.put("/coupon/:restaurantId", async function (req, res) {
    try {
        let resRef = firestore.collection("restaurants").doc(req.params.restaurantId);
        let restaurant = await resRef.get();
        restaurant = restaurant.data();
        if(restaurant.coupon.some((c) => c.name === req.body.name)){
            let userRef =  firestore.collection("users").doc(req.body.userId);
            let user = await userRef.get();
            user = user.data();

            let index = restaurant.coupon.map((c) => {
                    return c.name;
                }).indexOf(req.body.name);
            if(user.coin >= restaurant.coupon[index].coin){
                await userRef.update({
                    coin: user.coin - restaurant.coupon[index].coin,
                    coupon: [...user.coupon, {...restaurant.coupon[index], restaurant:req.params.restaurantId}]
                });
                await resRef.update({
                   coin: restaurant.coin + restaurant.coupon[index].coin
                });
                return res.send({
                    status: 200,
                    message: "success",
                });
            } else {
                return res.send({
                    status: 400,
                    message: "coin not enough",
                });
            }

        } else {
            return res.send({
                status: 404,
                message: "coupon not found",
            });
        }

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
        let restaurants = await firestore.collection("restaurants").get();
        restaurants = restaurants.docs.map(doc => {return {id:doc.id, ...doc.data()}});
        return res.status(200).send({
            status: 200,
            message: "success",
            restaurants: restaurants
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            message: "server error",
        });
    }
});

router.post("/near", async function (req, res) {
    try {
        let currentLocation = req.body;
        let resRef = firestore.collection("restaurants");
        let res1 = await resRef
            .where('latitude', '>=', currentLocation.latitude-currentLocation.radius/111000)
            .where('latitude', '<=', currentLocation.latitude+currentLocation.radius/111000)
            .get();
        let res2 = await firestore.collection('restaurants')
            .where('longitude', '>=', currentLocation.longitude-currentLocation.radius/111000)
            .where('longitude', '<=', currentLocation.longitude+currentLocation.radius/111000)
            .get();
        res1 = res1.docs.map(doc => {return {id:doc.id, ...doc.data()}});
        res2 = res2.docs.map(doc => {return {id:doc.id, ...doc.data()}});

        let restaurants = res1.filter(function(r) {
            for(var i=0; i < res2.length; i++){
                if(r.id === res2[i].id){
                    return true;
                }
            }
            return false;
        });

        return res.send({
            status: 200,
            message: "success",
            restaurants:restaurants
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
