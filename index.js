const express=require('express')
const cors=require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
var jwt = require('jsonwebtoken');
const port=process.env.PORT || 5000

const app=express()

//middleware
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2qayojn.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function verifyJWT(req,res,next){
  console.log('token',req.headers.authorization) //got the access token from booking display /fetching function client side
  const headerAuthorization=req.headers.authorization;
 
  if(!headerAuthorization)
  {
    return res.status(401).send('unauthorized token')

    
  }
  const token=headerAuthorization.split(' ')[1] //the token string will get split on second word
  console.log('kkt',token)

  jwt.verify(token,process.env.ACCESS_TOKEN, function(err, decoded) {
   if(err){
    return res.status(403).send({message:'forbidden access'})
   }
   req.decoded=decoded;
   next() // must be called here 
  });
}

async function run(){
  try{
    const appointmentOptionCollection=client.db('doctorAppoinment').collection('appointmentCollection')
    const bookingCollection=client.db('doctorAppoinment').collection('bookCollection')
    const UserCollection=client.db('doctorAppoinment').collection('UserCollection')

    app.get('/appointment',async(req,res)=>{
       const date=req.query.date
       console.log(date)
      const query={}
      const allAppointmentOptions=await appointmentOptionCollection.find(query).toArray() //getting all options for appointment
      const bookingQuery={appointmentDate : date}
      const alreadyBooked=await bookingCollection.find(bookingQuery).toArray() // getting all the booking from database
      allAppointmentOptions.forEach(appointmentOption=>{
        const appointmentBooked=alreadyBooked.filter(book=>book.treatment===appointmentOption.name) //distincting all the bookings according to treatment name
        const timeSlot=appointmentBooked.map(book=>book.slot) //getting the selected slot time
        const remainingtimeSlots= appointmentOption.slots.filter(slot=>!timeSlot.includes(slot))
        appointmentOption.slots=remainingtimeSlots; // setting the new remainingslot to the available slot of appointment options
        //console.log(date,appointmentOption.name,timeSlot,remainingtimeSlots.length)
        
      })
      res.send(allAppointmentOptions)
    })
//accessToken created for sign in user with email query
    app.get('/jwt',async(req,res)=>{ 
      const email=req.query.email
      console.log(email)

      const query={email : email}
      const user= await UserCollection.findOne(query)
      console.log(user)
      if(user){
        const token=jwt.sign({email}, process.env.ACCESS_TOKEN, { expiresIn: '1h' });//decoded into jwt.verify()
        return  res.send({accessToken: token}) //forgot to return
      }
      return res.status(403).send({accessToken:''})
      
    })
    
    app.get('/bookings',verifyJWT,async(req,res)=>{// verifyJWT ,middleware calling for this booking api with  (?email=) query to decode the email to make it secure
      const email=req.query.email
      console.log(email)
      const decodedEmail=req.decoded.email // getting decoded email token=jwt.sign({})-> jwt.verify()
      if(email!==decodedEmail){ //bookings?email=xyz@gmail.com will not load data cause email will be decoded
        return res.status(403).send({message:'forbidden access'})
      }
      const query={email : email}
      const myAllBooking= await bookingCollection.find(query).toArray()
      res.send(myAllBooking)
      //console.log(myAllBooking)
    })

    app.post('/bookings',async(req,res)=>{
      const booking=req.body
      const query={  // query for limiting one booking per day for a user
        appointmentDate:booking.appointmentDate,
        treatment : booking.treatment,
        email: booking.email
      }
      
      const thisUserBooked=await bookingCollection.find(query).toArray()
      console.log(thisUserBooked)
      if(thisUserBooked.length)
      {
        const message=`you have already a booking at ${booking.appointmentDate}`
        return res.send({acknowledged: false, message})
      }
      
      const result=await bookingCollection.insertOne(booking)
      res.send(result)
    })

    //creating user collection on the database
    app.post('/users',async(req,res)=>{
      const user=req.body
      const result= await UserCollection.insertOne(user)
      res.send(result)

    })

  }
  finally{
  
  }
}
run().catch(console.dir);

app.get('/',async(req,res)=>{
    res.send('doctor portal runinng')
})

app.listen(port,()=>console.log(`port is ${port}`))