const express = require('express');
const app = express();
const port = 5000;
const cors = require('cors');

require('dotenv').config();
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.get('/', (req, res) => {
    res.send('Hello World!');
});


const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();


        const database = client.db("ticket-booking-user-info");
        const addTicketCollection = database.collection('ticket_booking');

        //================= add ticket api ============================
        app.post("/api/add-ticket", async (req, res) => {
            const ticket = req.body;
            const result = await addTicketCollection.insertOne(ticket);
            res.send(result);
        })

        //================= get user created tickets api ============================
        app.get('/api/get-user-created-tickets', async (req, res) => {
            const query = {};

            if (req.query.vendorEmail) {
                query.vendorEmail = req.query.vendorEmail;
            }

            if (req.query.status) {
                query.status = req.query.status;
            }
            const cursor = addTicketCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});