require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const jwt =require('jsonwebtoken')
const cookieParser=require('cookie-parser')
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const corsOptions ={
  origin:['https://sparkly-rolypoly-810eb2.netlify.app','http://localhost:5173'],
  credentials:true,
  optionalSuccessStatus:200
}


app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v4o8q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken=(req,res,next)=>{
const token=req.cookies?.token
if(!token)return res.status(401).send({message:"unauthorized access token verify"})
  jwt.verify(token,process.env.PRIVATE_KEY,(err,decoded)=>{
    if(err){
      return res.status(401).send({message:"unauthorized access verify"})}
req.user=decoded
  })
next()
}



async function run() {
  try {
   
    const volunteerPosts = client.db("volunteerAllPosts").collection("allPost");
const volunteerBid = client.db("volunteerAllPosts").collection("allBids");


// generate token  jwt

app.post('/jwt',(req,res)=>{
  const email=req.body
 const token= jwt.sign(email,process.env.PRIVATE_KEY,{expiresIn:'365d'})
  res.cookie('token',token ,{
    httpOnly:true,
    secure:process.env.NODE_ENV ==='production',
    sameSite:process.env.NODE_ENV==='production'?'none':'strict',
  }).send({success:true})
})

// remove token jwt
app.get('/remove',(req,res)=>{
  res.clearCookie("token",{
    maxAge:0,
    secure:process.env.NODE_ENV ==='production',
    sameSite:process.env.NODE_ENV==='production'?'none':'strict',
  }).send({success:true})
})

app.get('/sortPost',async(req,res)=>{
  const search =req.query.search
  let query ={}
  if(search)query={title:{$regex:search, $options:'i'}}
    const result = await volunteerPosts.find(query).toArray()
    res.send(result)
})

app.get('/sort',async(req,res)=>{
 const sortData=volunteerPosts.find().sort({deadline:1})

    const result = await sortData.toArray()
    res.send(result)
})

app.get('/sortPost/:id',async(req,res)=>{
    const id =req.params.id
    const query={_id : new ObjectId(id)}
    const result = await volunteerPosts.findOne(query)
    res.send(result)
})

app.get('/addBid/:email',verifyToken, async(req,res)=>{
  const decodedEmail=req.user?.email
    const email=req.params.email
    if(decodedEmail !==email) return res.status(401).send({message:"unauthorized access token"})
    const query={volunteerEmail : email}
    const result = await volunteerBid.find(query).toArray()
    res.send(result)
})

app.get('/allJob/:email',verifyToken, async(req,res)=>{
  const decodedEmail=req.user?.email
    const email=req.params.email
    if(decodedEmail !==email) return res.status(401).send({message:"unauthorized access token"})
    const query={userEmail : email}
    const result = await volunteerPosts.find(query).toArray()
    res.send(result)
})

app.post('/addPost' ,verifyToken,async(req,res)=>{
  const decodedEmail=req.user?.email
  const email=req.body.userEmail
  if(decodedEmail !==email) return res.status(401).send({message:"unauthorized access token"})
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

app.delete('/bidDelete/:id',async(req,res)=>{
  const id =req.params.id
  const query={_id :new ObjectId(id)}
  const result =await volunteerBid.deleteOne(query)
  res.send(result)
})

  } finally {

  }
}
run().catch(console.dir);






app.get('/' , (req , res)=>{
    res.send('volunteer server is running')
})

app.listen(port,()=>{
    console.log(`server is running on port : ${port}`)
})