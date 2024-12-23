const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v4o8q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const volunteerPosts = client.db("volunteerAllPosts").collection("allPost");
const volunteerBid = client.db("volunteerAllPosts").collection("allBids");

async function run() {
  try {
   
    await client.connect();

app.get('/sortPost',async(req,res)=>{
    const result = await volunteerPosts.find().toArray()
    res.send(result)
})


app.get('/sortPost/:id',async(req,res)=>{
    const id =req.params.id
    const query={_id : new ObjectId(id)}
    const result = await volunteerPosts.findOne(query)
    res.send(result)
})


app.get('/addBid/:email',async(req,res)=>{
    const email=req.params.email
    const query={volunteerEmail : email}
    const result = await volunteerBid.find(query).toArray()
    res.send(result)
})

app.get('/allJob/:email',async(req,res)=>{
    const email=req.params.email
    const query={userEmail : email}
    const result = await volunteerPosts.find(query).toArray()
    res.send(result)
})


app.post('/addPost' ,async(req,res)=>{
    const post = req.body
    const result = await volunteerPosts.insertOne(post)
    res.send(result)
})

app.post('/addBid' ,async(req,res)=>{
  const post = req.body
  const result = await volunteerBid.insertOne(post)

  const filter ={_id:new ObjectId(post.requestId)}
  const updated={
    $inc:{need : -1}
  }
  const updateBidCount = await volunteerPosts.updateOne(filter,updated)
  res.send(result)
})



app.put('/update/:id',async(req,res)=>{
  const id =req.params.id
  const updateData = req.body
  const query={_id :new ObjectId(id)}
  const updated={
    $set: updateData
  }
  const options ={upsert : true}
  const result =await volunteerPosts.updateOne(query,updated,options)
  res.send(result)
})

app.delete('/allPost/:id',async(req,res)=>{
  const id =req.params.id
  const query={_id :new ObjectId(id)}
  const result =await volunteerPosts.deleteOne(query)
  res.send(result)
})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/' , (req , res)=>{
    res.send('volunteer server is running')
})

app.listen(port,()=>{
    console.log(`server is running on port : ${port}`)
})