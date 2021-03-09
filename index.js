const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const doc = require("./swgger.json");
const PORT = process.env.PORT || 3000;
const app = express();
const users = require('./src/user');
const restaurants = require('./src/restaurant');

app.use(bodyParser.json());
app.use(cors({ origin: true }));
app.use('/user', users);
app.use('/restaurant', restaurants);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(doc));

app.get("/", (req, res) => {
    res.send({ status: 200 });
});

app.listen(PORT, () => {
    console.log('Start server at port. '+PORT)
});
