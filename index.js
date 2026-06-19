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
        const database = client.db("ticket_booking_db");
        const ticketBookingCollection = database.collection('ticket_booking');
        const bookingCollection = database.collection('bookings');

        app.post('/api/add-ticket', async (req, res) => {
            try {
                const ticket = req.body;

                // 🔥 Basic validation (important for production)
                if (!ticket.title || !ticket.from || !ticket.to) {
                    return res.status(400).send({
                        success: false,
                        message: 'Missing required fields',
                    });
                }

                // 🧠 Force backend-controlled fields (security)
                const newTicket = {
                    title: ticket.title,
                    from: ticket.from,
                    to: ticket.to,
                    type: ticket.type || 'bus',
                    price: Number(ticket.price),
                    quantity: Number(ticket.quantity),
                    dateTime: ticket.dateTime,
                    perks: ticket.perks || [],
                    image: ticket.image || null,

                    vendorName: ticket.vendorName,
                    vendorEmail: ticket.vendorEmail,

                    status: 'pending',
                    isApproved: false,

                    createdAt: new Date(),
                };

                const result = await ticketBookingCollection.insertOne(newTicket);

                res.status(201).send({
                    success: true,
                    message: 'Ticket added successfully',
                    data: result,
                });

            } catch (error) {
                console.error('Add Ticket Error:', error);

                res.status(500).send({
                    success: false,
                    message: 'Internal Server Error',
                });
            }
        });

        app.post('/api/book-ticket', async (req, res) => {
            try {
                const booking = req.body;

                if (!booking.ticketId || !booking.quantity) {
                    return res.status(400).send({
                        success: false,
                        message: 'Invalid booking data',
                    });
                }

                const newBooking = {
                    ticketId: booking.ticketId,
                    quantity: Number(booking.quantity),
                    status: 'Pending',

                    createdAt: new Date(),
                };

                const result = await bookingCollection.insertOne(newBooking);

                res.send({
                    success: true,
                    insertedId: result.insertedId,
                });

            } catch (error) {
                console.error(error);
                res.status(500).send({ success: false, message: 'Booking failed' });
            }
        });

        app.get('/api/my-bookings', async (req, res) => {
            try {
              const result = await bookingCollection.find().toArray();
              res.send(result);
            } catch (err) {
              res.status(500).send({ message: 'Failed to load bookings' });
            }
          });

        app.get('/api/my-tickets', async (req, res) => {
            const email = req.query.email;

            const result = await ticketBookingCollection
                .find({ vendorEmail: email })
                .toArray();

            res.send(result);
        });

        app.get('/api/pending-tickets', async (req, res) => {
            const result = await ticketBookingCollection
                .find({ status: 'pending' })
                .toArray();

            res.send(result);
        });

        app.patch('/api/ticket/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedData = req.body;

                const result = await ticketBookingCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: updatedData,
                    }
                );

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: 'Update failed' });
            }
        });

        app.get('/api/approved-tickets', async (req, res) => {
            const result = await ticketBookingCollection
                .find({ status: 'approved' })
                .toArray();

            res.send(result);
        });


        app.delete('/api/ticket/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const result = await ticketBookingCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.send({
                    success: true,
                    deletedCount: result.deletedCount,
                });

            } catch (error) {
                console.error(error);
                res.status(500).send({
                    success: false,
                    message: 'Delete failed',
                });
            }
        });

        app.get('/api/ticket/:id', async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: 'Invalid ID' });
                }

                const result = await ticketBookingCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!result) {
                    return res.status(404).send({ message: 'Not found' });
                }

                res.send(result);
            } catch (err) {
                res.status(500).send({ error: err.message });
            }
        });

        app.get('/api/bookings', async (req, res) => {
            try {
              const result = await bookingCollection.find().toArray();
              res.send(result);
            } catch (err) {
              res.status(500).send({ message: 'Failed to load bookings' });
            }
          });

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